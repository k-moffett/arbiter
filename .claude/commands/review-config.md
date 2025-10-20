# Review Claude Configuration

Review the main Claude configuration files to understand project setup and coding standards.

## What this command does

This command reviews:
1. **README.md**: Main project documentation (if exists)
2. **CLAUDE.md**: File navigation map and directory structure guide (Note: This project uses CLAUDE.md for direct file mappings rather than contextual commands)
3. **baseContext.md**: Universal coding principles that apply to all projects
4. **Project Plans**: Active and completed project plans in `.claude/aiContext/project/`

## Files reviewed

- `README.md` - Main project documentation (if exists)
- `.claude/CLAUDE.md` - File navigation map and directory structure (direct file mappings)
- `.claude/aiContext/baseContext.md` - Core coding principles

## Key information extracted

### From README.md (if exists):
- Project overview and purpose
- Installation and setup instructions
- Dependencies and requirements
- Usage examples and documentation
- Development workflow and conventions

### From CLAUDE.md:
- Directory structure and file organization
- Direct mappings to important project files
- Available commands listed as file references
- Language-specific configuration file locations
- Navigation guide for Claude configuration

### From baseContext.md:
- Core principles (SRP, KISS, DRY)
- Pre-coding checklist
- Code quality standards
- Context management rules
- Sub-agent guidelines
- Error handling and security practices

## Usage

```bash
/review-config
```

## When to use

- At the start of a new session to understand project configuration
- When onboarding to a new project
- To refresh understanding of coding standards
- Before making significant changes to the codebase

## Related commands

- `/language-select` - Configure language settings
- `/load-context` - Load previous session context
- `/code-standards-audit` - Validate documentation currency
- `/project-standards-audit` - Audit project compliance