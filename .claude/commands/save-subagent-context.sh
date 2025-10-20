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
    
    # DEBUG: Show what's actually in the transcript
    echo "🔍 DEBUG: Raw Task tool calls in transcript:" >> "$DEBUG_LOG"
    grep -c '"tool_use".*"Task"' "$TRANSCRIPT_PATH" 2>/dev/null >> "$DEBUG_LOG" || echo "0" >> "$DEBUG_LOG"
    
    echo "🔍 DEBUG: Recent Task tool_use entries:" >> "$DEBUG_LOG" 
    grep -B 2 -A 2 '"tool_use".*"Task"' "$TRANSCRIPT_PATH" 2>/dev/null | tail -10 >> "$DEBUG_LOG"
    
    echo "🔍 DEBUG: Raw toolUseResult entries:" >> "$DEBUG_LOG"
    grep -c '"toolUseResult"' "$TRANSCRIPT_PATH" 2>/dev/null >> "$DEBUG_LOG" || echo "0" >> "$DEBUG_LOG"
    
    echo "🔍 DEBUG: Recent toolUseResult entries:" >> "$DEBUG_LOG"
    grep -B 1 -A 5 '"toolUseResult"' "$TRANSCRIPT_PATH" 2>/dev/null | tail -20 >> "$DEBUG_LOG"
    
    # CRITICAL: Get baseline of Task tool_use_ids currently in transcript
    # Only capture Task results (with nested content structure)
    BASELINE_IDS_FILE="/tmp/claude-baseline-${SESSION_ID}.ids"
    cat "$TRANSCRIPT_PATH" 2>/dev/null | jq -r '
        select(.type == "user" and .toolUseResult) |
        select(.toolUseResult.content != null and (
            (.toolUseResult.content | type) == "string" or
            (.toolUseResult.content[0].text // null) != null
        )) |
        .message.content[0].tool_use_id // empty
    ' | grep -v '^$' > "$BASELINE_IDS_FILE" 2>/dev/null
    
    BASELINE_COUNT=$(wc -l < "$BASELINE_IDS_FILE" 2>/dev/null | tr -d ' ')
    echo "📊 RT Baseline: $BASELINE_COUNT existing tool_results" >> "$DEBUG_LOG"
    
    # Log the last few baseline IDs for debugging
    echo "📝 RT Last 5 baseline tool_use_ids:" >> "$DEBUG_LOG"
    tail -5 "$BASELINE_IDS_FILE" 2>/dev/null | while read -r id; do
        echo "  - $id" >> "$DEBUG_LOG"
    done
    
    # Find the most recent unprocessed result (hook fires AFTER result is written)
    echo "🎯 RT Looking for most recent unprocessed result..." >> "$DEBUG_LOG"
    
    # Get the most recent unprocessed tool_result
    RECENT_UNPROCESSED=$(cat "$TRANSCRIPT_PATH" 2>/dev/null | jq -r '
        select(.type == "user" and .toolUseResult) |
        select(.toolUseResult.content != null and (
            (.toolUseResult.content | type) == "string" or
            (.toolUseResult.content[0].text // null) != null
        )) |
        .message.content[0].tool_use_id // empty
    ' | grep -v '^$' | while read -r id; do
        if ! grep -q "^$id$" "$PROCESSED_FILE" 2>/dev/null; then
            echo "$id"
        fi
    done | tail -1)
    
    if [ -n "$RECENT_UNPROCESSED" ]; then
        TOOL_ID="$RECENT_UNPROCESSED"
        echo "✅ RT Processing most recent unprocessed: ${TOOL_ID:0:20}..." >> "$DEBUG_LOG"
        
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
        else
            echo "❌ RT Failed to extract result for $TOOL_ID" >> "$DEBUG_LOG"
        fi
    fi
    
    # Clean up temp files
    rm -f "$BASELINE_IDS_FILE"
    
    echo "$(TZ=UTC date '+%Y-%m-%d %H:%M:%S UTC'): RT Hook completed" >> "$DEBUG_LOG"
fi

exit 0