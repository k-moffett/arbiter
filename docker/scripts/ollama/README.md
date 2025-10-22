# Ollama Scripts

This directory contains utility scripts for Ollama model management.

## Automatic Initialization

Models are automatically pulled by the `ollama-init` service in `docker-compose.services.yml`.

## Model Warming (Performance Optimization)

The `warm-models.sh` script pre-loads models into GPU memory after initialization to reduce first-request latency.

**How it works:**
1. Waits for Ollama to be ready
2. Sends minimal requests to each model to trigger loading
3. Models remain in memory until Ollama restarts or memory pressure evicts them

**Benefits:**
- Reduces first-request latency from 10-20s to <1s
- Ensures predictable response times for CLI users
- No impact on subsequent requests

**Usage:**
```bash
# Automatic (runs with docker:services:up by default)
npm run docker:services:up

# Manual trigger
npm run docker:warm

# Skip warming (faster startup)
npm run docker:services:up:no-warm

# Direct script execution
docker compose -f docker-compose.services.yml --profile warm up -d ollama-warm
```

**Configuration:**
- Set `OLLAMA_WARM_MODELS=false` in `.env` to disable
- Models warmed: nomic-embed-text, llama3.1:8b, phi4:14b-q4_K_M
- Startup time increase: ~30-60 seconds (one-time)

## Manual Model Management

```bash
# Pull additional models
docker exec arbiter-ollama ollama pull <model-name>

# List loaded models
docker exec arbiter-ollama ollama list

# Remove a model
docker exec arbiter-ollama ollama rm <model-name>

# Test embedding generation
docker exec arbiter-ollama ollama run nomic-embed-text "test embedding"
```

## Models Used

- **nomic-embed-text**: 768-dimensional embeddings (0.5GB VRAM)
- **llama3.1:8b**: Validation and fallback LLM (5-6GB VRAM)
- **phi4:14b-q4_K_M**: Fallback reasoning model (8-10GB VRAM)
