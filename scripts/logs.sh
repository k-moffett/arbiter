#!/bin/bash
#
# Log Viewing Helper Script
# Provides easy commands to filter and view Arbiter and Ollama logs
#

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print usage
usage() {
  echo "Usage: $0 {arbiter|ollama|all|json} [container-name]"
  echo ""
  echo "Commands:"
  echo "  arbiter [container]  - Show only Arbiter application logs (filtered by [ARBITER] prefix)"
  echo "  ollama              - Show only Ollama service logs"
  echo "  all                 - Show all logs from all containers"
  echo "  json                - Show Arbiter logs in JSON format (use with jq for filtering)"
  echo ""
  echo "Examples:"
  echo "  $0 arbiter                    - Show Arbiter logs from MCP server"
  echo "  $0 arbiter arbiter-cli        - Show Arbiter logs from CLI"
  echo "  $0 ollama                     - Show Ollama logs"
  echo "  $0 json | jq 'select(.level == \"ERROR\")'  - Show only ERROR logs"
  exit 1
}

# Function to view Arbiter logs (filtered)
view_arbiter_logs() {
  local container=${1:-arbiter-mcp-server}
  echo -e "${GREEN}Showing Arbiter logs from: $container${NC}"
  echo -e "${YELLOW}Filter: [ARBITER] prefix${NC}"
  echo ""
  docker logs -f "$container" 2>&1 | grep --line-buffered "\[ARBITER\]"
}

# Function to view Ollama logs
view_ollama_logs() {
  echo -e "${BLUE}Showing Ollama logs${NC}"
  echo ""
  docker logs -f arbiter-ollama
}

# Function to view all logs
view_all_logs() {
  echo -e "${GREEN}Showing all logs from all containers${NC}"
  echo ""
  docker-compose -f docker-compose.services.yml \
                 -f docker-compose.mcp.yml \
                 -f docker-compose.cli.yml \
                 logs -f
}

# Function to view JSON logs (for parsing with jq)
view_json_logs() {
  local container=${1:-arbiter-mcp-server}
  echo -e "${GREEN}Showing JSON logs from: $container${NC}"
  echo -e "${YELLOW}Pipe to jq for filtering, e.g.: | jq 'select(.level == \"ERROR\")'${NC}"
  echo ""
  docker logs -f "$container" 2>&1 | grep --line-buffered "^{\"timestamp\""
}

# Main script logic
case "${1:-}" in
  arbiter)
    view_arbiter_logs "$2"
    ;;
  ollama)
    view_ollama_logs
    ;;
  all)
    view_all_logs
    ;;
  json)
    view_json_logs "$2"
    ;;
  *)
    usage
    ;;
esac
