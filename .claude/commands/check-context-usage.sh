#!/bin/bash

# This script can be called from hooks to check context usage
# It receives the transcript_path as an environment variable from hooks

if [ -z "$TRANSCRIPT_PATH" ]; then
    echo "Error: TRANSCRIPT_PATH not set" >&2
    exit 1
fi

if [ ! -f "$TRANSCRIPT_PATH" ]; then
    echo "Error: Transcript file not found at $TRANSCRIPT_PATH" >&2
    exit 1
fi

# Count approximate tokens (rough estimate: 1 token ≈ 4 characters)
CHAR_COUNT=$(wc -c < "$TRANSCRIPT_PATH")
APPROX_TOKENS=$((CHAR_COUNT / 4))

# Claude Code context window is roughly 200k tokens
# Autocompact typically triggers around 95% (190k tokens)
MAX_TOKENS=200000
AUTOCOMPACT_THRESHOLD=190000

# Calculate percentage
PERCENTAGE=$((APPROX_TOKENS * 100 / MAX_TOKENS))
TOKENS_UNTIL_COMPACT=$((AUTOCOMPACT_THRESHOLD - APPROX_TOKENS))

echo "Context Usage Report:" >&2
echo "  Approximate tokens: $APPROX_TOKENS" >&2
echo "  Context usage: ${PERCENTAGE}%" >&2
echo "  Tokens until autocompact: $TOKENS_UNTIL_COMPACT" >&2

# If we're getting close to autocompact (e.g., 85%), suggest creating summary
if [ $PERCENTAGE -ge 85 ]; then
    echo "" >&2
    echo "⚠️ WARNING: Context usage is high (${PERCENTAGE}%)" >&2
    echo "Consider creating a session summary before autocompact triggers at ~95%" >&2
    
    # If we're very close (90%+), be more urgent
    if [ $PERCENTAGE -ge 90 ]; then
        echo "🚨 URGENT: Autocompact imminent! Create summary NOW." >&2
        # Could trigger summary creation here
        exit 2  # Return error to signal action needed
    fi
fi

exit 0