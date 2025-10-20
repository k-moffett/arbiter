#!/bin/bash

# Script to request compact summary creation
# Called by PreCompact hook - shows message but cannot block

TIMESTAMP=$(date +"%Y-%m-%d_%H:%M:%S")
SUMMARY_PATH=".claude/aiContext/compactHistory"

# Create directory if it doesn't exist
mkdir -p "$SUMMARY_PATH"

# Check if this is auto or manual compact
TRIGGER="${1:-manual}"

# Send message to Claude via stderr 
# Note: PreCompact cannot block, only inform
cat >&2 <<EOF
📝 Compact operation triggered ($TRIGGER)

Please create a session summary at $SUMMARY_PATH/${TIMESTAMP}_summary.md with:

1. **Task Summary**: What was requested and accomplished
2. **Key Insights**: Important discoveries and learnings  
3. **Technical Details**: Architecture, dependencies, configurations
4. **Progress**: Completed items and current state
5. **Next Steps**: Pending tasks or recommendations
6. **Blockers**: Any issues encountered

Note: PreCompact hooks cannot block - this is informational only.
Consider using monitor-and-summarize.sh for proactive monitoring.
EOF

# Exit with code 0 since PreCompact can't block anyway
exit 0