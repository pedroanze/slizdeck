# Hook de verificación automática (opcional, Claude Code)

`scripts/verify-hook.mjs` es un hook `PostToolUse` que corre `scripts/audit.mjs` automáticamente después de cada `Edit`/`Write` sobre un deck de slizdeck, y empuja los hallazgos de vuelta al contexto del agente — sin depender de que nadie se acuerde de pedirlo. Nace de un bug real: un deck derivado (la versión sin red de una charla) se quedó con un bug de cascada CSS ya arreglado en otro archivo, porque nadie volvió a auditarlo después del fix.

**Es opcional y específico de Claude Code** — no forma parte del flujo obligatorio de la skill (coherente con el campo `compatibility` de `SKILL.md`: "Probado en Claude Code"). En Gemini CLI/Codex/OpenCode, la verificación sigue siendo manual vía las fases `audit`/`fix`/`add`, como siempre.

## Qué hace y qué no

- Se activa solo si el archivo tocado es `.html`, no es `template.html` ni `examples/demo-deck.html`, y contiene la firma de un deck de slizdeck (`data-steps=` o `<deck-stage`) — no se dispara sobre cualquier HTML del proyecto del usuario.
- Corre `audit.mjs` (rápido, determinístico, sin Chrome). Si hay fallos, los reporta en el siguiente turno del agente.
- **Deliberadamente no corre `check-reveal.mjs`** — ya confirmamos que es intermitente en frío por Chrome headless (ver su propio header), y dispararlo en cada edición sería ruidoso. `check-reveal.mjs` sigue siendo un paso manual antes de dar el deck por terminado (`reference/audit.md`).
- Nunca rompe el turno: siempre sale con `exit 0`, con o sin hallazgos.
- Sin CLI de administración (`on`/`off`/`status`) — a diferencia de otras skills con un flujo de hooks más grande, acá alcanza con agregar o quitar el bloque de configuración a mano.

## Cómo activarlo

Agregar este bloque a `.claude/settings.local.json` del proyecto donde se está generando el deck (no dentro del repo de la skill):

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "node \"${CLAUDE_PROJECT_DIR}/.claude/skills/slizdeck/scripts/verify-hook.mjs\"",
            "timeout": 15
          }
        ]
      }
    ]
  }
}
```

Ajustar la ruta del `command` según dónde esté clonada la skill (`~/.claude/skills/slizdeck` si se instaló ahí, o la ruta relativa correspondiente).

## Cómo desactivarlo

Quitar el bloque `hooks.PostToolUse` de `.claude/settings.local.json`, o simplemente no agregarlo — no hay nada más que limpiar.
