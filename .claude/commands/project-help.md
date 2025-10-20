# Project Help

View complete documentation for the project standards system and available commands.

## Purpose
Provides comprehensive documentation about:
- How the project standards system works
- Available commands and their usage
- System structure and organization
- Best practices for maintaining standards

## Usage

### Interactive Mode (Recommended)
```bash
/project-help
```
Opens an interactive menu with detailed information about each component.

### Quick Reference
```bash
/project-help --list     # List all commands
/project-help --structure # Show directory structure
/project-help --workflow  # Show example workflow
```

## What You'll Learn

### System Overview
- Purpose of the .claude directory
- How standards improve code quality
- AI context management
- Session persistence

### Available Commands
- `/code-standards-init` - Initialize framework-specific coding standards
- `/code-standards-audit` - Validate documentation currency against industry standards
- `/project-standards-audit` - Audit project compliance with documented standards
- `/research-feature` - AI-driven feature research and implementation planning
- `/language-select` - Configure project language
- `/load-context` - Restore previous session
- `/save-context` - Save session insights

### Directory Structure
```
.claude/
├── CLAUDE.md              # Main navigation
├── aiContext/             # Context files
│   ├── baseContext.md     # Universal principles
│   └── codingStandards/   # Language-specific
├── commands/              # System commands
└── settings.local.json    # Configuration
```

### How Standards Work

1. **Detection Phase**
   - Automatically identifies project language
   - Detects installed frameworks
   - Checks for existing standards

2. **Standards Initialization**
   - Generates framework-specific documentation
   - Creates project structure templates
   - Adds best practices and patterns

3. **Feature Research**
   - AI-driven research for new feature implementations
   - Provides tech stack recommendations
   - Suggests implementation methodologies

4. **Compliance Validation**
   - Audits project structure against standards
   - Validates file organization and naming
   - Provides compliance scoring

5. **Documentation Maintenance**
   - Checks for framework updates
   - Identifies deprecated patterns
   - Maintains currency with industry standards

6. **AI Integration**
   - Claude uses standards for consistent code
   - Follows project patterns
   - Applies documented best practices

## Interactive Menu Options

### [1] View System Structure
Shows complete directory layout with explanations.

### [2] How Standards Work
Explains the detection, bootstrap, and validation process.

### [3] Framework Documentation
Details what documentation gets created for each framework.

### [4] Context Management
Explains the 3-tier context system and size limits.

### [5] Best Practices
Tips for maintaining and customizing standards.

## Example Workflows

### Starting a New Project
1. Initialize your project (npm init, pip install, etc.)
2. Start Claude - language auto-detected
3. Run `/code-standards-init` if frameworks detected
4. Standards guide all future code development

### Adding a New Feature
1. Research feature: `/research-feature "user authentication" --project-context`
2. Review tech stack and implementation recommendations
3. Implement feature using research guidance
4. Validate compliance: `/project-standards-audit`

### Maintaining Project Standards
1. Check documentation currency: `/code-standards-audit`
2. Review outdated patterns and missing features
3. Update standards based on latest best practices
4. Validate project compliance: `/project-standards-audit`

### Adding New Framework
1. Install framework in project
2. Run `/code-standards-init` to detect and initialize
3. Framework standards created automatically
4. Language context updated with new framework

## Tips

- Run `/project-help` when starting a new project
- Use `/research-feature` before implementing new functionality
- Use `/code-standards-audit` monthly to keep docs current
- Use `/project-standards-audit` to validate compliance
- Customize generated standards for your team
- Keep context files under size limits
- Document custom patterns in standards

## See Also

- `/code-standards-init` - Initialize framework standards
- `/code-standards-audit` - Validate documentation currency
- `/project-standards-audit` - Audit project compliance  
- `/research-feature` - Research feature implementation
- `.claude/CLAUDE.md` - System overview
- `.claude/aiContext/baseContext.md` - Core principles