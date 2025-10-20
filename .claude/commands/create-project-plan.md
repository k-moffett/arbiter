# Create Project Plan

Creates a timestamped project plan in `.claude/aiContext/project/` for tracking implementation work with integrated todo tracking.

## Usage

```bash
/create-project-plan --name "feature-name" --goals 3 --type mvp
```

## Arguments

- `--name` (required): Project/feature name (kebab-case recommended)
- `--goals` (required): Number of goals or comma-separated list (e.g., "3" or "connection,processing,response")
- `--type` (required): Project type - one of:
  - `mvp` - Minimal Viable Product
  - `feature` - New feature addition
  - `refactor` - Code refactoring
  - `bugfix` - Bug fix
  - `optimization` - Performance optimization
  - `documentation` - Documentation updates
- `--phases` (optional): Number of implementation phases (default: 4)
- `--update-docs` (optional): Include documentation update tasks (default: true)

## Examples

### Create MVP plan
```bash
/create-project-plan --name "discord-bot" --goals 3 --type mvp
```

### Create feature plan with specific goals
```bash
/create-project-plan --name "quote-system" --goals "load-quotes,select-quotes,integrate-quotes" --type feature --phases 3
```

### Create refactor plan without doc updates
```bash
/create-project-plan --name "repository-pattern" --goals 2 --type refactor --update-docs false
```

## Output

Creates a file at `.claude/aiContext/project/YYYY-MM-DD-{name}-plan.md` containing:
- Project overview
- Numbered goals
- Implementation phases with tasks
- Success criteria
- Technical decisions
- File creation/update list
- **Integrated todo list that syncs with TodoWrite tool**
- **Completion status tracking**

## Template Structure

```markdown
# {Name} Implementation Plan
**Created**: YYYY-MM-DD
**Type**: {type}
**Status**: Active
**Completed**: [ ] No

## Overview
{Auto-generated based on type}

## Goals
1. Goal 1
2. Goal 2
3. Goal 3

## Active Todos
<!-- This section is automatically synchronized with TodoWrite tool -->
- [ ] Task 1 (pending)
- [ ] Task 2 (pending)
- [ ] Task 3 (pending)

## Implementation Phases

### Phase 1: {Phase Name}
**Goal**: {Phase goal}
**Tasks**:
- [ ] Task 1
- [ ] Task 2

**Files to Create/Update**:
- `path/to/file.ts`

## Success Criteria
- [ ] Criteria 1
- [ ] Criteria 2

## Technical Decisions
- Decision points

## Completion Status
- [ ] All tasks completed
- [ ] All success criteria met
- [ ] Documentation updated
- [ ] Tests passing

## Notes
- Keep todos synchronized using TodoWrite tool
- Update status when phases complete
- Document patterns as they emerge
```

## Status Values

Project plans can have the following status values:
- **Active**: Currently being worked on
- **Completed**: All tasks finished
- **Paused**: Temporarily on hold
- **Cancelled**: No longer needed

## Important Rules

1. **Todo Synchronization**: Always use TodoWrite tool when working on project plan tasks
2. **Status Updates**: Update plan status when completing phases
3. **Progress Tracking**: Never work on tasks without updating the plan
4. **Documentation**: Update docs as tasks complete, not after

## Integration with TodoWrite

When working on a project plan:
1. Load the plan's todos into TodoWrite at session start
2. Update todos as work progresses
3. Sync todo status back to the plan file
4. Mark plan complete when all todos are done

## Notes

- Plans are timestamped to avoid conflicts
- No timeline/time estimates (AI agents cannot accurately estimate time)
- Focus on concrete tasks and deliverables
- Include documentation updates by default
- **Todos must always be kept in sync**
- Status is checked by `/review-config` command on session start

## Implementation

When executed, this command should:
1. Parse arguments
2. Generate timestamp (YYYY-MM-DD)
3. Create plan file from template
4. Set initial status to "Active" and Completed to "No"
5. Generate todos and add them to TodoWrite
6. If goals is a number, create generic numbered goals
7. If goals is comma-separated, use those as goal names
8. Generate appropriate phases based on type
9. Include or exclude documentation tasks based on flag
10. Ensure todos are trackable and never lost