#!/usr/bin/env node
/**
 * Arbiter CLI Development Entry Point
 *
 * This script is used to run the CLI in development with live TypeScript compilation.
 */

import { execute } from '@oclif/core';

await execute({ development: true, dir: import.meta.url });
