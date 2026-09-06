#!/usr/bin/env node
/**
 * slizdeck · verify-hook
 *
 * Hook PostToolUse para Claude Code (ver reference/hooks.md para cómo
 * activarlo). Corre automáticamente después de cada Edit/Write y, si el
 * archivo tocado es un deck de slizdeck, ejecuta scripts/audit.mjs y empuja
 * los hallazgos de vuelta al contexto del agente — sin que nadie tenga que
 * acordarse de pedirlo. Nace de un bug real de esta sesión: un deck derivado
 * (la versión sin red de una charla) se quedó con un bug ya arreglado en
 * otro archivo, sin que nadie lo volviera a chequear.
 *
 * Deliberadamente NO corre check-reveal.mjs acá — es intermitente en frío
 * por Chrome headless (ver su propio header), y dispararlo en cada edición
 * sería ruidoso. check-reveal.mjs sigue siendo un paso manual antes de dar
 * el deck por terminado (reference/audit.md).
 *
 * Contrato: nunca rompe el turno. Siempre sale con exit 0. Si algo falla
 * de forma inesperada (JSON malformado, audit.mjs no existe), se queda en
 * silencio en vez de reventar la edición del usuario.
 *
 * No se auto-instala: reference/hooks.md documenta cómo agregarlo a mano en
 * .claude/settings.local.json del proyecto donde se está generando el deck.
 */

import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const AUDIT_SCRIPT = path.join(__dirname, 'audit.mjs');

async function readStdin() {
  if (process.stdin.isTTY) return '';
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  return Buffer.concat(chunks).toString('utf-8');
}

function looksLikeDeck(filePath) {
  if (!filePath.endsWith('.html')) return false;
  const base = path.basename(filePath);
  if (base === 'template.html' || base === 'demo-deck.html') return false;
  let content;
  try {
    content = readFileSync(filePath, 'utf8');
  } catch {
    return false;
  }
  return content.includes('data-steps=') || content.includes('<deck-stage');
}

function emit(additionalContext) {
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'PostToolUse',
      additionalContext,
    },
  }));
}

async function main() {
  let stdinJson = '';
  try {
    stdinJson = await readStdin();
  } catch {
    process.exit(0);
  }

  let event;
  try {
    event = JSON.parse(stdinJson);
  } catch {
    process.exit(0);
  }

  const filePath = event?.tool_input?.file_path;
  if (typeof filePath !== 'string' || !filePath) process.exit(0);
  if (!['Edit', 'Write'].includes(event?.tool_name)) process.exit(0);
  if (!looksLikeDeck(filePath)) process.exit(0);

  let auditOutput = '';
  let auditFailed = false;
  try {
    execFileSync('node', [AUDIT_SCRIPT, filePath], { stdio: 'pipe' });
  } catch (err) {
    auditFailed = true;
    auditOutput = (err.stdout ? err.stdout.toString() : '') + (err.stderr ? err.stderr.toString() : '');
  }

  if (auditFailed) {
    emit(
      `slizdeck · verify-hook: node scripts/audit.mjs ${path.basename(filePath)} encontró fallos después de esta edición.\n\n${auditOutput}\n\nCorregir antes de dar la slide por terminada.`,
    );
  }

  process.exit(0);
}

main().catch(() => process.exit(0));
