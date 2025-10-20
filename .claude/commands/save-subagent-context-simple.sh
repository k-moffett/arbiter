#!/bin/bash

# Simple version - just capture the latest unprocessed tool_result
DEBUG_LOG="/tmp/claude-subagent-hook-debug.log"
HOOK_START_TIME=$(TZ=UTC date '+%Y-%m-%dT%H:%M:%S.%3NZ')
echo "$(TZ=UTC date '+%Y-%m-%d %H:%M:%S UTC'): SIMPLE hook started (PID: $$)" >> "$DEBUG_LOG"

# Get script directory and project paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
CONTEXT_DIR="$PROJECT_ROOT/.claude/aiContext/subAgentContexts"
mkdir -p "$CONTEXT_DIR"

# Read input
INPUT=$(cat)
echo "$(TZ=UTC date '+%Y-%m-%d %H:%M:%S UTC'): Input: $INPUT" >> "$DEBUG_LOG"

# Parse JSON metadata
if echo "$INPUT" | grep -q '"transcript_path"'; then
    SESSION_ID=$(echo "$INPUT" | jq -r '.session_id')
    TRANSCRIPT_PATH=$(echo "$INPUT" | jq -r '.transcript_path')
    PROCESSED_FILE="$CONTEXT_DIR/.processed_tool_ids"
    
    echo "📍 SIMPLE: Processing session: $SESSION_ID (after $HOOK_START_TIME)" >&2
    
    # Count existing tool_results at hook start (baseline)
    BASELINE_COUNT=$(cat "$TRANSCRIPT_PATH" | jq -c '
        select(.type == "user" and .toolUseResult) |
        select(.toolUseResult.content[0].text)
    ' 2>/dev/null | wc -l | tr -d ' ')
    
    echo "📊 SIMPLE: $BASELINE_COUNT tool_results at hook start" >&2
    
    # Poll until exactly ONE new tool_result appears
    POLL_COUNT=0
    MAX_POLLS=60  # 30 seconds at 0.5s intervals
    LATEST_RESULT=""
    
    while [ $POLL_COUNT -lt $MAX_POLLS ]; do
        # Count current tool_results
        CURRENT_COUNT=$(cat "$TRANSCRIPT_PATH" | jq -c '
            select(.type == "user" and .toolUseResult) |
            select(.toolUseResult.content[0].text)
        ' 2>/dev/null | wc -l | tr -d ' ')
        
        if [ "$CURRENT_COUNT" -gt "$BASELINE_COUNT" ]; then
            echo "🎯 SIMPLE: Detected new tool_result ($CURRENT_COUNT > $BASELINE_COUNT)" >&2
            
            # Get the newest tool_result (last one chronologically)
            LATEST_RESULT=$(cat "$TRANSCRIPT_PATH" | jq -c '
                select(.type == "user" and .toolUseResult) |
                select(.toolUseResult.content[0].text) |
                {
                    tool_use_id: .message.content[0].tool_use_id,
                    content: .toolUseResult.content[0].text,
                    timestamp
                }
            ' 2>/dev/null | tail -1)
            
            if [ -n "$LATEST_RESULT" ]; then
                TOOL_ID=$(echo "$LATEST_RESULT" | jq -r '.tool_use_id')
                # Check if this is truly new (not already processed)
                if ! grep -q "^$TOOL_ID$" "$PROCESSED_FILE" 2>/dev/null; then
                    echo "✅ SIMPLE: Found new unprocessed tool_result: ${TOOL_ID:0:20}..." >&2
                    break
                else
                    echo "⏳ SIMPLE: Latest result already processed, continuing to poll..." >&2
                    LATEST_RESULT=""
                fi
            fi
        fi
        
        sleep 0.5
        POLL_COUNT=$((POLL_COUNT + 1))
    done
    
    if [ -n "$LATEST_RESULT" ]; then
        TOOL_USE_ID=$(echo "$LATEST_RESULT" | jq -r '.tool_use_id')
        
        echo "🔍 SIMPLE: Processing tool_use_id: ${TOOL_USE_ID:0:20}..." >&2
        
        # Check if already processed
        if grep -q "^$TOOL_USE_ID$" "$PROCESSED_FILE" 2>/dev/null; then
            echo "ℹ️ Already processed: ${TOOL_USE_ID:0:20}..." >&2
        else
            # Mark as processed
            echo "$TOOL_USE_ID" >> "$PROCESSED_FILE"
            
            # Extract content
            CONTENT=$(echo "$LATEST_RESULT" | jq -r '.content')
            
            # Simple title extraction - handle multiple header levels
            TITLE=$(echo "$CONTENT" | head -10 | grep -E "^#{1,3} " | head -1 | sed 's/^#* *//' | sed 's/[^a-zA-Z0-9 .-]//g' | head -c 40 || echo "subagent-output")
            SAFE_TITLE=$(echo "$TITLE" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9.-]/-/g' | sed 's/--*/-/g' | sed 's/^-//;s/-$//')
            
            # Create file
            TIMESTAMP=$(date "+%Y-%m-%d_%H:%M:%S")
            FILENAME="$CONTEXT_DIR/${TIMESTAMP}_${SAFE_TITLE}.md"
            
            cat > "$FILENAME" << EOF
# Subagent Context: $TITLE

**Generated**: $TIMESTAMP
**Tool Use ID**: $TOOL_USE_ID
**Session ID**: $SESSION_ID

## Subagent Output

$CONTENT

---
*Auto-saved by simple hook at $(TZ=UTC date '+%Y-%m-%d %H:%M:%S UTC')*
EOF
            
            echo "✅ SIMPLE: Created $(basename $FILENAME)" >&2
            echo "$(TZ=UTC date '+%Y-%m-%d %H:%M:%S UTC'): SIMPLE hook completed successfully" >> "$DEBUG_LOG"
        fi
    else
        echo "⚠️ No new tool_results found after polling ($POLL_COUNT attempts)" >&2
        WAIT_TIME=$((POLL_COUNT / 2))
        echo "🕒 Waited ${WAIT_TIME}s for new results" >&2
    fi
fi

exit 0