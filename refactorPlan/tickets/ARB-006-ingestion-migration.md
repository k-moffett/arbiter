# ARB-006: Ingestion Pipeline Migration

**Status**: 🔶 READY
**Priority**: P1 - High
**Epic**: ARB-EPIC-001
**Effort**: 8-10 hours
**Assignee**: @kmoffett

---

## Description

Migrate the working ingestion pipelines from Cogitator (BattleScribe XML parsing and PDF processing) to Arbiter, removing IP-specific references and making them domain-agnostic. This preserves the excellent work done in Cogitator while adapting it for the new pluggable architecture.

---

## Goals

1. Migrate BattleScribe XML ingestion (excellent code, minimal changes)
2. Migrate PDF ingestion (good code, remove web scraping)
3. Remove IP-specific hardcoded references
4. Make ingestion configuration-driven
5. Expose ingestion as MCP tool

---

## Acceptance Criteria

### Must Have

- [ ] **BattleScribe Ingestion** working
  - [ ] Parse BattleScribe XML catalogs
  - [ ] Extract units, weapons, abilities, constraints
  - [ ] Generate structured data + natural language chunks
  - [ ] Store in vector DB
  - [ ] Configuration-driven (repo URLs from config file)

- [ ] **PDF Ingestion** working
  - [ ] Parse PDF files
  - [ ] Semantic chunking (Ollama-based)
  - [ ] Extract text + metadata
  - [ ] Store in vector DB
  - [ ] Configuration-driven (PDF URLs from config file)

- [ ] **Configuration Files**
  - [ ] `domains/{domain}/sources.json` defines sources
  - [ ] Support BattleScribe repos
  - [ ] Support PDF URLs
  - [ ] Support local file paths

- [ ] **MCP Tool Exposure**
  - [ ] `ingest-battlescribe` tool
  - [ ] `ingest-pdf` tool
  - [ ] `ingest-domain` tool (runs all sources for a domain)

- [ ] **IP-Agnostic**
  - [ ] No hardcoded Warhammer URLs
  - [ ] No hardcoded faction names
  - [ ] Generic entity types (configurable)

### Should Have

- [ ] Progress reporting during ingestion
- [ ] Incremental ingestion (only new/changed files)
- [ ] Validation after ingestion

### Nice to Have

- [ ] Web scraping (like Wahapedia) - LOW PRIORITY
- [ ] Automatic PDF discovery
- [ ] Ingestion scheduling

---

## Implementation Plan

### Phase 1: BattleScribe Migration (4-5 hours)

**Files to Copy from Cogitator**:
```
src/mcp/40k/parsers/
├── BattleScribeCatParser.ts       → src/ingestion/parsers/BattleScribeCatParser.ts
├── BattleScribeAdapter.ts         → src/ingestion/parsers/BattleScribeAdapter.ts
└── ParserConfig.ts                → src/ingestion/parsers/ParserConfig.ts (make generic)

src/scripts/ingestGitHubRepo.ts    → src/ingestion/BattleScribeIngestion.ts
```

**Files to Create**:
```
src/ingestion/
├── BattleScribeIngestion.ts       # Main ingestion orchestrator
├── parsers/
│   ├── BattleScribeCatParser.ts   # (copied)
│   └── BattleScribeAdapter.ts     # (copied)
└── interfaces/
    └── IIngestionService.ts
```

**Implementation Steps**:

1. **Copy Parser Files**
   - Copy BattleScribeCatParser.ts as-is (no changes needed - excellent code)
   - Copy BattleScribeAdapter.ts as-is
   - Modify ParserConfig.ts to be generic (remove Warhammer-specific defaults)

2. **Make Configuration-Driven**

**Before (Cogitator):**
```typescript
// Hardcoded in script
const repoUrl = 'https://github.com/BSData/wh40k-10e';
const branch = 'main';
```

**After (Arbiter):**
```typescript
// Read from domains/{domain}/sources.json
const config = await loadDomainConfig(domain);
const battlescribeRepos = config.sources.battlescribe.repos;

for (const repo of battlescribeRepos) {
  await ingestBattleScribeRepo(repo.url, repo.branch, repo.catalogPath);
}
```

**domains/warhammer-40k/sources.json**:
```json
{
  "battlescribe": {
    "repos": [
      {
        "url": "https://github.com/BSData/wh40k-10e",
        "branch": "main",
        "catalogPath": "Warhammer 40,000.gst"
      }
    ]
  }
}
```

