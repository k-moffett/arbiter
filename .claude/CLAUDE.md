# CLAUDE Assistant Configuration - File Navigation Map

**Note:** This CLAUDE.md file serves as a direct file mapping and navigation guide rather than containing contextual commands. It provides a comprehensive map of important project files and their purposes.

Welcome to the Claude configuration directory. This directory contains all settings, context, and standards for AI-assisted development.

## Quick Start

When starting a new session, Claude will automatically detect your project language. You can also manually configure it:

```bash
# Auto-detect language
/language-select

# Or manually set
/language-select typescript
/language-select python
```

## Purpose of This File

This CLAUDE.md file provides:
- A complete directory structure map
- Direct paths to all important configuration files
- Quick navigation references for Claude Code
- Clear organization of language-specific standards
- Location of command definitions and scripts

## Directory Structure

```
.claude/
├── CLAUDE.md                     # This file - file navigation map and directory guide
├── aiContext/                    # Context and coding standards
│   ├── baseContext.md           # Universal, language-agnostic principles
│   ├── codingStandards/         # Language-specific standards
│   │   ├── typescript/          # TypeScript/JavaScript standards
│   │   │   ├── baseContext.md   # TypeScript fundamentals
│   │   │   ├── client/          # Frontend frameworks
│   │   │   │   └── nextjs/     # Next.js specific
│   │   │   └── server/          # Backend frameworks
│   │   │       ├── lambda/      # AWS Lambda
│   │   │       └── mentalbot/   # MentalBot Discord project
│   │   └── python/              # Python standards
│   │       ├── baseContext.md   # Python fundamentals
│   │       ├── server/          # Backend frameworks
│   │       ├── data-science/    # ML/Data projects
│   │       └── scripts/         # CLI/Automation
│   └── compactHistory/          # Session history summaries
├── commands/                    # Claude commands
│   ├── detect-language.sh      # Language detection script
│   ├── language-select.md      # Language selection command
│   ├── load-context.md         # Context loading command
│   └── save-context.md         # Context saving command
└── settings.local.json          # Local project settings
```

## Core Files

### Universal Context
- **baseContext.md**: Language-agnostic coding principles that apply to all projects
  - Core principles (SRP, KISS, DRY)
  - Code quality standards
  - Context management rules
  - Sub-agent guidelines

### Language-Specific Context
- **typescript/baseContext.md**: TypeScript/JavaScript standards
  - Type system rules
  - Module system (ESM)
  - Testing with Jest/Vitest
  - React/Next.js patterns
  
- **python/baseContext.md**: Python standards
  - PEP 8 compliance
  - Type hints
  - Testing with pytest
  - Virtual environments

### Project Templates
- **typescript/client/nextjs/**: Next.js project structure
- **typescript/server/lambda/**: AWS Lambda structure
- **typescript/server/mentalbot/**: Discord Bot with AI personality system
- **python/server/lambda/**: Python Lambda structure

## Available Commands

**Note:** The commands listed below are references to command definition files in `.claude/commands/`, not embedded commands in this file.

### Standards Management
- `/code-standards-init` - Initialize framework-specific coding standards
- `/code-standards-audit` - Validate documentation currency against industry standards
- `/project-standards-audit` - Audit project compliance with documented standards
- `/research-feature` - AI-driven feature research and implementation planning
- `/project-help` - Interactive help system

### Context Management
- `/load-context` - Load previous session context
- `/save-context` - Save current session insights
- `/language-select` - Configure language settings
- `/startup` - Welcome message (runs automatically)

### Language-Specific Context
- **typescript/baseContext.md**: TypeScript/JavaScript standards
  - Type system rules
  - Module system (ESM)
  - Testing with Jest/Vitest
  - React/Next.js patterns

- **typescript/server/mentalbot/**: Object-Oriented Discord Bot Project
  - ProjectStructure.md: OOP monorepo architecture
  - CodingStandards.md: TypeScript OOP standards & SOLID principles
  - DesignPatterns.md: Factory, Strategy, Adapter implementations
  - personality-guidelines.md: Personality system and tone control guidelines
  - README.md: Quick reference for AI agents
  
- **python/baseContext.md**: Python standards
  - PEP 8 compliance
  - Type hints
  - Testing with pytest
  - Virtual environments

### Language-Specific Commands

**TypeScript/JavaScript:**
```bash
npm run typecheck    # Type checking
npm run lint        # ESLint
npm test           # Jest tests
npm run build      # Build project
```

**Python:**
```bash
mypy src/          # Type checking
ruff check .       # Linting
black src/         # Formatting
pytest            # Run tests
```

## Settings Configuration

The `settings.local.json` file contains:
- **Permissions**: Allowed/denied operations
- **Hooks**: Pre/post operation scripts
- **Environment**: Configuration variables
- **Context**: Auto-loaded context files

## Best Practices

1. **Language Detection**: Let Claude auto-detect your project language on startup
2. **Context Loading**: Use `/load-context` to restore previous session state
3. **Context Saving**: Important insights are automatically saved to `compactHistory/`
4. **Standards**: Language-specific standards are loaded based on project type
5. **Validation**: Always run language-specific validation before committing

## Adding New Languages

To add support for a new language:

1. Create directory: `.claude/aiContext/codingStandards/[language]/`
2. Add `baseContext.md` with language-specific standards
3. Update `detect-language.sh` to recognize the language
4. Add language-specific commands to `settings.local.json`
5. Create project structure templates as needed

## Troubleshooting

- **Wrong language detected**: Use `/language-select [language]` to override
- **Context too large**: Check that baseContext.md is under 2KB
- **Missing commands**: Ensure language-specific tools are installed
- **Permission denied**: Check `settings.local.json` permissions

## Current Session

**Auto-detected Language**: Run `/language-select` to detect
**Loaded Context**: Check `.claude/aiContext/compactHistory/` for latest
**Active Standards**: Based on detected/selected language

---

For more information about Claude Code, visit: https://docs.anthropic.com/en/docs/claude-code