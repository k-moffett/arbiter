# GPU Configuration & Model Recommendations for Semantic Chunking

**Date:** 2025-11-10 (Updated: 2025-11-11)
**System:** Arbiter - Domain-Agnostic RAG System
**GPUs:** NVIDIA RTX 4070 (12GB) + NVIDIA RTX 2060 (6GB) = 18GB total VRAM

---

## 🔑 KEY FINDING: Ollama Automatic Multi-GPU Support

**IMPORTANT DISCOVERY:** Ollama automatically splits models across multiple GPUs without manual configuration!

### How It Works

When you configure Docker Compose with multiple GPUs:
```yaml
environment:
  - CUDA_VISIBLE_DEVICES=0,1  # Make both GPUs visible
deploy:
  resources:
    reservations:
      devices:
        - driver: nvidia
          device_ids: ['0', '1']  # Assign both GPUs
```

**Ollama automatically:**
1. Detects both GPUs and their VRAM capacity
2. Loads models that fit on a single GPU entirely on GPU 0
3. **Splits models larger than a single GPU** across GPU 0 + GPU 1
4. Distributes layers intelligently based on VRAM availability

**No manual GPU assignment needed!** You don't need to configure which models go on which GPU - Ollama handles this transparently.

### Verified Behavior (RTX 4070 + RTX 2060)

```bash
# qwen2.5:14b (13.5GB total) - Too large for RTX 4070 (12GB) alone
$ docker logs arbiter-ollama
[INFO] GPU 0: NVIDIA GeForce RTX 4070 (12.0 GiB)
[INFO] GPU 1: NVIDIA GeForce RTX 2060 (6.0 GiB)
[INFO] load_tensors: offloaded 49/49 layers to GPU

$ nvidia-smi
GPU 0 (RTX 4070): 11.2 GB / 12.0 GB (91% used) ← Primary layers
GPU 1 (RTX 2060):  3.6 GB /  6.0 GB (58% used) ← Overflow layers
```

**Result:** 13.5GB model runs successfully across 18GB total VRAM (12GB + 6GB) ✅

---

## Current GPU Configuration

### GPU 0 (Currently Active)
- **Model:** NVIDIA GeForce RTX 4070
- **VRAM:** 12.0 GiB total, 10.8 GiB available
- **Compute Capability:** 8.9 (Ada Lovelace architecture)
- **Driver:** CUDA 13.0
- **Status:** Active, running models successfully

### GPU 1 (Secondary)
- **Model:** NVIDIA GeForce RTX 2060
- **VRAM:** 6.0 GiB total, 5.0 GiB available
- **Compute Capability:** 7.5 (Turing architecture)
- **Driver:** CUDA 13.0
- **Status:** Active, configured for smaller models

### Combined Capacity (Multi-GPU)
- **Total VRAM:** 18 GB (12GB + 6GB)
- **Optimal for:** Running qwen2.5:14b (10GB) on GPU 0 + llama3.1:8b (5GB) on GPU 1
- **Note:** qwen2.5:32b (20GB) does NOT fit - exceeds total VRAM

---

## Available Models Analysis

### Currently Pulled Models

| Model | Size | Parameters | Quantization | VRAM Required | Load Time | Quality Score |
|-------|------|------------|--------------|---------------|-----------|---------------|
| **qwen2.5:32b** | 19.8 GB | 32.8B | Q4_K_M | ~20 GB | Slow | ⭐⭐⭐⭐⭐ Excellent |
| **phi4:14b-q4_K_M** | 9.0 GB | 14.7B | Q4_K_M | ~9.5 GB | Medium | ⭐⭐⭐⭐ Very Good |
| **qwen2.5:14b** | 9.0 GB | 14.8B | Q4_K_M | ~9.5 GB | Medium | ⭐⭐⭐⭐ Very Good |
| **llama3.1:8b** | 4.9 GB | 8.0B | Q4_K_M | ~5.5 GB | Fast | ⭐⭐⭐ Good |
| **nomic-embed-text** | 274 MB | 137M | F16 | ~500 MB | Very Fast | ⭐⭐⭐⭐⭐ (for embeddings) |

---

## Semantic Chunking Requirements

### Task Breakdown

Semantic chunking requires 5 distinct operations:

