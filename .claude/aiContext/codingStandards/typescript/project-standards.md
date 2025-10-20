# TypeScript Project Standards - Arbiter

## File Organization

### Plan Files
- **Location:** `.claude/aiContext/plans/`
- **Naming:** `YYYYMMDD-HHMMSS-descriptive-name.md` (timestamp prefix)
- **Purpose:** Track major implementation phases (>2 hours work)
- **Structure:**
  - Overview (what and why)
  - Phases with tasks and acceptance criteria
  - Success metrics
  - Checkpoints
  - Risk mitigation
- **When to create:**
  - Starting new feature implementation
  - Major refactoring
  - Architecture changes
  - Multi-day work spanning multiple sessions
- **Update status:** Pending → In Progress → Completed
- **Reference in todos:** Connect planning with execution

### Summaries
- **Location:** `.claude/aiContext/summaries/`
- **Purpose:** Session insights, decisions, context preservation
- **Naming:** `FEATURE-NAME-SUMMARY.md`

### Temporary Files
- **Location:** `.claude/aiContext/temp/`
  - `.claude/aiContext/temp/test/` - Test scripts
  - `.claude/aiContext/temp/scripts/` - Utility scripts
- **Rule:** NEVER create temp files in project root
- **Cleanup:** Remove when research/investigation complete
- **Gitignored:** Yes, to prevent bloat

### Directory-Based Structure Pattern
**Status:** ✅ **MANDATORY** for all classes project-wide

All classes in the project must follow the directory-based structure pattern:

```
src/{module}/{ClassName}/
    ├── index.ts                      # Barrel exports (required)
    ├── {ClassName}Implementation.ts  # Main class (required)
    ├── consts.ts                     # Constants (optional)
    ├── enums.ts                      # Enums (optional)
    ├── types.ts                      # Type aliases (optional)
    ├── interfaces.ts                 # Interfaces (optional)
    ├── zodSchemas.ts                 # Zod schemas (optional)
    └── utils.ts                      # Pure functions (optional)
```

**Key Principles:**
- ✅ Each class gets its own directory
- ✅ Separate concerns: constants, enums, types, interfaces, schemas, implementation
- ✅ Small, focused files (<150 lines each)
- ✅ Only create optional files when needed
- ✅ Tests mirror src structure in `test/unit/`

**See:** [DIRECTORY-BASED-STRUCTURE.md](./DIRECTORY-BASED-STRUCTURE.md) for complete documentation

**Applied To:**
- All infrastructure: ConsoleLogger, StandardErrorHandler, RuleValidator, ZodValidator, MemoryCache, SimpleMetrics
- All base classes: BaseLogger, BaseCache, BaseValidator, BaseMetrics, BaseErrorHandler, DomainError

### Folder Naming Convention: Organizing vs Implementation

**Problem:** Mixing organizational containers with implementation folders creates visual confusion and cognitive load.

**Solution:** Use underscore prefix `_` for organizing folders to create visual distinction and force sorted grouping.

#### Folder Types

**Organizing Folders (Containers):**
- **Purpose:** Group related modules, provide namespace, architectural boundaries
- **Convention:** `_lowercase` with underscore prefix
- **Examples:** `_shared`, `_base`, `_infrastructure`, `_domains`, `_usecases`
- **Rule:** May contain subfolders and implementation folders, never standalone classes

**Implementation Folders (Classes):**
- **Purpose:** House a single class implementation following directory-based structure
- **Convention:** `PascalCase` matching the class name
- **Examples:** `ConsoleLogger`, `UserService`, `BaseLogger`
- **Rule:** Must be nested within organizing folders, never at src/ root

#### Directory Structure

```
src/
├── _shared/                      ← organizing folder (sorts first)
│   ├── _base/                    ← organizing folder (nested)
│   │   ├── BaseCache/            ← implementation (PascalCase)
│   │   └── BaseLogger/           ← implementation (PascalCase)
│   ├── _infrastructure/          ← organizing folder (nested)
│   │   ├── ConsoleLogger/        ← implementation (PascalCase)
│   │   └── MemoryCache/          ← implementation (PascalCase)
│   └── lib/                      ← organizing folder (utilities)
│
├── _domains/                     ← organizing folder (future)
│   └── User/
│       └── UserEntity/           ← implementation (PascalCase)
│
└── _usecases/                    ← organizing folder (future)
    └── Auth/
        └── LoginUseCase/         ← implementation (PascalCase)
```

#### Naming Rules

1. ✅ **Organizing folders MUST use `_lowercase` prefix**
   - Examples: `_shared`, `_base`, `_domains`, `_core`
   - Sorts before alphanumeric characters on most systems

