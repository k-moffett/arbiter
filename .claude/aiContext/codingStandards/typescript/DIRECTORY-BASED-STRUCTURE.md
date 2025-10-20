# Directory-Based Structure Pattern

**Status:** ✅ Implemented (All infrastructure + base classes)
**Last Updated:** 2025-10-20
**Applies To:** All classes project-wide

## Overview

This document defines the mandatory directory-based structure pattern for all implementation classes in the Arbiter project. This pattern replaces single-file implementations with organized, modular directories that separate concerns and improve maintainability.

## The Problem This Solves

### Before (Single-File Pattern)
```
src/shared/infrastructure/implementations/
├── ConsoleLogger.ts          (207 lines - constants, interfaces, implementation mixed)
├── StandardErrorHandler.ts   (195 lines - utilities, interfaces, implementation mixed)
└── ...
```

**Issues:**
- Large files (150-200+ lines) difficult to navigate
- Mixed concerns (constants, types, interfaces, implementation all in one file)
- Hard to extend (adding subclasses requires modifying the base file)
- Difficult to extract and reuse utilities
- Poor separation of concerns
- Violates Single Responsibility Principle

### After (Directory-Based Pattern)
```
src/shared/infrastructure/
├── ConsoleLogger/
│   ├── index.ts                      (10 lines - barrel exports)
│   ├── ConsoleLoggerImplementation.ts (140 lines - pure implementation)
│   ├── consts.ts                     (20 lines - constants only)
│   └── interfaces.ts                 (10 lines - interfaces only)
```

**Benefits:**
- Small, focused files (each <150 lines)
- Clear separation of concerns
- Easy to extend with subclasses
- Reusable utilities
- Better IDE navigation
- Follows SOLID principles

## Pattern Structure

### Standard Directory Layout

```
src/{module}/
└── {ClassName}/
    ├── index.ts                      # REQUIRED - Barrel exports
    ├── {ClassName}Implementation.ts  # REQUIRED - Main class
    ├── consts.ts                     # OPTIONAL - Constants
    ├── enums.ts                      # OPTIONAL - Enums
    ├── types.ts                      # OPTIONAL - Type aliases
    ├── interfaces.ts                 # OPTIONAL - Interfaces
    ├── zodSchemas.ts                 # OPTIONAL - Zod schema definitions
    └── utils.ts                      # OPTIONAL - Pure utility functions

test/unit/{module}/
└── {ClassName}/
    └── {ClassName}Implementation.test.ts  # Tests mirror src structure
```

### File Responsibilities

#### index.ts (REQUIRED)
**Purpose:** Barrel export file - the public API of the module

```typescript
/**
 * {ClassName} Module
 *
 * Exports the {ClassName} implementation and related types.
 */

export { ClassName } from './{ClassName}Implementation';
export type { ClassNameParams } from './interfaces';
export type { AdditionalType } from './types'; // If types.ts exists
```

**Rules:**
- Must export main class with original name (not `{ClassName}Implementation`)
- Must export all public types and interfaces
- Type exports come before value exports (perfectionist rule)
- Keep sorted alphabetically (perfectionist rule)

#### {ClassName}Implementation.ts (REQUIRED)
**Purpose:** Contains ONLY the class implementation

```typescript
/**
 * {ClassName}
 *
 * Brief description of what this class does.
 *
 * Features:
 * - Feature 1
 * - Feature 2
 *
 * @example
 * ```typescript
 * const instance = new ClassName({ param: value });
 * instance.doSomething();
 * ```
 */

import type { ParamType } from './interfaces';
import type { ExternalType } from '../BaseClass';

import { BaseClass } from '../BaseClass';
import { SOME_CONSTANT } from './consts';
import { utilityFunction } from './utils';

export class ClassName extends BaseClass {
  // Implementation only - no constants, types, or interfaces
}
```

**Rules:**
- Class must have JSDoc header
- Import types from local files (./interfaces, ./types)
- Import constants from ./consts.ts
- Import utilities from ./utils.ts
- NO inline constants (extract to consts.ts)
- NO inline types (extract to types.ts or interfaces.ts)
- NO inline interfaces (extract to interfaces.ts)
- Focus ONLY on implementation logic

#### consts.ts (OPTIONAL)
**Purpose:** Module-level constants only

