// Construye "Ori", la orca mascota del ejemplo, con primitivas de three.js y la
// exporta a GLB con tres clips: Idle, Wave y Spin. three.js no es dependencia
// del repo; para regenerar el modelo:
//   mkdir /tmp/ori && cd /tmp/ori && npm i three@0.186.1
//   cp <repo>/examples/orca/ori/build-ori.mjs . && node build-ori.mjs ori.glb
//   cd <repo>/examples/orca && npx slizdeck 3d add orca-agentes.html --model /tmp/ori/ori.glb --id ori
//   npx slizdeck 3d poster orca-agentes.html
import { writeFileSync } from 'node:fs';
import * as THREE from 'three';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';

// GLTFExporter usa FileReader para el binario; Node 20 trae Blob pero no FileReader.
globalThis.FileReader = class {
  readAsArrayBuffer(blob) { blob.arrayBuffer().then((b) => { this.result = b; this.onloadend?.(); }); }
  readAsDataURL(blob) {
    blob.arrayBuffer().then((b) => {
      this.result = `data:${blob.type || 'application/octet-stream'};base64,${Buffer.from(b).toString('base64')}`;
      this.onloadend?.();
    });
  }
};

const out = process.argv[2] || 'ori.glb';

const INK = new THREE.Color('#121A33');   // cuerpo: marino casi negro, lee bien sobre cobalto y sobre blanco
const SNOW = new THREE.Color('#F7F8FC');  // vientre y manchas de los ojos
const BLUSH = new THREE.Color('#FF9DB0');

const std = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.55, metalness: 0, ...extra });

// ---------- Cuerpo: elipsoide marino + casquete blanco del vientre ----------
const BODY_SCALE = new THREE.Vector3(1.0, 0.92, 1.08);
const BODY_Y = 1.0;
const shell = new THREE.Group();
shell.name = 'Shell';
shell.scale.copy(BODY_SCALE);
const body = new THREE.Mesh(new THREE.SphereGeometry(1, 96, 64), std(INK, { roughness: 0.45 }));
body.name = 'BodyMesh';
shell.add(body);
{
  // casquete esférico centrado abajo-adelante: borde limpio, sin manchas por vértice
  const capDir = new THREE.Vector3(0, -Math.sin(0.87), Math.cos(0.87)).normalize();
  const cap = new THREE.Mesh(new THREE.SphereGeometry(1.012, 96, 40, 0, Math.PI * 2, 0, 0.93),
    std(SNOW, { roughness: 0.6, emissive: SNOW, emissiveIntensity: 0.14 }));
  cap.name = 'Belly';
  cap.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), capDir);
  shell.add(cap);
}

// punto sobre la superficie del cuerpo en una dirección dada (en coordenadas del grupo Body)
const onSurface = (dir, lift = 0) => {
  const d = dir.clone().normalize();
  return new THREE.Vector3(d.x * BODY_SCALE.x, d.y * BODY_SCALE.y, d.z * BODY_SCALE.z).multiplyScalar(1 + lift);
};

const bodyGroup = new THREE.Group();
bodyGroup.name = 'Body';
bodyGroup.position.y = BODY_Y;
bodyGroup.add(shell);

// ---------- Cara: manchas, ojos, brillo, mejillas, sonrisa ----------
const eyeMat = std('#0A0E27', { roughness: 0.18 });
const glintMat = std('#FFFFFF', { emissive: new THREE.Color('#FFFFFF'), emissiveIntensity: 0.9 });
const patchMat = std(SNOW, { roughness: 0.6, emissive: SNOW, emissiveIntensity: 0.14 });
for (const side of [1, -1]) {
  const patch = new THREE.Mesh(new THREE.SphereGeometry(1, 40, 24), patchMat);
  patch.name = side > 0 ? 'PatchR' : 'PatchL';
  patch.position.copy(onSurface(new THREE.Vector3(0.37 * side, 0.22, 0.9), -0.012));
  patch.scale.set(0.165, 0.2, 0.04);
  patch.lookAt(patch.position.clone().multiplyScalar(2));
  patch.rotateZ(-0.38 * side);
  bodyGroup.add(patch);

  const eye = new THREE.Mesh(new THREE.SphereGeometry(0.105, 32, 24), eyeMat);
  eye.name = side > 0 ? 'EyeR' : 'EyeL';
  eye.position.copy(onSurface(new THREE.Vector3(0.33 * side, 0.17, 0.92), -0.005));
  eye.scale.set(1, 1.18, 0.7);
  bodyGroup.add(eye);

  const glint = new THREE.Mesh(new THREE.SphereGeometry(0.034, 16, 12), glintMat);
  glint.name = side > 0 ? 'GlintR' : 'GlintL';
  glint.position.copy(eye.position).add(new THREE.Vector3(0.032 * side + 0.02, 0.05, 0.07));
  bodyGroup.add(glint);

  const cheek = new THREE.Mesh(new THREE.SphereGeometry(0.1, 24, 16), std(BLUSH, { roughness: 0.8 }));
  cheek.name = side > 0 ? 'CheekR' : 'CheekL';
  cheek.position.copy(onSurface(new THREE.Vector3(0.55 * side, -0.16, 0.82), 0.004));
  cheek.scale.set(1.15, 0.62, 0.35);
  cheek.lookAt(cheek.position.clone().multiplyScalar(2));
  bodyGroup.add(cheek);
}
{
  const smile = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.022, 10, 32, Math.PI), std('#0A0E27', { roughness: 0.4 }));
  smile.name = 'Smile';
  smile.rotation.z = Math.PI; // arco hacia abajo
  smile.position.copy(onSurface(new THREE.Vector3(0, -0.06, 1), 0.016));
  smile.rotation.x = -0.1;
  bodyGroup.add(smile);
}

