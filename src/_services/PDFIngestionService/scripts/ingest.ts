#!/usr/bin/env tsx

/**
 * PDF Ingestion CLI Script
 *
 * Command-line interface for ingesting PDFs into Qdrant.
 *
 * Usage:
 *   npm run ingest:pdf -- /path/to/file.pdf
 *   npm run ingest:pdf -- /path/to/file.pdf --collection-name my-docs
 *   npm run ingest:pdf -- /path/to/file.pdf --force
 *   npm run ingest:pdf -- /path/to/file.pdf --chunking-strategy semantic
 */

/* eslint-disable no-console -- CLI script requires console output for user interaction */

import { existsSync } from 'fs';

import { LogLevel } from '@shared/_base/BaseLogger/index.js';
import { ConsoleLogger } from '@shared/_infrastructure/ConsoleLogger/index.js';

import { QdrantClientAdapter } from '../../../_data/_repositories/QdrantClientAdapter/index.js';
import { PdfParsePDFParser } from '../../_pdfParsers/PdfParsePDFParser/index.js';
import { OllamaEmbeddingService } from '../../OllamaEmbeddingService/index.js';
import { SimpleChunker } from '../../TextChunkingService/_strategies/SimpleChunker/index.js';
import { TextChunkingService } from '../../TextChunkingService/index.js';
import { PDFIngestionService } from '../index.js';

// Parse command line arguments
const args = process.argv.slice(2);

/**
 * Show usage information
 */
function showUsage(): void {
  console.log(`
🛠️  PDF Ingestion CLI

Usage:
  npm run ingest:pdf -- <pdf-path> [options]

Arguments:
  <pdf-path>              Path to PDF file (required)

Options:
  --collection-name <name>    Custom collection name (default: auto-generated from filename)
  --force                     Overwrite existing collection
  --chunking-strategy <type>  Chunking strategy: simple (default: simple)
  --max-chunk-size <number>   Maximum chunk size in characters (default: 1500)
  --min-chunk-size <number>   Minimum chunk size in characters (default: 200)
  --chunk-overlap <number>    Overlap between chunks in characters (default: 100)
  --verbose, -v               Enable verbose logging
  --help, -h                  Show this help message

Examples:
  npm run ingest:pdf -- /path/to/document.pdf
  npm run ingest:pdf -- /path/to/document.pdf --collection-name my-docs
  npm run ingest:pdf -- /path/to/document.pdf --force
  npm run ingest:pdf -- /path/to/document.pdf --chunking-strategy simple
  npm run ingest:pdf -- /path/to/document.pdf --max-chunk-size 2000
  npm run ingest:pdf -- /path/to/document.pdf --verbose

Environment Variables:
  QDRANT_HOST         Qdrant host (default: localhost)
  QDRANT_PORT         Qdrant port (default: 6333)
  LOG_LEVEL           Log level: DEBUG, INFO, WARN, ERROR (default: INFO)

Prerequisites:
  - Qdrant vector database running
  - Environment variables configured

Exit Codes:
  0 = Success
  1 = Error occurred
`);
}

interface ParsedArgs {
  chunkingStrategy?: 'simple' | 'semantic';
  chunkOverlap?: number;
  collectionName?: string;
  force: boolean;
  help: boolean;
  maxChunkSize?: number;
  minChunkSize?: number;
  pdfPath?: string;
  verbose: boolean;
}

/**
 * Process a string argument value
 */
function processStringArg(params: {
  args: string[];
  index: number;
  setValue(value: string): void;
}): { incrementIndex: boolean } {
  const nextArg = params.args[params.index + 1];
  if (nextArg !== undefined) {
    params.setValue(nextArg);
    return { incrementIndex: true };
  }
  return { incrementIndex: false };
}

/**
 * Process a number argument value
 */
function processNumberArg(params: {
  args: string[];
  index: number;
  setValue(value: number): void;
}): { incrementIndex: boolean } {
  const nextArg = params.args[params.index + 1];
  if (nextArg !== undefined) {
    params.setValue(parseInt(nextArg, 10));
    return { incrementIndex: true };
  }
  return { incrementIndex: false };
}

/**
 * Process a single argument and update result
 *
 * Note: Complexity is expected for CLI argument parsing
 */
