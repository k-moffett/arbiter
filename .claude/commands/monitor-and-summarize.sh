#!/bin/bash

# This script monitors context usage and triggers summary creation when needed
# It can be called from UserPromptSubmit or other hooks

# Check if we have the transcript path
if [ -z "$TRANSCRIPT_PATH" ] && [ -z "$1" ]; then
    echo "Error: No transcript path provided" >&2
    exit 0  # Don't block normal operation
fi

TRANSCRIPT="${TRANSCRIPT_PATH:-$1}"

if [ ! -f "$TRANSCRIPT" ]; then
    exit 0  # Don't block if file doesn't exist
fi

# Count approximate tokens (rough estimate: 1 token ≈ 4 characters)
CHAR_COUNT=$(wc -c < "$TRANSCRIPT" 2>/dev/null || echo "0")
APPROX_TOKENS=$((CHAR_COUNT / 4))

# Claude Code context window is roughly 200k tokens
# Autocompact typically triggers around 95% (190k tokens)
MAX_TOKENS=200000
AUTOCOMPACT_THRESHOLD=190000
WARNING_THRESHOLD=170000  # 85%

# Calculate percentage
PERCENTAGE=$((APPROX_TOKENS * 100 / MAX_TOKENS))
TOKENS_UNTIL_COMPACT=$((AUTOCOMPACT_THRESHOLD - APPROX_TOKENS))

# Only show warnings when approaching threshold
if [ $APPROX_TOKENS -ge $WARNING_THRESHOLD ]; then
    echo "📊 Context Usage: ${PERCENTAGE}% (${APPROX_TOKENS} tokens)" >&2
    echo "   Tokens until autocompact: $TOKENS_UNTIL_COMPACT" >&2
    
    # If we're at 90%+, trigger summary creation
    if [ $PERCENTAGE -ge 90 ]; then
        TIMESTAMP=$(date +"%Y-%m-%d_%H:%M:%S")
        SUMMARY_PATH=".claude/aiContext/compactHistory"
        
        # Create directory if it doesn't exist
        mkdir -p "$SUMMARY_PATH"
        
        echo "" >&2
        echo "🚨 Context at ${PERCENTAGE}% - Autocompact imminent!" >&2
        echo "" >&2
        echo "URGENT: Please perform these steps immediately:" >&2
        echo "" >&2
        echo "1. Create a session summary at $SUMMARY_PATH/${TIMESTAMP}_summary.md with:" >&2
        echo "   - **Task Summary**: What was requested and accomplished" >&2
        echo "   - **Key Insights**: Important discoveries and learnings" >&2
        echo "   - **Technical Details**: Architecture, dependencies, configurations" >&2
        echo "   - **Progress**: Completed items and current state" >&2
        echo "   - **Next Steps**: Pending tasks or recommendations" >&2
        echo "   - **Blockers**: Any issues encountered" >&2
        echo "" >&2
        echo "2. After creating the summary, immediately run: /compact" >&2
        echo "" >&2
        echo "This will preserve important context before the automatic compaction." >&2
        
        # For UserPromptSubmit hook, we can block with exit 2
        if [ "$HOOK_EVENT_NAME" == "UserPromptSubmit" ]; then
            exit 2  # Block the prompt and show message to Claude
        fi
    fi
fi

exit 0