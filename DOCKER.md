# Docker Setup & Usage Guide

## Overview

Arbiter uses a containerized microservices architecture optimized for RTX 4070 12GB VRAM. This guide covers setup, usage, and troubleshooting.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                Docker Network: arbiter-network               │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Agents (Future)          Supporting Services                │
│  ┌──────────────┐         ┌──────────┐  ┌────────┐          │
│  │ Orchestrator │────────▶│  vLLM    │  │ Qdrant │          │
│  │ QueryAgent   │         │  :8000   │  │ :6333  │          │
│  │ Validation   │         │ (GPU)    │  │Vector  │          │
│  └──────────────┘         └────┬─────┘  │   DB   │          │
│                                │         └────────┘          │
│                           ┌────▼─────┐                       │
│                           │ Ollama   │                       │
│                           │ :11434   │                       │
│                           │ (GPU)    │                       │
│                           └──────────┘                       │
│                                                               │
│                     RTX 4070 12GB VRAM                        │
│                (CUDA_VISIBLE_DEVICES=0)                      │
└─────────────────────────────────────────────────────────────┘
```

## Prerequisites

### Required Software

1. **Docker** (v24.0+) & **Docker Compose** (v2.0+)
   ```bash
   docker --version
   docker compose version
   ```

2. **NVIDIA Container Toolkit** (for GPU access)
   ```bash
   # Install NVIDIA Container Toolkit
   distribution=$(. /etc/os-release;echo $ID$VERSION_ID)
   curl -s -L https://nvidia.github.io/nvidia-docker/gpgkey | sudo apt-key add -
   curl -s -L https://nvidia.github.io/nvidia-docker/$distribution/nvidia-docker.list | \
     sudo tee /etc/os-transfer-list.d/nvidia-docker.list

   sudo apt-get update && sudo apt-get install -y nvidia-container-toolkit
   sudo systemctl restart docker
   ```

3. **Verify GPU Access**
   ```bash
   docker run --rm --gpus all nvidia/cuda:12.0-base nvidia-smi
   ```

### Hardware Requirements

- **GPU**: NVIDIA RTX 4070 (12GB VRAM)
- **RAM**: 16GB minimum, 64GB recommended
- **Storage**: 50GB free space (for models)
- **CPU**: Intel i7 or equivalent

---

## Quick Start

### 1. Start Supporting Services

```bash
# Start all services (Qdrant, Ollama, vLLM)
npm run docker:services:up

# This will:
# - Pull required Docker images (~10GB first time)
# - Start Qdrant vector database
# - Start Ollama (embeddings + fallback LLM)
# - Start vLLM (primary LLM with Phi-4 14B)
# - Initialize Ollama models (nomic-embed-text, llama3.1:8b, phi4:14b)
```

**Expected startup time**:
- First run: 5-10 minutes (image download + model pull)
- Subsequent runs: 30-60 seconds (warm start)

### 2. Verify Services

```bash
# Check service health
npm run docker:services:ps

# Expected output:
# NAME               STATUS         PORTS
# arbiter-qdrant     Up (healthy)   0.0.0.0:6333->6333/tcp
# arbiter-vllm       Up (healthy)   0.0.0.0:8000->8000/tcp
# arbiter-ollama     Up (healthy)   0.0.0.0:11434->11434/tcp
```

### 3. Test Services

```bash
# Test Qdrant
curl http://localhost:6333/collections

# Test Ollama
curl http://localhost:11434/api/version

# Test vLLM
curl http://localhost:8000/health
```

---

## Service Details

### Qdrant Vector Database

**Purpose**: Semantic search and vector storage
**Port**: 6333 (REST), 6334 (gRPC)
**Volume**: `arbiter-qdrant-storage` (persistent)
**Memory**: 512MB-1GB

**Management**:
```bash
# View collections
curl http://localhost:6333/collections

# Create collection
curl -X PUT http://localhost:6333/collections/test \
  -H 'Content-Type: application/json' \
  -d '{"vectors": {"size": 768, "distance": "Cosine"}}'

