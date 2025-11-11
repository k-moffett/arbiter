# Semantic Chunking with NLM Tag Extraction - Implementation Plan

**Plan Created:** 2025-11-10 08:12:48
**Status:** In Progress
**Estimated Duration:** 6.25 hours

---

## Overview

Implement optimal semantic chunking system with NLM-powered tag extraction matching cogitator quality. Uses two-pass boundary detection (embedding pre-filter + selective LLM analysis) with adaptive thresholding, structure preservation, and comprehensive progress feedback.

### What is Being Built
- Two-pass semantic boundary detection system
- NLM-powered tag/entity/topic extraction
- Domain-specific ENV configuration system (`env/.env.text-chunking`)
- Helper classes for distance calculation and threshold adaptation
- Integration into PDF ingestion pipeline

### Why It's Needed
- Current simple chunking creates arbitrary boundaries (poor for RAG)
- Missing NLM-extracted metadata (tags, entities, topics, keyPhrases)
- Naive semantic approach takes 3.8 hours (unacceptable)
- Need cogitator-quality results with optimal performance (3-5 minutes)

### High-Level Approach
1. Establish ENV organization pattern (`env/` directory)
2. Create configuration infrastructure with validation
3. Implement two-pass boundary detection (embedding filter → selective LLM)
4. Integrate tag extraction into pipeline
5. Test with 400-page PDF, verify performance and quality

---

## Key Standards Compliance

- ✅ **Directory-based structure** for all classes
- ✅ **Typed object parameters** (MANDATORY - enforced by ESLint)
- ✅ **No `any` types** - use `unknown` with type guards
- ✅ **Dependency injection** for all configuration (ENV-based)
- ✅ **SOLID principles** throughout implementation
- ✅ **ESM only** - no CommonJS
- ✅ **Run `npm run lint && npm run typecheck`** after EVERY file creation/edit
- ✅ **Fix ALL warnings and errors** before proceeding
- ✅ **JSDoc for all public APIs**

---

## PHASE 0: Plan Document Creation ⏱️ 10 min

**Status:** ✅ Completed

### Checklist
- [x] Create plan file with proper timestamp format (20251110-081248)
- [x] Include all phases with detailed checklists
- [x] Add acceptance criteria for each phase
- [x] Include success metrics
- [x] Add risk mitigation strategies
- [x] Document checkpoints
- [x] Mark initial status as "In Progress"

### Acceptance Criteria
- ✅ Plan file exists in `.claude/aiContext/plans/`
- ✅ All 8 phases documented with checklists
- ✅ Each task has validation steps
- ✅ lint/typecheck requirements documented

---

## PHASE 1: ENV Organization & Configuration Infrastructure ⏱️ 60 min

**Status:** Pending

### Task 1.1: Create ENV Directory Structure

**Checklist:**
- [ ] Create `env/` directory at project root
- [ ] Create `.gitignore` in `env/` directory
- [ ] Add pattern: `!.env.*.example` (track examples)
- [ ] Add pattern: `.env.*` (ignore actual files)
- [ ] Verify git tracks `.example` files but ignores actual `.env` files

### Task 1.2: Create ENV README

**File:** `env/README.md`

**Checklist:**
- [ ] Document ENV organization pattern
- [ ] Explain why configs are separated
- [ ] Show how to copy `.example` files
- [ ] List all ENV file purposes
- [ ] Add usage examples
- [ ] Document naming conventions (kebab-case)
- [ ] No lint/typecheck needed (markdown)

### Task 1.3: Create Text Chunking ENV Example

**File:** `env/.env.text-chunking.example`

**Checklist:**
- [ ] Add comprehensive semantic chunking section
- [ ] Document all ENV variables with inline comments
- [ ] Include performance implications
- [ ] Add examples and recommendations
- [ ] Document valid ranges for each value
- [ ] Add links to documentation if relevant
- [ ] Include "Quick Start" recommended values section
- [ ] No lint/typecheck needed (env file)

### Task 1.4: Create SemanticChunkingConfig Interfaces

**File:** `src/_services/TextChunkingService/_strategies/OllamaSemanticChunker/config/interfaces.ts`