// ---------- Aleta dorsal (extruida) ----------
{
  const s = new THREE.Shape();
  s.moveTo(-0.34, 0);
  s.bezierCurveTo(-0.3, 0.27, -0.42, 0.52, -0.6, 0.72); // borde delantero curvado hacia atrás
  s.bezierCurveTo(-0.4, 0.52, -0.05, 0.25, 0.32, 0);
  s.lineTo(-0.34, 0);
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.1, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.04, bevelSegments: 4, curveSegments: 24 });
  g.translate(0, 0, -0.05);
  const fin = new THREE.Mesh(g, std(INK));
  fin.name = 'DorsalFin';
  fin.rotation.y = Math.PI / 2; // la forma (x hacia adelante) pasa a mirar hacia -z: punta hacia atrás
  fin.position.set(0, BODY_SCALE.y * 0.86, -0.12);
  bodyGroup.add(fin);
}

// ---------- Aletas pectorales con pivote (para saludar) ----------
const makePectoral = (side) => {
  const pivot = new THREE.Group();
  pivot.name = side > 0 ? 'FinR' : 'FinL';
  pivot.position.copy(onSurface(new THREE.Vector3(0.9 * side, -0.25, 0.25), -0.08));
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 40, 24), std(INK));
  mesh.name = side > 0 ? 'FinRMesh' : 'FinLMesh';
  mesh.scale.set(0.42, 0.1, 0.24);
  mesh.position.set(0.34 * side, 0, 0);
  pivot.add(mesh);
  pivot.rotation.z = -0.55 * side;
  bodyGroup.add(pivot);
  return pivot;
};
const finR = makePectoral(1);
const finL = makePectoral(-1);

// ---------- Cola con aleta caudal ----------
const tail = new THREE.Group();
tail.name = 'Tail';
tail.position.set(0, -0.1, -0.86 * BODY_SCALE.z);
{
  const stem = new THREE.Mesh(new THREE.ConeGeometry(0.4, 0.9, 40, 1, true), std(INK));
  stem.name = 'TailStem';
  stem.rotation.x = -Math.PI / 2; // la punta del cono apunta hacia -z
  stem.position.z = -0.32;
  tail.add(stem);
  const s = new THREE.Shape();
  s.moveTo(0, 0);
  s.bezierCurveTo(0.2, -0.05, 0.42, -0.12, 0.62, -0.02);
  s.bezierCurveTo(0.5, -0.22, 0.3, -0.38, 0.0, -0.3);
  s.bezierCurveTo(-0.3, -0.38, -0.5, -0.22, -0.62, -0.02);
  s.bezierCurveTo(-0.42, -0.12, -0.2, -0.05, 0, 0);
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.06, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 3, curveSegments: 24 });
  g.translate(0, 0, -0.03);
  const fluke = new THREE.Mesh(g, std(INK));
  fluke.name = 'Fluke';
  fluke.rotation.x = -Math.PI / 2; // plano horizontal, se abre hacia atrás
  fluke.position.set(0, 0.0, -0.68);
  tail.add(fluke);
}
bodyGroup.add(tail);

const ori = new THREE.Group();
ori.name = 'Ori';
ori.add(bodyGroup);
const scene = new THREE.Scene();
scene.add(ori);

