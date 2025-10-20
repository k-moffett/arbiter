# Base Context — Universal Coding Principles

Language-agnostic principles. Research best practices when unsure.

## Core Principles
- **SRP**: One purpose per function/class
- **KISS**: Simplest working solution
- **DRY**: Reuse existing code
- **Readable**: Clear naming
- **Consistent**: Follow patterns
- **Document as we build**: Update docs with implementation

## Before Writing Code
1. Work with given context - avoid unnecessary searches
2. Only look up files when specifically needed
3. Assume patterns are established
4. Plan implementation
5. Validate with project tools
6. Update docs immediately

## Project Planning
- Create plans: `/create-project-plan`
- Sync todos with plans using TodoWrite
- **IMPORTANT**: Update `.claude/aiContext/project/*-plan.md` files when completing tasks
- Mark tasks with [x] as they complete
- Update plan Status and Completed fields when done
- Check plans at start: `/review-config`

## Code Quality
- Use linting tools (ESLint)
- Run type checking (TypeScript strict)
- Write tests (80% coverage minimum)
- Handle errors gracefully
- Never commit secrets
- Validate inputs
- Test in Docker before deployment

## Context Management
- Load only relevant files
- Create project context in `aiContext/project/`
- Avoid context bloat
- Sub-agents: max 6 parallel

## Quick Checks
- Simplest approach?
- Code exists?
- Follows patterns?
- Will pass checks?