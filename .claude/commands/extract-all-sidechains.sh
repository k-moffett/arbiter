#!/bin/bash

# Function to extract and save a specific sidechain
extract_sidechain() {
    local TRANSCRIPT_PATH="$1"
    local START_LINE="$2"
    local END_LINE="$3"
    local SIDECHAIN_NUM="$4"
    
    echo "  📖 Extracting sidechain #$SIDECHAIN_NUM (lines $START_LINE to $END_LINE)" >&2
    
    # Extract messages from this specific sidechain
    if [ -n "$END_LINE" ]; then
        SUBAGENT_OUTPUT=$(sed -n "${START_LINE},${END_LINE}p" "$TRANSCRIPT_PATH" | \
            jq -r 'select(.isSidechain == true and .message.role == "assistant" and .message.content[0].type == "text") | .message.content[0].text' 2>/dev/null | \
            sed '/^$/d')
    else
        # Last sidechain, go to end of file
        SUBAGENT_OUTPUT=$(tail -n +"$START_LINE" "$TRANSCRIPT_PATH" | \
            jq -r 'select(.isSidechain == true and .message.role == "assistant" and .message.content[0].type == "text") | .message.content[0].text' 2>/dev/null | \
            sed '/^$/d')
    fi
    
    if [ -n "$SUBAGENT_OUTPUT" ]; then
        # Extract task description from output
        TASK_DESC=$(echo "$SUBAGENT_OUTPUT" | grep -m 1 "^# " | sed 's/^# //' | sed 's/[^a-zA-Z0-9 -]//g')
        if [ -z "$TASK_DESC" ]; then
            TASK_DESC=$(echo "$SUBAGENT_OUTPUT" | head -5 | grep -v "^I'll\|^Let me" | head -1 | sed 's/[^a-zA-Z0-9 -]//g' | cut -c1-60)
        fi
        TASK_DESC="${TASK_DESC:-sidechain-$SIDECHAIN_NUM}"
        
        # Create safe filename
        SAFE_TASK=$(echo "$TASK_DESC" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9-]/-/g' | sed 's/--*/-/g' | sed 's/^-//;s/-$//' | cut -c1-50)
        
        # Generate filename
        TIMESTAMP=$(date "+%Y-%m-%d_%H:%M:%S")
        FILENAME="$CONTEXT_DIR/${TIMESTAMP}_${SAFE_TASK}_sc${SIDECHAIN_NUM}.md"
        
        # Save the content
        cat > "$FILENAME" << EOF
# Subagent Context: $TASK_DESC

**Generated**: $TIMESTAMP
**Sidechain**: #$SIDECHAIN_NUM

## Task Description
$TASK_DESC

## Subagent Output

$SUBAGENT_OUTPUT

---
*Auto-saved by subagent-stop hook at $(date)*
EOF
        
        echo "  ✅ Saved: $(basename $FILENAME)" >&2
    else
        echo "  ⚠️ No content found in sidechain #$SIDECHAIN_NUM" >&2
    fi
}

# Main extraction logic
# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Navigate to project root (two levels up from .claude/commands/)
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Get the directory for subagent contexts (relative to project root)
CONTEXT_DIR="$PROJECT_ROOT/.claude/aiContext/subAgentContexts"
TRANSCRIPT_PATH="$1"

if [ ! -f "$TRANSCRIPT_PATH" ]; then
    echo "❌ Transcript file not found: $TRANSCRIPT_PATH" >&2
    exit 1
fi

echo "🔍 Finding all sidechains in transcript..." >&2

# Find all sidechain boundaries (false->true transitions)
BOUNDARIES=$(cat "$TRANSCRIPT_PATH" | jq -r '[.isSidechain] | @csv' 2>/dev/null | \
    nl | awk -F'[,\t]' 'BEGIN{prev="false"; count=0} 
    {
        gsub(/"/, "", $2)
        gsub(/[ \t]/, "", $1)
        if(prev == "false" && $2 == "true") {
            count++
            print $1 "|" count
        }
        prev=$2
    } END {print "TOTAL|" count}')

TOTAL_SIDECHAINS=$(echo "$BOUNDARIES" | grep "TOTAL" | cut -d'|' -f2)
echo "📊 Found $TOTAL_SIDECHAINS sidechain(s)" >&2

if [ "$TOTAL_SIDECHAINS" -gt 0 ]; then
    # Process each sidechain
    PREV_START=""
    for boundary in $(echo "$BOUNDARIES" | grep -v "TOTAL"); do
        LINE=$(echo "$boundary" | cut -d'|' -f1)
        NUM=$(echo "$boundary" | cut -d'|' -f2)
        
        if [ -n "$PREV_START" ]; then
            # Process previous sidechain (it ends where this one starts)
            extract_sidechain "$TRANSCRIPT_PATH" "$PREV_START" "$((LINE - 1))" "$((NUM - 1))"
        fi
        
        PREV_START=$LINE
    done
    
    # Process the last sidechain (goes to end of file)
    if [ -n "$PREV_START" ]; then
        extract_sidechain "$TRANSCRIPT_PATH" "$PREV_START" "" "$TOTAL_SIDECHAINS"
    fi
else
    echo "⚠️ No sidechains found in transcript" >&2
fi

echo "✨ Processing complete!" >&2