**Checklist:**
- [ ] Create `interfaces.ts` with comprehensive JSDoc
- [ ] Define `SemanticChunkingConfigParams` interface
- [ ] Define `SemanticBoundaryWeights` interface
- [ ] Define `AdaptiveThresholdConfig` interface
- [ ] Export all interfaces
- [ ] **Run `npm run lint && npm run typecheck`**
- [ ] **Fix all errors/warnings**

### Task 1.5: Create SemanticChunkingConfig Implementation

**File:** `src/_services/TextChunkingService/_strategies/OllamaSemanticChunker/config/SemanticChunkingConfigImplementation.ts`

**Checklist:**
- [ ] Create class following directory-based structure
- [ ] Accept `envFile` parameter in constructor (optional)
- [ ] Load config from specified ENV file using `dotenv`
- [ ] Use `getEnv` utility for each ENV variable
- [ ] Provide sensible defaults for all fields
- [ ] Validate weights sum to 1.0 (±0.01 tolerance)
- [ ] Validate thresholds in range (0.0-1.0)
- [ ] Validate sizes are positive integers
- [ ] Validate overlap percentage 0-100
- [ ] Throw descriptive errors for invalid config
- [ ] Add comprehensive JSDoc with examples
- [ ] Constructor uses typed object parameter
- [ ] **Run `npm run lint && npm run typecheck`**
- [ ] **Fix all errors/warnings**

### Task 1.6: Create Barrel Exports

**File:** `src/_services/TextChunkingService/_strategies/OllamaSemanticChunker/config/index.ts`

**Checklist:**
- [ ] Export `SemanticChunkingConfig` class
- [ ] Export all interfaces
- [ ] Export factory function `createSemanticChunkingConfig()`
- [ ] **Run `npm run lint && npm run typecheck`**
- [ ] **Fix all errors/warnings**

### Task 1.7: Update .gitignore

**File:** `.gitignore` (root)

**Checklist:**
- [ ] Add `env/.env.*` pattern (ignore actual ENV files)
- [ ] Add `!env/.env.*.example` pattern (track example files)
- [ ] Verify existing `.env` patterns don't conflict
- [ ] No lint/typecheck needed

### Acceptance Criteria
- [ ] ENV directory structure created
- [ ] All config loaded from domain-specific ENV file
- [ ] Validation ensures correct config values
- [ ] Factory function provides simple interface
- [ ] Zero TypeScript errors, zero ESLint warnings
- [ ] JSDoc coverage 100%

---

## PHASE 2: Boundary Detection Helper Classes ⏱️ 60 min

**Status:** Pending

### Task 2.1: Create EmbeddingDistanceCalculator

**Directory:** `src/_services/TextChunkingService/_strategies/OllamaSemanticChunker/_analyzers/EmbeddingDistanceCalculator/`

**Checklist:**
- [ ] Create `interfaces.ts` (CalculateDistanceParams, CalculateBatchDistancesParams)
- [ ] Create `EmbeddingDistanceCalculatorImplementation.ts`
- [ ] Implement cosine distance calculation
- [ ] Implement batch distance calculation
- [ ] Add comprehensive JSDoc
- [ ] Create `index.ts` with exports
- [ ] **Run `npm run lint && npm run typecheck`**
- [ ] **Fix all errors/warnings**

### Task 2.2: Create AdaptiveThresholdCalculator

**Directory:** `src/_services/TextChunkingService/_strategies/OllamaSemanticChunker/_analyzers/AdaptiveThresholdCalculator/`

**Checklist:**
- [ ] Create `interfaces.ts` (CalculateThresholdParams)
- [ ] Create `AdaptiveThresholdCalculatorImplementation.ts`
- [ ] Implement statistical threshold calculation (mean + 1.5*stdDev)
- [ ] Implement top-N% fallback
- [ ] Respect min/max bounds from config
- [ ] Add comprehensive JSDoc with algorithm explanation
- [ ] Create `index.ts` with exports
- [ ] **Run `npm run lint && npm run typecheck`**
- [ ] **Fix all errors/warnings**

### Task 2.3: Create BoundaryCandidate Types

**File:** `src/_services/TextChunkingService/_strategies/OllamaSemanticChunker/types.ts`

