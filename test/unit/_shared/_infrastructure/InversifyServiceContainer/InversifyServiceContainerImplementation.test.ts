/**
 * InversifyServiceContainer Tests
 *
 * Tests for the InversifyJS-based service container, validating:
 * - Singleton, transient, and scoped service lifetimes
 * - Type-safe service registration with Symbol identifiers
 * - Request scoping via child containers
 * - Dependency injection through factory functions
 * - Error handling for missing services
 * - Proper disposal and cleanup
 *
 * @module test/unit/_shared/_infrastructure/InversifyServiceContainer.test
 */

import 'reflect-metadata';

import { describe, expect, it } from '@jest/globals';

import {
  InversifyServiceContainer,
  ServiceLifetime,
} from '@shared/_infrastructure';

// Test service classes
class TestLogger {
  public instanceId: number;

  constructor() {
    this.instanceId = Math.random();
  }

  public log(message: string): string {
    return `[${this.instanceId}] ${message}`;
  }
}

class TestRepository {
  public instanceId: number;

  constructor() {
    this.instanceId = Math.random();
  }

  public getData(): string {
    return `Data from ${this.instanceId}`;
  }
}

class TestService {
  public logger: TestLogger;
  public repository: TestRepository;

  constructor(params: { logger: TestLogger; repository: TestRepository }) {
    this.logger = params.logger;
    this.repository = params.repository;
  }

  public execute(): string {
    this.logger.log('Executing service');
    return this.repository.getData();
  }
}

// Test symbols
const TEST_SYMBOLS = {
  Logger: Symbol.for('TestLogger'),
  Repository: Symbol.for('TestRepository'),
  Service: Symbol.for('TestService'),
};

