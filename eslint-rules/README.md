# Custom ESLint Rules

This directory contains custom ESLint rules specific to the Arbiter project. These rules enforce SOLID principles and keep the codebase AI-friendly by limiting class complexity.

---

## Available Rules

### 1. `local-rules/max-class-properties`

**Purpose**: Enforce a maximum number of properties (fields) in a class.

**Why**: Classes with too many properties often violate the Single Responsibility Principle. This rule encourages composition over large, complex classes.

**Default Limit**: 15 properties

**Usage**:
```javascript
'local-rules/max-class-properties': ['error', 15]
```

**Example**:
```typescript
// ❌ BAD - Too many properties (16)
class UserService {
  private db: Database;
  private cache: Cache;
  private logger: Logger;
  private config: Config;
  private metrics: Metrics;
  private validator: Validator;
  private transformer: Transformer;
  private encoder: Encoder;
  private decoder: Decoder;
  private serializer: Serializer;
  private deserializer: Deserializer;
  private authenticator: Authenticator;
  private authorizer: Authorizer;
  private notifier: Notifier;
  private mailer: Mailer;
  private smsService: SMSService; // 16th property - exceeds limit!
}

// ✅ GOOD - Compose smaller services
class UserService {
  private userRepository: UserRepository;
  private authService: AuthService;
  private notificationService: NotificationService;
  private validationService: ValidationService;
  // ... fewer, more focused dependencies
}
```

---

### 2. `local-rules/max-class-methods`

**Purpose**: Enforce a maximum number of public methods in a class.

**Why**: Classes with too many public methods violate the Interface Segregation Principle. This rule encourages creating focused interfaces and splitting large classes.

**Default Limit**: 15 public methods

**Counts**: Only public methods (excludes private, protected, and constructor)

**Usage**:
```javascript
'local-rules/max-class-methods': ['error', 15]
```

**Example**:
```typescript
// ❌ BAD - Too many public methods (16)
class UserManager {
  public createUser() {}
  public updateUser() {}
  public deleteUser() {}
  public getUser() {}
  public listUsers() {}
  public searchUsers() {}
  public activateUser() {}
  public deactivateUser() {}
  public resetPassword() {}
  public changeEmail() {}
  public updateProfile() {}
  public uploadAvatar() {}
  public deleteAvatar() {}
  public getRoles() {}
  public addRole() {}
  public removeRole() {} // 16th method - exceeds limit!
}

// ✅ GOOD - Split into focused classes
class UserRepository {
  public create() {}
  public update() {}
  public delete() {}
  public findById() {}
  public findAll() {}
}

class UserAuthService {
  public resetPassword() {}
  public changeEmail() {}
}

class UserRoleService {
  public getRoles() {}
  public addRole() {}
  public removeRole() {}
}
```

---

## How These Rules Are Loaded

The custom rules are loaded in `eslint.config.mjs` using **ESM imports** (never `require()`):

```javascript
// Import custom rules (ESM)
import maxClassProperties from './eslint-rules/max-class-properties.js';
import maxClassMethods from './eslint-rules/max-class-methods.js';

export default tseslint.config(
  {
    plugins: {
      'local-rules': {
        rules: {
          'max-class-properties': maxClassProperties,
          'max-class-methods': maxClassMethods,
        },
      },
    },
    rules: {
      'local-rules/max-class-properties': ['error', 15],
      'local-rules/max-class-methods': ['error', 15],
      '@typescript-eslint/no-require-imports': 'error',  // Enforce ESM only
    },
  }
);
```

**⚠️ IMPORTANT**: This project uses ESM only. Never use `require()` or `module.exports`.

---

## Creating Additional Custom Rules

To add a new custom rule:

1. **Create the rule file** in this directory:
   ```bash
   touch eslint-rules/my-custom-rule.js
   ```

2. **Implement the rule** using ESLint's rule API (**ESM format**):
   ```javascript
   /**
    * @type {import('eslint').Rule.RuleModule}
    */
   export default {
     meta: {
       type: 'suggestion',
       docs: {
         description: 'Description of the rule',
       },
       messages: {
         myMessage: 'Error message',
       },
       schema: [], // Options schema
     },
     create(context) {
       return {
         // AST node visitors
       };
     },
   };
   ```

   **⚠️ Note**: Use `export default` (ESM), NOT `module.exports` (CommonJS)

3. **Import and register in `eslint.config.mjs`**:
   ```javascript
   // At the top of the file
   import myCustomRule from './eslint-rules/my-custom-rule.js';

   // In the config
   plugins: {
     'local-rules': {
       rules: {
         'my-custom-rule': myCustomRule,
       },
     },
   }
   ```

4. **Enable the rule**:
   ```javascript
   rules: {
     'local-rules/my-custom-rule': 'error',
   }
   ```

---

## Testing Custom Rules

Use the `test/lint-examples/` directory to test rule violations:

```bash
# Run lint on violation examples (should fail)
npm run lint test/lint-examples/violations.ts

# Run lint on compliant code (should pass)
npm run lint src/shared/utils/Calculator.ts
```

---

## Resources

- [ESLint Custom Rules](https://eslint.org/docs/latest/extend/custom-rules)
- [TypeScript ESLint Custom Rules](https://typescript-eslint.io/developers/custom-rules/)
- [AST Explorer](https://astexplorer.net/) - Visualize AST for TypeScript code
- [ESLint Rule Tester](https://eslint.org/docs/latest/integrate/nodejs-api#ruletester)

---

## Rationale: Why These Limits?

### 15 Properties Maximum
- Encourages composition over inheritance
- Forces thinking about class responsibilities
- Reduces cognitive load when reading code
- Makes classes easier to test and mock
- Typical service classes have 5-10 dependencies

### 15 Public Methods Maximum
- Prevents "god objects" with too many responsibilities
- Encourages Interface Segregation Principle
- Makes interfaces easier to implement
- Improves code organization
- Most well-designed classes have 5-12 public methods

### AI-Friendly Code
- Smaller classes fit within AI context windows
- Clear boundaries make AI suggestions more accurate
- Easier for AI to understand and refactor
- Reduces hallucinations in AI-generated code

---

**Last Updated**: 2025-10-20
**Maintained By**: Arbiter Team
