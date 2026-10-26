/**
 * slizdeck · three-pin
 *
 * Fuente unica de verdad para la version fijada de three.js, sus URLs en
 * jsDelivr y los hashes SRI (sha384) de todo el grafo de modulos que usa
 * el runtime .sz-3d:
 *
 *   - build/three.module.js -> importa ./three.core.js
 *   - examples/jsm/loaders/GLTFLoader.js -> importa three,
 *     ../utils/BufferGeometryUtils.js y ../utils/SkeletonUtils.js
 *   - examples/jsm/loaders/SVGLoader.js -> importa three
 *
 * Se usan los archivos estaticos del paquete npm (no los .min.js dinamicos
 * de jsDelivr, cuyo contenido puede re-generarse y romper SRI).
 */

import { createHash } from 'node:crypto';

export const THREE_VERSION = '0.186.1';
export const THREE_CDN_BASE = `https://cdn.jsdelivr.net/npm/three@${THREE_VERSION}`;

export const THREE_IMPORTS = {
  three: `${THREE_CDN_BASE}/build/three.module.js`,
  'three/addons/': `${THREE_CDN_BASE}/examples/jsm/`,
};

export const THREE_FILES = [
  {
    path: 'build/three.module.js',
    url: `${THREE_CDN_BASE}/build/three.module.js`,
    integrity: 'sha384-m8JoFX52V6NGv2usipnlLJKnJfL7IE8dbniPDDCSGSQv3Hm4n6PjfV6syVwfuoRc',
  },
  {
    path: 'build/three.core.js',
    url: `${THREE_CDN_BASE}/build/three.core.js`,
    integrity: 'sha384-mdKeCwPEcbDvzaxwhm+MVuLoMou+E7jQqrs4tmu/n8HBYPGI1kZt0MkJxlMR4zFM',
  },
  {
    path: 'examples/jsm/loaders/GLTFLoader.js',
    url: `${THREE_CDN_BASE}/examples/jsm/loaders/GLTFLoader.js`,
    integrity: 'sha384-jmhN0si8z6E7+h0t9KiwQ71oyrC3PhTpols1FXeN/vODuFa/L4bPIe9sLbOlhjq7',
  },
  {
    path: 'examples/jsm/utils/BufferGeometryUtils.js',
    url: `${THREE_CDN_BASE}/examples/jsm/utils/BufferGeometryUtils.js`,
    integrity: 'sha384-Rm97j4mcjlLkGsYC2LX3nZG9VU2R8lgK0QE+DmBr4thue+H7J+SHm+68If2ZLBVg',
  },
  {
    path: 'examples/jsm/utils/SkeletonUtils.js',
    url: `${THREE_CDN_BASE}/examples/jsm/utils/SkeletonUtils.js`,
    integrity: 'sha384-Pozn8j5+YFr3ak8Pm90ayqDrGYn/DV7vVs/YIIqzJhzeJT0LQksoS1fZQ5lfsYlw',
  },
  {
    path: 'examples/jsm/loaders/SVGLoader.js',
    url: `${THREE_CDN_BASE}/examples/jsm/loaders/SVGLoader.js`,
    integrity: 'sha384-kjEHr+WzxvIznprG0mIWROae4RI64aqDDQR3h4hOi0GARly6NsJqGmSSQqYMKNqg',
  },
];

export const THREE_INTEGRITY = Object.fromEntries(
  THREE_FILES.map((f) => [f.url, f.integrity]),
);

export const THREE_PIN = {
  version: THREE_VERSION,
  baseUrl: THREE_CDN_BASE,
  imports: THREE_IMPORTS,
  files: THREE_FILES,
  integrity: THREE_INTEGRITY,
};

export function sha384(buf) {
  return 'sha384-' + createHash('sha384').update(buf).digest('base64');
}

export function buildImportMap(pin = THREE_PIN) {
  return {
    imports: { ...pin.imports },
    integrity: { ...pin.integrity },
  };
}

export function importMapScript(pin = THREE_PIN) {
  return `<script type="importmap">${JSON.stringify(buildImportMap(pin))}</script>`;
}
