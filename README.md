# Centennial Park Boat Launch & Moorage — 3D Viewer

Interactive 3D model of the Centennial Park boat launch and moorage, captured
by drone on August 26, 2026.

**View it here:** https://jimothy-dev.github.io/centennial-park-point-cloud/

## About the survey

- Flown with a DJI Mini SE. The flight route was plotted in Litchi.
- The photos were processed into a georeferenced, textured 3D mesh
  (WGS 84 / UTM zone 10N).
- The original 102 MB model was compressed to about 11 MB for the web:
  meshopt geometry compression, plus textures resized to 2048px JPEG.

## Using the viewer

- Drag to orbit, scroll to zoom, right-drag to pan
- The panel has a wireframe toggle and a dark/light background switch

## What's in this repo

- `index.html`, `main.js` — the viewer, built with Three.js
- `model.glb` — the compressed model

## Running locally

Any static file server works:

```bash
python -m http.server 8000
```

then open `http://localhost:8000`.

The site is served with GitHub Pages from the `main` branch — pushing to
`main` redeploys it.

## Licence

[GPL-3.0](LICENSE). Copyright (c) 2026 James Simpson.