```typescript
/**
 * {ClassName} Constants
 *
 * Description of what constants are defined here.
 */

import { LogLevel } from '../types'; // If needed for typing

/**
 * Description of constant
 */
export const CONSTANT_NAME = value;

/**
 * Description of constant object
 */
export const CONFIG_OBJECT: Record<string, string> = {
  key: 'value',
};

/**
 * Description of constant set
 */
export const VALUE_SET = new Set([value1, value2]);
```

**Rules:**
- Only create if constants exist
- All constants UPPER_SNAKE_CASE
- Must have JSDoc for each constant
- Can import types for typing constants
- Readonly values only

#### enums.ts (OPTIONAL)
**Purpose:** Enum definitions only

```typescript
/**
 * {ClassName} Enums
 *
 * Enum definitions for {ClassName}.
 */

/**
 * Status values for processing
 */
export enum ProcessingStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

/**
 * Priority levels
 */
export enum Priority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}
```

**Rules:**
- Only create if enums exist
- Use for: status values, priority levels, modes, states
- NO const enums (use regular enums)
- Must have JSDoc for each enum
- Enum names should be PascalCase
- Enum values should be lowercase strings (for serialization)
- Export individual enums (not as const object)

**When to use:**
- ✅ Fixed set of related values (status, priority, mode)
- ✅ Values need to be type-checked at compile time
- ✅ Values will be serialized to/from JSON
- ❌ Simple boolean flags (use boolean)
- ❌ Large sets of values (use union types)
- ❌ Values that might change (use configuration)

**Import in implementation:**
```typescript
import { ProcessingStatus, Priority } from './enums';

export class ClassName {
  public setStatus(params: { status: ProcessingStatus }): void {
    // ... use enum
  }
}
```

#### types.ts (OPTIONAL)
**Purpose:** Type aliases and utility types only

```typescript
/**
 * {ClassName} Types
 *
 * Type definitions for {ClassName}.
 */

/**
 * Description of type
 */
export type TypeName<T> = {
  field: T;
};

/**
 * Description of union
 */
export type UnionType = Type1 | Type2;

/**
 * Description of result type
 */
export type ResultType<T> = SuccessType<T> | FailureType;
```

**Rules:**
- Only create if type aliases exist
- Use for: union types, utility types, generic types
- NO interfaces (those go in interfaces.ts)
- Must have JSDoc for each type
- Keep simple - complex types may need own file

#### interfaces.ts (OPTIONAL)
**Purpose:** Interface definitions only

```typescript
/**
 * {ClassName} Interfaces
 *
 * Interface definitions for {ClassName} configuration.
 */

/**
 * Constructor parameters for {ClassName}
 */
export interface ClassNameParams {
  field: string;
  optionalField?: number;
}

/**
 * Internal structure description
 */
export interface InternalStructure {
  data: unknown;
}
```

**Rules:**
- Only create if interfaces exist
- Use for: constructor params, internal structures, external contracts
- NO "I" prefix (modern TypeScript style)
- Must have JSDoc for each interface
- Parameter interfaces should end with "Params"

#### zodSchemas.ts (OPTIONAL)
**Purpose:** Zod schema definitions only

```typescript
/**
 * {ClassName} Zod Schemas
 *
 * Zod schema definitions for {ClassName} validation.
 */

import { z } from 'zod';

/**
 * Schema for validating input data
 */
export const InputDataSchema = z.object({
  email: z.string().email('Invalid email address'),
  age: z.number().min(18, 'Must be at least 18 years old'),
  name: z.string().min(1, 'Name is required'),
});

/**
 * Schema for validating configuration
 */
export const ConfigSchema = z.object({
  apiKey: z.string().min(32, 'API key must be at least 32 characters'),
  endpoint: z.string().url('Must be a valid URL'),
  timeout: z.number().positive().optional(),
});

/**
 * Schema for nested validation
 */
export const AddressSchema = z.object({
  city: z.string(),
  country: z.string(),
  street: z.string(),
  zipCode: z.string().regex(/^\d{5}(-\d{4})?$/, 'Invalid zip code'),
});

export const UserSchema = z.object({
  address: AddressSchema,
  email: z.string().email(),
  name: z.string(),
});
```

**Rules:**
- Only create if Zod schemas are defined for this class
- Keep all Zod schemas for this implementation in one place
- Use for: input validation, config validation, API contracts
- Must have JSDoc for each schema
- Schema names should be PascalCase ending with "Schema"
- Export individual schemas (not as a const object)
- Complex nested schemas should be broken into smaller schemas
- Prefer composition over large monolithic schemas

