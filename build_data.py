"""
Preprocess the georeferenced LAZ point cloud into a compact binary the
web viewer can load without any LAZ/WASM decoding in the browser.

Output:
  data/points.bin  - interleaved Float32 x,y,z (local meters) + Uint8 r,g,b
  data/meta.json    - bounds, origin, crs, point count, voxel size used
"""
import json
import sys
import numpy as np
import laspy

SRC = "model.laz"
OUT_BIN = "data/points.bin"
OUT_META = "data/meta.json"
VOXEL_SIZE = float(sys.argv[1]) if len(sys.argv) > 1 else 0.02  # meters

f = laspy.read(SRC)
x = np.asarray(f.x, dtype=np.float64)
y = np.asarray(f.y, dtype=np.float64)
z = np.asarray(f.z, dtype=np.float64)
r = np.asarray(f.red, dtype=np.float64)
g = np.asarray(f.green, dtype=np.float64)
b = np.asarray(f.blue, dtype=np.float64)

pts = np.stack([x, y, z], axis=1)
mins = pts.min(axis=0)
maxs = pts.max(axis=0)
print(f"raw points: {len(pts):,}")
print(f"bounds (utm meters): mins={mins} maxs={maxs}")

# origin = min corner, so local coords are all >= 0 and small (fits float32 cleanly)
origin = mins.copy()
local = pts - origin

voxel_idx = np.floor(local / VOXEL_SIZE).astype(np.int64)
extent = voxel_idx.max(axis=0) + 1
print(f"voxel grid: {extent} at {VOXEL_SIZE}m")

keys = (voxel_idx[:, 0] * extent[1] + voxel_idx[:, 1]) * extent[2] + voxel_idx[:, 2]
uniq_keys, inverse, counts = np.unique(keys, return_inverse=True, return_counts=True)
n_out = len(uniq_keys)
print(f"downsampled points: {n_out:,} ({n_out / len(pts) * 100:.1f}% of raw)")

sum_pos = np.zeros((n_out, 3), dtype=np.float64)
np.add.at(sum_pos, inverse, local)
mean_pos = (sum_pos / counts[:, None]).astype(np.float32)

sum_col = np.zeros((n_out, 3), dtype=np.float64)
np.add.at(sum_col, inverse, np.stack([r, g, b], axis=1))
mean_col = np.clip(np.round(sum_col / counts[:, None]), 0, 255).astype(np.uint8)

import os
os.makedirs("data", exist_ok=True)

with open(OUT_BIN, "wb") as fh:
    fh.write(mean_pos.tobytes())
    fh.write(mean_col.tobytes())

local_maxs = (maxs - origin).tolist()
meta = {
    "pointCount": int(n_out),
    "rawPointCount": int(len(pts)),
    "voxelSizeMeters": VOXEL_SIZE,
    "localBoundsMin": [0.0, 0.0, 0.0],
    "localBoundsMax": local_maxs,
    "originUtm": origin.tolist(),
    "crs": "EPSG:32610",
    "crsName": "WGS 84 / UTM zone 10N",
    "sourceFile": "Centennial-Park-Boat-Launch-Moorage-8-26-2026-georeferenced_model.laz",
}
with open(OUT_META, "w") as fh:
    json.dump(meta, fh, indent=2)

bin_mb = (n_out * 15) / (1024 * 1024)
print(f"wrote {OUT_BIN} ({bin_mb:.1f} MB) and {OUT_META}")
