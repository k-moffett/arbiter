# Dependency Injection Container & Example Feature Implementation

**Plan Created:** 2025-10-20 13:19:00
**Status:** Pending
**Estimated Duration:** 2-3 hours

---

## Overview

Complete the shared infrastructure layer by implementing a dependency injection (DI) container and creating an example feature that demonstrates all the established patterns: typed object parameters, Zod validation, base class inheritance, and proper error handling.

---

## Phase 1: Dependency Injection Container (45 minutes)

### Objectives
- Create lightweight, type-safe DI container
- Support singleton and transient lifetimes
- Enable constructor injection with typed parameters
- Maintain SOLID principles (especially Dependency Inversion)

### Tasks

#### 1.1 Create Container Interface
**File:** `src/shared/infrastructure/Container.ts`
- Define `Container` interface with registration and resolution methods
- Support generic type parameters for type safety
- Document container usage patterns

**Methods:**
```typescript
- register<T>(params: RegisterParams<T>): void
- resolve<T>(params: ResolveParams): T
- singleton<T>(params: SingletonParams<T>): void
- transient<T>(params: TransientParams<T>): void
```

#### 1.2 Implement SimpleContainer
**File:** `src/shared/infrastructure/implementations/SimpleContainer.ts`
- Implement basic DI container
- Use Map for service registry
- Support factory functions for service creation
- Handle circular dependencies gracefully
- Add proper error messages for missing dependencies

#### 1.3 Create Container Tests
**File:** `test/unit/shared/infrastructure/implementations/SimpleContainer.test.ts`
- Test singleton vs transient lifetimes
- Test dependency resolution
- Test error handling for missing services
- Test circular dependency detection

#### 1.4 Export Container
**File:** `src/shared/infrastructure/index.ts`
- Add Container interface and SimpleContainer exports
- Update documentation

**Acceptance Criteria:**
- ✅ All container tests pass
- ✅ Type-safe service registration and resolution
- ✅ Singleton services return same instance
- ✅ Transient services return new instances
- ✅ Clear error messages for configuration issues

---

## Phase 2: Example Feature Implementation (60 minutes)

### Objectives
- Demonstrate all infrastructure patterns in real-world scenario
- Show proper layering (domain, application, infrastructure)
- Validate that patterns scale to actual features

### Tasks

#### 2.1 Design Example Domain
**Feature:** User Registration Service

**Domain Layer:**
```
src/features/user-registration/
├── domain/
│   ├── User.ts                    # User entity
│   ├── UserRepository.ts          # Repository interface
│   └── UserValidationRules.ts     # Domain validation rules
```

**Entities & Value Objects:**
- User entity with email, username, createdAt
- Email value object with validation
- Username value object with validation

#### 2.2 Create Application Layer
**File:** `src/features/user-registration/application/RegisterUserUseCase.ts`

**Use Case:**
```typescript
RegisterUserUseCase {
  - constructor(params: {
      repository: UserRepository,
      validator: BaseValidator,
      logger: BaseLogger,
      errorHandler: BaseErrorHandler
    })
  - execute(params: RegisterUserParams): Promise<User>
}
```

**Responsibilities:**
- Validate user input with ZodValidator
- Check for existing users via repository
- Create new user entity
- Log operations
- Handle errors with StandardErrorHandler

#### 2.3 Create Infrastructure Layer
```
src/features/user-registration/
├── infrastructure/
│   ├── InMemoryUserRepository.ts  # Test/demo repository
│   └── UserRegistrationSchemas.ts # Zod schemas
```

**Zod Schemas:**
- RegisterUserInputSchema (email, username, password)
- UserSchema (domain entity validation)

#### 2.4 Create Feature Container
**File:** `src/features/user-registration/container.ts`

**Register Services:**
```typescript
container.singleton({
  name: 'logger',
  factory: () => new ConsoleLogger({ level: LogLevel.INFO })
})

container.singleton({
  name: 'errorHandler',
  factory: (c) => new StandardErrorHandler({
    logger: c.resolve({ name: 'logger' })
  })
})

container.singleton({
  name: 'userValidator',
  factory: () => new ZodValidator({
    schema: RegisterUserInputSchema
  })
})

container.singleton({
  name: 'userRepository',
  factory: () => new InMemoryUserRepository()
})

container.transient({
  name: 'registerUserUseCase',
  factory: (c) => new RegisterUserUseCase({
    repository: c.resolve({ name: 'userRepository' }),
    validator: c.resolve({ name: 'userValidator' }),
    logger: c.resolve({ name: 'logger' }),
    errorHandler: c.resolve({ name: 'errorHandler' })
  })
})
```

#### 2.5 Create Feature Tests
**File:** `test/integration/features/user-registration/RegisterUserUseCase.test.ts`

**Test Scenarios:**
- ✓ Successfully register new user
- ✓ Reject duplicate email
- ✓ Reject duplicate username
- ✓ Validate email format
- ✓ Validate username requirements
- ✓ Handle repository errors
- ✓ Log all operations
- ✓ Return proper domain errors

**Acceptance Criteria:**
- ✅ All integration tests pass
- ✅ Demonstrates DI container usage
- ✅ Uses ZodValidator for input validation
- ✅ Uses BaseLogger for operation logging
- ✅ Uses StandardErrorHandler for errors
- ✅ Repository pattern properly implemented
- ✅ Clean architecture layers respected

