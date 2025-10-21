#!/bin/bash
# Health Check Script for Arbiter Services
# Verifies all services are healthy before allowing CLI access

set -e

echo "🔍 Checking Arbiter services health..."
echo ""

# Colors for output
GREEN='\033[0.32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

check_service() {
    local service_name=$1
    local container_name=$2
    local max_attempts=30
    local attempt=1

    echo -n "⏳ Waiting for $service_name... "

    while [ $attempt -le $max_attempts ]; do
        if docker inspect --format='{{.State.Health.Status}}' "$container_name" 2>/dev/null | grep -q "healthy"; then
            echo -e "${GREEN}✓ Ready${NC}"
            return 0
        fi
        sleep 2
        attempt=$((attempt + 1))
    done

    echo -e "${RED}✗ Failed${NC}"
    return 1
}

# Check all required services
FAILED=0

check_service "Qdrant Vector DB" "arbiter-qdrant" || FAILED=1
check_service "Ollama (GPU)" "arbiter-ollama" || FAILED=1
check_service "MCP Server" "arbiter-mcp-server" || FAILED=1

echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🚀 All services ready!${NC}"
    echo ""
    echo "You can now use the CLI:"
    echo "  docker compose -f docker-compose.cli.yml run --rm cli"
    echo ""
    echo "Or use the npm script:"
    echo "  npm run docker:cli"
    exit 0
else
    echo -e "${RED}❌ Some services failed to start${NC}"
    echo ""
    echo "Check logs with:"
    echo "  docker compose -f docker-compose.services.yml logs"
    echo "  docker compose -f docker-compose.mcp.yml logs"
    exit 1
fi