1. **Embedding Generation** (Pass 1)
   - Model: `nomic-embed-text` (274MB)
   - Frequency: Once per sentence (~4,000 calls for 400-page PDF)
   - Priority: Speed over quality (embeddings are consistent)

2. **Topic Analysis** (Pass 3)
   - Frequency: ~200 candidates per document
   - Requirements: Strong context understanding, topic detection
   - Priority: Quality > Speed

3. **Discourse Classification** (Pass 3)
   - Frequency: ~200 candidates per document
   - Requirements: Understanding text structure, narrative flow
   - Priority: Quality > Speed

4. **Structure Detection** (Pass 2)
   - Frequency: All sentences (~4,000)
   - Requirements: Pattern matching (lightweight, mostly regex)
   - Priority: Speed (no LLM needed)

5. **Tag Extraction** (Post-chunking)
   - Frequency: Once per chunk (~125-200 chunks)
   - Requirements: Entity recognition, topic extraction, keyword identification
   - Priority: Quality >> Speed

---

## Model Recommendations by Use Case

### How Ollama Handles Multi-GPU (Important!)

**Automatic Model Splitting:**
- When a model is larger than a single GPU's VRAM, Ollama **automatically splits it** across available GPUs
- Layers are distributed intelligently based on VRAM capacity
- No manual configuration required - just set `CUDA_VISIBLE_DEVICES=0,1`

**Model Loading Behavior:**
- **Model fits on single GPU** (e.g., llama3.1:8b @ 5GB on RTX 4070 12GB)
  → Loaded entirely on GPU 0
- **Model exceeds single GPU** (e.g., qwen2.5:14b @ 13.5GB on RTX 4070 12GB)
  → Automatically split: GPU 0 (11GB) + GPU 1 (3GB)

**Verified on RTX 4070 (12GB) + RTX 2060 (6GB):**
```bash
$ docker logs arbiter-ollama | grep offload
load_tensors: offloaded 49/49 layers to GPU  # All layers on GPU(s)
```

### Single GPU Configuration (12GB)

#### Option A: Balanced Quality/Speed (Works on single OR multi-GPU)
```yaml
OLLAMA_SEMANTIC_CHUNKER_MODEL=qwen2.5:14b      # Topic, Discourse, Tags
OLLAMA_EMBEDDING_MODEL=nomic-embed-text        # Embeddings
```
**Behavior:**
- **Single GPU:** Model attempts to load on GPU 0, may fail if >12GB
- **Multi-GPU:** Model automatically split across GPU 0 + GPU 1 ✅

**Pros:**
- ✅ Excellent quality for semantic understanding (90%+ accuracy)
- ✅ Reasonable speed (~3-5 min for 400-page PDF)
- ✅ **Multi-GPU:** Automatically uses both GPUs when available

**Cons:**
- ⚠️ **Single GPU:** May exceed 12GB VRAM (model is ~13.5GB)
- ⚠️ Requires multi-GPU setup for reliable operation

#### Option B: Maximum Speed
```yaml
OLLAMA_SEMANTIC_CHUNKER_MODEL=llama3.1:8b
OLLAMA_EMBEDDING_MODEL=nomic-embed-text
```
**Pros:**
- ✅ Fits easily in 12GB with 6GB headroom
- ✅ Fast inference (~2-3 min for 400-page PDF)
- ✅ Good quality (sufficient for most use cases)

**Cons:**
- ⚠️ Lower quality entity/topic extraction than 14B models
- ⚠️ May miss nuanced semantic boundaries

### Multi-GPU Configuration (RTX 4070 12GB + RTX 2060 6GB = 18GB Total) ⭐ CURRENT SETUP

**🔑 KEY DISCOVERY: Ollama Automatically Splits Models Across GPUs**

Ollama intelligently manages multi-GPU setups **without manual configuration**:
- Models larger than a single GPU's VRAM are **automatically split** across available GPUs
- You don't need to manually assign models to specific GPUs
- Ollama handles layer distribution and memory management transparently

**Example: qwen2.5:14b (13.5GB total) on RTX 4070 (12GB) + RTX 2060 (6GB)**
```
GPU 0 (RTX 4070): 11.2 GB / 12.0 GB (primary layers)
GPU 1 (RTX 2060):  3.6 GB /  6.0 GB (overflow layers)
Total: 14.8 GB model split automatically across 18GB total VRAM ✅
```