**Checklist:**
- [ ] Add `BoundaryCandidate` interface
- [ ] Add `StructureAnalysisResult` interface
- [ ] Update `SentenceWithBoundary` if needed
- [ ] Export all types
- [ ] **Run `npm run lint && npm run typecheck`**
- [ ] **Fix all errors/warnings**

### Acceptance Criteria
- [ ] Helper classes follow directory-based structure
- [ ] All methods use typed object parameters
- [ ] Statistical calculations verified
- [ ] Zero TypeScript errors, zero ESLint warnings

---

## PHASE 3: Two-Pass Boundary Analysis ⏱️ 90 min

**Status:** Pending

### Task 3.1: Add Helper Methods to OllamaSemanticChunker

**File:** `src/_services/TextChunkingService/_strategies/OllamaSemanticChunker/OllamaSemanticChunkerImplementation.ts`

**Checklist:**
- [ ] Add `batchCalculateEmbeddings` private method with typed params
- [ ] Add `calculateAllSemanticDistances` private method with typed params
- [ ] Add `identifyCandidates` private method with typed params
- [ ] Add `analyzeAllStructure` private method with typed params
- [ ] All methods have comprehensive JSDoc
- [ ] All methods use typed object parameters
- [ ] **Run `npm run lint && npm run typecheck`**
- [ ] **Fix all errors/warnings**

### Task 3.2: Refactor analyzeBoundaries Method

**File:** Same as 3.1

**Checklist:**
- [ ] Implement Pass 1: Batch embedding calculation with progress logging
- [ ] Calculate all semantic distances using helper
- [ ] Calculate adaptive threshold or use config threshold
- [ ] Identify candidate boundaries using helper
- [ ] Log Pass 1 results (candidates identified, threshold used)
- [ ] Implement Pass 2: Run structure detector on ALL sentences
- [ ] Log structure analysis progress
- [ ] Implement Pass 3: LLM analysis ONLY on candidates
- [ ] Add progress feedback every N sentences (from config)
- [ ] For non-candidates, use embedding distance only
- [ ] Calculate weighted boundary scores
- [ ] Preserve atomic units based on structure analysis
- [ ] All new code uses typed object parameters
- [ ] **Run `npm run lint && npm run typecheck`**
- [ ] **Fix all errors/warnings**

### Task 3.3: Update BoundaryScorer Weights

**File:** `src/_services/TextChunkingService/_strategies/OllamaSemanticChunker/_analyzers/OllamaBoundaryScorer/OllamaBoundaryScorerImplementation.ts`

**Checklist:**
- [ ] Update `calculateBoundaryScore` to include embedding weight
- [ ] Verify weights interface includes `embedding` field
- [ ] Update JSDoc
- [ ] **Run `npm run lint && npm run typecheck`**
- [ ] **Fix all errors/warnings**

### Acceptance Criteria
- [ ] Two-pass algorithm implemented correctly
- [ ] Progress feedback every N sentences
- [ ] Adaptive threshold working
- [ ] Structure preserved on ALL sentences
- [ ] LLM calls only on candidates
- [ ] Zero TypeScript errors, zero ESLint warnings

---

## PHASE 4: Tag Extraction Integration ⏱️ 60 min

**Status:** Pending

### Task 4.1: Add TagExtractor Parameter

**File:** `src/_services/PDFIngestionService/PDFIngestionServiceImplementation.ts`

**Checklist:**
- [ ] Add `tagExtractor?: OllamaTagExtractor` to `PDFIngestionServiceParams` interface
- [ ] Store in private readonly field
- [ ] Update JSDoc for constructor
- [ ] **Run `npm run lint && npm run typecheck`**
- [ ] **Fix all errors/warnings**

### Task 4.2: Create enrichChunksWithTags Method

**File:** Same as 4.1

**Checklist:**
- [ ] Create private method `enrichChunksWithTags` with typed params
- [ ] Parameter interface: `EnrichChunksWithTagsParams`
- [ ] Iterate through chunks with progress feedback (every 50 chunks)
- [ ] Call `tagExtractor.extractTags` for each chunk
- [ ] Merge extracted metadata with document-level metadata
- [ ] Return enriched chunks
- [ ] Add comprehensive JSDoc with @example
- [ ] **Run `npm run lint && npm run typecheck`**
- [ ] **Fix all errors/warnings**