**When to use:**
- ✅ Class validates external input with Zod schemas
- ✅ Multiple related schemas used by the class
- ✅ Schemas are reused across methods
- ❌ Single schema only used once (keep in implementation)
- ❌ Test-only schemas (keep in test files)
- ❌ Schemas shared across multiple classes (create shared schema file)

**Import in implementation:**
```typescript
import { ConfigSchema, InputDataSchema } from './zodSchemas';

export class ClassName {
  public validateInput(params: { data: unknown }): ValidationResult {
    const result = InputDataSchema.safeParse(params.data);
    // ... use schema
  }
}
```

#### utils.ts (OPTIONAL)
**Purpose:** Pure utility functions only

```typescript
/**
 * {ClassName} Utilities
 *
 * Pure utility functions for {ClassName} operations.
 */

/**
 * Description of what this function does
 *
 * @param params - Function parameters
 * @param params.field1 - Description
 * @param params.field2 - Description
 * @returns What it returns
 */
export function utilityFunction(params: {
  field1: string;
  field2: number;
}): ResultType {
  // Pure function logic - no side effects
  return result;
}
```

**Rules:**
- Only create if pure functions exist
- Must be pure functions (no side effects)
- Cannot use class instance state
- Must use typed object parameters
- Must have comprehensive JSDoc
- Should be testable independently
- Extract private methods that don't need `this` context

### Test File Location

```
test/unit/shared/infrastructure/{ClassName}/{ClassName}Implementation.test.ts
```

**Rules:**
- Tests mirror src directory structure exactly
- Test file named after implementation file
- Still use barrel exports: `import { ClassName } from '@shared/_infrastructure'`
- NO imports from implementation files directly

## Import Order (Perfectionist)

### Within Implementation Files

```typescript
// 1. Type imports from parent directories
import type { ExternalType } from '../BaseClass';

// 2. Type imports from local files
import type { LocalInterface } from './interfaces';
import type { LocalType } from './types';

// (blank line)

// 3. Value imports from parent directories
import { BaseClass } from '../BaseClass';

// 4. Value imports from local files
import { CONSTANT } from './consts';
import { utilityFunction } from './utils';
```

### Within index.ts Exports

```typescript
// 1. Type exports (alphabetically)
export type { Interface1 } from './interfaces';
export type { Interface2 } from './interfaces';
export type { Type1 } from './types';

// 2. Value exports (alphabetically)
export { ClassName } from './ClassNameImplementation';
```

## When to Create Each File

### Always Create:
- ✅ **index.ts** - Every directory must have this
- ✅ **{ClassName}Implementation.ts** - Every directory must have this

### Create Only If Needed:
- ⚠️ **consts.ts** - Only if you have module-level constants
- ⚠️ **enums.ts** - Only if you have enum definitions
- ⚠️ **types.ts** - Only if you have type aliases
- ⚠️ **interfaces.ts** - Only if you have interfaces
- ⚠️ **zodSchemas.ts** - Only if you have Zod schema definitions
- ⚠️ **utils.ts** - Only if you have pure utility functions

### Never Create:
- ❌ Empty files just for consistency
- ❌ Files with only one export (keep in implementation)
- ❌ Files that duplicate base class functionality

## Real-World Examples

### Example 1: ConsoleLogger (Has consts + interfaces)

```
ConsoleLogger/
├── index.ts                          # Exports ConsoleLogger + ConsoleLoggerParams
├── ConsoleLoggerImplementation.ts    # Class implementation
├── consts.ts                         # ANSI_COLORS, ANSI_RESET, STDERR_LOG_LEVELS
└── interfaces.ts                     # ConsoleLoggerParams
```

**Why no types.ts or utils.ts?**
- No type aliases needed (uses types from ../types.ts)
- No pure functions (all methods need `this` context)

### Example 2: StandardErrorHandler (Has interfaces + utils)

```
StandardErrorHandler/
├── index.ts                                # Exports
├── StandardErrorHandlerImplementation.ts   # Class implementation
├── interfaces.ts                           # StandardErrorHandlerParams
└── utils.ts                                # enrichError, normalizeError
```

**Why no consts.ts or types.ts?**
- No module-level constants
- No type aliases
- Has utils because private methods were pure functions

### Example 3: ZodValidator (Has types + interfaces)

```
ZodValidator/
├── index.ts                        # Exports
├── ZodValidatorImplementation.ts   # Class implementation
├── types.ts                        # ZodValidationSuccess, ZodValidationFailure, ZodValidationResult
└── interfaces.ts                   # ZodSchema, ZodIssue, ZodValidatorParams
```