2. ✅ **Implementation folders MUST use `PascalCase`**
   - Match the exported class name exactly
   - Examples: `ConsoleLogger`, `UserService`, `BaseLogger`

3. ✅ **Implementation folders MUST be nested**
   - Never place PascalCase implementation folders at src/ root
   - Always nest within an organizing folder

4. ❌ **Never mix conventions**
   - Don't use `_PascalCase` or `lowercase` for implementations
   - Don't use `PascalCase` for organizing folders

#### Sort Order Behavior

The underscore prefix forces organizing folders to appear first in most file explorers:

**macOS/Windows:**
```
_base/           ← organizing (sorts first)
_infrastructure/ ← organizing (sorts first)
_shared/         ← organizing (sorts first)
BaseLogger/      ← implementation (sorts after)
ConsoleLogger/   ← implementation (sorts after)
lib/             ← organizing (no prefix, sorts with implementations)
```

**Note:** Sorting behavior may vary on Linux depending on locale settings.

#### Benefits

✅ **Visual clarity** - Organizing folders visually distinct from implementations
✅ **Reduced cognitive load** - Easy to identify folder purpose at a glance
✅ **Forced grouping** - Organizing folders sort together
✅ **Scalable** - Pattern works as project grows
✅ **Minimal refactoring** - Only organizing folders need renaming

#### Examples

**✅ Correct:**
```
src/
├── _shared/_base/BaseLogger/           # Organizing → Organizing → Implementation
└── _domains/User/UserEntity/           # Organizing → Organizing → Implementation
```

**❌ Incorrect:**
```
src/
├── shared/BaseLogger/                  # Missing underscore prefix
├── _ConsoleLogger/                     # Wrong: underscore on implementation
└── UserService/                        # Wrong: implementation at root level
```

## Module System

- **ESM ONLY:** Use `import/export`, never `require()` or `module.exports`
- **Package.json:** Contains `"type": "module"`
- **File extensions:** `.ts`, `.mts` for TypeScript; `.js`, `.mjs` for JavaScript
- **No CommonJS:** Project is pure ESM

## Code Quality Standards

### Testing
- **Minimum coverage:** 80%
- **Test location:** `test/unit/` and `test/integration/`
- **Framework:** Jest with ts-jest
- **Naming:** `*.test.ts` or `*.spec.ts`

### Linting & Type Checking
- **ESLint:** Strict mode, zero errors, zero warnings
- **TypeScript:** Strict mode enabled
  - `strictNullChecks: true`
  - `noImplicitAny: true`
  - `exactOptionalPropertyTypes: true`
- **Commands:**
  - `npm run typecheck` - Type checking only
  - `npm run lint` - ESLint all files
  - `npm run lint:fix` - Auto-fix issues

### Code Metrics
- **Max function length:** 75 lines
- **Max file length:** 400 lines (500 for tests)
- **Max cyclomatic complexity:** 10
- **Max function parameters:** 1 (use typed object params)
- **Max class properties:** 15
- **Max class methods:** 15

### Custom ESLint Rules
Project enforces additional code quality rules beyond standard ESLint:

#### no-promise-constructor
**Rule:** Prevent explicit Promise construction
- ❌ Avoid: `Promise.resolve()`, `Promise.reject()`, `new Promise()`
- ✅ Use: `async`/`await` patterns
- **Rationale:** Modern async/await is more readable and maintainable

```typescript
// ❌ Bad
public async flush(): Promise<void> {
  return Promise.resolve();
}

// ✅ Good
public async flush(): Promise<void> {
  return;
}
```

#### no-switch-statement
**Rule:** Prevent switch statements
- ❌ Avoid: `switch` / `case` statements
- ✅ Use: Object literals, Map, or polymorphic dispatch
- **Rationale:** Object literals are more maintainable and testable

```typescript
// ❌ Bad
switch (status) {
  case 'pending': return handlePending();
  case 'active': return handleActive();
  default: return handleUnknown();
}

// ✅ Good
const handlers = {
  pending: () => handlePending(),
  active: () => handleActive(),
};
return (handlers[status] ?? handleUnknown)();
```

#### no-logging-in-loops
**Rule:** Prevent logging inside loops
- ❌ Avoid: `logger.info()`, `console.log()` in loops
- ✅ Use: Collect data, log once outside loop
- **Rationale:** Performance and log volume management

```typescript
// ❌ Bad
for (const item of items) {
  logger.info({ message: `Processing ${item.id}` });
  process(item);
}

// ✅ Good
const processed = items.map((item) => process(item));
logger.info({ message: `Processed ${processed.length} items` });
```

