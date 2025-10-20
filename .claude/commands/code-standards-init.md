# Code Standards Init

Initialize framework documentation and coding standards for project auditing - supporting React, Flask, Express, Django, and more.

## Auto-Detection
Claude will automatically detect frameworks in your project and offer to create standards:
- **Python**: Flask, FastAPI, Django, Streamlit
- **TypeScript/JS**: Express, NestJS, React, Vue, Angular, Svelte
- **Go**: Gin, Echo, Fiber
- **Rust**: Actix, Rocket
- **Java**: Spring Boot
- **Ruby**: Rails, Sinatra

## Usage

### Automatic Detection
```bash
/code-standards-init
```
Detects frameworks and prompts to create missing standards.

### Manual Framework Selection
```bash
/code-standards-init flask          # Bootstrap Flask standards
/code-standards-init react          # Bootstrap React standards
/code-standards-init fastapi        # Bootstrap FastAPI standards
```

### Update Existing
```bash
/code-standards-init flask --update  # Update existing Flask standards
```

## What Gets Created

### Three-Tier Documentation System

1. **Language baseContext.md** (<3KB)
   - Updates language-specific fundamentals
   - Adds framework to detection list
   - Keeps concise to avoid context bloat

2. **FrameworkContext.md** (<2KB)
   - Quick reference for AI context
   - Common patterns and commands
   - Key dependencies

3. **ProjectStructure.md** (Detailed)
   - Complete file organization (~400 lines)
   - Configuration examples
   - Best practices
   - Testing strategies

### Example: Flask Bootstrap

When you run `/code-standards-init flask`, Claude will:

1. **Update** `.claude/aiContext/codingStandards/python/baseContext.md`
   - Add Flask to framework list
   - Include Flask validation commands

2. **Create** `.claude/aiContext/codingStandards/python/server/flask/FrameworkContext.md`
   - Flask patterns (decorators, blueprints)
   - Common commands
   - Key extensions

3. **Create** `.claude/aiContext/codingStandards/python/server/flask/ProjectStructure.md`
   - Full application structure
   - Configuration files
   - Testing setup
   - Deployment patterns

## Quality Standards

All generated documentation maintains:
- ✅ Consistent structure across frameworks
- ✅ Complete code examples
- ✅ Security best practices
- ✅ Testing strategies
- ✅ Performance guidelines
- ✅ Monitoring approaches

## Framework Categories

### Backend Frameworks
- Located in `[language]/server/[framework]/`
- Includes API design, database patterns, authentication

### Frontend Frameworks  
- Located in `[language]/client/[framework]/`
- Includes component structure, state management, routing

### Data Science Frameworks
- Located in `python/data-science/[framework]/`
- Includes notebook organization, pipeline patterns

### CLI/Scripts
- Located in `[language]/scripts/`
- Includes argument parsing, configuration, distribution

## Options

### Force Regeneration
```bash
/code-standards-init flask --force
```
Regenerates even if standards exist.

### Template Selection
```bash
/code-standards-init flask --template=microservices
/code-standards-init react --template=enterprise
```
Use specific architectural templates.

### Dry Run
```bash
/code-standards-init --dry-run
```
Shows what would be created without making changes.

## Notes

- Standards are based on current industry best practices
- Documentation follows consistent format for easy navigation
- Size limits prevent context bloat
- Can be customized after generation
- Automatically detects framework versions when possible