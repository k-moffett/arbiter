/**
 * ZodValidator Tests
 *
 * Tests for the ZodValidator implementation, validating:
 * - Zod schema integration
 * - safeParse validation
 * - Error conversion from Zod to ValidationError format
 * - Field-level validation
 * - Type inference
 *
 * @module test/unit/shared/infrastructure/implementations/ZodValidator.test
 */

import { describe, expect, it } from '@jest/globals';

import { z, ZodValidator } from '@shared/_infrastructure';

describe('ZodValidator', () => {
  describe('validate', () => {
    it('should validate data against a simple schema', () => {
      const schema = z.object({
        age: z.number(),
        name: z.string(),
      });

      const validator = new ZodValidator({ schema });
      const result = validator.validate({
        data: { age: 25, name: 'John' },
      });

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return errors for invalid data', () => {
      const schema = z.object({
        age: z.number(),
        name: z.string(),
      });

      const validator = new ZodValidator({ schema });
      const result = validator.validate({
        data: { age: 'not a number', name: 'John' },
      });

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should convert Zod errors to ValidationError format', () => {
      const schema = z.object({
        email: z.string().email(),
      });

      const validator = new ZodValidator({ schema });
      const result = validator.validate({
        data: { email: 'invalid-email' },
      });

      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toHaveProperty('field');
      expect(result.errors[0]).toHaveProperty('message');
      expect(result.errors[0]?.field).toBe('email');
    });

    it('should handle multiple validation errors', () => {
      const schema = z.object({
        age: z.number().min(18),
        email: z.string().email(),
        name: z.string().min(2),
      });

      const validator = new ZodValidator({ schema });
      const result = validator.validate({
        data: { age: 16, email: 'bad-email', name: 'A' },
      });

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(2);
    });

    it('should handle nested object validation', () => {
      const schema = z.object({
        address: z.object({
          city: z.string(),
          zip: z.string().length(5),
        }),
        name: z.string(),
      });

      const validator = new ZodValidator({ schema });
      const result = validator.validate({
        data: {
          address: {
            city: 'New York',
            zip: '12345',
          },
          name: 'John',
        },
      });

      expect(result.isValid).toBe(true);
    });

    it('should return field path for nested validation errors', () => {
      const schema = z.object({
        address: z.object({
          zip: z.string().length(5),
        }),
      });

      const validator = new ZodValidator({ schema });
      const result = validator.validate({
        data: {
          address: {
            zip: '123', // Too short
          },
        },
      });

      expect(result.isValid).toBe(false);
      expect(result.errors[0]?.field).toBe('address.zip');
    });

    it('should validate array data', () => {
      const schema = z.array(z.number());

      const validator = new ZodValidator({ schema });
      const result = validator.validate({
        data: [1, 2, 3],
      });

      expect(result.isValid).toBe(true);
    });

    it('should handle required field validation', () => {
      const schema = z.object({
        email: z.string(),
        name: z.string(),
      });

      const validator = new ZodValidator({ schema });
      const result = validator.validate({
        data: { email: 'test@example.com' },
      });

      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.field === 'name')).toBe(true);
    });

    it('should handle optional field validation', () => {
      const schema = z.object({
        age: z.number().optional(),
        name: z.string(),
      });

      const validator = new ZodValidator({ schema });
      const result = validator.validate({
        data: { name: 'John' },
      });

      expect(result.isValid).toBe(true);
    });

    it('should validate union types', () => {
      const schema = z.union([z.string(), z.number()]);

      const validator = new ZodValidator({ schema });
      const result1 = validator.validate({ data: 'hello' });
      const result2 = validator.validate({ data: 42 });
      const result3 = validator.validate({ data: true });

      expect(result1.isValid).toBe(true);
      expect(result2.isValid).toBe(true);
      expect(result3.isValid).toBe(false);
    });

    it('should handle custom error messages', () => {
      const schema = z.object({
        age: z.number().min(18, 'Must be at least 18 years old'),
      });

      const validator = new ZodValidator({ schema });
      const result = validator.validate({
        data: { age: 16 },
      });

      expect(result.isValid).toBe(false);
      expect(result.errors[0]?.message).toBe('Must be at least 18 years old');
    });

    it('should include error codes in validation errors', () => {
      const schema = z.object({
        age: z.number(),
      });

      const validator = new ZodValidator({ schema });
      const result = validator.validate({
        data: { age: 'not a number' },
      });

      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toHaveProperty('code');
    });

    it('should handle null data', () => {
      const schema = z.object({
        name: z.string(),
      });

      const validator = new ZodValidator({ schema });
      const result = validator.validate({ data: null });

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle undefined data', () => {
      const schema = z.object({
        name: z.string(),
      });

      const validator = new ZodValidator({ schema });
      const result = validator.validate({ data: undefined });

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('validateField', () => {
    it('should validate a specific field', () => {
      const schema = z.object({
        age: z.number(),
        email: z.string().email(),
        name: z.string(),
      });

      const validator = new ZodValidator({ schema });
      const result = validator.validateField({
        field: 'email',
        value: 'test@example.com',
      });

      expect(result.isValid).toBe(true);
    });

    it('should return errors only for the specified field', () => {
      const schema = z.object({
        age: z.number(),
        email: z.string().email(),
      });

      const validator = new ZodValidator({ schema });
      const result = validator.validateField({
        field: 'email',
        value: 'invalid-email',
      });

      expect(result.isValid).toBe(false);
      expect(result.errors.every((e) => e.field === 'email')).toBe(true);
    });

    it('should handle nested field validation', () => {
      const schema = z.object({
        address: z.object({
          city: z.string(),
        }),
      });

      const validator = new ZodValidator({ schema });
      const result = validator.validateField({
        field: 'address',
        value: { city: 'New York' },
      });

      expect(result.isValid).toBe(true);
    });

    it('should filter errors to nested field path', () => {
      const schema = z.object({
        address: z.object({
          zip: z.string().length(5),
        }),
      });

      const validator = new ZodValidator({ schema });
      const result = validator.validateField({
        field: 'address',
        value: { zip: '123' },
      });

      expect(result.isValid).toBe(false);
      expect(
        result.errors.every(
          (e) =>
            e.field !== undefined &&
            (e.field === 'address' || e.field.startsWith('address.'))
        )
      ).toBe(true);
    });

    it('should handle non-object field values', () => {
      const schema = z.object({
        name: z.string().min(2),
      });

      const validator = new ZodValidator({ schema });
      const result = validator.validateField({
        field: 'name',
        value: 'J',
      });

      expect(result.isValid).toBe(false);
      expect(result.errors[0]?.field).toBe('name');
    });

    it('should validate primitive field values', () => {
      const schema = z.object({
        count: z.number().positive(),
      });

      const validator = new ZodValidator({ schema });
      const result = validator.validateField({
        field: 'count',
        value: 42,
      });

      expect(result.isValid).toBe(true);
    });
  });

  describe('error conversion', () => {
    it('should handle malformed Zod error objects', () => {
      const schema = z.object({
        name: z.string(),
      });

      const validator = new ZodValidator({ schema });
      // This should trigger validation error
      const result = validator.validate({ data: { name: 123 } });

      expect(result.isValid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(Array.isArray(result.errors)).toBe(true);
    });

    it('should include error message in converted errors', () => {
      const schema = z.string().min(5);

      const validator = new ZodValidator({ schema });
      const result = validator.validate({ data: 'abc' });

      expect(result.isValid).toBe(false);
      expect(result.errors[0]?.message).toBeDefined();
      expect(typeof result.errors[0]?.message).toBe('string');
    });

    it('should handle errors without paths', () => {
      const schema = z.string();

      const validator = new ZodValidator({ schema });
      const result = validator.validate({ data: 123 });

      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toBeDefined();
    });
  });

  describe('type inference', () => {
    it('should work with inferred types', () => {
      const userSchema = z.object({
        age: z.number(),
        email: z.string().email(),
        name: z.string(),
      });

      type User = z.infer<typeof userSchema>;

      const validator = new ZodValidator<User>({ schema: userSchema });
      const validUser: User = {
        age: 25,
        email: 'test@example.com',
        name: 'John',
      };

      const result = validator.validate({ data: validUser });

      expect(result.isValid).toBe(true);
    });

    it('should support complex schema types', () => {
      const complexSchema = z.object({
        items: z.array(
          z.object({
            id: z.string(),
            quantity: z.number(),
          })
        ),
        userId: z.string(),
      });

      const validator = new ZodValidator({ schema: complexSchema });
      const result = validator.validate({
        data: {
          items: [
            { id: '1', quantity: 5 },
            { id: '2', quantity: 3 },
          ],
          userId: 'user123',
        },
      });

      expect(result.isValid).toBe(true);
    });
  });
});
