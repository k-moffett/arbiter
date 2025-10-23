#!/bin/bash
# Clean CLI startup - suppress Docker Compose noise
export COMPOSE_IGNORE_ORPHANS=True

# Clear the npm output lines before starting CLI
printf '\033[3A\033[K\033[K\033[K'

docker compose -f docker-compose.cli.yml run --rm cli 2>/dev/null