3. **Create BattleScribeIngestion Service**
```typescript
interface IBattleScribeIngestion {
  ingest(
    domain: string,
    repoUrl: string,
    branch: string,
    catalogPath: string
  ): Promise<IngestionResult>;
}

interface IngestionResult {
  success: boolean;
  itemsProcessed: number;
  vectorsCreated: number;
  duration: number;
  errors: string[];
}

class BattleScribeIngestion implements IBattleScribeIngestion {
  async ingest(
    domain: string,
    repoUrl: string,
    branch: string,
    catalogPath: string
  ): Promise<IngestionResult> {
    const startTime = Date.now();

    // 1. Clone repo (or pull if exists)
    await this.gitService.cloneOrPull(repoUrl, branch);

    // 2. Parse catalog
    const parser = new BattleScribeCatParser();
    const data = await parser.parse(catalogPath);

    // 3. Generate vectors
    const vectors = await this.generateVectors(data, domain);

    // 4. Store in Qdrant
    const collection = `${domain}_units`;
    await this.vectorDB.upsert(collection, vectors);

    return {
      success: true,
      itemsProcessed: data.units.length,
      vectorsCreated: vectors.length,
      duration: Date.now() - startTime,
      errors: []
    };
  }

  private async generateVectors(data: any, domain: string) {
    // Reuse logic from Cogitator
    // Generate structured + natural language chunks
    // Embed with Ollama
    // Return vector objects
  }
}
```

4. **Remove IP-Specific References**
   - Entity types from config (not hardcoded as "unit", "weapon", etc.)
   - Metadata fields configurable
   - Example:

**domains/warhammer-40k/config.json**:
```json
{
  "entities": {
    "types": ["unit", "weapon", "ability", "stratagem", "faction"],
    "schema": "./schemas/entity.json"
  },
  "ingestion": {
    "battlescribe": {
      "entityMapping": {
        "selections": "unit",
        "profiles": "weapon",
        "rules": "ability"
      }
    }
  }
}
```

**Testing**:
- Ingest Warhammer 40K BattleScribe data
- Verify units extracted correctly
- Verify vectors created correctly
- Verify data queryable in vector DB

---

### Phase 2: PDF Migration (3-4 hours)

**Files to Copy from Cogitator**:
```
src/core/services/PDFParser.ts     → src/ingestion/parsers/PDFParser.ts
src/mcp/40k/services/CoreRulesProcessor.ts → src/ingestion/PDFIngestion.ts (rename generic)
src/vector/services/chunking/      → src/ingestion/chunking/ (copy entire dir)
```

**Files to Create**:
```
src/ingestion/
├── PDFIngestion.ts                # Main PDF ingestion
├── parsers/
│   └── PDFParser.ts               # (copied)
└── chunking/
    └── SemanticChunker.ts         # (copied)
```

**Implementation Steps**:

1. **Copy PDF Parser**
   - Copy PDFParser.ts as-is (works well)
   - Copy semantic chunking logic

2. **Remove Web Scraping for PDF Discovery**

**Before (Cogitator):**
```typescript
// Scrapes Warhammer Community for PDF links
const pdfLinks = await this.puppeteerScraper.scrapePDFLinks();
```

**After (Arbiter):**
```typescript
// Read from domains/{domain}/sources.json
const config = await loadDomainConfig(domain);
const pdfs = config.sources.pdfs;

for (const pdf of pdfs) {
  await ingestPDF(pdf.url, pdf.type, pdf.name);
}
```

**domains/warhammer-40k/sources.json**:
```json
{
  "pdfs": [
    {
      "name": "Core Rules 10th Edition",
      "url": "https://example.com/core-rules.pdf",
      "type": "rules"
    },
    {
      "name": "Munitorum Field Manual Q4 2024",
      "url": "https://example.com/munitorum.pdf",
      "type": "points"
    }
  ]
}
```

3. **Create PDFIngestion Service**
```typescript
interface IPDFIngestion {
  ingest(
    domain: string,
    pdfUrl: string,
    pdfType: string,
    pdfName: string
  ): Promise<IngestionResult>;
}

class PDFIngestion implements IPDFIngestion {
  async ingest(
    domain: string,
    pdfUrl: string,
    pdfType: string,
    pdfName: string
  ): Promise<IngestionResult> {
    const startTime = Date.now();

    // 1. Download PDF
    const pdfPath = await this.downloadPDF(pdfUrl);

    // 2. Parse PDF
    const parser = new PDFParser();
    const text = await parser.parse(pdfPath);

    // 3. Semantic chunking (Ollama-based)
    const chunker = new SemanticChunker();
    const chunks = await chunker.chunk(text);

    // 4. Embed chunks
    const vectors = [];
    for (const chunk of chunks) {
      const embedding = await this.embeddingService.embed(chunk.content);
      vectors.push({
        id: chunk.id,
        vector: embedding,
        content: chunk.content,
        metadata: {
          domain,
          type: pdfType,
          source: pdfName,
          page: chunk.page
        }
      });
    }

    // 5. Store in Qdrant
    const collection = `${domain}_rules`;
    await this.vectorDB.upsert(collection, vectors);

    return {
      success: true,
      itemsProcessed: chunks.length,
      vectorsCreated: vectors.length,
      duration: Date.now() - startTime,
      errors: []
    };
  }
}
```

4. **Support Local Files**
   - If URL is a file:// path, read locally
   - Useful for testing and offline ingestion

**Testing**:
- Ingest sample PDF
- Verify chunking works
- Verify embeddings created
- Verify data queryable

---

### Phase 3: MCP Tool Integration (1-2 hours)

**Files to Create**:
```
src/mcp/tools/
├── IngestBattleScribeTool.ts
├── IngestPDFTool.ts
└── IngestDomainTool.ts
```

**Implementation Steps**:

