# Mateo Tannahill Portfolio Starter

## What to add later

Put your files here:

- `assets/videos/` for video files like `.mp4`
- `assets/thumbnails/` for poster images like `.jpg`, `.jpeg`, `.png`, or `.webp`

## Recommended files to send

For each project:

- 1 video file: exported as `.mp4` with H.264 codec
- 1 thumbnail image: landscape format, around 1600px wide
- project title
- short category label
- 1 to 2 sentence description

## Example

- `assets/videos/tokyo-after-rain.mp4`
- `assets/thumbnails/tokyo-after-rain.jpg`

Then update the matching card in `index.html`:

- `data-video="assets/videos/tokyo-after-rain.mp4"`

If you want, the thumbnail boxes can also be upgraded next to use your real poster images as backgrounds.

## Visitor strip

The bottom visitor strip calls `/api/visitor` on page load. The API reads the previous visitor from Vercel KV first, returns that to the page, then stores the current visitor. Add `KV_REST_API_URL` and `KV_REST_API_TOKEN` in Vercel for it to persist across visitors.