### Task 4.3: Integrate into Ingestion Pipeline

**File:** Same as 4.1

**Checklist:**
- [ ] After `chunkText()` call, add enrichment step
- [ ] Log enrichment start
- [ ] Call `enrichChunksWithTags` with chunks and metadata
- [ ] Log enrichment complete
- [ ] Pass enriched chunks to `storeChunks`
- [ ] **Run `npm run lint && npm run typecheck`**
- [ ] **Fix all errors/warnings**

### Acceptance Criteria
- [ ] Tag extraction integrated into pipeline
- [ ] Progress feedback working
- [ ] Document-level metadata merged correctly
- [ ] Zero TypeScript errors, zero ESLint warnings

---

## PHASE 5: Enhanced Metadata Types ⏱️ 30 min

**Status:** Pending

### Task 5.1: Update TextChunk Metadata Interface

**File:** `src/_services/TextChunkingService/types.ts`

**Checklist:**
- [ ] Add `documentTitle?: string`
- [ ] Add `documentAuthor?: string`
- [ ] Add `documentCategory?: string`
- [ ] Add `documentTags?: string[]`
- [ ] Add `tagConfidence?: number`
- [ ] Update JSDoc
- [ ] **Run `npm run lint && npm run typecheck`**
- [ ] **Fix all errors/warnings**

### Task 5.2: Verify Qdrant Storage Auto-Spread

**File:** `src/_services/PDFIngestionService/PDFIngestionServiceImplementation.ts`

**Checklist:**
- [ ] Verify `...chunk.metadata` spread is present (line ~449-456)
- [ ] Confirm all new fields will automatically be stored
- [ ] Add comment explaining auto-spread behavior
- [ ] No code changes needed (just verification)

### Acceptance Criteria
- [ ] Metadata interface supports all new fields
- [ ] Qdrant storage spreads metadata correctly
- [ ] Zero TypeScript errors, zero ESLint warnings

---

## PHASE 6: Wire Up Dependencies ⏱️ 30 min

**Status:** Pending

### Task 6.1: Update Ingestion Script

**File:** `src/_services/PDFIngestionService/scripts/ingest.ts`

**Checklist:**
- [ ] Verify `tagExtractor` created at line 531-534
- [ ] Add `tagExtractor` to `PDFIngestionService` constructor (line 605)
- [ ] Update semantic chunker to load config from `env/.env.text-chunking`
- [ ] Update JSDoc if needed
- [ ] **Run `npm run lint && npm run typecheck`**
- [ ] **Fix all errors/warnings**

### Task 6.2: Verify Semantic Chunker Initialization

**File:** Same as 6.1

**Checklist:**
- [ ] Verify all 5 analyzers initialized (lines 516-559)
- [ ] Verify embedding adapter created (lines 541-549)
- [ ] Update config loading to use new ENV file (line 502)
- [ ] Verify factory function called correctly

### Acceptance Criteria
- [ ] All dependencies wired correctly
- [ ] Tag extractor passed to ingestion service
- [ ] Config loads from `env/.env.text-chunking`
- [ ] Zero TypeScript errors, zero ESLint warnings

---

## PHASE 7: Testing & Validation ⏱️ 60 min

**Status:** Pending

### Task 7.1: Setup ENV File

**Checklist:**
- [ ] Copy `env/.env.text-chunking.example` to `env/.env.text-chunking`
- [ ] Review all values (use defaults for first test)
- [ ] Verify file is gitignored
- [ ] Verify config class loads values correctly

### Task 7.2: Test Configuration Loading

**Checklist:**
- [ ] Run simple test to verify config loads
- [ ] Verify all ENV variables loaded correctly
- [ ] Verify defaults applied when ENV missing
- [ ] Verify validation catches invalid weights
- [ ] **Run `npm run lint && npm run typecheck`**

### Task 7.3: Test Semantic Chunking Pipeline

**Checklist:**
- [ ] Backup existing project-odyssey collection (optional)
- [ ] Run ingestion with semantic chunking
- [ ] Verify progress feedback appears
- [ ] Verify completion time is 3-5 minutes (not hours)
- [ ] Verify no errors in logs