# Health check
curl http://localhost:6333/health
```

### Ollama (Embeddings + Fallback)

**Purpose**: Local embedding generation, fallback LLM
**Port**: 11434
**Volume**: `arbiter-ollama-models` (~10GB)
**GPU**: RTX 4070 (shared with vLLM)
**Memory**: 4-8GB

**Models Installed**:
- `nomic-embed-text`: 768-dim embeddings (0.5GB VRAM)
- `llama3.1:8b`: Validation LLM (5-6GB VRAM)
- `phi4:14b-q4_K_M`: Fallback reasoning (8-10GB VRAM)

**Management**:
```bash
# List models
docker exec arbiter-ollama ollama list

# Pull additional model
docker exec arbiter-ollama ollama pull <model-name>

# Generate embedding test
curl http://localhost:11434/api/embeddings \
  -d '{"model": "nomic-embed-text", "prompt": "test"}'

# Chat completion test
curl http://localhost:11434/api/chat \
  -d '{"model": "llama3.1:8b", "messages": [{"role": "user", "content": "Hello"}]}'
```

### vLLM (Primary LLM Server)

**Purpose**: Primary reasoning LLM (Phi-4 14B)
**Port**: 8000
**Volume**: `arbiter-vllm-models` (~10GB)
**GPU**: RTX 4070 (75% utilization)
**Memory**: 8-12GB

**Configuration**:
- Model: `microsoft/phi-4` (14B parameters)
- Quantization: AWQ (4-bit)
- Max context: 8192 tokens
- GPU memory: 75% utilization (~9GB VRAM)

**Management**:
```bash
# Health check
curl http://localhost:8000/health

# List models
curl http://localhost:8000/v1/models

# Chat completion test
curl http://localhost:8000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "microsoft/phi-4",
    "messages": [{"role": "user", "content": "What is TypeScript?"}],
    "temperature": 0.7,
    "max_tokens": 100
  }'
```

---

## Common Operations

### Start/Stop Services

```bash
# Start all services
npm run docker:services:up

# Stop all services (preserves data)
npm run docker:services:down

# Restart services
npm run docker:services:restart

# View logs
npm run docker:services:logs

# View specific service logs
docker compose -f docker-compose.services.yml logs -f qdrant
docker compose -f docker-compose.services.yml logs -f ollama
docker compose -f docker-compose.services.yml logs -f vllm
```

### Monitor Resources

```bash
# Docker stats (CPU, memory, GPU)
docker stats

# Check GPU usage
nvidia-smi

# Watch GPU usage in real-time
watch -n 1 nvidia-smi

# Container health
npm run docker:services:ps
```

### Clean Up

```bash
# Stop and remove containers (keeps volumes)
npm run docker:services:down

# Remove everything including volumes (DANGER: loses data)
npm run docker:clean

# Remove ALL Docker resources (DANGER: affects all projects)
npm run docker:clean:all
```

---

## Troubleshooting

### GPU Not Detected

**Symptom**: Services start but GPU not used (slow inference)

**Solution**:
```bash
# 1. Verify NVIDIA drivers
nvidia-smi

# 2. Verify Docker has GPU access
docker run --rm --gpus all nvidia/cuda:12.0-base nvidia-smi

# 3. Restart Docker daemon
sudo systemctl restart docker

# 4. Check container GPU access
docker exec arbiter-vllm nvidia-smi
```

### Out of Memory (OOM) Errors

**Symptom**: `vllm` or `ollama` containers crash with OOM

**Solution**:
```bash
# 1. Check VRAM usage
nvidia-smi

# 2. Run models sequentially (not simultaneously)
#    Edit docker-compose.services.yml:
#    - Reduce vLLM gpu-memory-utilization to 0.5
#    - Reduce Ollama memory limit to 4G

