#!/bin/bash

# Project Help - Concise reference for project standards system

cat << 'EOF'
════════════════════════════════════════════════════════
📚 PROJECT STANDARDS SYSTEM - Quick Reference
════════════════════════════════════════════════════════

This system automatically maintains coding standards and project documentation
for your AI assistant, ensuring consistent and high-quality code.

📁 SYSTEM STRUCTURE
.claude/
├── aiContext/
│   ├── baseContext.md         # Universal principles (<2KB)
│   └── codingStandards/
│       ├── typescript/         # Language-specific standards
│       │   ├── baseContext.md  # TypeScript essentials (<3KB)
│       │   └── client/react/   # Framework documentation
│       └── python/
│           ├── baseContext.md  # Python essentials (<3KB)
│           └── server/flask/   # Framework documentation

📄 FRAMEWORK DOCUMENTATION EXAMPLE (React)
Each framework gets 2 files:
• FrameworkContext.md    - Quick AI reference (<2KB)
  └─ Contains: patterns, commands, key dependencies
• ProjectStructure.md    - Full documentation (~400 lines)
  └─ Contains: directory structure, best practices, examples

🛠 AVAILABLE COMMANDS

/code-standards-init [framework]
  → Initializes framework-specific coding standards
  → Auto-detects: React, Flask, Express, Django, etc.
  → Creates: ProjectStructure.md, FrameworkContext.md

/code-standards-audit [framework]  
  → Validates documentation currency against industry standards
  → Checks: versions, deprecated patterns, quality
  → Options: --update, --dry-run

/project-standards-audit [framework]
  → Audits project compliance with documented standards
  → Validates: structure, files, naming conventions
  → Provides: compliance scoring and actionable feedback

/research-feature "description" [options]
  → AI-driven feature research and implementation planning
  → Researches: tech stacks, methodologies, best practices
  → Options: --project-context, --domain, --scale, --constraints

/language-select [language]
  → Configures project language (auto-detects on startup)
  → Supports: TypeScript, Python, Go, Rust, Java, Ruby

/load-context
  → Restores previous session from compactHistory/

/save-context
  → Saves current session insights

/project-help
  → Shows this help documentation

💡 QUICK START
1. Language is auto-detected when Claude starts
2. Run /code-standards-init to create framework docs
3. Use /research-feature to plan new feature implementations
4. Run /project-standards-audit to check project compliance
5. Run /code-standards-audit monthly to keep docs current

📊 CONTEXT MANAGEMENT
• Universal context: <2KB (language-agnostic principles)
• Language context: <3KB (TypeScript, Python, etc.)
• Framework context: <2KB (quick reference)
• Project structure: No limit (detailed reference)

Size limits prevent context bloat and ensure fast responses.

🔧 HOW IT WORKS
1. DETECTION: Checks package.json, requirements.txt, etc.
2. STANDARDS: Creates framework-specific documentation
3. RESEARCH: Plans feature implementation with current best practices
4. COMPLIANCE: Validates project follows documented standards
5. MAINTENANCE: Keeps documentation current with industry changes
6. AI INTEGRATION: Claude uses standards for consistent development

📝 EXAMPLE: Flask Standards
.claude/aiContext/codingStandards/python/server/flask/
├── FrameworkContext.md     # Flask patterns, decorators, commands
├── ProjectStructure.md     # Full app structure, testing, deployment
└── .metadata.json         # Version tracking, quality scores

🚀 EXAMPLE WORKFLOW: Adding Authentication
1. /research-feature "user authentication" --project-context
   → Researches auth approaches compatible with existing stack
2. /code-standards-init flask (if not already done)
   → Ensures Flask standards are available
3. Implement feature using research recommendations
4. /project-standards-audit flask
   → Validates implementation follows Flask standards

Learn more: .claude/CLAUDE.md
════════════════════════════════════════════════════════
EOF