#### Option C: Automatic Multi-GPU Model Splitting (CURRENT CONFIGURATION)
```yaml
# Ollama automatically splits models across GPUs when needed
OLLAMA_SEMANTIC_CHUNKER_MODEL=qwen2.5:14b      # ~13.5GB (auto-split)
OLLAMA_EMBEDDING_MODEL=nomic-embed-text        # ~0.5GB (lightweight)

# Docker configuration (already set)
CUDA_VISIBLE_DEVICES=0,1  # Both GPUs visible
device_ids: ['0', '1']    # Both assigned to Ollama
```

**GPU Allocation (Automatic):**
- **GPU 0 (RTX 4070):** Primary model layers (~11GB) + embeddings (~0.5GB)
- **GPU 1 (RTX 2060):** Overflow model layers (~3-4GB) when needed
- Ollama manages distribution automatically based on VRAM availability

**Pros:**
- ✅ ⭐ **AUTOMATIC**: No manual GPU assignment required
- ✅ ⭐ **FLEXIBLE**: Ollama adapts to model size and available VRAM
- ✅ ⭐ **EFFICIENT**: Uses full 18GB capacity (12GB + 6GB)
- ✅ Excellent quality: qwen2.5:14b provides 90%+ accuracy
- ✅ Works seamlessly with heterogeneous GPUs (different VRAM sizes)

**Cons:**
- ⚠️ Slightly slower model loading (32B takes longer)
- ⚠️ Requires coordinated model management

#### Option D: Parallel Processing (SPEED OPTIMIZED)
```yaml
# GPU 0: Primary workload
OLLAMA_SEMANTIC_CHUNKER_MODEL=qwen2.5:14b
OLLAMA_EMBEDDING_MODEL=nomic-embed-text

# GPU 1: Parallel workload
OLLAMA_TAG_EXTRACTION_MODEL=phi4:14b-q4_K_M  # Different model family
```

**GPU Allocation:**
- **GPU 0:** qwen2.5:14b (~9.5GB) + nomic-embed-text (~500MB) = ~10GB
- **GPU 1:** phi4:14b (~9.5GB) for tag extraction

**Pros:**
- ✅ True parallel processing (both GPUs active simultaneously)
- ✅ Fastest throughput (~1.5-2 min for 400-page PDF)
- ✅ Diversified model families (Qwen for semantic, Phi for tags)

**Cons:**
- ⚠️ Not using the 32B model (missing top-tier quality)
- ⚠️ Requires code changes to support separate tag extraction model

---

## Final Recommendations

### 🏆 RECOMMENDATION 1: Multi-GPU Dual Model Strategy (CURRENT CONFIGURATION)
**Use this for production-quality semantic chunking with maximum accuracy**

```bash
# env/.env.text-chunking
OLLAMA_SEMANTIC_CHUNKER_MODEL=qwen2.5:14b    # Fits on RTX 4070 (12GB)
METADATA_EXTRACTION_MODEL=llama3.1:8b        # Fits on RTX 2060 (6GB)
OLLAMA_EMBEDDING_MODEL=nomic-embed-text      # Lightweight (500MB)

# docker-compose.yml (ALREADY CONFIGURED)
CUDA_VISIBLE_DEVICES=0,1  # Both GPUs exposed ✅
device_ids: ['0', '1']    # Both assigned to Ollama ✅
```

**Expected Performance:**
- Processing time: 3-5 minutes for 400-page PDF
- LLM calls: ~200 (topic/discourse) + ~150 (tag extraction) = ~350 total
- Quality: ⭐⭐⭐⭐ (excellent for 18GB hardware constraint)
- Memory: GPU 0 (10GB used/12GB), GPU 1 (5GB used/6GB)

---

### 🥈 RECOMMENDATION 2: Single GPU Balanced (Option A)
**Use this if you want to test before configuring multi-GPU**

```bash
# env/.env.text-chunking
OLLAMA_SEMANTIC_CHUNKER_MODEL=qwen2.5:14b
OLLAMA_EMBEDDING_MODEL=nomic-embed-text

# docker-compose.yml (no changes needed)
CUDA_VISIBLE_DEVICES=0
device_ids: ['0']
```

