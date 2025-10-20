# Base Context — Universal Coding Principles

## Core Principles
SRP • KISS • DRY • Readable • Consistent

## Workflow
1. Load context 2. Plan 3. Code 4. Validate 5. Document

## File Organization
- **Plans:** `.claude/aiContext/plans/YYYYMMDD-HHMMSS-name.md` (major features >2h)
- **Summaries:** `.claude/aiContext/summaries/FEATURE-NAME.md` (session insights)
- **Temp:** `.claude/aiContext/temp/{test,scripts}/` (NEVER in project root, clean up)
- **Standards:** See `.claude/aiContext/codingStandards/typescript/project-standards.md`

## Code Quality
- ESLint + TypeScript strict mode
- 80% test coverage
- No `any` types (use `unknown`)
- Typed object params only
- Prefer `null` over `undefined`
- Run `npm run lint` and `npm run typecheck` after creating or editing any file

## TypeScript
- **ESM ONLY:** `import/export` (never `require()`)
- Package: `"type": "module"`

## Security
- Never commit secrets
- Validate all inputs
- Handle errors gracefully

## Context Management
- Load only relevant files
- Keep baseContext.md < 2KB
- Max 6 parallel sub-agents

**Detailed standards:** `.claude/aiContext/codingStandards/typescript/project-standards.md`
