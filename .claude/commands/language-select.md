# Language Select

Auto-detect or manually set your project language (TypeScript, Python, Go, Rust, etc).

## Auto-detection
Claude will automatically detect your project language based on configuration files:
- **TypeScript/JavaScript**: package.json, tsconfig.json
- **Python**: requirements.txt, pyproject.toml, Pipfile
- **Go**: go.mod
- **Rust**: Cargo.toml
- **Java**: pom.xml, build.gradle
- **C#**: *.csproj, *.sln
- **Ruby**: Gemfile

## Manual Override
If you need to work with a different language than detected, specify it:
- `/language-select typescript` - For TypeScript/Node.js projects
- `/language-select python` - For Python projects
- `/language-select generic` - For multi-language or unsupported projects

## What This Command Does
1. Detects or sets the project language
2. Loads language-specific coding standards from `.claude/aiContext/codingStandards/[language]/`
3. Configures appropriate validation commands (lint, test, type-check)
4. Sets up language-specific hooks and permissions
5. Provides context about available tools and commands

## Usage
Simply run `/language-select` to auto-detect, or `/language-select [language]` to manually set.

The selected language will be used for:
- Code validation commands
- Import/export conventions
- Testing frameworks
- Package management
- Code style and formatting