### Task 7.4: Validate Qdrant Metadata

**Checklist:**
- [ ] Query Qdrant for sample points
- [ ] Verify `tags` array populated
- [ ] Verify `entities` array populated
- [ ] Verify `topics` array populated
- [ ] Verify `keyPhrases` array populated
- [ ] Verify `documentTitle`, `documentAuthor`, etc. present
- [ ] Verify chunk boundaries look semantically correct

### Task 7.5: Performance Validation

**Checklist:**
- [ ] Record total ingestion time
- [ ] Verify < 5 minutes for 400-page PDF
- [ ] Check logs for Pass 1 time (embedding calculation)
- [ ] Check logs for Pass 2 time (structure analysis)
- [ ] Check logs for Pass 3 time (LLM candidate analysis)
- [ ] Check logs for tag extraction time
- [ ] Calculate throughput (chunks per second)

### Acceptance Criteria
- [ ] Total time < 5 minutes for ProjectOdyssey.pdf
- [ ] All metadata fields populated
- [ ] Chunk boundaries semantically coherent
- [ ] Zero TypeScript errors, zero ESLint warnings

---

## PHASE 8: Documentation & Cleanup ⏱️ 30 min

**Status:** Pending

### Task 8.1: Update Plan Document

**File:** `.claude/aiContext/plans/20251110-081248-semantic-chunking-nlm-tag-extraction.md`

**Checklist:**
- [ ] Mark all phases as completed
- [ ] Add completion timestamp
- [ ] Document actual vs estimated duration
- [ ] Add performance metrics
- [ ] Note any deviations from plan
- [ ] Add lessons learned
- [ ] Update status to "Completed"

### Task 8.2: Create Summary Document

**File:** `.claude/aiContext/summaries/SEMANTIC-CHUNKING-NLM-SUMMARY.md`

**Checklist:**
- [ ] Document final architecture
- [ ] List all files created/modified
- [ ] Document configuration options
- [ ] Add usage examples
- [ ] Document performance characteristics
- [ ] Include troubleshooting tips
- [ ] Document ENV organization pattern

### Task 8.3: Update Plans README Index

**File:** `.claude/aiContext/plans/README.md`

**Checklist:**
- [ ] Add plan to index table
- [ ] Mark status as Completed
- [ ] No lint/typecheck needed (markdown file)

### Task 8.4: Update Root .gitignore

**File:** `.gitignore` (root)

**Checklist:**
- [ ] Verify `env/.env.*` patterns present
- [ ] Verify `env/.env.*.example` tracked
- [ ] Test that git correctly ignores/tracks files

### Acceptance Criteria
- [ ] All documentation complete
- [ ] Plan marked completed
- [ ] Summary created for future reference
- [ ] ENV pattern documented for team

---

## Success Metrics

### Code Quality
- [ ] Zero TypeScript errors across entire project
- [ ] Zero ESLint warnings across entire project
- [ ] All new code uses typed object parameters
- [ ] No `any` types used anywhere
- [ ] JSDoc coverage 100% for public APIs
- [ ] All methods < 75 lines
- [ ] All files < 400 lines

### Architecture
- [ ] SOLID principles followed throughout
- [ ] Directory-based structure used for all classes
- [ ] Dependency injection used for configuration
- [ ] Separation of concerns maintained
- [ ] No circular dependencies
- [ ] ENV organization pattern established

### Performance
- [ ] Semantic chunking completes in < 5 minutes for 400-page PDF
- [ ] Embedding calculation < 2 minutes
- [ ] LLM analysis < 3 minutes
- [ ] Tag extraction < 2 minutes
- [ ] 45-60x faster than naive semantic approach

### Functionality
- [ ] Chunks respect semantic boundaries
- [ ] Tags/entities/topics extracted for all chunks
- [ ] Document-level metadata included
- [ ] Structure preservation working (tables, lists intact)
- [ ] Progress feedback provides good UX
- [ ] Adaptive threshold working across document types
- [ ] Config loads from domain-specific ENV file

---

## Risk Mitigation

### Risk 1: Performance Regression
**Mitigation**: Profile each pass separately, adjust thresholds if needed