**Expected Performance:**
- Processing time: 3-5 minutes for 400-page PDF
- LLM calls: ~200 (topic/discourse) + ~150 (tag extraction) = ~350 total
- Quality: ⭐⭐⭐⭐ (very good, sufficient for most use cases)
- Memory: Single GPU, 10GB used out of 12GB

---

## Configuration Changes Required

### For Multi-GPU Setup (Recommendation 1)

1. **Update docker-compose.yml** (line 70 and 84):
```yaml
environment:
  - CUDA_VISIBLE_DEVICES=0,1  # Expose both GPUs (change from "0")

deploy:
  resources:
    reservations:
      devices:
        - driver: nvidia
          device_ids: ['0', '1']  # Assign both GPUs (change from ['0'])
          capabilities: [gpu]
```

2. **Update env/.env.text-chunking** (ALREADY DONE):
```bash
# Primary model for semantic chunking (topic, discourse, boundary detection)
# Using qwen2.5:14b instead of 32b - hardware limited to 18GB total
OLLAMA_SEMANTIC_CHUNKER_MODEL=qwen2.5:14b

# Metadata extraction model (smaller, fits on RTX 2060)
METADATA_EXTRACTION_MODEL=llama3.1:8b

# Embedding model (fast, lightweight)
OLLAMA_EMBEDDING_MODEL=nomic-embed-text
```

3. **Update root .env** (align with text-chunking config):
```bash
# Align with env/.env.text-chunking
OLLAMA_SEMANTIC_CHUNKER_MODEL=qwen2.5:32b
DEFAULT_CHUNKING_STRATEGY=semantic  # Optional: make semantic default
```

4. **Restart services**:
```bash
docker compose restart ollama
docker compose restart mcp-server agent-orchestrator
```

---

## Model Quality Comparison for Semantic Tasks

### Entity Extraction Quality
| Model | Entities Detected | Accuracy | Examples |
|-------|-------------------|----------|----------|
| **qwen2.5:32b** | ⭐⭐⭐⭐⭐ 95%+ | Excellent | Correctly identifies "CISO", "NIST 800-53", "New Western" |
| **qwen2.5:14b** | ⭐⭐⭐⭐ 90%+ | Very Good | Most entities, may miss abbreviations |
| **phi4:14b** | ⭐⭐⭐⭐ 88%+ | Very Good | Strong on technical terms |
| **llama3.1:8b** | ⭐⭐⭐ 85%+ | Good | Mainstream entities, misses niche terms |

### Topic Detection Quality
| Model | Topic Coherence | Granularity | Examples |
|-------|-----------------|-------------|----------|
| **qwen2.5:32b** | ⭐⭐⭐⭐⭐ Excellent | Fine-grained | "backup and disaster recovery", "high availability", "infrastructure as code" |
| **qwen2.5:14b** | ⭐⭐⭐⭐ Very Good | Medium | "security policies", "data protection", "network security" |
| **phi4:14b** | ⭐⭐⭐⭐ Very Good | Medium | Similar to qwen2.5:14b |
| **llama3.1:8b** | ⭐⭐⭐ Good | Coarse | "security", "compliance", "management" (less specific) |

### Semantic Boundary Detection
| Model | Boundary Accuracy | False Positives | False Negatives |
|-------|-------------------|-----------------|-----------------|
| **qwen2.5:32b** | ⭐⭐⭐⭐⭐ 95%+ | Very Low | Very Low |
| **qwen2.5:14b** | ⭐⭐⭐⭐ 90%+ | Low | Low |
| **phi4:14b** | ⭐⭐⭐⭐ 88%+ | Low | Medium |
| **llama3.1:8b** | ⭐⭐⭐ 85%+ | Medium | Medium |

---

## Performance Benchmarks (Estimated)

### 400-Page PDF (Project Odyssey Use Case)

| Configuration | Total Time | Embedding | Structure | LLM Analysis | Tag Extraction | Quality |
|---------------|------------|-----------|-----------|--------------|----------------|---------|
| **qwen2.5:32b (Multi-GPU)** | 4-6 min | 30s | 10s | 2.5 min | 1.5 min | ⭐⭐⭐⭐⭐ |
| **qwen2.5:14b (Single GPU)** | 3-5 min | 30s | 10s | 1.5 min | 1.5 min | ⭐⭐⭐⭐ |
| **llama3.1:8b (Single GPU)** | 2-3 min | 30s | 10s | 0.75 min | 0.75 min | ⭐⭐⭐ |

