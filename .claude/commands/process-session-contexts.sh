#!/bin/bash

# Process Session Contexts - Batch process all subagent contexts for a session with deduping
# Based on all the features we developed: deduping, enhanced title extraction, batch processing

echo "🔄 Processing Session Subagent Contexts"

# Get script directory and project paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
CONTEXT_DIR="$PROJECT_ROOT/.claude/aiContext/subAgentContexts"
mkdir -p "$CONTEXT_DIR"

# Parse command line arguments
SESSION_ID=""
TRANSCRIPT_PATH=""
VERBOSE=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -s|--session)
            SESSION_ID="$2"
            shift 2
            ;;
        -t|--transcript)
            TRANSCRIPT_PATH="$2"
            shift 2
            ;;
        -v|--verbose)
            VERBOSE=true
            shift
            ;;
        -h|--help)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "OPTIONS:"
            echo "  -s, --session ID        Session ID to process"
            echo "  -t, --transcript PATH   Path to transcript file"
            echo "  -v, --verbose          Verbose output"
            echo "  -h, --help             Show this help"
            echo ""
            echo "If no session specified, uses current session from debug log"
            exit 0
            ;;
        *)
            SESSION_ID="$1"
            shift
            ;;
    esac
done

# Auto-detect session if not specified
if [ -z "$SESSION_ID" ] && [ -z "$TRANSCRIPT_PATH" ]; then
    DEBUG_LOG="/tmp/claude-subagent-hook-debug.log"
    if [ -f "$DEBUG_LOG" ]; then
        # Extract session info from most recent hook entry
        HOOK_INPUT=$(grep "Input:" "$DEBUG_LOG" | tail -1 | sed 's/.*Input: //')
        if [ -n "$HOOK_INPUT" ]; then
            SESSION_ID=$(echo "$HOOK_INPUT" | jq -r '.session_id' 2>/dev/null)
            TRANSCRIPT_PATH=$(echo "$HOOK_INPUT" | jq -r '.transcript_path' 2>/dev/null)
        fi
    fi
fi

# Find transcript if session provided but no transcript
if [ -n "$SESSION_ID" ] && [ -z "$TRANSCRIPT_PATH" ]; then
    TRANSCRIPT_PATH=$(find "$HOME/.claude/projects" -name "${SESSION_ID}.jsonl" -type f | head -1)
fi

# Validate inputs
if [ -z "$SESSION_ID" ] || [ -z "$TRANSCRIPT_PATH" ]; then
    echo "❌ Could not determine session ID or transcript path"
    echo "   Either provide session ID or ensure debug log exists"
    exit 1
fi

if [ ! -f "$TRANSCRIPT_PATH" ]; then
    echo "❌ Transcript file not found: $TRANSCRIPT_PATH"
    exit 1
fi

echo "📄 Processing session: $SESSION_ID"
echo "📄 Transcript: $(basename "$TRANSCRIPT_PATH")"

PROCESSED_FILE="$CONTEXT_DIR/.processed_tool_ids"

# Extract ALL tool_results from transcript
echo "🔍 Extracting tool_results from transcript..."

