import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS, EXTMeshoptCompression } from "@gltf-transform/extensions";
import { MeshoptDecoder, MeshoptEncoder } from "meshoptimizer";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

const [, , inPath, outPath, maxDimArg, qualityArg] = process.argv;
const maxDim = Number(maxDimArg ?? 2048);
const quality = Number(qualityArg ?? 82);
const PY = "./.venv/Scripts/python.exe";

await MeshoptDecoder.ready;
await MeshoptEncoder.ready;

const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({
    "meshopt.decoder": MeshoptDecoder,
    "meshopt.encoder": MeshoptEncoder,
  });
const doc = await io.read(inPath);

const textures = doc.getRoot().listTextures();
console.log(`found ${textures.length} textures`);

let totalBefore = 0;
let totalAfter = 0;

for (const [i, tex] of textures.entries()) {
  const image = tex.getImage();
  if (!image) continue;
  totalBefore += image.byteLength;

  const tmpIn = path.join(os.tmpdir(), `tex_in_${i}.jpg`);
  const tmpOut = path.join(os.tmpdir(), `tex_out_${i}.jpg`);
  fs.writeFileSync(tmpIn, Buffer.from(image));

  execFileSync(PY, ["resize_texture.py", tmpIn, tmpOut, String(maxDim), String(quality)], {
    stdio: "inherit",
  });

  const resized = fs.readFileSync(tmpOut);
  tex.setImage(new Uint8Array(resized));
  tex.setMimeType("image/jpeg");
  totalAfter += resized.byteLength;

  fs.unlinkSync(tmpIn);
  fs.unlinkSync(tmpOut);
  console.log(
    `texture ${i}: ${(image.byteLength / 1024 / 1024).toFixed(2)}MB -> ${(resized.byteLength / 1024 / 1024).toFixed(2)}MB`
  );
}

console.log(
  `total textures: ${(totalBefore / 1024 / 1024).toFixed(1)}MB -> ${(totalAfter / 1024 / 1024).toFixed(1)}MB`
);

await io.write(outPath, doc);
console.log(`wrote ${outPath}`);
