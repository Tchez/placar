# SPEC 007 — Canastra defaults and home cleanup

- **Status:** done
- **Created:** 2026-08-23
- **Depends on:** SPEC 005 (canastra setup and home), SPEC 006 (truco gaudério)

## Goal

Starting a canastra match reflects the family's most common table immediately: 4000 points with
negative entries disabled. The home also stops advertising truco gaúcho as coming soon now that
truco gaudério is already available as a real game.

## Context

SPEC 005 made the canastra setup start at 3000 points with negative entries enabled and added an
inert **Em breve · Truco gaúcho** card. SPEC 006 later shipped that game under its settled name,
**Truco gaudério**, through the registry, but the placeholder remained. The owner has now changed the
canastra defaults and removed that stale placeholder.

These are defaults only. The setup still lets the user choose 3000, type another positive integer,
and enable negative entries for a match.

## Scope

**In**

- Canastra setup defaults to 4000 points
- Canastra setup defaults to negative entries disabled
- The obsolete **Em breve · Truco gaúcho** home card is removed
- Tests and shared documentation reflect the shipped behaviour

**Out**

- Removing or changing either canastra target suggestion
- Removing free target entry or the negatives toggle
- Changing scoring, validation, persistence, existing matches or match visuals
- Removing the generic **Mais jogos em breve** ornament below the game registry
- Changing truco mineiro or truco gaudério

## Behaviour

### Canastra setup — `/nova/canastra`

- **Pontos para vencer** opens with **4000** and the 4000 suggestion selected.
- **Permitir pontos negativos** opens disabled.
- The 3000 and 4000 suggestions remain available, free positive-integer entry remains available,
  and the user may enable negatives before starting.
- Starting without changing either control creates a match with `target: 4000` and
  `allowNegativeEntries: false`.

### Home — `/`

- Every game in the registry still renders as an interactive game card.
- No inert card naming **Truco gaúcho** is rendered.
- The generic **Mais jogos em breve** ornament remains.

## Rules

- `GameDefinition.defaultTarget` supplies the initial target when a game needs setup. If it is
  absent, the setup may fall back to the first target suggestion.
- A game that supports negative entries may declare `defaultAllowNegativeEntries`; an absent value
  defaults to `false`. Capability and initial choice remain separate concerns.
- Defaults affect newly created matches only. Persisted matches keep their resolved target and
  negative-entry setting.

## Acceptance criteria

- [x] Canastra declares `defaultTarget: 4000` and `defaultAllowNegativeEntries: false`
- [x] `/nova/canastra` initially shows 4000 with negative entries disabled
- [x] Starting the untouched form persists 4000 and disabled negatives
- [x] Both target suggestions, free target entry and the negatives toggle remain usable
- [x] The home renders every registered game and does not render the stale truco gaúcho placeholder
- [x] The generic **Mais jogos em breve** ornament remains
- [x] `npm run check` and `npm run build` pass

## Open questions

None.
