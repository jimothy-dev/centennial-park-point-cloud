# Centennial Park Boat Launch & Moorage — Point Cloud Viewer

Interactive WebGL viewer for a georeferenced LiDAR/photogrammetry point cloud
of the Centennial Park boat launch and moorage, surveyed 2026-08-26.

**Live site:** (added after first deploy — see repo Pages settings)

## What's here

- `model.laz` — the original georeferenced point cloud (LAS 1.x, LASzip
  compressed, EPSG:32610 / WGS 84 UTM zone 10N), 8,428,980 points with RGB.
- `data/points.bin` + `data/meta.json` — a voxel-downsampled (1.5 cm), local
  binary export of that cloud (1,564,382 points, positions recentered to a
  local origin) that the browser loads directly — no LAZ/WASM decoding
  client-side.
- `index.html` / `main.js` — a Three.js viewer: orbit/pan/zoom camera, true
  color / elevation-ramp / solid coloring, adjustable point size.
- `build_data.py` — regenerates `data/points.bin` / `data/meta.json` from
  `model.laz` (requires `pip install laspy[lazrs] numpy`). Run
  `python build_data.py <voxel_size_meters>` to change the downsample level.

## Local development

Any static file server works, e.g.:

```bash
python -m http.server 8000
```

then open `http://localhost:8000`.

## Deploying

This repo is served as-is via GitHub Pages (branch `main`, root). Pushing to
`main` redeploys automatically.
