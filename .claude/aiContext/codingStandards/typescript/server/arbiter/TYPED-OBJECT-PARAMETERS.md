# Typed Object Parameters Pattern

**Status**: Required for all methods and constructors
**Enforced by**: ESLint rule `local-rules/require-typed-params`

---

## Overview

All methods and constructors in this project MUST accept a single typed object parameter instead of multiple positional parameters. This pattern eliminates confusion, improves maintainability, and makes the codebase AI-friendly.

---

## The Pattern

### ✅ Correct Pattern

```typescript
// Define parameter interface
export interface LogParams {
  context?: LogContext;
  message: string;
}

// Method accepts typed object
public info(params: LogParams): void {
  console.log(params.message, params.context);
}

// Usage
logger.info({ message: 'User logged in', context: { userId: '123' } });
```

### ❌ Incorrect Pattern

```typescript
// Multiple positional parameters - NOT ALLOWED
public info(message: string, context?: LogContext): void {
  console.log(message, context);
}

// Usage - confusing!
logger.info('User logged in', { userId: '123' });
```

---

## Rules

### Rule 1: All Methods with Parameters Use Typed Objects

**Every method that accepts parameters MUST accept a single typed object.**

```typescript
// ✅ CORRECT
export interface SetLevelParams {
  level: LogLevel;
}

public setLevel(params: SetLevelParams): void {
  this.level = params.level;
}

// ❌ WRONG - positional parameter
public setLevel(level: LogLevel): void {
  this.level = level;
}
```

### Rule 2: Methods with No Parameters Accept Nothing

**Methods that need no input accept no parameters.**

```typescript
// ✅ CORRECT - no parameters needed
public getLevel(): LogLevel {
  return this.level;
}

public flush(): Promise<void> {
  return Promise.resolve();
}
```

### Rule 3: Constructors Use Typed Objects

**All constructors accept a single typed configuration object.**

```typescript
// ✅ CORRECT
export interface ConsoleLoggerParams {
  context?: LogContext;
  level?: LogLevel;
  useColors?: boolean;
}

constructor(params: ConsoleLoggerParams = {}) {
  this.level = params.level ?? LogLevel.INFO;
  this.context = params.context ?? {};
  this.useColors = params.useColors ?? true;
}

// Usage
const logger = new ConsoleLogger({
  level: LogLevel.DEBUG,
  context: { service: 'api' }
});
```

### Rule 4: Parameter Interfaces are Exported

**All parameter interfaces MUST be exported for use by consumers.**

```typescript
// ✅ CORRECT - exported from module
export interface LogParams {
  context?: LogContext;
  message: string;
}

// Also export from index.ts
export type { LogParams } from './BaseLogger';
```

---

## Benefits

### 1. Clear Intent

```typescript
// ✅ Crystal clear what each value is
logger.error({
  message: 'Database connection failed',
  context: {
    host: 'localhost',
    port: 5432,
    error: err.message
  }
});

// ❌ What is what?
logger.error('Database connection failed', { host: 'localhost', port: 5432, error: err.message });
```

### 2. Easy to Extend

```typescript
// Adding a new optional parameter doesn't break existing code
export interface LogParams {
  context?: LogContext;
  message: string;
  timestamp?: Date;  // ✅ NEW - no breaking change
}

// All existing calls still work
logger.info({ message: 'Test' });  // ✅ Still valid
```

### 3. IDE Support

```typescript
// IDE shows parameter names and types
logger.info({
  message:  // ← IDE autocomplete shows this is required
  context:  // ← IDE shows this is optional
});
```

### 4. AI-Friendly

```typescript
// AI can easily understand what parameters are needed
// No confusion about parameter order
// Clear documentation through types
```

### 5. Refactoring Safety

```typescript
// Easy to refactor - parameter order doesn't matter
const params: LogParams = {
  context: ctx,
  message: msg,
};
logger.info(params);

// Can build params object conditionally
const params: LogParams = { message: 'Test' };
if (hasContext) {
  params.context = ctx;
}
logger.info(params);
```

---

## Implementation Guide

### Step 1: Define Parameter Interface

```typescript
/**
 * Parameters for child logger creation
 */
export interface ChildLoggerParams {
  context: LogContext;
}
```

**Naming convention**: `{MethodName}Params` or `{ClassName}Params` for constructors

### Step 2: Use in Method Signature

```typescript
/**
 * Create a child logger with additional context
 *
 * @param params - Parameters for child logger
 * @param params.context - Additional context to add
 * @returns A new logger instance
 */
public abstract child(params: ChildLoggerParams): BaseLogger;
```

### Step 3: Access Parameters in Implementation

```typescript
public child(params: ChildLoggerParams): BaseLogger {
  return new ConsoleLogger({
    context: { ...this.context, ...params.context },
    level: this.level,
  });
}
```

### Step 4: Export from Index

```typescript
// module/index.ts
export type { ChildLoggerParams } from './BaseLogger';
```

---

## Special Cases

### Case 1: Getters (No Parameters)

```typescript
// ✅ CORRECT - no parameters
public getLevel(): LogLevel {
  return this.level;
}

// ❌ WRONG - don't add empty params object
public getLevel(params: Record<string, never>): LogLevel {
  return this.level;
}
```

### Case 2: Single Primitive Parameter

Even single parameters use typed objects:

