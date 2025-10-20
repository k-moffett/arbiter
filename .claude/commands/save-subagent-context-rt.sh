#!/bin/bash

# Real-time individual subagent context extraction with proper JSON handling
# This version handles both regular tool results and Task's nested structure

DEBUG_LOG="/tmp/claude-subagent-hook-debug.log"
echo "$(TZ=UTC date '+%Y-%m-%d %H:%M:%S UTC'): RT Hook started (PID: $$)" >> "$DEBUG_LOG"

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
    
    echo "🔍 RT Processing session: $SESSION_ID" >&2
    
    # CRITICAL: Get baseline of ALL tool_use_ids currently in transcript
    # Handle both simple string content and Task's nested structure
    BASELINE_IDS_FILE="/tmp/claude-baseline-${SESSION_ID}.ids"
    cat "$TRANSCRIPT_PATH" 2>/dev/null | jq -r '
        select(.type == "user" and .toolUseResult) |
        select(.toolUseResult.content != null) |
        .message.content[0].tool_use_id // empty
    ' | grep -v '^$' > "$BASELINE_IDS_FILE" 2>/dev/null
    
    BASELINE_COUNT=$(wc -l < "$BASELINE_IDS_FILE" 2>/dev/null | tr -d ' ')
    echo "📊 RT Baseline: $BASELINE_COUNT existing tool_results" >> "$DEBUG_LOG"
    
    # Log the last few baseline IDs for debugging
    echo "📝 RT Last 5 baseline tool_use_ids:" >> "$DEBUG_LOG"
    tail -5 "$BASELINE_IDS_FILE" 2>/dev/null | while read -r id; do
        echo "  - $id" >> "$DEBUG_LOG"
    done
    
    # Poll for a NEW tool_result that wasn't in baseline
    POLL_COUNT=0
    MAX_POLLS=60  # 30 seconds at 0.5s intervals
    FOUND_NEW=false
    
    while [ $POLL_COUNT -lt $MAX_POLLS ]; do
        # Get ALL current tool_use_ids
        CURRENT_IDS_FILE="/tmp/claude-current-${SESSION_ID}.ids"
        cat "$TRANSCRIPT_PATH" 2>/dev/null | jq -r '
            select(.type == "user" and .toolUseResult) |
            select(.toolUseResult.content != null) |
            .message.content[0].tool_use_id // empty
        ' | grep -v '^$' > "$CURRENT_IDS_FILE" 2>/dev/null
        
        # Find new IDs that weren't in baseline
        NEW_IDS=$(comm -13 <(sort "$BASELINE_IDS_FILE" 2>/dev/null) <(sort "$CURRENT_IDS_FILE" 2>/dev/null))
        
        if [ -n "$NEW_IDS" ]; then
            echo "🎯 RT Found new tool_use_ids:" >> "$DEBUG_LOG"
            echo "$NEW_IDS" | head -5 >> "$DEBUG_LOG"
            
            # Process the first new unprocessed ID
            for TOOL_ID in $NEW_IDS; do
                # Check if not already processed
                if ! grep -q "^$TOOL_ID$" "$PROCESSED_FILE" 2>/dev/null; then
                    echo "✅ RT Processing new tool_result: ${TOOL_ID:0:20}..." >> "$DEBUG_LOG"
                    FOUND_NEW=true
                    
                    # Mark as processed immediately to prevent duplicates
                    echo "$TOOL_ID" >> "$PROCESSED_FILE"
                    
                    # Extract the full result for this tool_id
                    RESULT=$(cat "$TRANSCRIPT_PATH" 2>/dev/null | jq -c --arg id "$TOOL_ID" '
                        select(.type == "user" and .toolUseResult) |
                        select(.message.content[0].tool_use_id == $id) |
                        {
                            tool_use_id: .message.content[0].tool_use_id,
                            content: (
                                if (.toolUseResult.content | type) == "string" then
                                    .toolUseResult.content
                                elif .toolUseResult.content[0].text then
                                    .toolUseResult.content[0].text
                                else
                                    .toolUseResult.content | tostring
                                end
                            ),
                            timestamp
                        }
                    ' | head -1)
                    
                    if [ -n "$RESULT" ]; then
                        # Extract content
                        CONTENT=$(echo "$RESULT" | jq -r '.content')
                        ORIGINAL_TIMESTAMP=$(echo "$RESULT" | jq -r '.timestamp')
                        
                        # Enhanced title extraction with multiple strategies
                        TITLE=""
                        
                        # Strategy 1: Look for # headers (1-3 levels)
                        if [ -z "$TITLE" ]; then
                            TITLE=$(echo "$CONTENT" | head -15 | grep -E "^#{1,3} " | head -1 | sed 's/^#* *//' | sed 's/[^a-zA-Z0-9 .-]//g' | head -c 50)
                        fi
                        
                        # Strategy 2: Look for bold headers
                        if [ -z "$TITLE" ]; then
                            TITLE=$(echo "$CONTENT" | head -10 | grep -E "^\*\*[A-Z].*\*\*" | head -1 | sed 's/\*//g' | sed 's/[^a-zA-Z0-9 .-]//g' | head -c 50)
                        fi
                        
                        # Strategy 3: First non-empty, non-generic line
                        if [ -z "$TITLE" ]; then
                            TITLE=$(echo "$CONTENT" | head -10 | grep -v "^$" | grep -v "^I'll" | grep -v "^Based on" | grep -v "^Here" | head -1 | sed 's/[^a-zA-Z0-9 .-]//g' | head -c 50)
                        fi
                        
                        # Strategy 4: Fallback
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
**Tool Use ID**: $TOOL_ID
**Session ID**: $SESSION_ID
**Processing Mode**: Real-time Individual

## Subagent Output

$CONTENT

---
*Auto-captured in real-time at $(TZ=UTC date '+%Y-%m-%d %H:%M:%S UTC')*
EOF
                        
                        echo "✅ RT Created $(basename "$FILENAME")" >&2
                        echo "$(TZ=UTC date '+%Y-%m-%d %H:%M:%S UTC'): RT Successfully processed $TOOL_ID" >> "$DEBUG_LOG"
                        break 2  # Exit both loops
                    fi
                fi
            done
        fi
        
        if [ "$FOUND_NEW" = false ]; then
            if [ $((POLL_COUNT % 10)) -eq 0 ]; then
                echo "⏳ RT Poll $POLL_COUNT: Waiting for new tool_results..." >> "$DEBUG_LOG"
            fi
            sleep 0.5
            POLL_COUNT=$((POLL_COUNT + 1))
        fi
    done
    
    # Clean up temp files
    rm -f "$BASELINE_IDS_FILE" "$CURRENT_IDS_FILE"
    
    if [ "$FOUND_NEW" = false ]; then
        echo "⏱️ RT No new tool_result found after ${POLL_COUNT} attempts ($(echo "scale=1; $POLL_COUNT / 2" | bc)s)" >> "$DEBUG_LOG"
        echo "ℹ️ RT No new tool_result detected within timeout" >&2
    fi
    
    echo "$(TZ=UTC date '+%Y-%m-%d %H:%M:%S UTC'): RT Hook completed" >> "$DEBUG_LOG"
fi

exit 0