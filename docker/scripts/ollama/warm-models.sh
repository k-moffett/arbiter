#!/bin/bash
# Ollama Model Warming Script
# Pre-loads models into memory to reduce first-request latency
# Runs after ollama-init completes model downloads

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
OLLAMA_HOST="${OLLAMA_HOST:-ollama:11434}"
MAX_RETRIES=30
RETRY_INTERVAL=2

echo -e "${BLUE}🔥 Ollama Model Warming Script${NC}"
echo -e "${BLUE}================================${NC}"
echo ""

# Function to wait for Ollama to be ready
wait_for_ollama() {
    local attempt=1
    echo -n "⏳ Waiting for Ollama to be ready... "

    while [ $attempt -le $MAX_RETRIES ]; do
        if curl -sf "http://${OLLAMA_HOST}/api/tags" > /dev/null 2>&1; then
            echo -e "${GREEN}✓${NC}"
            return 0
        fi
        sleep $RETRY_INTERVAL
        attempt=$((attempt + 1))
    done

    echo -e "${RED}✗ Failed${NC}"
    echo -e "${RED}Error: Ollama did not become ready within $((MAX_RETRIES * RETRY_INTERVAL)) seconds${NC}"
    return 1
}

# Function to warm a model
warm_model() {
    local model=$1
    local prompt=$2

    echo -n "🔥 Warming model: ${YELLOW}${model}${NC}... "

    # Send a simple request to load the model into memory
    local response=$(curl -sf "http://${OLLAMA_HOST}/api/generate" \
        -H "Content-Type: application/json" \
        -d "{
            \"model\": \"${model}\",
            \"prompt\": \"${prompt}\",
            \"stream\": false,
            \"options\": {
                \"num_predict\": 1
            }
        }" 2>&1)

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Loaded${NC}"
        return 0
    else
        echo -e "${RED}✗ Failed${NC}"
        echo -e "${RED}Error response: ${response}${NC}"
        return 1
    fi
}

# Function to warm embedding model
warm_embedding_model() {
    local model=$1

    echo -n "🔥 Warming embedding model: ${YELLOW}${model}${NC}... "

    # Send a simple embedding request
    local response=$(curl -sf "http://${OLLAMA_HOST}/api/embeddings" \
        -H "Content-Type: application/json" \
        -d "{
            \"model\": \"${model}\",
            \"prompt\": \"test\"
        }" 2>&1)

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Loaded${NC}"
        return 0
    else
        echo -e "${RED}✗ Failed${NC}"
        echo -e "${RED}Error response: ${response}${NC}"
        return 1
    fi
}

# Main warming sequence
main() {
    # Wait for Ollama to be ready
    wait_for_ollama || exit 1

    echo ""
    echo -e "${BLUE}Starting model warming sequence...${NC}"
    echo ""

    # Track failures
    local failed=0

    # Warm embedding model (most frequently used)
    warm_embedding_model "nomic-embed-text" || failed=$((failed + 1))

    # Warm primary LLM (from env or default to qwen2.5:14b)
    LLM_MODEL="${LLM_MODEL:-qwen2.5:14b}"
    warm_model "$LLM_MODEL" "Hi" || failed=$((failed + 1))

    # Warm fallback LLM models
    warm_model "llama3.1:8b" "Hi" || failed=$((failed + 1))

    # Warm fallback reasoning model
    warm_model "phi4:14b-q4_K_M" "Test" || failed=$((failed + 1))

    echo ""

    if [ $failed -eq 0 ]; then
        echo -e "${GREEN}✓ All models warmed successfully!${NC}"
        echo -e "${GREEN}✓ Models are now loaded in memory and ready for requests${NC}"
        exit 0
    else
        echo -e "${YELLOW}⚠ Warning: ${failed} model(s) failed to warm${NC}"
        echo -e "${YELLOW}⚠ First requests to these models may have higher latency${NC}"
        # Still exit 0 to not block startup - warming is optional optimization
        exit 0
    fi
}

# Run main function
main