### Risk 2: Memory Usage
**Mitigation**: Batch process embeddings, stream large documents

### Risk 3: Configuration Complexity
**Mitigation**: Comprehensive defaults, validation, documentation, example file

### Risk 4: Breaking Existing Code
**Mitigation**: Run full test suite after each phase, backwards compatible

### Risk 5: ENV File Conflicts
**Mitigation**: Clear naming convention, separate directory, comprehensive README

---

## Checkpoints

### Checkpoint 1: After Phase 1 (Config & ENV)
- [ ] ENV directory structure created
- [ ] Config loads from `env/.env.text-chunking` correctly
- [ ] Validation working
- [ ] Zero lint/typecheck errors
- **Go/No-Go**: Can proceed if all green

### Checkpoint 2: After Phase 3 (Boundary Detection)
- [ ] Two-pass algorithm working
- [ ] Progress feedback appearing
- [ ] Adaptive threshold calculating correctly
- **Go/No-Go**: Can proceed if all green

### Checkpoint 3: After Phase 4 (Tag Extraction)
- [ ] Tags extracting correctly
- [ ] Metadata merging working
- [ ] Pipeline integrated smoothly
- **Go/No-Go**: Can proceed if all green

### Checkpoint 4: After Phase 7 (Testing)
- [ ] Performance targets met
- [ ] Metadata in Qdrant validated
- [ ] No errors in production test
- **Go/No-Go**: Can proceed to documentation if all green

---

## Files to Create/Modify

### New Files (11):
1. ✅ `.claude/aiContext/plans/20251110-081248-semantic-chunking-nlm-tag-extraction.md`
2. `env/README.md`
3. `env/.env.text-chunking.example`
4. `env/.gitignore`
5. `src/_services/TextChunkingService/_strategies/OllamaSemanticChunker/config/interfaces.ts`
6. `src/_services/TextChunkingService/_strategies/OllamaSemanticChunker/config/SemanticChunkingConfigImplementation.ts`
7. `src/_services/TextChunkingService/_strategies/OllamaSemanticChunker/config/index.ts`
8. `src/_services/TextChunkingService/_strategies/OllamaSemanticChunker/_analyzers/EmbeddingDistanceCalculator/` (directory with files)
9. `src/_services/TextChunkingService/_strategies/OllamaSemanticChunker/_analyzers/AdaptiveThresholdCalculator/` (directory with files)
10. `.claude/aiContext/summaries/SEMANTIC-CHUNKING-NLM-SUMMARY.md`

### Modified Files (7):
1. `.gitignore` (root - add env/ patterns)
2. `src/_services/TextChunkingService/_strategies/OllamaSemanticChunker/OllamaSemanticChunkerImplementation.ts`
3. `src/_services/TextChunkingService/_strategies/OllamaSemanticChunker/types.ts`
4. `src/_services/TextChunkingService/_strategies/OllamaSemanticChunker/_analyzers/OllamaBoundaryScorer/OllamaBoundaryScorerImplementation.ts`
5. `src/_services/PDFIngestionService/PDFIngestionServiceImplementation.ts`
6. `src/_services/TextChunkingService/types.ts`
7. `src/_services/PDFIngestionService/scripts/ingest.ts`
8. `.claude/aiContext/plans/README.md` (add plan to index)

---

## ENV Organization Pattern (For Future Reference)

This implementation establishes a new pattern for the project:

### Pattern
- **Location**: `env/` directory at project root
- **Naming**: `env/.env.{domain-name}.example` (kebab-case)
- **Structure**: One ENV file per major domain/service
- **Tracking**: Example files tracked in git, actual files gitignored
- **Loading**: Config classes accept `envFile` parameter

### Benefits
- Clear separation of concerns
- Easier to find relevant configuration
- Reduces merge conflicts
- Better documentation
- Scales well as project grows

### Future ENV Files
As project grows, create:
- `env/.env.embeddings.example` - Ollama embedding service config
- `env/.env.vector-db.example` - Qdrant configuration
- `env/.env.llm-providers.example` - LLM provider settings
- `env/.env.discord-bot.example` - Discord bot configuration
- etc.

---

**Status:** In Progress
**Next Phase:** PHASE 1 - ENV Organization & Configuration Infrastructure