// eslint-disable-next-line complexity, max-statements
function processArgument(params: {
  arg: string | undefined;
  args: string[];
  index: number;
  result: ParsedArgs;
}): { incrementIndex: boolean } {
  const { arg, args, index, result } = params;

  if (arg === '--help' || arg === '-h') {
    result.help = true;
    return { incrementIndex: false };
  }

  if (arg === '--verbose' || arg === '-v') {
    result.verbose = true;
    return { incrementIndex: false };
  }

  if (arg === '--force') {
    result.force = true;
    return { incrementIndex: false };
  }

  if (arg === '--collection-name') {
    return processStringArg({
      args,
      index,
      setValue: (value) => {
        result.collectionName = value;
      },
    });
  }

  if (arg === '--chunking-strategy') {
    return processStringArg({
      args,
      index,
      setValue: (value) => {
        result.chunkingStrategy = value as 'simple' | 'semantic';
      },
    });
  }

  if (arg === '--max-chunk-size') {
    return processNumberArg({
      args,
      index,
      setValue: (value) => {
        result.maxChunkSize = value;
      },
    });
  }

  if (arg === '--min-chunk-size') {
    return processNumberArg({
      args,
      index,
      setValue: (value) => {
        result.minChunkSize = value;
      },
    });
  }

  if (arg === '--chunk-overlap') {
    return processNumberArg({
      args,
      index,
      setValue: (value) => {
        result.chunkOverlap = value;
      },
    });
  }

  if (arg !== undefined && !arg.startsWith('--')) {
    result.pdfPath ??= arg;
  }

  return { incrementIndex: false };
}

/**
 * Parse command line arguments
 */
function parseArgs(): ParsedArgs {
  const result: ParsedArgs = {
    force: false,
    help: false,
    verbose: false,
  };

  for (let i = 0; i < args.length; i++) {
    const processed = processArgument({ arg: args[i], args, index: i, result });
    if (processed.incrementIndex) {
      i++;
    }
  }

  return result;
}

/**
 * Display welcome message and configuration
 */
function displayWelcome(parsed: ParsedArgs): void {
  console.log('\n🚀 PDF Ingestion Service');
  console.log('========================\n');
  console.log(`📄 PDF Path: ${parsed.pdfPath ?? ''}`);
  console.log(`🔧 Chunking Strategy: ${parsed.chunkingStrategy ?? 'simple'}`);
  console.log(`🔄 Force Overwrite: ${parsed.force ? 'Yes' : 'No'}`);
  if (parsed.collectionName !== undefined) {
    console.log(`📊 Collection Name: ${parsed.collectionName} (custom)`);
  }
  console.log('');
}

/**
 * Initialize all services
 */
function initializeServices(parsed: ParsedArgs): PDFIngestionService {
  const logger = new ConsoleLogger({});

  if (parsed.verbose) {
    logger.setLevel({ level: LogLevel.DEBUG });
  }

  console.log('⚙️  Initializing services...');

  const qdrantHost = process.env['QDRANT_HOST'] ?? 'localhost';
  const qdrantPort = process.env['QDRANT_PORT'] ?? '6333';
  const qdrantUrl = `http://${qdrantHost}:${qdrantPort}`;

  const qdrantAdapter = new QdrantClientAdapter({
    collection: 'temp',
    url: qdrantUrl,
  });

  const pdfParser = new PdfParsePDFParser({ logger });
  const simpleChunker = new SimpleChunker({ logger });
  const textChunker = new TextChunkingService({
    logger,
    simpleChunker,
  });

  // Initialize Ollama Embedding Service
  const embeddingService = new OllamaEmbeddingService();

  const ingestionService = new PDFIngestionService({
    embeddingService,
    logger,
    pdfParser,
    qdrantAdapter,
    textChunker,
  });

  console.log('✅ Services initialized\n');

  return ingestionService;
}

/**
 * Build ingest parameters from parsed args
 */
