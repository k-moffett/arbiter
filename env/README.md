# Environment Configuration

This directory contains domain-specific environment configuration files for the Arbiter project.

## Overview

To reduce configuration complexity and improve maintainability, Arbiter separates environment variables into domain-specific files rather than maintaining one monolithic `.env` file.

## Structure

- **`.env.*.example`** - Template files (tracked in git)
- **`.env.*`** - Actual config files (gitignored, you create these locally)

## Setup

### Initial Setup

1. **Copy example files to actual config files:**
   ```bash
   cp env/.env.text-chunking.example env/.env.text-chunking
   # Repeat for other domains as needed
   ```

2. **Edit with your values:**
   ```bash
   nano env/.env.text-chunking
   # or use your preferred editor
   ```

3. **Each service automatically loads its specific ENV file:**
   - Config classes specify which ENV file to load
   - Default path conventions (e.g., `env/.env.text-chunking`)
   - Can override via constructor parameters

### Adding New ENV Files

When adding a new domain configuration:

1. Create `.env.{domain-name}.example` with all variables documented
2. Add to the table below
3. Update relevant config classes to load from the new file
4. Commit the `.example` file to git

## Current ENV Files

| File | Purpose | Used By |
|------|---------|---------|
| `.env.text-chunking` | Semantic chunking configuration | `SemanticChunkingConfig` |
| `.env.embeddings` | Ollama embedding service config | *Future* |
| `.env.vector-db` | Qdrant configuration | *Future* |
| `.env.llm-providers` | LLM provider settings | *Future* |
| `.env.discord-bot` | Discord bot configuration | *Future* |

## Naming Convention

**Format:** `.env.{domain-name}`

**Rules:**
- Use **kebab-case** for domain names (e.g., `text-chunking`, not `textChunking`)
- Domain name should be descriptive and scoped (e.g., `text-chunking` not just `chunking`)
- Always create both `.example` and actual files
- Keep each file focused on a single domain/service

**Examples:**
- ✅ `.env.text-chunking` - Good (specific domain)
- ✅ `.env.vector-db` - Good (specific service)
- ❌ `.env.config` - Bad (too generic)
- ❌ `.env.textChunking` - Bad (wrong case)

## File Organization

Each ENV file should include:

1. **Header comment** - Describes the domain/service
2. **Section dividers** - Group related variables
3. **Inline comments** - Document each variable
4. **Performance notes** - Explain impact of settings
5. **Quick start** - Recommended defaults for new users

**Example Structure:**
```bash
# =============================================================================
# Service Name - Configuration
# =============================================================================
# Brief description of what this configures
#
# Performance Impact:
# - Setting X affects Y
# - Higher values = more Z
#
# Quick Start: Use defaults for balanced performance

# =============================================================================
# Section Name
# =============================================================================

# Variable description
# Valid range: X-Y
# Recommended: Z
VARIABLE_NAME=default_value
```

## Loading Configuration

### In Config Classes

Config classes should accept an `envFile` parameter:

```typescript
export interface SemanticChunkingConfigConstructorParams {
  /** Path to ENV file (default: 'env/.env.text-chunking') */
  envFile?: string;

  /** Override specific config values (for testing) */
  overrides?: Partial<SemanticChunkingConfigParams>;
}

constructor(params: SemanticChunkingConfigConstructorParams = {}) {
  const envFile = params.envFile ?? 'env/.env.text-chunking';

  // Load ENV file
  dotenv.config({ path: envFile });

  // Use getEnv utility to load each variable
  const value = getEnv({
    key: 'VARIABLE_NAME',
    defaultValue: 'default'
  });
}
```

### Factory Pattern

Provide factory functions for convenience:

```typescript
export function createSemanticChunkingConfig(
  params?: SemanticChunkingConfigConstructorParams
): SemanticChunkingConfig {
  return new SemanticChunkingConfig(params);
}

// Usage
const config = createSemanticChunkingConfig();
// or with custom path
const config = createSemanticChunkingConfig({
  envFile: 'env/.env.text-chunking.test'
});
```

## Benefits

### 1. Separation of Concerns
Each domain has its own configuration file, making it clear which settings belong where.

### 2. Easier Onboarding
New developers can quickly identify and configure only the domains they're working on.

### 3. Reduced Merge Conflicts
Multiple developers can work on different configs without stepping on each other's toes.

### 4. Better Documentation
Each ENV file documents its specific domain comprehensively.

### 5. Scalability
Easy to add new domain configs as the project grows without bloating a single file.

### 6. Testing
Can easily create test-specific ENV files for different configurations.

## Troubleshooting

### Config Not Loading

**Problem:** Variables are undefined or using defaults

**Solutions:**
1. Verify the ENV file exists: `ls -la env/.env.text-chunking`
2. Check file permissions: `chmod 644 env/.env.text-chunking`
3. Verify no syntax errors in ENV file (no spaces around `=`)
4. Check config class is loading correct file path

### Git Tracking Issues

**Problem:** Actual ENV files are being tracked in git

**Solutions:**
1. Verify `env/.gitignore` exists and has correct patterns
2. If file was already tracked: `git rm --cached env/.env.text-chunking`
3. Commit the .gitignore changes

**Problem:** Example files are not tracked

**Solutions:**
1. Ensure filename ends with `.example` (e.g., `.env.text-chunking.example`)
2. Check `env/.gitignore` has the `!.env.*.example` exception pattern
3. Use `git add -f` to force-add if needed

### Configuration Validation Errors

**Problem:** Config class throws validation errors

**Solutions:**
1. Check ENV file has all required variables
2. Verify values are in valid ranges (e.g., weights sum to 1.0)
3. Review inline comments in `.example` file for valid ranges
4. Enable debug logging to see which validation failed

## Security

### Do Not Commit Secrets

- ❌ **NEVER** commit actual `.env.*` files (without `.example`)
- ❌ **NEVER** include sensitive values in `.example` files
- ✅ **ALWAYS** use placeholders in `.example` files
- ✅ **ALWAYS** document where to obtain sensitive values

**Example in `.example` file:**
```bash
# API key for Anthropic (get from: https://console.anthropic.com/)
# NEVER commit actual keys to git
ANTHROPIC_API_KEY=your-api-key-here
```

### Local Development

For local development, you can use different ENV files:

```bash
# Development
cp env/.env.text-chunking.example env/.env.text-chunking

# Testing
cp env/.env.text-chunking.example env/.env.text-chunking.test
```

## Related Documentation

- [Project Standards](../.claude/aiContext/codingStandards/typescript/project-standards.md)
- [Base Context](../.claude/aiContext/baseContext.md)
- [Main .env.example](../.env.example) - Main application ENV (still used for core settings)

---

**Pattern Established:** 2025-11-10
**Maintainer:** Development Team