**Why no consts.ts or utils.ts?**
- No constants
- No pure functions
- Has types.ts for Zod result type aliases

### Example 4: MemoryCache (Has only interfaces)

```
MemoryCache/
├── index.ts                     # Exports
├── MemoryCacheImplementation.ts # Class implementation
└── interfaces.ts                # CacheEntryInternal, MemoryCacheParams
```

**Minimal structure - only what's needed**

## Extending with Subclasses

### Adding a Subclass

When you need a specialized version:

```
ConsoleLogger/
├── index.ts                          # Update to export both
├── ConsoleLoggerImplementation.ts    # Base implementation
├── JsonConsoleLogger/                # Subclass directory
│   ├── index.ts
│   ├── JsonConsoleLoggerImplementation.ts
│   └── types.ts                      # JSON-specific types
├── consts.ts
└── interfaces.ts
```

**Update parent index.ts:**
```typescript
export { ConsoleLogger } from './ConsoleLoggerImplementation';
export { JsonConsoleLogger } from './JsonConsoleLogger';
export type { ConsoleLoggerParams } from './interfaces';
```

## Nested Related Classes Pattern

### Critical Rule: Tightly Coupled Classes Follow Full Directory Structure

When a class is tightly coupled to another class (like `DomainError` with `BaseErrorHandler`), it can live in a nested directory under the parent class, **BUT IT MUST STILL FOLLOW THE FULL DIRECTORY-BASED STRUCTURE PATTERN**.

This is an important architectural decision: **there are no exceptions to the directory-based structure pattern, even for nested classes.**

### Example: DomainError Under BaseErrorHandler

```
src/shared/base/
└── BaseErrorHandler/
    ├── index.ts                              # Re-exports DomainError
    ├── BaseErrorHandlerImplementation.ts     # Main class
    ├── interfaces.ts                         # BaseErrorHandler interfaces
    └── DomainError/                          # ← Nested class with FULL structure
        ├── index.ts                          # Barrel exports
        ├── DomainErrorImplementation.ts      # Class implementation
        └── interfaces.ts                     # DomainErrorParams
```

**Why DomainError is nested:**
- DomainError is tightly coupled to BaseErrorHandler
- It's primarily used by error handlers
- It's a core part of the error handling domain

**Why it still follows the full pattern:**
- Maintains architectural consistency
- Enables future extensibility (subclasses, utilities, etc.)
- Supports Clean Architecture principles
- No exceptions to the pattern

### Setting Up the Nested Class

**DomainError/index.ts:**
```typescript
/**
 * DomainError Module
 *
 * Exports the DomainError class and related types.
 */

export { DomainError } from './DomainErrorImplementation';
export type { DomainErrorParams } from './interfaces';
```

**DomainError/interfaces.ts:**
```typescript
/**
 * DomainError Interfaces
 *
 * Interface definitions for DomainError configuration.
 */

export interface DomainErrorParams {
  code: string;
  context?: Record<string, unknown>;
  message: string;
}
```

**DomainError/DomainErrorImplementation.ts:**
```typescript
/**
 * DomainError
 *
 * Represents operational errors in the domain layer.
 */

import type { DomainErrorParams } from './interfaces';

export class DomainError extends Error {
  public readonly code: string;
  public readonly context: Record<string, unknown> | undefined;
  public readonly isOperational: boolean;

  constructor(params: DomainErrorParams) {
    super(params.message);
    this.name = 'DomainError';
    this.code = params.code;
    this.context = params.context;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}
```

### Re-exporting from Parent

**BaseErrorHandler/index.ts:**
```typescript
/**
 * BaseErrorHandler Module
 *
 * Exports the BaseErrorHandler abstract class, DomainError, and related types.
 */

export { BaseErrorHandler } from './BaseErrorHandlerImplementation';

// Re-export DomainError from subdirectory
export { DomainError } from './DomainError';
export type { DomainErrorParams } from './DomainError';

export type {
  CreateErrorParams,
  CreateValidationErrorParams,
  HandleErrorParams,
  IsOperationalParams,
} from './interfaces';
```

**Rules for re-exporting:**
- Parent index.ts re-exports nested class and its types
- Consumers can import from either level:
  - `import { DomainError } from '@shared/_base'` ✅
  - `import { DomainError } from '@shared/_base/BaseErrorHandler'` ✅
