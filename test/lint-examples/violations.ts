/**
 * Lint Rule Violations - Example File
 *
 * This file intentionally violates lint rules to demonstrate what they catch.
 *
 * **Why this file exists:**
 * - Provides examples of what NOT to do
 * - Documents the exact violations each rule catches
 * - Serves as reference for understanding rule limits
 *
 * **Why this file is excluded from linting:**
 * 1. Directory `test/lint-examples/` is in `.eslintignore`
 * 2. Directory `test/**/*` is excluded from TypeScript project (tsconfig.json)
 * 3. File cannot be linted with --no-ignore due to TypeScript parser exclusion
 *
 * **To validate custom rules work:**
 * - See `LINT-VALIDATION-SUMMARY.md` for validation results
 * - Custom rules are tested against real code in `src/` directory
 * - Create temporary test files in `src/` to verify rules trigger correctly
 *
 * DO NOT import or use this file in actual code!
 *
 * @module test/lint-examples/violations
 */

// ==================================================================
// VIOLATION 1: Too many properties (>15)
// ==================================================================

class TooManyProperties {
  private prop1: string;
  private prop2: string;
  private prop3: string;
  private prop4: string;
  private prop5: string;
  private prop6: string;
  private prop7: string;
  private prop8: string;
  private prop9: string;
  private prop10: string;
  private prop11: string;
  private prop12: string;
  private prop13: string;
  private prop14: string;
  private prop15: string;
  private prop16: string; // 16th property - VIOLATES max-class-properties

  constructor() {
    this.prop1 = '1';
    this.prop2 = '2';
    this.prop3 = '3';
    this.prop4 = '4';
    this.prop5 = '5';
    this.prop6 = '6';
    this.prop7 = '7';
    this.prop8 = '8';
    this.prop9 = '9';
    this.prop10 = '10';
    this.prop11 = '11';
    this.prop12 = '12';
    this.prop13 = '13';
    this.prop14 = '14';
    this.prop15 = '15';
    this.prop16 = '16';
  }
}

// ==================================================================
// VIOLATION 2: Too many public methods (>15)
// ==================================================================

class TooManyMethods {
  public method1(): void {}
  public method2(): void {}
  public method3(): void {}
  public method4(): void {}
  public method5(): void {}
  public method6(): void {}
  public method7(): void {}
  public method8(): void {}
  public method9(): void {}
  public method10(): void {}
  public method11(): void {}
  public method12(): void {}
  public method13(): void {}
  public method14(): void {}
  public method15(): void {}
  public method16(): void {} // 16th method - VIOLATES max-class-methods
}

// ==================================================================
// VIOLATION 3: Multiple statements per line
// ==================================================================

function multipleStatementsPerLine(): void {
  let x = 1; let y = 2; let z = 3; // VIOLATES max-statements-per-line
  const a = 1, b = 2, c = 3; // VIOLATES max-statements-per-line
}

// ==================================================================
// VIOLATION 4: Function too long (>75 lines)
// ==================================================================

function tooLongFunction(): number {
  const line1 = 1;
  const line2 = 2;
  const line3 = 3;
  const line4 = 4;
  const line5 = 5;
  const line6 = 6;
  const line7 = 7;
  const line8 = 8;
  const line9 = 9;
  const line10 = 10;
  const line11 = 11;
  const line12 = 12;
  const line13 = 13;
  const line14 = 14;
  const line15 = 15;
  const line16 = 16;
  const line17 = 17;
  const line18 = 18;
  const line19 = 19;
  const line20 = 20;
  const line21 = 21;
  const line22 = 22;
  const line23 = 23;
  const line24 = 24;
  const line25 = 25;
  const line26 = 26;
  const line27 = 27;
  const line28 = 28;
  const line29 = 29;
  const line30 = 30;
  const line31 = 31;
  const line32 = 32;
  const line33 = 33;
  const line34 = 34;
  const line35 = 35;
  const line36 = 36;
  const line37 = 37;
  const line38 = 38;
  const line39 = 39;
  const line40 = 40;
  const line41 = 41;
  const line42 = 42;
  const line43 = 43;
  const line44 = 44;
  const line45 = 45;
  const line46 = 46;
  const line47 = 47;
  const line48 = 48;
  const line49 = 49;
  const line50 = 50;
  const line51 = 51;
  const line52 = 52;
  const line53 = 53;
  const line54 = 54;
  const line55 = 55;
  const line56 = 56;
  const line57 = 57;
  const line58 = 58;
  const line59 = 59;
  const line60 = 60;
  const line61 = 61;
  const line62 = 62;
  const line63 = 63;
  const line64 = 64;
  const line65 = 65;
  const line66 = 66;
  const line67 = 67;
  const line68 = 68;
  const line69 = 69;
  const line70 = 70;
  const line71 = 71;
  const line72 = 72;
  const line73 = 73;
  const line74 = 74;
  const line75 = 75;
  const line76 = 76; // Line 76 - VIOLATES max-lines-per-function

  return line76;
}

// ==================================================================
// VIOLATION 5: Too many statements (>20)
// ==================================================================

function tooManyStatements(): number {
  const s1 = 1;
  const s2 = 2;
  const s3 = 3;
  const s4 = 4;
  const s5 = 5;
  const s6 = 6;
  const s7 = 7;
  const s8 = 8;
  const s9 = 9;
  const s10 = 10;
  const s11 = 11;
  const s12 = 12;
  const s13 = 13;
  const s14 = 14;
  const s15 = 15;
  const s16 = 16;
  const s17 = 17;
  const s18 = 18;
  const s19 = 19;
  const s20 = 20;
  const s21 = 21; // Statement 21 - VIOLATES max-statements

  return s21;
}

// ==================================================================
// VIOLATION 6: Too complex (cyclomatic complexity >10)
// ==================================================================

function tooComplex(a: number, b: number, c: number): number {
  if (a > 0) {
    if (b > 0) {
      if (c > 0) {
        if (a > b) {
          if (b > c) {
            if (a > c) {
              if (a === 1) {
                if (b === 2) {
                  if (c === 3) {
                    if (a + b === 3) {
                      if (b + c === 5) { // VIOLATES complexity
                        return a + b + c;
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
  return 0;
}

// ==================================================================
// VIOLATION 7: Using require() instead of import (ESM violation)
// ==================================================================

// Uncommenting this would violate @typescript-eslint/no-require-imports:
// const fs = require('fs');

// ==================================================================
// VIOLATION 8: Too deeply nested (>3 levels)
// ==================================================================

function tooDeepNesting(): void {
  if (true) {
    if (true) {
      if (true) {
        if (true) { // VIOLATES max-depth (4th level)
          console.log('too deep');
        }
      }
    }
  }
}

// ==================================================================
// Summary of Violations
// ==================================================================

export const violations = {
  TooManyProperties,       // 16 properties (limit: 15)
  TooManyMethods,          // 16 methods (limit: 15)
  multipleStatementsPerLine,  // Multiple statements per line
  tooLongFunction,         // 76 lines (limit: 75)
  tooManyStatements,       // 21 statements (limit: 20)
  tooComplex,              // Complexity 12 (limit: 10)
  tooDeepNesting,          // Nesting depth 4 (limit: 3)
};
