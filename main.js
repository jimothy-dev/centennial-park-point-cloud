import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";

const loadingEl = document.getElementById("loading");
const loadFill = document.getElementById("loadFill");
const loadLabel = document.getElementById("loadLabel");
const panelEl = document.getElementById("panel");
const statsEl = document.getElementById("stats");

const app = document.getElementById("app");
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
app.prepend(renderer.domElement);

const scene = new THREE.Scene();
const bgColors = { dark: 0x0b0f14, light: 0xeef2f7 };
scene.background = new THREE.Color(bgColors.dark);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.01, 2000);

scene.add(new THREE.AmbientLight(0xffffff, 1.1));
const sun = new THREE.DirectionalLight(0xffffff, 1.6);
sun.position.set(1, 1.5, 1);
scene.add(sun);
const fill = new THREE.DirectionalLight(0xffffff, 0.6);
fill.position.set(-1, 0.5, -1);
scene.add(fill);

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

const loader = new GLTFLoader();
loader.setMeshoptDecoder(MeshoptDecoder);

let controls;
let defaultCameraPos = new THREE.Vector3();
let defaultTarget = new THREE.Vector3();
let modelRoot = null;

loader.load(
  "model.glb",
  (gltf) => {
    modelRoot = gltf.scene;
    scene.add(modelRoot);

    const box = new THREE.Box3().setFromObject(modelRoot);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const diag = size.length();

    camera.near = diag * 0.001;
    camera.far = diag * 20;
    camera.updateProjectionMatrix();
    camera.up.set(0, 0, 1);

    defaultCameraPos.copy(center).add(new THREE.Vector3(diag * 0.6, -diag * 0.6, diag * 0.5));
    defaultTarget.copy(center);
    camera.position.copy(defaultCameraPos);
    camera.lookAt(defaultTarget);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.target.copy(defaultTarget);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.screenSpacePanning = true;
    controls.zoomSpeed = 1.6;
    controls.minDistance = diag * 0.002;
    controls.maxDistance = diag * 10;
    controls.update();

    let triCount = 0;
    modelRoot.traverse((obj) => {
      if (obj.isMesh && obj.geometry) {
        const idx = obj.geometry.getIndex();
        triCount += idx ? idx.count / 3 : obj.geometry.attributes.position.count / 3;
      }
    });

    statsEl.innerHTML = `
      ${Math.round(triCount).toLocaleString()} triangles<br/>
      Extent: ${size.x.toFixed(1)} × ${size.y.toFixed(1)} × ${size.z.toFixed(1)} m<br/>
      Source: EPSG:32610 (WGS 84 / UTM 10N)
    `;

    loadingEl.style.display = "none";
    panelEl.style.display = "block";
  },
  (evt) => {
    if (evt.lengthComputable) {
      const pct = Math.round((evt.loaded / evt.total) * 100);
      loadFill.style.width = `${pct}%`;
      loadLabel.textContent = `downloading model… ${pct}% (${(evt.loaded / 1024 / 1024).toFixed(1)} MB)`;
    } else {
      loadLabel.textContent = `downloading model… ${(evt.loaded / 1024 / 1024).toFixed(1)} MB`;
    }
  },
  (err) => {
    console.error(err);
    loadLabel.textContent = `error: ${err.message ?? err}`;
  }
);

document.getElementById("shading").addEventListener("change", (e) => {
  if (!modelRoot) return;
  const wireframe = e.target.value === "wireframe";
  modelRoot.traverse((obj) => {
    if (obj.isMesh && obj.material) {
      obj.material.wireframe = wireframe;
    }
  });
});

document.getElementById("bg").addEventListener("change", (e) => {
  scene.background = new THREE.Color(bgColors[e.target.value] ?? bgColors.dark);
});

document.getElementById("resetView").addEventListener("click", () => {
  if (!controls) return;
  camera.position.copy(defaultCameraPos);
  controls.target.copy(defaultTarget);
  controls.update();
});

renderer.setAnimationLoop(() => {
  controls?.update();
  renderer.render(scene, camera);
});
