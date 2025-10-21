# Ollama Scripts

This directory contains utility scripts for Ollama model management.

## Automatic Initialization

Models are automatically pulled by the `ollama-init` service in `docker-compose.services.yml`.

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
