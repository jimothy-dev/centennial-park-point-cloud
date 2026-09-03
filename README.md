# Centennial Park Boat Launch & Moorage — 3D Model

Browser-based 3D viewer for a georeferenced, textured mesh of the Centennial Park boat launch and moorage, built from a DJI Mini SE drone survey.

**View it:** https://jimothy-dev.github.io/centennial-park-point-cloud/

![screenshot](docs/screenshot.png)
<!-- Capture: the viewer after load, angled view showing the ramp and moorage with the control panel open (textured shading, dark background). A second shot in wireframe mode works well as a comparison. -->

## What it does

- Loads an 11 MB compressed glTF (`model.glb`) and shows it in the browser with orbit, zoom and pan.
- Panel controls: textured / wireframe shading, dark / light background, reset view.
- Reports triangle count, model extent in metres, and the source CRS (EPSG:32610, WGS 84 / UTM zone 10N) once loaded.
- Shows a download progress bar while the model streams.

## How it works

**Survey.** Flown 26 August 2026 with a DJI Mini SE (a sub-250 g consumer drone) on a flight route planned in Litchi. The photos were processed into a georeferenced textured mesh in UTM 10N.

**Compression.** The original 102 MB model was reduced to about 11 MB for the web: meshopt geometry compression plus textures resized to 2048 px JPEG.

**Viewer.** Plain HTML + one ES module (`main.js`), no build step:

- [Three.js](https://threejs.org/) 0.169 loaded from a CDN via an import map
- `GLTFLoader` with `MeshoptDecoder` for the compressed geometry
- `OrbitControls` with damping; camera near/far planes and the default view are derived from the model's bounding box, with Z up to match the survey coordinate frame
- Ambient + two directional lights; sRGB output colour space
- Wireframe toggle flips `material.wireframe` across every mesh in the scene graph

Hosted on GitHub Pages from `main` (`.nojekyll` keeps Pages from touching the files).

## Run it

```bash
git clone https://github.com/jimothy-dev/centennial-park-point-cloud
cd centennial-park-point-cloud
python -m http.server 8000
# open http://localhost:8000
```

Any static server works; the page must be served over HTTP (not opened as a file) because `main.js` is an ES module. An internet connection is needed for the Three.js CDN.

Controls: drag to orbit, scroll to zoom, right-drag to pan.

## Data sources

- Drone imagery: own survey, DJI Mini SE, 26 Aug 2026, Centennial Park boat launch and moorage.
- `model.glb`: derived textured mesh, EPSG:32610.

## Limitations / next steps

- Despite the repo name, this is a textured **mesh**, not a point cloud. A Potree point-cloud view of the dense cloud would be a good companion.
- The consumer drone's GPS gives approximate georeferencing only; no ground control points were used, so absolute position accuracy is not quantified.
- No measurement tools (distance, area, elevation profile) yet — Three.js raycasting would support these.
- A fixed-size 11 MB download with no level-of-detail; a tiled format (3D Tiles) would help on mobile.
- Three.js is loaded from unpkg at runtime; vendoring it would make the page fully offline.

## Author

James Simpson — https://github.com/jimothy-dev

Licence: [GPL-3.0](LICENSE).
