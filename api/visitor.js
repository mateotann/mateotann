const STORE_KEY = "portfolio:last-visitor";

function decodeHeader(value) {
  if (!value) {
    return "";
  }

  try {
    return decodeURIComponent(value);
  } catch (_) {
    return value;
  }
}

function getRequestHeader(request, name) {
  return request.headers[name] || request.headers[name.toLowerCase()] || "";
}

function getLocation(request) {
  const city = decodeHeader(getRequestHeader(request, "x-vercel-ip-city"));
  const region = decodeHeader(getRequestHeader(request, "x-vercel-ip-country-region"));
  const country = decodeHeader(getRequestHeader(request, "x-vercel-ip-country"));
  const timezone = decodeHeader(getRequestHeader(request, "x-vercel-ip-timezone"));

  const parts = [city, region, country].filter(Boolean);
  return {
    city,
    region,
    country,
    timezone,
    label: parts.length ? parts.join(", ") : "unknown location",
  };
}

function findEnv(endings) {
  for (const ending of endings) {
    const key = Object.keys(process.env).find((name) => name.endsWith(ending) && process.env[name]);
    if (key) {
      return process.env[key];
    }
  }
  return "";
}

async function kvRequest(path, options = {}) {
  // Vercel names these with whatever prefix the store was connected under (KV_REST_API_URL,
  // STORAGE_TRACKER_KV_REST_API_URL, ...), and it differs per project, so match on the ending.
  const url = findEnv(["KV_REST_API_URL", "UPSTASH_REDIS_REST_URL"]);
  const token = findEnv(["KV_REST_API_TOKEN", "UPSTASH_REDIS_REST_TOKEN"]);

  if (!url || !token) {
    throw new Error("KV_MISSING");
  }

  const response = await fetch(`${url}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    throw new Error(`KV_HTTP_${response.status}`);
  }

  return response.json();
}

async function readLastVisitor() {
  const data = await kvRequest(`/get/${encodeURIComponent(STORE_KEY)}`);
  if (!data?.result) {
    return null;
  }

  if (typeof data.result === "string") {
    return JSON.parse(data.result);
  }

  return data.result;
}

async function writeCurrentVisitor(visitor) {
  const value = encodeURIComponent(JSON.stringify(visitor));
  await kvRequest(`/set/${encodeURIComponent(STORE_KEY)}/${value}`, { method: "POST" });
}

module.exports = async function handler(request, response) {
  response.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");

  if (request.method !== "GET" && request.method !== "POST") {
    response.status(405).json({ error: "method not allowed" });
    return;
  }

  try {
    const previous = await readLastVisitor();
    const location = getLocation(request);
    const current = {
      ...location,
      path: request.query?.path || "/",
      visitedAt: new Date().toISOString(),
    };

    await writeCurrentVisitor(current);

    response.status(200).json({
      previous,
      current,
      stored: true,
    });
  } catch (error) {
    response.status(200).json({
      previous: null,
      current: null,
      stored: false,
      error: error.message === "KV_MISSING" ? "visitor storage not configured" : "visitor storage unavailable",
    });
  }
};