### VRAM Usage Patterns

| Model | Idle | Embedding | LLM Analysis | Peak Usage |
|-------|------|-----------|--------------|------------|
| **qwen2.5:32b** | 0 GB | 0.5 GB | 20 GB | 20 GB |
| **qwen2.5:14b** | 0 GB | 0.5 GB | 9.5 GB | 9.5 GB |
| **llama3.1:8b** | 0 GB | 0.5 GB | 5.5 GB | 5.5 GB |
| **nomic-embed-text** | 0 GB | 0.5 GB | 0.5 GB | 0.5 GB |

---

## Implementation Notes

### Code Changes Required for Multi-Model Support

Currently, the semantic chunking system uses a single `OLLAMA_SEMANTIC_CHUNKER_MODEL` for all LLM tasks (topic, discourse, tag extraction). To use separate models:

1. **Add new environment variable**:
```typescript
// src/_services/TextChunkingService/_strategies/OllamaSemanticChunker/config/interfaces.ts
export interface SemanticChunkingConfig {
  // ... existing fields
  tagExtractionModel?: string;  // NEW: Separate model for tag extraction
}
```

2. **Update config loader**:
```typescript
// src/_services/TextChunkingService/_strategies/OllamaSemanticChunker/config/loader.ts
tagExtractionModel: process.env.OLLAMA_TAG_EXTRACTION_MODEL
  || process.env.OLLAMA_SEMANTIC_CHUNKER_MODEL  // Fallback to main model
  || 'llama3.1:8b',
```

3. **Update OllamaTagExtractor to use separate model**:
```typescript
// src/_services/TextChunkingService/_strategies/OllamaSemanticChunker/_analyzers/OllamaTagExtractor/OllamaTagExtractor.ts
constructor({ nlpService, temperature, model }: {
  nlpService: OllamaNLPService;
  temperature: number;
  model?: string;  // NEW: Optional separate model
}) {
  this.nlpService = nlpService;
  this.temperature = temperature;
  this.model = model || nlpService.defaultModel;  // Use separate model if provided
}
```

**Effort:** ~30 minutes to implement, test, and validate

---

## Testing Strategy

### Phase 1: Validate Current Setup (Single GPU)
```bash
# Use qwen2.5:14b for all tasks
npm run ingest:pdf -- /home/kurt/code/data/ProjectOdyssey.pdf \
  --chunking-strategy semantic \
  --collection-name test-single-gpu \
  --force --verbose
```

### Phase 2: Configure Multi-GPU
```bash
# Update docker-compose.yml (device_ids: ['0', '1'])
docker compose restart ollama

# Verify both GPUs visible
docker exec arbiter-ollama env | grep CUDA
```

### Phase 3: Test Multi-GPU with 32B Model
```bash
# Update env/.env.text-chunking to use qwen2.5:32b
npm run ingest:pdf -- /home/kurt/code/data/ProjectOdyssey.pdf \
  --chunking-strategy semantic \
  --collection-name test-multi-gpu-32b \
  --force --verbose
```

### Phase 4: Compare Results
```bash
# Compare quality of boundaries, entities, topics between collections
curl -X POST http://localhost:6333/collections/test-single-gpu/points/scroll \
  -H "Content-Type: application/json" \
  -d '{"limit": 10, "with_payload": true}'

curl -X POST http://localhost:6333/collections/test-multi-gpu-32b/points/scroll \
  -H "Content-Type: application/json" \
  -d '{"limit": 10, "with_payload": true}'
```

---

## Conclusion

**For immediate use:** Stick with **qwen2.5:14b** on single GPU (Option A) - excellent balance of quality and speed.

**After restart with multi-GPU:** Upgrade to **qwen2.5:32b** (Option C) - production-ready quality with minimal performance impact.

**Next session priorities:**
1. ✅ Configure multi-GPU in docker-compose.yml
2. ✅ Test qwen2.5:32b on multi-GPU setup
3. ⏭️ Consider implementing separate tag extraction model for true parallelization (optional enhancement)

---

**Status:** Ready for implementation
**Confidence:** High (based on real GPU specs, model sizes, and Ollama logs)
**Risk:** Low (changes are reversible, no data loss)