function buildIngestParams(parsed: ParsedArgs): {
  chunkingStrategy?: 'simple' | 'semantic';
  chunkOverlap?: number;
  collectionNameOverride?: string;
  force: boolean;
  maxChunkSize?: number;
  minChunkSize?: number;
  pdfPath: string;
} {
  const params: {
    chunkingStrategy?: 'simple' | 'semantic';
    chunkOverlap?: number;
    collectionNameOverride?: string;
    force: boolean;
    maxChunkSize?: number;
    minChunkSize?: number;
    pdfPath: string;
  } = {
    force: parsed.force,
    pdfPath: parsed.pdfPath ?? '',
  };

  if (parsed.chunkOverlap !== undefined) {
    params.chunkOverlap = parsed.chunkOverlap;
  }
  if (parsed.chunkingStrategy !== undefined) {
    params.chunkingStrategy = parsed.chunkingStrategy;
  }
  if (parsed.collectionName !== undefined) {
    params.collectionNameOverride = parsed.collectionName;
  }
  if (parsed.maxChunkSize !== undefined) {
    params.maxChunkSize = parsed.maxChunkSize;
  }
  if (parsed.minChunkSize !== undefined) {
    params.minChunkSize = parsed.minChunkSize;
  }

  return params;
}

interface IngestionResult {
  collectionName: string;
  documentsIngested: number;
  pdfMetadata: {
    filename: string;
    pages?: number;
    title?: string;
  };
}

/**
 * Display success results
 */
function displaySuccess(params: {
  executionTime: number;
  result: IngestionResult;
}): void {
  const { executionTime, result } = params;

  console.log('\n🎉 PDF ingestion completed successfully!');
  console.log(`📊 Collection Name: ${result.collectionName}`);
  console.log(`📄 Documents Ingested: ${String(result.documentsIngested)}`);
  console.log(`📁 PDF File: ${result.pdfMetadata.filename}`);
  if (result.pdfMetadata.title !== undefined) {
    console.log(`📖 Title: ${result.pdfMetadata.title}`);
  }
  if (result.pdfMetadata.pages !== undefined) {
    console.log(`📄 Pages: ${String(result.pdfMetadata.pages)}`);
  }
  console.log(`⏱️  Total Time: ${String(Math.round(executionTime / 1000))}s`);
  console.log('');
  console.log(`🔍 Collection '${result.collectionName}' is now available in Qdrant!`);
  console.log('');
}

/**
 * Display error information
 */
function displayError(params: {
  error: unknown;
  executionTime: number;
  verbose: boolean;
}): void {
  const { error, executionTime, verbose } = params;
  const errorObj = error as Error;

  console.error('\n💥 PDF ingestion failed!');
  console.error(`❌ Error: ${errorObj.message}`);
  console.error(`⏱️  Execution Time: ${String(Math.round(executionTime / 1000))}s`);

  if (verbose) {
    console.error(`\n🔍 Stack Trace:\n${errorObj.stack ?? 'No stack trace available'}`);
  }

  console.error('');
}

/**
 * Validate parsed arguments and handle help/errors
 */
function validateArgs(parsed: ParsedArgs): void {
  if (parsed.help) {
    showUsage();
    process.exit(0);
  }

  if (parsed.pdfPath === undefined) {
    console.error('❌ Error: PDF path is required\n');
    showUsage();
    process.exit(1);
  }

  if (!existsSync(parsed.pdfPath)) {
    console.error(`❌ Error: PDF file not found: ${parsed.pdfPath}`);
    process.exit(1);
  }
}

/**
 * Main ingestion function
 */
async function main(): Promise<void> {
  const startTime = Date.now();
  const parsed = parseArgs();

  validateArgs(parsed);
  displayWelcome(parsed);

  try {
    const ingestionService = initializeServices(parsed);

    console.log('⚙️  Processing PDF...');

    const ingestParams = buildIngestParams(parsed);
    const result = await ingestionService.ingest(ingestParams);

    const executionTime = Date.now() - startTime;

    if (result.success) {
      displaySuccess({ executionTime, result });
      process.exit(0);
    }

    throw result.error ?? new Error('Ingestion failed with unknown error');
  } catch (error: unknown) {
    const executionTime = Date.now() - startTime;
    displayError({ error, executionTime, verbose: parsed.verbose });
    process.exit(1);
  }
}

// Handle uncaught errors
process.on('unhandledRejection', (reason: unknown) => {
  console.error('\n💥 Unhandled promise rejection!');
  console.error(`❌ ${String(reason)}`);
  process.exit(1);
});

process.on('uncaughtException', (error: unknown) => {
  const err = error as Error;
  console.error('\n💥 Uncaught exception!');
  console.error(`❌ ${err.message}`);
  process.exit(1);
});

// Run the ingestion
main().catch((error: unknown) => {
  const err = error as Error;
  console.error('\n💥 Script execution failed!');
  console.error(`❌ ${err.message}`);
  process.exit(1);
});
