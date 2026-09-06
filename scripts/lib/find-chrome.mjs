/**
 * Encuentra un binario de Chrome/Chromium usable en macOS, Linux o Windows.
 *
 * Orden de resolución:
 *   1. Variable de entorno CHROME_PATH (siempre gana, si está seteada).
 *   2. Rutas típicas de instalación por sistema operativo.
 *   3. Buscar en PATH (`which`/`where`) nombres comunes de binario.
 *
 * Lanza un error con un mensaje accionable si no encuentra nada — nunca
 * devuelve un valor "probablemente correcto" sin verificar que el archivo
 * exista.
 */

import { existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const CANDIDATES_BY_PLATFORM = {
  darwin: [
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary',
  ],
  win32: [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files\\Chromium\\Application\\chrome.exe',
  ],
  linux: [
    '/usr/bin/google-chrome-stable',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
    '/snap/bin/chromium',
  ],
};

const PATH_LOOKUP_NAMES = {
  darwin: [],
  win32: ['chrome.exe'],
  linux: ['google-chrome-stable', 'google-chrome', 'chromium-browser', 'chromium'],
};

function tryPathLookup(names) {
  const lookupCmd = process.platform === 'win32' ? 'where' : 'which';
  for (const name of names) {
    try {
      const found = execFileSync(lookupCmd, [name], { stdio: ['ignore', 'pipe', 'ignore'] })
        .toString()
        .split(/\r?\n/)[0]
        .trim();
      if (found && existsSync(found)) return found;
    } catch {
      // no encontrado con este nombre, seguir probando
    }
  }
  return null;
}

export function findChrome() {
  if (process.env.CHROME_PATH) {
    if (!existsSync(process.env.CHROME_PATH)) {
      throw new Error(
        `CHROME_PATH="${process.env.CHROME_PATH}" está seteada pero ese archivo no existe. Corregí la variable o quitala para usar la detección automática.`,
      );
    }
    return process.env.CHROME_PATH;
  }

  const candidates = CANDIDATES_BY_PLATFORM[process.platform] || [];
  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate;
  }

  const pathMatch = tryPathLookup(PATH_LOOKUP_NAMES[process.platform] || []);
  if (pathMatch) return pathMatch;

  throw new Error(
    `No se encontró Chrome/Chromium instalado en las rutas típicas de ${process.platform}. ` +
    'Instalá Google Chrome, o si ya está instalado en una ruta no estándar, ' +
    'seteá la variable de entorno CHROME_PATH con la ruta completa al ejecutable.',
  );
}

// También sirve como CLI: `node scripts/lib/find-chrome.mjs` imprime la ruta
// resuelta, útil para componer comandos de una línea sin hardcodear la ruta
// (ver reference/export.md, README.md).
if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    console.log(findChrome());
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
}
