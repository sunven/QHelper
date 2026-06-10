# Domain Docs

How the engineering skills should consume this repo's domain documentation when exploring the codebase.

## Layout

This is a single-context repo.

## Before exploring, read these
- `CONTEXT.md` at the repo root
- `docs/adr/` for ADRs that touch the area being changed, if any exist

If any of these files do not exist, proceed silently. The producer skill (`/grill-with-docs`) creates them lazily when terms or decisions get resolved.

## Use the glossary's vocabulary

When output names a domain concept, use the term as defined in `CONTEXT.md`. If the concept is missing, note the gap rather than inventing new vocabulary.

## Flag ADR conflicts

If output contradicts an existing ADR, surface the conflict explicitly.
