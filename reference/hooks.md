# Hook de verificación automática (opcional, Claude Code)

`scripts/verify-hook.mjs` es un hook `PostToolUse` que corre `scripts/audit.mjs` automáticamente después de cada `Edit`/`Write` sobre un deck de slizdeck, y empuja los hallazgos de vuelta al contexto del agente, sin depender de que nadie se acuerde de pedirlo.

**Es opcional y específico de Claude Code** — no forma parte del flujo obligatorio de la skill (coherente con el campo `compatibility` de `SKILL.md`: "Probado en Claude Code"). En Gemini CLI/Codex/OpenCode, la verificación sigue siendo manual vía las fases `audit`/`fix`/`add`, como siempre.

## Qué hace y qué no

- Se activa solo si el archivo tocado es `.html`, no es `template.html`, y contiene la firma de un deck de slizdeck (`data-steps=` o `<deck-stage`) — no se dispara sobre cualquier HTML del proyecto del usuario.
- Corre `audit.mjs` (rápido, determinístico, sin Chrome). Si hay fallos, los reporta en el siguiente turno del agente.
- **No corre los validadores con Chrome** (`check-reveal`, `check-overflow`, `check-contrast`): tardan segundos y en cada edición frenarían al agente. Siguen siendo un paso de la fase `audit` antes de entregar.
- Nunca rompe el turno: siempre sale con `exit 0`, con o sin hallazgos.

## Cómo activarlo

**Instalada como plugin de Claude Code** (`/plugin install slizdeck@slizdeck`): ya está activo, viene en `hooks/hooks.json` del plugin. No hay que hacer nada; se desactiva desactivando el plugin (`/plugin`).

**Instalada con `npx slizdeck install` o con git**: agregarlo a mano como se explica abajo.

Agregar este bloque a `.claude/settings.local.json` del proyecto donde se genera el deck, con la ruta de la skill instalada: `~/.claude/skills/slizdeck` con `npx slizdeck install` (lo que muestra `npx slizdeck where`), o `${CLAUDE_PROJECT_DIR}/.claude/skills/slizdeck` si se instaló con `--project`:

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "node \"$HOME/.claude/skills/slizdeck/scripts/verify-hook.mjs\"",
            "timeout": 15
          }
        ]
      }
    ]
  }
}
```


## Cómo desactivarlo

Quitar el bloque `hooks.PostToolUse` de `.claude/settings.local.json`, o simplemente no agregarlo — no hay nada más que limpiar.