# 3. Use smaller models
docker exec arbiter-ollama ollama pull phi4:7b  # Instead of 14B
```

### Services Won't Start

**Symptom**: Containers fail health checks

**Solution**:
```bash
# 1. Check logs
npm run docker:services:logs

# 2. Verify ports not in use
lsof -i :6333  # Qdrant
lsof -i :8000  # vLLM
lsof -i :11434 # Ollama

# 3. Remove and rebuild
npm run docker:services:down
docker compose -f docker-compose.services.yml build --no-cache
npm run docker:services:up
```

### Model Download Fails

**Symptom**: `ollama-init` exits with error

**Solution**:
```bash
# 1. Manual model pull
docker exec arbiter-ollama ollama pull nomic-embed-text

# 2. Check disk space
df -h

# 3. Clear Docker cache
docker system prune -a

# 4. Restart ollama-init
docker compose -f docker-compose.services.yml up ollama-init
```

### Slow Inference

**Symptom**: LLM responses take >30 seconds

**Solution**:
```bash
# 1. Verify GPU usage
docker exec arbiter-vllm nvidia-smi

# 2. Check vLLM is using GPU
curl http://localhost:8000/health
# Should show "gpu": true

# 3. Increase GPU memory utilization
#    Edit docker-compose.services.yml:
#    --gpu-memory-utilization 0.85  # Instead of 0.75

# 4. Enable Flash Attention (if supported)
#    Already enabled in docker-compose.services.yml
```

---

## Development Workflow

### Typical Development Flow

```bash
# 1. Start supporting services
npm run docker:services:up

# 2. Develop locally with hot reload
npm run dev

# 3. Test with Docker containers
npm run docker:dev

# 4. Run tests in containers
npm run docker:test:unit
npm run docker:test:integration

# 5. Clean up when done
npm run docker:services:down
```

### Debug Mode

```bash
# Start Qdrant Web UI
docker compose -f docker-compose.services.yml --profile ui up qdrant-web-ui

# Access UI at http://localhost:3000
```

---

## Performance Optimization

### RTX 4070 12GB VRAM Budget

| Service | VRAM | Model | Notes |
|---------|------|-------|-------|
| vLLM (Phi-4 14B) | 9-10GB | Primary reasoning | 75% GPU utilization |
| Ollama (embeddings) | 0.5GB | nomic-embed-text | Always loaded |
| Ollama (chat) | 5-6GB | llama3.1:8b | Load on demand |
| **Total** | **10-11GB** | | **Leaves 1-2GB headroom** |

**Strategy**:
- vLLM primary (always running): ~10GB
- Ollama embeddings (always running): ~0.5GB
- Ollama chat models (sequential, not parallel): loaded on-demand

### Optimizations Applied

1. **vLLM**: AWQ quantization (4-bit) reduces VRAM from 28GB → 10GB
2. **Ollama**: Q4_K_M quantization for Phi-4
3. **Flash Attention**: Enabled for 20-30% speed boost
4. **PagedAttention**: vLLM's memory optimization (automatic)
5. **Model Caching**: Volumes persist models between restarts

---

## Next Steps

After Phase 0 (Docker foundation) is complete:

1. **Phase 1**: LLM Provider implementations (connect to vLLM/Ollama)
2. **Phase 2**: Vector RAG (connect to Qdrant)
3. **Phase 3**: HyDE integration
4. **Phase 4**: Query decomposition
5. **Phase 5**: Tool registry
6. **Phase 6**: Validation layer
7. **Phase 7**: Agent orchestration
8. **Phase 8**: CLI testing interface

---

## Reference

- [Docker Compose Specification](https://docs.docker.com/compose/compose-file/)
- [NVIDIA Container Toolkit](https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/install-guide.html)
- [vLLM Documentation](https://docs.vllm.ai/)
- [Ollama Documentation](https://ollama.ai/docs)
- [Qdrant Documentation](https://qdrant.tech/documentation/)

---

**Last Updated**: 2025-10-20
**Arbiter Version**: 2.0 (Containerized Architecture)