describe('InversifyServiceContainer', () => {
  describe('singleton', () => {
    it('should register a singleton service', () => {
      const container = new InversifyServiceContainer();

      container.singleton({
        factory: () => new TestLogger(),
        identifier: TEST_SYMBOLS.Logger,
      });

      expect(container.has({ identifier: TEST_SYMBOLS.Logger })).toBe(true);
    });

    it('should return the same instance for singleton services', () => {
      const container = new InversifyServiceContainer();

      container.singleton({
        factory: () => new TestLogger(),
        identifier: TEST_SYMBOLS.Logger,
      });

      const logger1 = container.resolve<TestLogger>({
        identifier: TEST_SYMBOLS.Logger,
      });
      const logger2 = container.resolve<TestLogger>({
        identifier: TEST_SYMBOLS.Logger,
      });

      expect(logger1).toBe(logger2);
      expect(logger1.instanceId).toBe(logger2.instanceId);
    });
  });

  describe('transient', () => {
    it('should return different instances for transient services', () => {
      const container = new InversifyServiceContainer();

      container.transient({
        factory: () => new TestLogger(),
        identifier: TEST_SYMBOLS.Logger,
      });

      const logger1 = container.resolve<TestLogger>({
        identifier: TEST_SYMBOLS.Logger,
      });
      const logger2 = container.resolve<TestLogger>({
        identifier: TEST_SYMBOLS.Logger,
      });

      expect(logger1).not.toBe(logger2);
      expect(logger1.instanceId).not.toBe(logger2.instanceId);
    });
  });

  describe('scoped', () => {
    it('should return same instance within scope', () => {
      const parent = new InversifyServiceContainer();

      parent.scoped({
        factory: () => new TestLogger(),
        identifier: TEST_SYMBOLS.Logger,
      });

      // Create child container to establish request scope
      const requestScope = parent.createScope();

      const logger1 = requestScope.resolve<TestLogger>({
        identifier: TEST_SYMBOLS.Logger,
      });
      const logger2 = requestScope.resolve<TestLogger>({
        identifier: TEST_SYMBOLS.Logger,
      });

      expect(logger1).toBe(logger2);
    });

    it('should return different instances across scopes', () => {
      const parentContainer = new InversifyServiceContainer();

      const scope1 = parentContainer.createScope();
      const scope2 = parentContainer.createScope();

      // Register scoped service in each child scope
      scope1.scoped({
        factory: () => new TestLogger(),
        identifier: TEST_SYMBOLS.Logger,
      });

      scope2.scoped({
        factory: () => new TestLogger(),
        identifier: TEST_SYMBOLS.Logger,
      });

      const logger1 = scope1.resolve<TestLogger>({
        identifier: TEST_SYMBOLS.Logger,
      });
      const logger2 = scope2.resolve<TestLogger>({
        identifier: TEST_SYMBOLS.Logger,
      });

      expect(logger1.instanceId).not.toBe(logger2.instanceId);
    });
  });

  describe('register', () => {
    it('should register with explicit lifetime', () => {
      const container = new InversifyServiceContainer();

      container.register({
        factory: () => new TestLogger(),
        identifier: TEST_SYMBOLS.Logger,
        lifetime: ServiceLifetime.SINGLETON,
      });

      expect(container.has({ identifier: TEST_SYMBOLS.Logger })).toBe(true);
    });
  });

  describe('resolve', () => {
    it('should resolve a registered service', () => {
      const container = new InversifyServiceContainer();

      container.singleton({
        factory: () => new TestLogger(),
        identifier: TEST_SYMBOLS.Logger,
      });

      const logger = container.resolve<TestLogger>({
        identifier: TEST_SYMBOLS.Logger,
      });

      expect(logger).toBeInstanceOf(TestLogger);
    });

    it('should throw error when resolving unregistered service', () => {
      const container = new InversifyServiceContainer();

      expect(() => {
        container.resolve<TestLogger>({
          identifier: Symbol.for('Unknown'),
        });
      }).toThrow('is not registered');
    });
  });

  describe('createScope', () => {
    it('should create child container', () => {
      const parent = new InversifyServiceContainer();
      const child = parent.createScope();

      expect(child).toBeInstanceOf(InversifyServiceContainer);
    });

    it('should inherit parent singletons', () => {
      const parent = new InversifyServiceContainer();

      parent.singleton({
        factory: () => new TestLogger(),
        identifier: TEST_SYMBOLS.Logger,
      });

      const child = parent.createScope();

      const parentLogger = parent.resolve<TestLogger>({
        identifier: TEST_SYMBOLS.Logger,
      });
      const childLogger = child.resolve<TestLogger>({
        identifier: TEST_SYMBOLS.Logger,
      });

      expect(parentLogger).toBe(childLogger);
    });

    it('should isolate scoped services', () => {
      const parent = new InversifyServiceContainer();

      const child1 = parent.createScope();
      const child2 = parent.createScope();

      child1.scoped({
        factory: () => new TestLogger(),
        identifier: TEST_SYMBOLS.Logger,
      });
      child2.scoped({
        factory: () => new TestLogger(),
        identifier: TEST_SYMBOLS.Logger,
      });

      const logger1 = child1.resolve<TestLogger>({
        identifier: TEST_SYMBOLS.Logger,
      });
      const logger2 = child2.resolve<TestLogger>({
        identifier: TEST_SYMBOLS.Logger,
      });

      expect(logger1.instanceId).not.toBe(logger2.instanceId);
    });
  });

  describe('dispose', () => {
    it('should unbind all services', () => {
      const container = new InversifyServiceContainer();

      container.singleton({
        factory: () => new TestLogger(),
        identifier: TEST_SYMBOLS.Logger,
      });

      expect(container.has({ identifier: TEST_SYMBOLS.Logger })).toBe(true);

      container.dispose();

      expect(container.has({ identifier: TEST_SYMBOLS.Logger })).toBe(false);
    });
  });

  describe('clear', () => {
    it('should clear specific service', () => {
      const container = new InversifyServiceContainer();

      container.singleton({
        factory: () => new TestLogger(),
        identifier: TEST_SYMBOLS.Logger,
      });
      container.singleton({
        factory: () => new TestRepository(),
        identifier: TEST_SYMBOLS.Repository,
      });

      container.clear({ identifier: TEST_SYMBOLS.Logger });

      expect(container.has({ identifier: TEST_SYMBOLS.Logger })).toBe(false);
      expect(container.has({ identifier: TEST_SYMBOLS.Repository })).toBe(true);
    });

    it('should clear all services', () => {
      const container = new InversifyServiceContainer();

      container.singleton({
        factory: () => new TestLogger(),
        identifier: TEST_SYMBOLS.Logger,
      });
      container.singleton({
        factory: () => new TestRepository(),
        identifier: TEST_SYMBOLS.Repository,
      });

      container.clear({});

      expect(container.has({ identifier: TEST_SYMBOLS.Logger })).toBe(false);
      expect(container.has({ identifier: TEST_SYMBOLS.Repository })).toBe(false);
    });
  });

  describe('dependency injection', () => {
    it('should inject dependencies via factory', () => {
      const container = new InversifyServiceContainer();

      container.singleton({
        factory: () => new TestLogger(),
        identifier: TEST_SYMBOLS.Logger,
      });

      container.singleton({
        factory: () => new TestRepository(),
        identifier: TEST_SYMBOLS.Repository,
      });

      container.transient({
        factory: (c) =>
          new TestService({
            logger: c.resolve<TestLogger>({
              identifier: TEST_SYMBOLS.Logger,
            }),
            repository: c.resolve<TestRepository>({
              identifier: TEST_SYMBOLS.Repository,
            }),
          }),
        identifier: TEST_SYMBOLS.Service,
      });

      const service = container.resolve<TestService>({
        identifier: TEST_SYMBOLS.Service,
      });

      expect(service).toBeInstanceOf(TestService);
      expect(service.logger).toBeInstanceOf(TestLogger);
      expect(service.repository).toBeInstanceOf(TestRepository);
    });
  });
});
