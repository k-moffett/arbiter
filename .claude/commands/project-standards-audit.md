# Project Standards Audit

Audit your project's compliance with documented coding standards to ensure consistency and best practices.

## Purpose
Performs a comprehensive project compliance audit that:
- **Checks project structure** against documented standards
- **Validates file organization** and naming conventions
- **Ensures required files** are present and properly configured
- **Scores compliance** with specific, actionable feedback
- **Identifies missing components** for a complete project setup

## Usage

### Auto-Compliance Check
```bash
/project-standards-audit
```
Checks all projects against their documented standards.

### Specific Framework
```bash
/project-standards-audit flask      # Check Flask project compliance
/project-standards-audit react      # Check React project compliance
```

## Project Compliance Report

The command generates a comprehensive compliance report:

```
=== Project Standards Compliance Audit ===

📦 PROJECT COMPLIANCE: flask (python/server)

🔍 Project Compliance Check:
Comparing actual project structure against documented standards...

  ✅ Standard project directory found
  ✅ Test directory found
  ⚠️ No .env.example or .env.template
  ✅ Python naming conventions followed
  ✅ Python dependency file found

📋 Additional Compliance Checks:
  ⚠️ No license file
  ⚠️ No security policy
  ✅ CI/CD configuration found
  ✅ Dependency lock file found
  ✅ Code formatting config found
  ⚠️ No development environment configuration

  ✅ README found
  ✅ .gitignore found

  📊 Compliance Score: 8/12 (67%) - Needs improvement
  Issues found in: Environment config, License, Security documentation, Dev environment
```

## Compliance Checks

The audit examines multiple aspects of your project:

### Core Structure
- **Directory organization** - Standard src/, app/, or framework-specific directories
- **Test structure** - Proper test directory organization
- **Configuration files** - Framework-specific config files present
- **Naming conventions** - Follows language-specific naming standards

### Dependencies & Environment
- **Dependency files** - requirements.txt, package.json, etc.
- **Lock files** - Ensures reproducible builds
- **Environment templates** - .env.example for configuration
- **Development setup** - Docker, devcontainer, or other dev environment config

### Quality & Standards
- **Code formatting** - Prettier, Black, ESLint configuration
- **CI/CD setup** - GitHub Actions, GitLab CI, or other automation
- **Documentation** - README, license, security policy
- **Version control** - .gitignore and proper Git setup

### Framework-Specific Checks
- **Python projects**: Virtual environment setup, PEP 8 compliance
- **TypeScript projects**: TypeScript config, module structure
- **React projects**: Component organization, build setup
- **API projects**: Documentation, testing structure

## Scoring System

Projects are scored based on compliance with documented standards:

### Score Categories
- **90-100%**: Excellent - Project follows all best practices
- **70-89%**: Good - Minor issues that should be addressed
- **50-69%**: Needs improvement - Several compliance gaps
- **<50%**: Major issues - Significant restructuring needed

### Scoring Factors
Each check contributes equally to the final score:
- Core structure compliance
- Required file presence
- Framework-specific requirements
- Development environment setup
- Quality tooling configuration

## Common Issues & Solutions

### Low Compliance Scores
```bash
Issues found in: Environment config, License, Security documentation

Solutions:
• Add .env.example file with configuration templates
• Include LICENSE file (MIT, Apache, etc.)
• Create SECURITY.md with vulnerability reporting process
```

### Missing Development Setup
```bash
Issues found in: Dev environment, CI/CD setup

Solutions:
• Add Dockerfile or docker-compose.yml for consistent environments
• Set up GitHub Actions or similar CI/CD pipeline
• Include .devcontainer for VS Code development
```

### Framework-Specific Issues
- **Python**: Missing requirements.lock, no pyproject.toml formatting config
- **TypeScript**: Missing tsconfig.json, no ESLint/Prettier setup
- **React**: No components directory, missing build configuration

## Integration with Standards

This audit works in conjunction with:
- `/code-standards-audit` - Validates documentation currency against industry standards
- `/code-standards-init` - Creates initial framework standards to audit against

### Recommended Workflow
1. **Initialize standards**: `/code-standards-init <framework>`
2. **Check documentation currency**: `/code-standards-audit <framework>`
3. **Audit project compliance**: `/project-standards-audit <framework>`
4. **Fix identified issues** and re-run audit

## Examples

### Full Compliance Check
```bash
/project-standards-audit
```
Checks all detected frameworks for compliance.

### Framework-Specific Check
```bash
/project-standards-audit react
```
Focuses on React project compliance only.

### Continuous Integration
Add to your CI pipeline to maintain standards:
```yaml
- name: Check project compliance
  run: /project-standards-audit
```

## Notes

- Requires existing standards documentation (run `/code-standards-init` first)
- Non-destructive - only reports compliance, doesn't modify files
- Scores are calculated objectively based on file presence and structure
- Can be customized by editing framework-specific standards documentation