1. **Create IngestBattleScribeTool**
```typescript
class IngestBattleScribeTool extends BaseTool {
  name = 'ingest-battlescribe';
  description = 'Ingest BattleScribe XML catalog';

  inputSchema = {
    type: 'object',
    properties: {
      domain: { type: 'string' },
      repoUrl: { type: 'string' },
      branch: { type: 'string', default: 'main' },
      catalogPath: { type: 'string' }
    },
    required: ['domain', 'repoUrl', 'catalogPath']
  };

  async execute(args: any): Promise<IToolResult> {
    const ingestion = new BattleScribeIngestion();
    const result = await ingestion.ingest(
      args.domain,
      args.repoUrl,
      args.branch,
      args.catalogPath
    );

    return {
      tool: this.name,
      success: result.success,
      data: result,
      confidence: 1.0,
      duration: result.duration
    };
  }
}
```

2. **Create IngestPDFTool**
   - Similar to BattleScribe tool

3. **Create IngestDomainTool**
   - Reads domain config
   - Runs all ingestion sources for domain
   - Reports progress

```typescript
class IngestDomainTool extends BaseTool {
  name = 'ingest-domain';
  description = 'Ingest all sources for a domain';

  async execute(args: any): Promise<IToolResult> {
    const { domain } = args;
    const config = await loadDomainConfig(domain);

    const results = [];

    // Ingest BattleScribe repos
    for (const repo of config.sources.battlescribe?.repos || []) {
      const result = await this.battlescribeIngestion.ingest(
        domain, repo.url, repo.branch, repo.catalogPath
      );
      results.push(result);
    }

    // Ingest PDFs
    for (const pdf of config.sources.pdfs || []) {
      const result = await this.pdfIngestion.ingest(
        domain, pdf.url, pdf.type, pdf.name
      );
      results.push(result);
    }

    return {
      tool: this.name,
      success: results.every(r => r.success),
      data: {
        totalItems: results.reduce((sum, r) => sum + r.itemsProcessed, 0),
        totalVectors: results.reduce((sum, r) => sum + r.vectorsCreated, 0),
        results
      },
      confidence: 1.0
    };
  }
}
```

4. **Register Tools with MCP Server**
   - Add to tool registry
   - Expose via MCP protocol

**Testing**:
- Call `ingest-battlescribe` via MCP
- Call `ingest-pdf` via MCP
- Call `ingest-domain` via MCP
- Verify ingestion completes successfully

---

## Technical Details

### Reusable Components from Cogitator

**Direct Copy (Excellent Code)**:
- `src/mcp/40k/parsers/BattleScribeCatParser.ts` - **KEEP AS-IS**
- `src/mcp/40k/parsers/BattleScribeAdapter.ts` - **KEEP AS-IS**
- `src/core/services/PDFParser.ts` - Minor updates
- `src/vector/services/chunking/` - Semantic chunking logic

**Don't Copy**:
- `src/mcp/40k/services/puppeteer/WahpediaPuppeteerScraper.ts` - Web scraping (not needed)
- `src/mcp/40k/services/WarhammerCommunityPdfIngestionService.ts` - Web scraping

### Git Service

For cloning BattleScribe repos, use simple-git:

```typescript
import simpleGit from 'simple-git';

class GitService {
  async cloneOrPull(repoUrl: string, branch: string): Promise<string> {
    const repoDir = `./temp/repos/${this.getRepoName(repoUrl)}`;

    if (await fs.exists(repoDir)) {
      // Pull latest
      const git = simpleGit(repoDir);
      await git.pull('origin', branch);
    } else {
      // Clone
      await simpleGit().clone(repoUrl, repoDir, ['--branch', branch]);
    }

    return repoDir;
  }
}
```

---

## Configuration

**Environment Variables**:
```bash
# Ingestion
INGESTION_TEMP_DIR=./temp
INGESTION_PARALLEL_LIMIT=3

# Git
GIT_CLONE_DEPTH=1  # Shallow clone for speed
```

---

## Success Metrics

- [ ] BattleScribe ingestion produces same results as Cogitator
- [ ] PDF ingestion works with sample PDFs
- [ ] All ingestion is configuration-driven (no hardcoded URLs)
- [ ] MCP tools callable and functional
- [ ] Ingestion completes in <5 minutes for typical dataset

---

## Dependencies

- **Blockers**:
  - ARB-001 (Base Repo) - ✅ Complete
  - ARB-005 (MCP Server) - To expose as MCP tools

- **Nice to Have**:
  - ARB-002 (Context System) - For better chunking
  - ARB-004 (Validation) - For post-ingestion validation

---

## Follow-up Tasks

After completion:
- ARB-007: Integration Testing (test full pipeline with ingested data)
- Consider: Web scraping tools (Wahapedia) as optional extension

---

## Notes

- BattleScribe parser is **excellent work** - preserve it
- PDF ingestion works well - just remove web scraping
- Focus on configuration-driven approach
- Web scraping (Wahapedia) is LOW PRIORITY - can be added later

---

**Created**: 2025-10-20
**Last Updated**: 2025-10-20
**Status**: Ready for Development
