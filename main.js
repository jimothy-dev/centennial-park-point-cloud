import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const loadingEl = document.getElementById("loading");
const loadFill = document.getElementById("loadFill");
const loadLabel = document.getElementById("loadLabel");
const panelEl = document.getElementById("panel");
const statsEl = document.getElementById("stats");

async function fetchWithProgress(url, onProgress) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url}: ${res.status}`);
  const total = Number(res.headers.get("content-length")) || 0;
  const reader = res.body.getReader();
  const chunks = [];
  let received = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    received += value.length;
    if (total) onProgress(received / total);
  }
  const buf = new Uint8Array(received);
  let offset = 0;
  for (const c of chunks) {
    buf.set(c, offset);
    offset += c.length;
  }
  return buf.buffer;
}

function turbo(t) {
  // compact approximation of the turbo colormap
  const r = Math.max(0, Math.min(1, 1.5 - Math.abs(4 * t - 3)));
  const g = Math.max(0, Math.min(1, 1.5 - Math.abs(4 * t - 2)));
  const b = Math.max(0, Math.min(1, 1.5 - Math.abs(4 * t - 1)));
  return [r, g, b];
}

async function main() {
  loadLabel.textContent = "fetching metadata…";
  const meta = await (await fetch("data/meta.json")).json();

  loadLabel.textContent = "downloading points…";
  const buf = await fetchWithProgress("data/points.bin", (p) => {
    loadFill.style.width = `${Math.round(p * 100)}%`;
    loadLabel.textContent = `downloading points… ${Math.round(p * 100)}%`;
  });

  const n = meta.pointCount;
  const positions = new Float32Array(buf, 0, n * 3);
  const colorsU8 = new Uint8Array(buf, n * 3 * 4, n * 3);

  loadLabel.textContent = "building scene…";

  // renderer / scene / camera
  const app = document.getElementById("app");
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  app.prepend(renderer.domElement);

  const scene = new THREE.Scene();
  const bgColors = { dark: 0x0b0f14, light: 0xeef2f7 };
  scene.background = new THREE.Color(bgColors.dark);

  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.01, 2000);

  const bmin = new THREE.Vector3(...meta.localBoundsMin);
  const bmax = new THREE.Vector3(...meta.localBoundsMax);
  const center = bmin.clone().add(bmax).multiplyScalar(0.5);
  const size = bmax.clone().sub(bmin);
  const diag = size.length();

  // geometry
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

  const rgbColor = new THREE.BufferAttribute(colorsU8, 3, true);
  geometry.setAttribute("color", rgbColor);
  geometry.computeBoundingSphere();

  // precompute elevation ramp colors lazily
  let elevAttr = null;
  function elevationColors() {
    if (elevAttr) return elevAttr;
    const arr = new Uint8Array(n * 3);
    const zMin = bmin.z, zMax = bmax.z, range = Math.max(1e-6, zMax - zMin);
    for (let i = 0; i < n; i++) {
      const z = positions[i * 3 + 2];
      const t = (z - zMin) / range;
      const [r, g, b] = turbo(t);
      arr[i * 3] = r * 255;
      arr[i * 3 + 1] = g * 255;
      arr[i * 3 + 2] = b * 255;
    }
    elevAttr = new THREE.BufferAttribute(arr, 3, true);
    return elevAttr;
  }

  const material = new THREE.PointsMaterial({
    size: 2,
    sizeAttenuation: false,
    vertexColors: true,
  });
  const points = new THREE.Points(geometry, material);
  scene.add(points);

  // camera framing
  camera.position.copy(center).add(new THREE.Vector3(diag * 0.6, -diag * 0.6, diag * 0.5));
  camera.up.set(0, 0, 1);
  camera.lookAt(center);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.copy(center);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.screenSpacePanning = true;
  controls.update();

  function resetView() {
    camera.position.copy(center).add(new THREE.Vector3(diag * 0.6, -diag * 0.6, diag * 0.5));
    controls.target.copy(center);
    controls.update();
  }

  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  // UI wiring
  document.getElementById("colorMode").addEventListener("change", (e) => {
    if (e.target.value === "rgb") {
      geometry.setAttribute("color", rgbColor);
      material.vertexColors = true;
    } else if (e.target.value === "elevation") {
      geometry.setAttribute("color", elevationColors());
      material.vertexColors = true;
    } else {
      material.vertexColors = false;
      material.color.set(0xbfd7ff);
    }
    material.needsUpdate = true;
  });

  document.getElementById("pointSize").addEventListener("input", (e) => {
    material.size = Number(e.target.value);
  });

  document.getElementById("bg").addEventListener("change", (e) => {
    scene.background = new THREE.Color(bgColors[e.target.value] ?? bgColors.dark);
  });

  document.getElementById("resetView").addEventListener("click", resetView);

  statsEl.innerHTML = `
    ${n.toLocaleString()} points (voxel ${meta.voxelSizeMeters * 100}cm, ${(
    (n / meta.rawPointCount) *
    100
  ).toFixed(1)}% of ${meta.rawPointCount.toLocaleString()} raw)<br/>
    Extent: ${size.x.toFixed(1)} × ${size.y.toFixed(1)} × ${size.z.toFixed(1)} m<br/>
    CRS: ${meta.crsName} (${meta.crs})
  `;

  loadingEl.style.display = "none";
  panelEl.style.display = "block";

  renderer.setAnimationLoop(() => {
    controls.update();
    renderer.render(scene, camera);
  });
}

main().catch((err) => {
  console.error(err);
  loadLabel.textContent = `error: ${err.message}`;
});