# Handle both simple string content (Bash, Edit) and Task's nested structure
ALL_RESULTS=$(cat "$TRANSCRIPT_PATH" | jq -c '
    select(.type == "user" and .toolUseResult) |
    select(
        .toolUseResult.content != null and (
            (.toolUseResult.content | type) == "string" or
            (.toolUseResult.content[0].text // null) != null
        )
    ) |
    {
        tool_use_id: .message.content[0].tool_use_id,
        content: (
            if (.toolUseResult.content | type) == "string" then
                .toolUseResult.content
            else
                .toolUseResult.content[0].text
            end
        ),
        timestamp
    }
' 2>/dev/null)

if [ -z "$ALL_RESULTS" ]; then
    echo "ℹ️ No tool_results found in transcript"
    exit 0
fi

TOTAL_RESULTS=$(echo "$ALL_RESULTS" | wc -l | tr -d ' ')
echo "📊 Found $TOTAL_RESULTS total tool_results"

# Process each result
PROCESSED_COUNT=0
SKIPPED_COUNT=0

echo "$ALL_RESULTS" | while IFS= read -r result; do
    if [ -n "$result" ]; then
        TOOL_ID=$(echo "$result" | jq -r '.tool_use_id')
        
        # Check if already processed (deduping)
        if grep -q "^$TOOL_ID$" "$PROCESSED_FILE" 2>/dev/null; then
            SKIPPED_COUNT=$((SKIPPED_COUNT + 1))
            if [ "$VERBOSE" = true ]; then
                echo "⏭️ Skipping already processed: ${TOOL_ID:0:20}..."
            fi
            continue
        fi
        
        echo "🔄 Processing: ${TOOL_ID:0:20}..."
        
        # Mark as processed (deduping)
        echo "$TOOL_ID" >> "$PROCESSED_FILE"
        
        # Extract content
        CONTENT=$(echo "$result" | jq -r '.content')
        
        # Enhanced title extraction - handle multiple header levels and fallbacks
        # Strategy 1: Look for # headers (1-3 levels)
        TITLE=$(echo "$CONTENT" | head -10 | grep -E "^#{1,3} " | head -1 | sed 's/^#* *//' | sed 's/[^a-zA-Z0-9 .-]//g' | head -c 40)
        
        # Strategy 2: Look for markdown-style titles in content
        if [ -z "$TITLE" ]; then
            TITLE=$(echo "$CONTENT" | head -10 | grep -E "^[A-Z][^:]*:" | head -1 | sed 's/:.*//' | sed 's/[^a-zA-Z0-9 .-]//g' | head -c 40)
        fi
        
        # Strategy 3: Look for first meaningful line
        if [ -z "$TITLE" ]; then
            TITLE=$(echo "$CONTENT" | head -5 | grep -v "^$" | grep -v "^I'll" | head -1 | sed 's/[^a-zA-Z0-9 .-]//g' | head -c 40)
        fi
        
        # Strategy 4: Extract from patterns like "# Word Fundamentals"
        if [ -z "$TITLE" ]; then
            TITLE=$(echo "$CONTENT" | grep -i "fundamentals\|overview\|guide\|basics" | head -1 | sed 's/[^a-zA-Z0-9 .-]//g' | head -c 40)
        fi
        
        # Strategy 5: Fallback
        if [ -z "$TITLE" ]; then
            TITLE="subagent-output"
        fi
        
        # Create safe filename from title
        SAFE_TITLE=$(echo "$TITLE" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9.-]/-/g' | sed 's/--*/-/g' | sed 's/^-//;s/-$//')
        
        # Use original timestamp from when content was created
        ORIGINAL_TIMESTAMP=$(echo "$result" | jq -r '.timestamp')
        # Convert ISO timestamp to filename format
        FILENAME_TIMESTAMP=$(echo "$ORIGINAL_TIMESTAMP" | sed 's/T/_/; s/\..*Z//; s/:/-/g')
        FILENAME="$CONTEXT_DIR/${FILENAME_TIMESTAMP}_${SAFE_TITLE}.md"
        
        # Create readable timestamp for file content
        READABLE_TIMESTAMP=$(echo "$ORIGINAL_TIMESTAMP" | sed 's/T/ /; s/\..*Z/ UTC/')
        
        # Generate file content
        cat > "$FILENAME" << EOF
# Subagent Context: $TITLE

**Generated**: $READABLE_TIMESTAMP
**Tool Use ID**: $TOOL_ID
**Session ID**: $SESSION_ID
**Processing Mode**: Batch Session Processing

## Subagent Output

$CONTENT

---
*Batch processed from session at $(TZ=UTC date '+%Y-%m-%d %H:%M:%S UTC')*
EOF
        
        echo "✅ Created $(basename "$FILENAME")"
        PROCESSED_COUNT=$((PROCESSED_COUNT + 1))
        
        if [ "$VERBOSE" = true ]; then
            echo "   Title: $TITLE"
            echo "   Original timestamp: $READABLE_TIMESTAMP"
            echo "   Content length: $(echo "$CONTENT" | wc -c) chars"
        fi
    fi
done

echo ""
echo "📊 Processing Summary:"
echo "  📄 Session: $SESSION_ID"
echo "  📁 Total tool_results: $TOTAL_RESULTS"
echo "  ✅ Processed: $PROCESSED_COUNT new contexts"
echo "  ⏭️ Skipped: $SKIPPED_COUNT already processed"
echo "  📂 Output directory: $CONTEXT_DIR"
echo ""

if [ $PROCESSED_COUNT -gt 0 ]; then
    echo "🎉 Successfully processed $PROCESSED_COUNT new subagent contexts!"
else
    echo "ℹ️ No new contexts to process - all tool_results already processed"
fi