// ---------- Animaciones ----------
const sample = (duration, n, fn) => {
  const times = [], values = [];
  for (let i = 0; i <= n; i++) { const t = (duration * i) / n; times.push(t); values.push(...fn(t / duration, t)); }
  return { times, values };
};
const quat = (x, y, z) => new THREE.Quaternion().setFromEuler(new THREE.Euler(x, y, z)).toArray();
const TAU = Math.PI * 2;
const vTrack = (name, d, n, fn) => { const s = sample(d, n, fn); return new THREE.VectorKeyframeTrack(name, s.times, s.values); };
const qTrack = (name, d, n, fn) => { const s = sample(d, n, fn); return new THREE.QuaternionKeyframeTrack(name, s.times, s.values); };

const idle = (() => {
  const d = 3.0, n = 36;
  return new THREE.AnimationClip('Idle', d, [
    vTrack('Ori.position', d, n, (u) => [0, 0.07 * Math.sin(u * TAU), 0]),
    qTrack('Body.quaternion', d, n, (u) => quat(0.03 * Math.sin(u * TAU + 1), 0, 0.035 * Math.sin(u * TAU))),
    qTrack('Tail.quaternion', d, n, (u) => quat(0.2 * Math.sin(u * TAU * 2), 0, 0)),
    qTrack('FinR.quaternion', d, n, (u) => quat(0, 0, -0.55 + 0.14 * Math.sin(u * TAU * 2))),
    qTrack('FinL.quaternion', d, n, (u) => quat(0, 0, 0.55 - 0.14 * Math.sin(u * TAU * 2))),
  ]);
})();

const wave = (() => {
  const d = 1.6, n = 32;
  return new THREE.AnimationClip('Wave', d, [
    vTrack('Ori.position', d, n, (u) => [0, 0.05 * Math.sin(u * TAU), 0]),
    qTrack('Body.quaternion', d, n, (u) => quat(0.04, 0.12, -0.07 + 0.02 * Math.sin(u * TAU))),
    qTrack('Tail.quaternion', d, n, (u) => quat(0.18 * Math.sin(u * TAU * 2), 0, 0)),
    // aleta derecha levantada, saludando dos veces por ciclo
    qTrack('FinR.quaternion', d, n, (u) => quat(0, -0.3, 0.95 + 0.38 * Math.sin(u * TAU * 2))),
    qTrack('FinL.quaternion', d, n, (u) => quat(0, 0, 0.5 - 0.08 * Math.sin(u * TAU))),
  ]);
})();

const spin = (() => {
  const d = 3.2, n = 64, jump = 0.5; // la pirueta ocupa la primera mitad; después flota
  const ease = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
  return new THREE.AnimationClip('Spin', d, [
    vTrack('Ori.position', d, n, (u) => {
      if (u < jump) { const k = u / jump; return [0, 0.75 * Math.sin(Math.PI * k), 0]; }
      return [0, 0.05 * Math.sin(((u - jump) / (1 - jump)) * TAU), 0];
    }),
    qTrack('Ori.quaternion', d, n, (u) => quat(0, u < jump ? TAU * ease(u / jump) : 0, 0)),
    qTrack('Body.quaternion', d, n, (u) => quat(u < jump ? -0.25 * Math.sin(Math.PI * (u / jump)) : 0, 0, 0)),
    qTrack('Tail.quaternion', d, n, (u) => quat(u < jump ? 0.45 * Math.sin(Math.PI * (u / jump)) : 0.15 * Math.sin(u * TAU * 3), 0, 0)),
    qTrack('FinR.quaternion', d, n, (u) => quat(0, 0, u < jump ? 0.7 * Math.sin(Math.PI * (u / jump)) - 0.2 : -0.55)),
    qTrack('FinL.quaternion', d, n, (u) => quat(0, 0, u < jump ? -0.7 * Math.sin(Math.PI * (u / jump)) + 0.2 : 0.55)),
  ]);
})();

const exporter = new GLTFExporter();
const glb = await exporter.parseAsync(scene, { binary: true, animations: [idle, wave, spin] });
writeFileSync(out, Buffer.from(glb));
let tris = 0;
scene.traverse((o) => { if (o.isMesh) { const g = o.geometry; tris += (g.index ? g.index.count : g.attributes.position.count) / 3; } });
console.log(`ok ${out}: ${(glb.byteLength / 1024).toFixed(0)} KB, ~${Math.round(tris)} triangulos, clips Idle/Wave/Spin`);