```typescript
// ✅ CORRECT
export interface SetLevelParams {
  level: LogLevel;
}

public setLevel(params: SetLevelParams): void {
  this.level = params.level;
}

// ❌ WRONG
public setLevel(level: LogLevel): void {
  this.level = level;
}
```

**Why?** Consistency and future extensibility.

### Case 3: Optional vs Required Parameters

```typescript
export interface LogParams {
  message: string;       // Required - no ?
  context?: LogContext;  // Optional - has ?
}

// Usage
logger.info({ message: 'Test' });  // ✅ Valid
logger.info({ message: 'Test', context: { id: 1 } });  // ✅ Valid
```

### Case 4: Constructor with Defaults

```typescript
export interface ConsoleLoggerParams {
  context?: LogContext;
  level?: LogLevel;
  useColors?: boolean;
}

constructor(params: ConsoleLoggerParams = {}) {
  // All optional, provide defaults
  this.level = params.level ?? LogLevel.INFO;
  this.context = params.context ?? {};
  this.useColors = params.useColors ?? true;
}

// Usage
const logger1 = new ConsoleLogger();  // ✅ Uses defaults
const logger2 = new ConsoleLogger({ level: LogLevel.DEBUG });  // ✅ Partial
```

---

## Examples from Codebase

### Example 1: BaseLogger

```typescript
// Parameter interfaces
export interface ChildLoggerParams {
  context: LogContext;
}

export interface LogParams {
  context?: LogContext;
  message: string;
}

export interface SetLevelParams {
  level: LogLevel;
}

// Methods
public abstract child(params: ChildLoggerParams): BaseLogger;
public abstract debug(params: LogParams): void;
public abstract info(params: LogParams): void;
public abstract setLevel(params: SetLevelParams): void;

// Getter (no params)
public abstract getLevel(): LogLevel;
```

### Example 2: ConsoleLogger Constructor

```typescript
export interface ConsoleLoggerParams {
  context?: LogContext;
  level?: LogLevel;
  useColors?: boolean;
}

constructor(params: ConsoleLoggerParams = {}) {
  super();
  this.level = params.level ?? LogLevel.INFO;
  this.context = params.context ?? {};
  this.useColors = params.useColors ?? true;
}

// Usage
const logger = new ConsoleLogger({
  level: LogLevel.DEBUG,
  context: { component: 'AuthService' },
  useColors: true
});
```

---

## Anti-Patterns

### ❌ Anti-Pattern 1: Positional Parameters

```typescript
// ❌ WRONG
public log(level: LogLevel, message: string, context?: LogContext): void {
  // ...
}
```

**Problem**: Parameter order confusion, hard to extend

### ❌ Anti-Pattern 2: Mixed Pattern

```typescript
// ❌ WRONG - mixing both patterns
public log(level: LogLevel, params: { message: string; context?: LogContext }): void {
  // ...
}
```

**Problem**: Inconsistent, confusing

### ❌ Anti-Pattern 3: Unnamed Object

```typescript
// ❌ WRONG - untyped object
public log(params: { message: string; context?: Record<string, unknown> }): void {
  // ...
}
```

**Problem**: No reusable type, hard to document

### ❌ Anti-Pattern 4: Over-Nesting

```typescript
// ❌ WRONG - unnecessary nesting
export interface LogParams {
  data: {
    message: string;
    context?: LogContext;
  };
}

public log(params: LogParams): void {
  console.log(params.data.message);  // Extra nesting
}
```

**Problem**: Unnecessary complexity

---

## Migration Guide

If you have existing code with positional parameters:

### Step 1: Create Parameter Interface

```typescript
// Before
public error(message: string, context?: LogContext): void {
  // ...
}

// After - add interface
export interface ErrorParams {
  context?: LogContext;
  message: string;
}
```

### Step 2: Update Method Signature

```typescript
public error(params: ErrorParams): void {
  // Update body to use params.message, params.context
}
```

### Step 3: Update All Call Sites

```typescript
// Before
logger.error('Failed', { userId: '123' });

// After
logger.error({ message: 'Failed', context: { userId: '123' } });
```

---

## ESLint Enforcement

This pattern is enforced by the custom ESLint rule:

```javascript
// eslint.config.mjs
'local-rules/require-typed-params': 'error'
```

The rule checks:
- ✅ Methods with 0 parameters are allowed
- ✅ Methods with 1 typed object parameter are allowed
- ❌ Methods with 2+ parameters are rejected
- ❌ Methods with 1 primitive parameter are rejected

---

## Quick Reference

| Scenario | Pattern |
|----------|---------|
| **No parameters** | `method(): ReturnType` |
| **Single parameter** | `method(params: MethodParams): ReturnType` |
| **Constructor** | `constructor(params: ClassNameParams = {})` |
| **Optional params** | Use `?` in interface: `field?: Type` |
| **Required params** | No `?` in interface: `field: Type` |
| **Parameter name** | `{MethodName}Params` or `{ClassName}Params` |

---

## See Also

- [UNIVERSAL-INFRASTRUCTURE-PATTERN.md](./UNIVERSAL-INFRASTRUCTURE-PATTERN.md) - Infrastructure patterns
- [HELPER-CLASS-PATTERNS.md](./HELPER-CLASS-PATTERNS.md) - Helper class organization
- [BASE-CLASS-REFERENCE.md](./BASE-CLASS-REFERENCE.md) - API documentation for base classes

---

**Last Updated**: 2025-10-20
**Applies To**: All TypeScript classes and methods in this project