---

## Phase 3: Documentation (45 minutes)

### Tasks

#### 3.1 Document Zod Validation Pattern
**File:** `docs/patterns/zod-validation.md`

**Content:**
- When to use ZodValidator vs RuleValidator
- How to create schemas
- Type inference with `z.infer<>`
- Custom error messages
- Nested object validation
- Array validation
- Union types
- Integration with use cases

**Examples:**
- Simple schema validation
- Complex nested schemas
- Custom validation rules
- Error handling patterns

#### 3.2 Document DI Container Pattern
**File:** `docs/patterns/dependency-injection.md`

**Content:**
- Why use DI
- Container setup
- Service registration (singleton vs transient)
- Service resolution
- Testing with DI
- Common patterns
- Anti-patterns to avoid

#### 3.3 Update Architecture Documentation
**File:** `docs/architecture/clean-architecture.md`

**Content:**
- Layer responsibilities (domain, application, infrastructure)
- Dependency rules
- Entity vs Value Object
- Repository pattern
- Use case pattern
- Example: User Registration feature walkthrough

#### 3.4 Create Quick Start Guide
**File:** `docs/guides/creating-new-feature.md`

**Content:**
- Step-by-step feature creation
- File structure conventions
- Using infrastructure components
- Setting up DI container
- Writing tests
- Example: Creating a "Product Catalog" feature

#### 3.5 Update Main README
**File:** `.claude/CLAUDE.md`

**Updates:**
- Add section on Infrastructure Layer
- Link to pattern documentation
- Add feature examples
- Update directory structure map
- Add DI container reference

**Acceptance Criteria:**
- ✅ All documentation is clear and actionable
- ✅ Code examples compile and run
- ✅ Patterns are well-explained
- ✅ Quick start guide is beginner-friendly
- ✅ Links between docs work correctly

---

## Phase 4: Validation & Polish (30 minutes)

### Tasks

#### 4.1 Run All Tests
```bash
npm run test           # All unit tests
npm run test:integration  # Integration tests
npm run test:coverage  # Coverage report
```

**Target:** 80%+ coverage on infrastructure and example feature

#### 4.2 Run All Quality Checks
```bash
npm run typecheck      # TypeScript
npm run lint           # ESLint
npm run lint:fix       # Auto-fix issues
```

#### 4.3 Code Review Checklist
- [ ] All TODOs resolved or documented
- [ ] No console.log statements (use logger)
- [ ] All public APIs documented with JSDoc
- [ ] Consistent error handling
- [ ] Proper null handling (prefer null over undefined)
- [ ] All typed object parameters used
- [ ] No any types (use unknown with type guards)

#### 4.4 Documentation Review
- [ ] All links work
- [ ] Code examples are tested
- [ ] Spelling and grammar checked
- [ ] Consistent formatting
- [ ] File paths are correct

**Acceptance Criteria:**
- ✅ All tests pass (25/25 existing + new tests)
- ✅ Test coverage ≥ 80%
- ✅ No linting errors
- ✅ No type errors
- ✅ Documentation is complete and accurate

---

## Success Metrics

### Code Quality
- **Test Coverage:** ≥ 80% for infrastructure and examples
- **Type Safety:** 100% typed, zero `any` usage
- **Linting:** Zero errors, zero warnings
- **Complexity:** All functions ≤ 10 cyclomatic complexity

### Architecture
- **SOLID Compliance:** All principles demonstrated
- **Layer Separation:** Clean boundaries between layers
- **DI Usage:** All dependencies injected, no hard-coded deps
- **Pattern Consistency:** All code follows established patterns

### Documentation
- **Completeness:** All patterns documented with examples
- **Clarity:** Beginner-friendly with clear explanations
- **Accuracy:** Code examples tested and working
- **Discoverability:** Clear navigation and cross-references

---

## Risk Mitigation

### Risk: DI Container Complexity
**Mitigation:** Keep it simple - support only essential features (singleton, transient, basic resolution). No advanced features like scopes, interceptors, or auto-wiring.

### Risk: Example Feature Too Complex
**Mitigation:** User Registration is well-understood domain. Keep it focused on demonstrating patterns, not business logic complexity.

### Risk: Documentation Becomes Stale
**Mitigation:** Keep docs close to code (in-tree). Include runnable examples. Add doc validation to CI pipeline.

### Risk: Over-Engineering
**Mitigation:** Build only what's needed. YAGNI principle. Can extend later if needed.

---

## Next Steps After Completion

1. **Create Second Example Feature** - Show pattern reuse
2. **Add Metrics to Example** - Demonstrate SimpleMetrics usage
3. **Create Integration Tests** - Full end-to-end scenarios
4. **Performance Benchmarks** - Validate container overhead is minimal
5. **Migration Guide** - Help existing code adopt patterns

---

## Checkpoints

- [ ] **Checkpoint 1 (45min):** DI Container implemented and tested
- [ ] **Checkpoint 2 (1h 45min):** Example feature complete with tests
- [ ] **Checkpoint 3 (2h 30min):** All documentation written
- [ ] **Checkpoint 4 (3h):** All validation complete, ready to merge

---

## Notes

- Keep DI container under 200 lines - it should be simple
- Example feature should be under 400 lines total
- Each documentation file should be under 300 lines
- Prefer real-world examples over toy examples
- Test every code example in documentation