- Nested class maintains its own barrel export
- Follow perfectionist sort order (DomainError exports before interfaces exports)

### When to Use Nested Related Classes

**Use this pattern when:**
- ✅ Class is tightly coupled to parent class
- ✅ Class is primarily used by parent or in same domain
- ✅ Logical grouping improves understanding
- ✅ Class extends or supports parent functionality

**Don't use this pattern when:**
- ❌ Class is used across multiple domains (use shared/)
- ❌ Class could logically be standalone
- ❌ Nesting exceeds 2 levels (keep hierarchies shallow)
- ❌ Class is just a utility (use utils.ts instead)

### Common Examples

**Good use cases:**
- `BaseErrorHandler/DomainError/` - Error class used by error handlers
- `QueryBuilder/QueryExpression/` - Expression class used by query builder
- `ValidationEngine/ValidationRule/` - Rule class used by validation engine

**Bad use cases:**
- ❌ `UserService/UserDTO/` - DTOs are often shared, should be in shared/dto/
- ❌ `DataLoader/Cache/` - Cache might be used by other loaders
- ❌ `Parser/Utils/` - Use utils.ts instead

### Important Reminders

1. **No exceptions to the pattern**: Even nested classes get full directory structure
2. **Don't over-nest**: Keep hierarchies shallow (max 2 levels)
3. **Re-export from parent**: Make nested classes accessible from parent barrel
4. **Follow all rules**: Same rules apply (interfaces.ts, consts.ts, etc.)
5. **Test location**: Tests still mirror src structure exactly

## Barrel Export Updates

### Main Infrastructure Barrel (src/shared/infrastructure/index.ts)

```typescript
// Implementations
export { ConsoleLogger } from './ConsoleLogger';
export type { ConsoleLoggerParams } from './ConsoleLogger';
export { MemoryCache } from './MemoryCache';
export type { MemoryCacheParams } from './MemoryCache';
// ... etc
```

**Rules:**
- Import from directory (not from /index.ts explicitly)
- Type exports come before value exports
- Keep alphabetically sorted (perfectionist)
- Group by logical sections

## Common Mistakes to Avoid

### ❌ Don't: Mix concerns in implementation file
```typescript
// ConsoleLoggerImplementation.ts
const ANSI_COLORS = { ... };  // ❌ Extract to consts.ts

interface ConsoleLoggerParams {  // ❌ Extract to interfaces.ts
  level?: LogLevel;
}

export class ConsoleLogger { ... }
```

### ✅ Do: Separate concerns into files
```typescript
// consts.ts
export const ANSI_COLORS = { ... };

// interfaces.ts
export interface ConsoleLoggerParams {
  level?: LogLevel;
}

// ConsoleLoggerImplementation.ts
import { ANSI_COLORS } from './consts';
import type { ConsoleLoggerParams } from './interfaces';

export class ConsoleLogger { ... }
```

### ❌ Don't: Create empty placeholder files
```typescript
// utils.ts
// (empty file) ❌
```

### ✅ Do: Only create files when needed
```
ConsoleLogger/
├── index.ts
├── ConsoleLoggerImplementation.ts
├── consts.ts
└── interfaces.ts
(no utils.ts because we don't have utility functions)
```

### ❌ Don't: Export implementation class name from index
```typescript
// index.ts
export { ConsoleLoggerImplementation } from './ConsoleLoggerImplementation';  // ❌
```

### ✅ Do: Export with original class name
```typescript
// index.ts
export { ConsoleLogger } from './ConsoleLoggerImplementation';  // ✅
```

### ❌ Don't: Import from implementation files in tests
```typescript
// ConsoleLoggerImplementation.test.ts
import { ConsoleLogger } from '../ConsoleLogger/ConsoleLoggerImplementation';  // ❌
```

### ✅ Do: Use barrel exports in tests
```typescript
// ConsoleLoggerImplementation.test.ts
import { ConsoleLogger } from '@shared/_infrastructure';  // ✅
```

## Migration Checklist

When refactoring a new class to this pattern:

1. ✅ Create directory: `src/{module}/{ClassName}/`
2. ✅ Create test directory: `test/unit/{module}/{ClassName}/`
3. ✅ Extract constants → `consts.ts` (if any)
4. ✅ Extract enums → `enums.ts` (if any)
5. ✅ Extract type aliases → `types.ts` (if any)
6. ✅ Extract interfaces → `interfaces.ts` (if any)
7. ✅ Extract Zod schemas → `zodSchemas.ts` (if any)
8. ✅ Extract pure functions → `utils.ts` (if any)
9. ✅ Move implementation → `{ClassName}Implementation.ts`
10. ✅ Create barrel export → `index.ts`
11. ✅ Update parent barrel export
12. ✅ Move/create tests → `test/unit/{module}/{ClassName}/`
13. ✅ Run `npm run lint` - verify no errors
14. ✅ Run `npm run typecheck` - verify no errors
15. ✅ Run `npm test` - verify tests pass
16. ✅ Delete old single file

## Benefits Recap

### For Developers
✅ Easier to navigate - small, focused files
✅ Easier to extend - add subclasses without modifying base
✅ Easier to test - utilities can be tested independently
✅ Better IDE support - faster autocomplete, better navigation
✅ Less merge conflicts - changes are localized

### For AI Assistants
✅ Clearer context - can read specific files instead of entire implementation
✅ Better understanding - separation of concerns is explicit
✅ Easier to maintain - know exactly where to add new code
✅ Consistent patterns - same structure across all implementations

### For Codebase
✅ SOLID compliance - Single Responsibility Principle
✅ Maintainable - small, focused files
✅ Extensible - easy to add subclasses
✅ Testable - utilities can be tested in isolation
✅ Professional - follows modern TypeScript best practices

## Enforcement

This pattern is:
- ✅ **Mandatory** for all new implementations
- ✅ **Applied** to all existing implementations (as of 2025-10-20)
- ✅ **Enforced** through code review
- ✅ **Documented** in project standards
- ✅ **Validated** through lint rules (perfectionist import sorting)

## Questions & Answers

**Q: Should I create all 7 optional files every time?**
A: No! Only create files that are needed. If you have no constants, don't create consts.ts. If you have no Zod schemas, don't create zodSchemas.ts.

**Q: When should I use zodSchemas.ts vs keeping schemas in the implementation?**
A: Use zodSchemas.ts when you have multiple related schemas or schemas reused across methods. Keep single-use schemas in the implementation file. Never put test-only schemas in zodSchemas.ts.

**Q: Should Zod schemas be shared across multiple implementations?**
A: No! Each implementation directory has its own zodSchemas.ts. For schemas shared across implementations, create a `src/shared/schemas/` directory with appropriately named schema files.

**Q: Where do type guards belong?**
A: In the implementation file if they need class context. In utils.ts only if they're pure.

**Q: Can I have nested subdirectories?**
A: Only for subclasses. Don't create deep nesting for organization.

**Q: What about shared types across multiple implementations?**
A: Keep them in `src/_shared/_infrastructure/types.ts` (the shared types file).

**Q: Should test files import from the implementation file directly?**
A: No! Always use barrel exports: `import { ClassName } from '@shared/_infrastructure'`.

**Q: How do I know if a method should be in utils.ts?**
A: If it doesn't use `this` and is a pure function, extract it to utils.ts.

## Version History

- **v1.3** (2025-10-20): Added enums.ts optional file pattern and expanded scope project-wide
  - Added `enums.ts` to standard directory layout
  - Documented enum organization pattern with comprehensive guidelines
  - Updated pattern scope from infrastructure-only to all classes project-wide
  - Refactored LogLevel enum from types.ts to dedicated enums.ts file
  - Updated migration checklist to include enum extraction
  - Updated "Applies To" to cover entire project
  - All lint, typecheck, and tests passing

- **v1.2** (2025-10-20): Refactored all Base classes to directory-based structure
  - Moved BaseLogger, BaseCache, BaseValidator, BaseMetrics, BaseErrorHandler to `src/shared/base/`
  - Implemented DomainError with full nested directory structure under BaseErrorHandler
  - Added "Nested Related Classes Pattern" documentation
  - Documented critical architectural rule: no exceptions to the pattern, even for nested classes
  - Updated all implementation imports to use new base paths
  - All lint, typecheck, and tests passing

- **v1.1** (2025-10-20): Added zodSchemas.ts optional file pattern
  - Documented Zod schema organization pattern
  - Added guidelines for when to use zodSchemas.ts
  - Updated migration checklist to include schema extraction
  - Added Q&A for schema-related questions

- **v1.0** (2025-10-20): Initial implementation across all 6 infrastructure classes
  - ConsoleLogger
  - StandardErrorHandler
  - RuleValidator
  - ZodValidator
  - MemoryCache
  - SimpleMetrics
