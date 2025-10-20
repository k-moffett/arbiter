# Implementation Plans

This directory contains detailed implementation plans for major features and architectural changes.

## Purpose

Plan files serve as:
- **Project roadmaps** for multi-phase implementations
- **Context preservation** for AI agents across sessions
- **Progress tracking** with checkpoints and acceptance criteria
- **Historical record** of architectural decisions

## File Naming Convention

```
YYYYMMDD-HHMMSS-descriptive-name.md
```

**Examples:**
- `20251020-131900-dependency-injection-and-examples.md`
- `20251021-090000-discord-bot-integration.md`
- `20251022-140000-vector-search-optimization.md`

The timestamp prefix ensures chronological ordering and provides a clear timeline of project evolution.

## Plan Structure

Each plan should include:

### 1. Header Section
```markdown
# Plan Title

**Plan Created:** YYYY-MM-DD HH:MM:SS
**Status:** Pending | In Progress | Completed
**Estimated Duration:** X hours/days
```

### 2. Overview
- What is being built
- Why it's needed
- High-level approach

### 3. Phases
Each phase includes:
- **Objectives:** Clear goals
- **Tasks:** Specific implementation steps
- **Acceptance Criteria:** Definition of done
- **Files:** What will be created/modified

### 4. Success Metrics
- Code quality targets (coverage, complexity)
- Architecture compliance
- Documentation completeness

### 5. Risk Mitigation
- Identified risks
- Mitigation strategies

### 6. Checkpoints
- Time-based progress checks
- Go/no-go decision points

## Status Updates

Update the status as work progresses:

```markdown
**Status:** Pending → In Progress → Completed
```

Add completion notes:
```markdown
**Completed:** YYYY-MM-DD HH:MM:SS
**Actual Duration:** X hours
**Notes:** Insights, deviations, lessons learned
```

## Relationship to TodoWrite

Plans are strategic (phases, acceptance criteria), while TodoWrite tracks tactical execution:

```markdown
Plan File:
  Phase 1: Create DI Container (45 minutes)
    ↓
TodoWrite:
  [ ] Create Container interface
  [ ] Implement SimpleContainer
  [ ] Write container tests
  [ ] Export from index.ts
```

## When to Create a Plan

Create a plan file when:
- Starting a new major feature (>2 hours work)
- Performing significant refactoring
- Making architectural changes
- Work spans multiple sessions/days
- Complex dependencies between tasks

Don't create a plan for:
- Bug fixes
- Simple feature additions (<1 hour)
- Documentation-only changes
- Routine maintenance

## Example Plan Workflow

1. **User requests feature:** "Add user authentication"
2. **AI creates plan:** `20251020-100000-user-authentication.md`
3. **AI updates todos:** Reference plan in todo items
4. **AI executes Phase 1:** Updates plan status to "In Progress"
5. **Checkpoint 1 reached:** Review and adjust if needed
6. **Phase 1 complete:** Update plan, move to Phase 2
7. **All phases done:** Mark plan "Completed", add notes
8. **Future reference:** New AI agent reads plan to understand decisions

## Archiving

Plans remain in this directory permanently as historical record. They:
- Document architectural evolution
- Explain why decisions were made
- Help onboard new contributors
- Provide templates for similar work

## Index of Plans

| Date | Plan | Status |
|------|------|--------|
| 2025-10-20 | [Dependency Injection & Examples](./20251020-131900-dependency-injection-and-examples.md) | Pending |

---

*This README is automatically updated as new plans are created.*