#### max-conditions-per-statement
**Rule:** Limit logical operators (&&, ||) to 1 per statement
- ❌ Avoid: Multiple conditions in single statement
- ✅ Use: Early returns, Extract Methods, Specification Pattern
- **Rationale:** Improves readability and testability

```typescript
// ❌ Bad
if (user !== null && user.isActive && user.hasPermission('admin')) {
  doSomething();
}

// ✅ Good - Early returns
if (user === null) return;
if (!user.isActive) return;
if (!user.hasPermission('admin')) return;
doSomething();

// ✅ Good - Extract method
if (isValidAdmin(user)) {
  doSomething();
}

private isValidAdmin(user: User | null): boolean {
  if (user === null) return false;
  if (!user.isActive) return false;
  return user.hasPermission('admin');
}
```

#### no-bracket-notation
**Rule:** Prevent bracket notation with string literals
- ❌ Avoid: `obj['property']` with static strings
- ✅ Use: Dot notation `obj.property` or optional chaining `obj?.property`
- **Exception:** Dynamic/computed property access is allowed
- **Rationale:** Dot notation is safer and more readable

```typescript
// ❌ Bad
const value = obj['property'];
const name = data['user']['name'];

// ✅ Good - Dot notation
const value = obj.property;
const name = data.user.name;

// ✅ Good - Optional chaining for safety
const value = obj?.property;
const name = data?.user?.name;

// ✅ Good - Dynamic access (allowed)
const key = 'dynamicProperty';
const value = obj[key];
```

## Architecture Patterns

### Typed Object Parameters
All functions/methods MUST use typed object parameters:

```typescript
// ✅ Correct
function createUser(params: { email: string; name: string }): User {
  return new User(params.email, params.name);
}

// ❌ Wrong
function createUser(email: string, name: string): User {
  return new User(email, name);
}
```

### Null vs Undefined
- **Prefer null over undefined** for absent values
- Use `| null` for optional returns
- Use `| undefined` only for optional parameters/properties
- Check with `!== null` not `!= null` (no loose equality)

### No Any Types
- **Never use `any`**
- Use `unknown` with type guards instead
- Use proper TypeScript types or interfaces

```typescript
// ✅ Correct
function processData(data: unknown): Result {
  if (typeof data === 'object' && data !== null && 'id' in data) {
    return { id: (data as { id: string }).id };
  }
  throw new Error('Invalid data');
}

// ❌ Wrong
function processData(data: any): Result {
  return { id: data.id };
}
```

### Error Handling
- Always handle errors gracefully
- Use DomainError for domain-specific errors
- Use StandardErrorHandler for error processing
- Log all errors with BaseLogger
- Never swallow errors silently

### Input Validation
- Validate all external inputs
- Use ZodValidator for schema validation
- Use RuleValidator for simple validation
- Return ValidationResult with clear error messages

## Infrastructure Usage

### Base Classes
All infrastructure components must extend base classes:
- `BaseLogger` - Logging
- `BaseCache` - Caching
- `BaseMetrics` - Metrics
- `BaseValidator` - Validation
- `BaseErrorHandler` - Error handling

### Dependency Injection
- Use DI container for service management
- Register services with typed factory functions
- Prefer constructor injection
- Use singleton for stateless services
- Use transient for stateful services

## Documentation

### JSDoc
All public APIs require JSDoc:

```typescript
/**
 * Register a new user in the system
 *
 * @param params - Registration parameters
 * @param params.email - User email address
 * @param params.username - Unique username
 * @returns Newly created user entity
 *
 * @throws {DomainError} When email already exists
 *
 * @example
 * ```typescript
 * const user = await registerUser({
 *   email: 'user@example.com',
 *   username: 'johndoe'
 * });
 * ```
 */
public async registerUser(params: RegisterUserParams): Promise<User>
```

### File Headers
Every file should have a header comment:

```typescript
/**
 * UserRepository
 *
 * Repository for managing user persistence.
 * Provides CRUD operations for User entities.
 *
 * @example
 * ```typescript
 * const repo = new InMemoryUserRepository();
 * const user = await repo.create({ email, username });
 * ```
 */
```

## Security

### Secrets Management
- **NEVER commit secrets** to repository
- Use environment variables for sensitive data
- Use dotenv for local development
- Validate .env files exist in .gitignore

### Input Sanitization
- Validate all user inputs
- Sanitize data before storage
- Escape data before rendering
- Use parameterized queries

## Performance

### Context Management
- Load only relevant files
- Avoid context bloat (keep baseContext.md < 2KB)
- Use sub-agents for parallel work (max 6)
- Clean up temporary files

### Optimization Guidelines
- Profile before optimizing
- Measure performance impact
- Document optimization decisions
- Use caching appropriately
- Avoid premature optimization
