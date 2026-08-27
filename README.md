# Centennial Park Boat Launch & Moorage — 3D Model Viewer

Interactive WebGL viewer for a georeferenced, textured photogrammetry mesh
of the Centennial Park boat launch and moorage, surveyed 2026-08-26.

**Live site:** (added after first deploy — see repo Pages settings)

## What's here

- `model.glb` — the textured mesh, re-exported for the web from the original
  102 MB source (`EXT_meshopt_compression` geometry + downscaled/re-encoded
  JPEG textures, 2048px max, quality 82). Final size ~11 MB.
- `index.html` / `main.js` — a Three.js viewer: orbit/pan/zoom camera,
  wireframe toggle, dark/light background.
- `process_textures.mjs` + `resize_texture.py` — the build step that
  produced `model.glb`: runs the model through `@gltf-transform` (dedup,
  join, weld, simplify, meshopt-compress) then resizes/re-encodes each
  baseColor texture with Pillow (the bundled `sharp`/libvips texture step
  in `gltf-transform optimize` crashes on this machine, so textures are
  handled out-of-process instead).

## Regenerating model.glb

```bash
py -m venv .venv
./.venv/Scripts/pip install laspy pillow
npm install
npx @gltf-transform/cli optimize <source.glb> model_test.glb --texture-compress false
node process_textures.mjs model_test.glb model.glb 2048 82
```

## Local development

Any static file server works, e.g.:

```bash
python -m http.server 8000
```

then open `http://localhost:8000`.

## Deploying

This repo is served as-is via GitHub Pages (branch `main`, root). Pushing to
`main` redeploys automatically.
