#!/usr/bin/env node
/**
 * Arbiter CLI Production Entry Point
 *
 * This script is used to run the CLI in production after building with npm run build.
 */

import { execute } from '@oclif/core';

await execute({ development: false, dir: import.meta.url });
