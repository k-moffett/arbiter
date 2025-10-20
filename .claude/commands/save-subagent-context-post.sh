#!/bin/bash

# PostToolUse hook for Task tool completion - captures subagent outputs immediately
# This fires after every Task tool completes

DEBUG_LOG="/tmp/claude-subagent-hook-debug.log"
echo "$(TZ=UTC date '+%Y-%m-%d %H:%M:%S UTC'): PostToolUse Hook started (PID: $$)" >> "$DEBUG_LOG"

# Get script directory and project paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
CONTEXT_DIR="$PROJECT_ROOT/.claude/aiContext/subAgentContexts"
mkdir -p "$CONTEXT_DIR"

# Read input
INPUT=$(cat)
echo "$(TZ=UTC date '+%Y-%m-%d %H:%M:%S UTC'): PostToolUse Input: $INPUT" >> "$DEBUG_LOG"

# Parse JSON metadata
if echo "$INPUT" | grep -q '"transcript_path"'; then
    SESSION_ID=$(echo "$INPUT" | jq -r '.session_id')
    TRANSCRIPT_PATH=$(echo "$INPUT" | jq -r '.transcript_path')
    TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // empty')
    TOOL_RESPONSE=$(echo "$INPUT" | jq -r '.tool_response')
    PROCESSED_FILE="$CONTEXT_DIR/.processed_tool_ids"
    
    # Extract tool_use_id by matching content with stored Task descriptions
    TOOL_USE_ID=""
    PENDING_TASKS_FILE="$CONTEXT_DIR/.pending_tasks"
    
    if [ "$TOOL_NAME" = "Task" ]; then
        # Generate a unique temporary ID for this Task completion
        # Since Claude Code doesn't provide the tool_use_id in PostToolUse hook,
        # we'll create a unique identifier based on content and timestamp
        CONTENT_HASH=$(echo "$TOOL_RESPONSE" | jq -r '.content[0].text // .content // ""' 2>/dev/null | head -c 200 | shasum -a 256 | cut -c 1-16)
        TOOL_USE_ID="task_$(date +%s)_${CONTENT_HASH}"
        
        echo "🎯 PostToolUse Generated unique ID for current Task: $TOOL_USE_ID" >> "$DEBUG_LOG"
    fi
    
    echo "🎯 PostToolUse Processing Task tool: $TOOL_USE_ID" >> "$DEBUG_LOG"
    
    # Only process if this is a Task tool and not already processed
    if [ "$TOOL_NAME" = "Task" ] && [ -n "$TOOL_USE_ID" ]; then
        if ! grep -q "^$TOOL_USE_ID$" "$PROCESSED_FILE" 2>/dev/null; then
            echo "✅ PostToolUse Processing new Task result: ${TOOL_USE_ID:0:20}..." >> "$DEBUG_LOG"
            
            # Mark as processed immediately to prevent duplicates
            echo "$TOOL_USE_ID" >> "$PROCESSED_FILE"
            
            # Use tool_response directly from hook input
            CONTENT=""
            if [ -n "$TOOL_RESPONSE" ]; then
                # Extract content from tool_response
                CONTENT=$(echo "$TOOL_RESPONSE" | jq -r '
                    if (.content | type) == "string" then
                        .content
                    elif .content[0].text then
                        .content[0].text
                    else
                        .content | tostring
                    end
                ' 2>/dev/null)
            fi
            
            # Get timestamp from hook input
            ORIGINAL_TIMESTAMP=$(TZ=UTC date '+%Y-%m-%dT%H:%M:%S.000Z')
            
            if [ -n "$CONTENT" ]; then
                
                # Enhanced title extraction - look for the main topic
                TITLE=""
                
                # Strategy 1: Extract technology name from content
                if [ -z "$TITLE" ]; then
                    # First try to extract technology name from opening lines
                    TECH_NAME=""
                    
                    # Look for technology mentions in first 10 lines
                    FIRST_LINES=$(echo "$CONTENT" | head -10)
                    
                    # Extended list of technologies to detect
                    TECH_PATTERN="(GitHub Copilot|DuckDB [0-9.]+|DuckDB|Svelte [0-9]+|Svelte|Vue\.?js [0-9.]+|Vue\.?js|React [0-9]+|React|Next\.js [0-9]+|Next\.js|Angular [0-9]+|Angular|Redis [0-9.]+|Redis|MongoDB [0-9.]+|MongoDB|PostgreSQL [0-9]+|PostgreSQL|TypeScript [0-9.]+|TypeScript|Python [0-9.]+|Python|Rust [0-9.]+|Rust|Go [0-9.]+|Go|Docker [0-9]+|Docker|Kubernetes|Terraform [0-9.]+|Terraform|Elasticsearch [0-9.]+|Elasticsearch|Apache Kafka [0-9.]+|Kafka)"
                    
                    # Try to extract tech name with version first
                    TECH_NAME=$(echo "$FIRST_LINES" | grep -oiE "$TECH_PATTERN" | head -1)
                    
                    # Now try to find the main topic/focus
                    TOPIC=""
                    if echo "$FIRST_LINES" | grep -qi "features"; then
                        if echo "$FIRST_LINES" | grep -qi "latest"; then
                            TOPIC="latest features"
                        elif echo "$FIRST_LINES" | grep -qi "new"; then
                            TOPIC="new features"
                        else
                            TOPIC="features"
                        fi
                    elif echo "$FIRST_LINES" | grep -qi "improvements"; then
                        TOPIC="improvements"
                    fi
                    
                    # Add focus area if mentioned
                    if echo "$FIRST_LINES" | grep -qi "performance"; then
                        TOPIC="$TOPIC - performance"
                    fi
                    if echo "$FIRST_LINES" | grep -qi "AI\|ML\|machine learning"; then
                        TOPIC="$TOPIC and AI"
                    fi
                    if echo "$FIRST_LINES" | grep -qi "developer experience"; then
                        TOPIC="$TOPIC and developer experience"
                    fi
                    
                    # Build the title
                    if [ -n "$TECH_NAME" ] && [ -n "$TOPIC" ]; then
                        TITLE="$TECH_NAME $TOPIC"
                    elif [ -n "$TECH_NAME" ]; then
                        TITLE="$TECH_NAME features and improvements"
                    fi
                fi
                
                # Strategy 2: Fallback to extracting from "top X" pattern
                if [ -z "$TITLE" ]; then
                    TITLE=$(echo "$CONTENT" | head -5 | grep -i "top [0-9]" | head -1 | sed 's/.*\(top [0-9].*\)/\1/' | cut -c 1-70)
                fi
                
                # Strategy 3: Use task description if available
                if [ -z "$TITLE" ] && [ -f "$PENDING_TASKS_FILE" ]; then
                    TASK_DESC=$(grep "^$TOOL_USE_ID|" "$PENDING_TASKS_FILE" 2>/dev/null | cut -d'|' -f2)
                    if [ -n "$TASK_DESC" ]; then
                        TITLE=$(echo "$TASK_DESC" | sed 's/research //' | sed 's/[^a-zA-Z0-9 .-]/ /g' | sed 's/  */ /g' | cut -c 1-80)
                    fi
                fi
                
                # Strategy 4: Fallback to first header if all else fails
                if [ -z "$TITLE" ]; then
                    TITLE=$(echo "$CONTENT" | head -15 | grep -E "^#{1,3} " | head -1 | sed 's/^#* *//' | sed 's/[^a-zA-Z0-9 .-]//g' | cut -c 1-80)
                fi
                
                # Strategy 5: Final fallback
                if [ -z "$TITLE" ]; then
                    TITLE="subagent-output"
                fi
                
                # Create safe filename
                SAFE_TITLE=$(echo "$TITLE" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9.-]/-/g' | sed 's/--*/-/g' | sed 's/^-//;s/-$//')
                
                # Use original timestamp for filename
                FILENAME_TIMESTAMP=$(echo "$ORIGINAL_TIMESTAMP" | sed 's/T/_/; s/\..*Z//; s/:/-/g')
                FILENAME="$CONTEXT_DIR/${FILENAME_TIMESTAMP}_${SAFE_TITLE}.md"
                
                # Create readable timestamp for content
                READABLE_TIMESTAMP=$(echo "$ORIGINAL_TIMESTAMP" | sed 's/T/ /; s/\..*Z/ UTC/')
                
                # Generate file
                cat > "$FILENAME" << EOF
# Subagent Context: $TITLE

**Generated**: $READABLE_TIMESTAMP
**Tool Use ID**: $TOOL_USE_ID
**Session ID**: $SESSION_ID
**Processing Mode**: PostToolUse Hook

## Subagent Output

$CONTENT

---
*Auto-captured via PostToolUse hook at $(TZ=UTC date '+%Y-%m-%d %H:%M:%S UTC')*
EOF
                
                echo "✅ PostToolUse Created $(basename "$FILENAME")" >&2
                echo "$(TZ=UTC date '+%Y-%m-%d %H:%M:%S UTC'): PostToolUse Successfully processed $TOOL_USE_ID" >> "$DEBUG_LOG"
                
                # Remove from pending tasks
                if [ -f "$PENDING_TASKS_FILE" ]; then
                    grep -v "^$TOOL_USE_ID|" "$PENDING_TASKS_FILE" > "$PENDING_TASKS_FILE.tmp" && \
                    mv "$PENDING_TASKS_FILE.tmp" "$PENDING_TASKS_FILE"
                fi
            else
                echo "❌ PostToolUse Failed to extract result for $TOOL_USE_ID" >> "$DEBUG_LOG"
            fi
        else
            echo "ℹ️ PostToolUse Task $TOOL_USE_ID already processed" >> "$DEBUG_LOG"
        fi
    else
        echo "ℹ️ PostToolUse Not a Task tool or missing tool_use_id (tool: $TOOL_NAME, id: $TOOL_USE_ID)" >> "$DEBUG_LOG"
    fi
    
    echo "$(TZ=UTC date '+%Y-%m-%d %H:%M:%S UTC'): PostToolUse Hook completed" >> "$DEBUG_LOG"
fi

exit 0