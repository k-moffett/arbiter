# Code Standards Audit

Validate framework documentation against current industry standards and generate research-based update recommendations.

## Purpose
Performs comprehensive documentation validation that:
- **Validates documentation quality** and completeness
- **Ensures standards remain current** with latest framework versions
- **Identifies deprecated patterns** in documentation
- **Provides research-guided updates** based on current industry practices
- **Generates actionable recommendations** for modernizing standards

## Usage

### Auto-Documentation Check
```bash
/code-standards-audit
```
Validates all existing framework documentation.

### Specific Framework
```bash
/code-standards-audit flask      # Audit Flask documentation
/code-standards-audit react      # Audit React documentation
```

### Options
```bash
/code-standards-audit --update    # Apply recommended updates
/code-standards-audit --dry-run   # Show what would change
/code-standards-audit --force     # Force complete refresh
```

## Documentation Audit Report

The command generates a comprehensive validation report:

```
=== Code Standards Documentation Audit ===

📦 FRAMEWORK: flask (python/server)

📅 Metadata:
  Last updated: 2024-01-15 (32 days ago)
  Documented version: 2.0.0
  Quality score: 78/100

📚 Context Files:
  ✅ Universal context is 1541 bytes (within limit)
  ✅ python context is 2588 bytes (within limit)
  ⚠️ flask context missing

  ✅ flask found in python context

📁 Project Structure:
  📊 Quality Score: 78/100 (Good)
  Missing: Testing Structure, File Naming Conventions

🔄 Version Check:
  Current version: 3.0.0
  Status: Update recommended (major version behind)

🔍 Checking for deprecated patterns...
  ⚠️ Flask-Script found (deprecated, use Click)
  ⚠️ Old SQLAlchemy query() syntax found

🔬 Research Recommendations:
To update this framework's standards with current industry practices:

RESEARCH_FRAMEWORK_STANDARDS: flask:python:server

📋 Research Instructions:

STEP 1: CURRENT INDUSTRY RESEARCH
  • Use WebSearch to find the LATEST flask official documentation
  • Search for 'flask best practices 2025' to find current standards
  • Look for 'flask security guidelines' and recent vulnerability reports
  • Find 'flask performance optimization' latest techniques
  • Check for 'flask migration guide' for breaking changes

STEP 2: VERSION AND COMPATIBILITY
  • Research latest stable version of flask
  • Check for python version compatibility requirements
  • Find breaking changes in recent flask releases
  • Document new features and recommended patterns
```

## What Gets Audited

### Documentation Quality
- **Required sections** - Root Directory, Core Structure, Configuration, Testing
- **Code examples** - Minimum 10 code blocks for comprehensive guidance
- **Documentation length** - At least 200 lines for thorough coverage
- **Section completeness** - All framework-specific sections present

### Version Currency
- **Framework versions** - Compares documented vs actual project versions
- **Breaking changes** - Identifies when major updates are needed
- **Migration paths** - Documents upgrade requirements
- **Compatibility** - Ensures language version compatibility

### Pattern Validation
- **Deprecated patterns** - Finds outdated practices in documentation
- **Security updates** - Identifies missing security improvements
- **Modern features** - Highlights new framework capabilities to document

### Context Management
- **File sizes** - Ensures context files stay within performance limits
- **Integration** - Verifies framework appears in language context
- **Hierarchy** - Validates proper documentation structure

## Research-Driven Updates

### Research Instructions
Each audit provides specific research guidance:
- **WebSearch queries** for latest documentation
- **Version compatibility** research requirements  
- **Security guidelines** investigation
- **Performance patterns** discovery
- **Migration paths** documentation

### Update Recommendations
Based on research findings:
- **Outdated patterns** to remove or update
- **New features** to document
- **Security improvements** to implement
- **Performance optimizations** to include

## Common Issues Found

### Outdated Framework Versions
```bash
Current version: 3.0.0
Documented: 2.0.0
Status: Major update needed

Action: Research Flask 3.0 changes and update documentation
```

### Missing Modern Patterns
```bash
Missing: Async support, Type hints, Modern testing

Action: Research current Flask async patterns and add examples
```

### Deprecated Patterns
```bash
Found: Flask-Script, old SQLAlchemy syntax

Action: Replace with Click CLI and SQLAlchemy 2.0 patterns
```

### Documentation Gaps
```bash
Missing sections: Testing Structure, File Naming Conventions
Quality score: 68/100 (below 70 threshold)

Action: Add missing sections with current best practices
```

## Update Workflow

When documentation needs updates:

```
🔄 Update Options:
1. Update outdated sections only
2. Add missing modern patterns  
3. Remove deprecated patterns
4. Full refresh (complete regeneration)
5. Skip update

UPDATE_STANDARDS_ACTION: [Select 1-5]
```

### Smart Updates
- **Preserves customizations** - Keeps company-specific additions
- **Creates backups** - Saves current version before changes
- **Shows differences** - Displays what will change
- **Maintains limits** - Respects context file size constraints

## Integration with Project Audit

Works in conjunction with project compliance checking:

### Recommended Audit Sequence
1. **Documentation currency**: `/code-standards-audit <framework>`
2. **Project compliance**: `/project-standards-audit <framework>`
3. **Initialize if missing**: `/code-standards-init <framework>`

This ensures both documentation is current AND projects follow those standards.

## Research Quality Guidelines

### Reliable Sources
- Official framework documentation
- Framework maintainer blogs and releases
- Major tech company engineering blogs
- Security advisory databases (OWASP, CVE)
- Package manager statistics and trends

### Research Verification
- **Multiple sources** - Verify practices across sources
- **Version specificity** - Note exact versions and release dates
- **Implementation examples** - Find working code samples
- **Community consensus** - Check adoption in popular projects

## Examples

### Full Documentation Audit
```bash
/code-standards-audit
```
Audits all framework documentation for currency and quality.

### Framework-Specific Deep Audit
```bash
/code-standards-audit react --update
```
Audits React documentation and prompts for updates.

### Research Mode
```bash
/code-standards-audit flask
```
Provides research instructions for updating Flask standards.

## Notes

- Focuses on documentation quality, not project compliance
- Provides research guidance for AI-assisted updates
- Non-destructive by default (use --update to modify)
- Validates against current industry practices
- Maintains context file performance constraints