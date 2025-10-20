#!/bin/bash

# Debug script to search for tool_results in transcript using basic grep
# This bypasses jq parsing to see if the data is actually there

echo "🔍 Debug Transcript Search"
echo "=========================="

# Get transcript path from most recent hook log or command line
TRANSCRIPT_PATH="$1"
if [ -z "$TRANSCRIPT_PATH" ]; then
    # Try to get from debug log
    if [ -f "/tmp/claude-subagent-hook-debug.log" ]; then
        TRANSCRIPT_PATH=$(grep "transcript_path" /tmp/claude-subagent-hook-debug.log | tail -1 | sed 's/.*"transcript_path":"//' | sed 's/".*//')
    fi
fi

if [ -z "$TRANSCRIPT_PATH" ] || [ ! -f "$TRANSCRIPT_PATH" ]; then
    echo "❌ No transcript file found. Provide path as argument."
    exit 1
fi

echo "📄 Transcript: $TRANSCRIPT_PATH"
echo "📊 File size: $(ls -lh "$TRANSCRIPT_PATH" | awk '{print $5}')"
echo "📊 Total lines: $(wc -l < "$TRANSCRIPT_PATH")"
echo ""

# Search for different patterns that might contain tool_results
echo "=== Searching for toolUseResult patterns ==="
echo "Lines containing 'toolUseResult':"
grep -n "toolUseResult" "$TRANSCRIPT_PATH" | tail -10
echo ""

echo "=== Searching for tool_use_id patterns ==="
echo "Lines containing 'tool_use_id':"
grep -n "tool_use_id" "$TRANSCRIPT_PATH" | tail -10
echo ""

echo "=== Searching for Task tool results ==="
echo "Lines containing both 'toolUseResult' and 'Task':"
grep "toolUseResult" "$TRANSCRIPT_PATH" | grep "Task" | tail -5
echo ""

echo "=== Searching for specific content patterns ==="
echo "Lines containing 'Redis' (from our test):"
grep -n "Redis" "$TRANSCRIPT_PATH" | tail -5
echo ""

echo "Lines containing 'MySQL' (from our test):"
grep -n "MySQL" "$TRANSCRIPT_PATH" | tail -5
echo ""

echo "Lines containing 'PostgreSQL' (from earlier test):"
grep -n "PostgreSQL" "$TRANSCRIPT_PATH" | tail -5
echo ""

echo "Lines containing 'Flask' (from earlier test):"
grep -n "Flask" "$TRANSCRIPT_PATH" | tail -5
echo ""

echo "=== Extracting tool_use_ids using different methods ==="

echo ""
echo "Method 1: Using jq (current approach):"
cat "$TRANSCRIPT_PATH" | jq -r '
    select(.type == "user" and .toolUseResult) |
    .message.content[0].tool_use_id
' 2>/dev/null | tail -5

echo ""
echo "Method 2: Using grep and sed to extract tool_use_ids:"
grep '"tool_use_id"' "$TRANSCRIPT_PATH" | sed 's/.*"tool_use_id":"//' | sed 's/".*//' | tail -5

echo ""
echo "Method 3: Looking for toolu_ patterns directly:"
grep -o 'toolu_[a-zA-Z0-9]*' "$TRANSCRIPT_PATH" | sort -u | tail -10

echo ""
echo "=== Checking for recent timestamps ==="
CURRENT_TIME=$(date -u +%Y-%m-%d)
echo "Lines with today's date ($CURRENT_TIME):"
grep "$CURRENT_TIME" "$TRANSCRIPT_PATH" | tail -5

echo ""
echo "=== Last 5 lines of transcript ==="
tail -5 "$TRANSCRIPT_PATH"

echo ""
echo "=== Searching for content that should exist ==="
# Try to find the actual content we're looking for
echo "Searching for 'provide you with a concise overview' (common in our tests):"
grep -c "provide you with a concise overview" "$TRANSCRIPT_PATH"

echo ""
echo "=== Raw toolUseResult entries (last 3) ==="
# Extract complete toolUseResult entries
grep "toolUseResult" "$TRANSCRIPT_PATH" | tail -3 | while IFS= read -r line; do
    echo "---"
    echo "$line" | python -m json.tool 2>/dev/null || echo "$line"
done

echo ""
echo "=== Summary ==="
TOOL_USE_COUNT=$(grep -c '"tool_use_id"' "$TRANSCRIPT_PATH")
TOOL_RESULT_COUNT=$(grep -c 'toolUseResult' "$TRANSCRIPT_PATH")
echo "Total tool_use_id mentions: $TOOL_USE_COUNT"
echo "Total toolUseResult mentions: $TOOL_RESULT_COUNT"
echo "File last modified: $(stat -f "%Sm" -t "%Y-%m-%d %H:%M:%S" "$TRANSCRIPT_PATH" 2>/dev/null || stat -c "%y" "$TRANSCRIPT_PATH" 2>/dev/null)"