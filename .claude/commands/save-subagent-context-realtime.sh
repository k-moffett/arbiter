#!/bin/bash

# Real-time individual subagent context extraction with better correlation
# This version uses a clean-slate approach and smart detection

DEBUG_LOG="/tmp/claude-subagent-hook-debug.log"
echo "$(TZ=UTC date '+%Y-%m-%d %H:%M:%S UTC'): Hook started (PID: $$)" >> "$DEBUG_LOG"

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
    
    echo "🔍 Processing session: $SESSION_ID" >&2
    
    # CRITICAL: Get baseline of ALL tool_use_ids currently in transcript
    # This ensures we only process truly NEW results
    BASELINE_IDS_FILE="/tmp/claude-baseline-${SESSION_ID}.ids"
    cat "$TRANSCRIPT_PATH" 2>/dev/null | jq -r '
        select(.type == "user" and .toolUseResult) |
        select(.toolUseResult.content[0].text) |
        .message.content[0].tool_use_id
    ' > "$BASELINE_IDS_FILE" 2>/dev/null
    
    BASELINE_COUNT=$(wc -l < "$BASELINE_IDS_FILE" 2>/dev/null | tr -d ' ')
    echo "📊 Baseline: $BASELINE_COUNT existing tool_results" >> "$DEBUG_LOG"
    
    # Log the last few baseline IDs for debugging
    echo "📝 Last 5 baseline tool_use_ids:" >> "$DEBUG_LOG"
    tail -5 "$BASELINE_IDS_FILE" 2>/dev/null | while read -r id; do
        echo "  - $id" >> "$DEBUG_LOG"
    done
    
    # Poll for a NEW tool_result that wasn't in baseline
    POLL_COUNT=0
    MAX_POLLS=20  # 10 seconds at 0.5s intervals
    FOUND_NEW=false
    
    while [ $POLL_COUNT -lt $MAX_POLLS ]; do
        # Get current tool_results
        CURRENT_RESULTS=$(cat "$TRANSCRIPT_PATH" 2>/dev/null | jq -c '
            select(.type == "user" and .toolUseResult) |
            select(.toolUseResult.content[0].text) |
            {
                tool_use_id: .message.content[0].tool_use_id,
                content: .toolUseResult.content[0].text,
                timestamp
            }
        ' | tail -5)  # Only check last 5 for efficiency
        
        # Log all candidates being checked
        echo "📋 Poll $POLL_COUNT - Checking last 5 tool_results:" >> "$DEBUG_LOG"
        echo "$CURRENT_RESULTS" | while IFS= read -r result; do
            if [ -n "$result" ]; then
                TOOL_ID=$(echo "$result" | jq -r '.tool_use_id')
                TIMESTAMP=$(echo "$result" | jq -r '.timestamp')
                # Extract first few words of content for identification
                CONTENT_PREVIEW=$(echo "$result" | jq -r '.content' | head -1 | cut -c1-50)
                echo "  - ${TOOL_ID:0:20}... @ $TIMESTAMP: $CONTENT_PREVIEW..." >> "$DEBUG_LOG"
            fi
        done
        
        # Check each result to see if it's new (not in baseline)
        while IFS= read -r result; do
            if [ -n "$result" ]; then
                TOOL_ID=$(echo "$result" | jq -r '.tool_use_id')
                
                # Log checking status
                IN_BASELINE="NO"
                if grep -q "^$TOOL_ID$" "$BASELINE_IDS_FILE" 2>/dev/null; then
                    IN_BASELINE="YES"
                fi
                
                ALREADY_PROCESSED="NO"
                if grep -q "^$TOOL_ID$" "$PROCESSED_FILE" 2>/dev/null; then
                    ALREADY_PROCESSED="YES"
                fi
                
                echo "  Checking ${TOOL_ID:0:20}... - In baseline: $IN_BASELINE, Already processed: $ALREADY_PROCESSED" >> "$DEBUG_LOG"
                
                # Check if this ID was in baseline
                if [ "$IN_BASELINE" = "NO" ]; then
                    # Also check if not already processed
                    if [ "$ALREADY_PROCESSED" = "NO" ]; then
                        echo "🎯 Found NEW tool_result: ${TOOL_ID:0:20}..." >> "$DEBUG_LOG"
                        FOUND_NEW=true
                        
                        # Mark as processed immediately to prevent duplicates
                        echo "$TOOL_ID" >> "$PROCESSED_FILE"
                        
                        # Extract content
                        CONTENT=$(echo "$result" | jq -r '.content')
                        ORIGINAL_TIMESTAMP=$(echo "$result" | jq -r '.timestamp')
                        
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
                        
                        echo "✅ Created $(basename "$FILENAME")" >&2
                        echo "$(TZ=UTC date '+%Y-%m-%d %H:%M:%S UTC'): Successfully processed $TOOL_ID" >> "$DEBUG_LOG"
                        break 2  # Exit both loops
                    fi
                fi
            fi
        done <<< "$CURRENT_RESULTS"
        
        if [ "$FOUND_NEW" = false ]; then
            sleep 0.5
            POLL_COUNT=$((POLL_COUNT + 1))
        fi
    done
    
    # Clean up baseline file
    rm -f "$BASELINE_IDS_FILE"
    
    if [ "$FOUND_NEW" = false ]; then
        echo "⏱️ No new tool_result found after ${POLL_COUNT} attempts" >> "$DEBUG_LOG"
        echo "ℹ️ No new tool_result detected within timeout" >&2
    fi
    
    echo "$(TZ=UTC date '+%Y-%m-%d %H:%M:%S UTC'): Hook completed" >> "$DEBUG_LOG"
fi

exit 0