#!/bin/bash

# Clear Subagent Contexts - Cleanup command for testing and maintenance

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Navigate to project root (two levels up from .claude/commands/)
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Get the directory for subagent contexts (relative to project root)
CONTEXT_DIR="$PROJECT_ROOT/.claude/aiContext/subAgentContexts"

# Parse arguments
HELP_TEXT="
Clear Subagent Contexts

Usage: $0 [OPTIONS]

OPTIONS:
  -h, --help        Show this help message
  -a, --all         Clear all files (contexts, logs, and tracking files)
  -c, --contexts    Clear only context files (default)
  -l, --logs        Clear only debug logs
  -t, --tracking    Clear only tracking files (.session_mapping, .processing_log)
  -v, --verbose     Verbose output
  --dry-run        Show what would be cleared without actually clearing

EXAMPLES:
  $0                # Clear context files only
  $0 -a            # Clear everything (contexts, logs, tracking)
  $0 -l            # Clear debug logs only
  $0 --dry-run -a  # Preview what would be cleared
"

# Default values
CLEAR_CONTEXTS=true
CLEAR_LOGS=false
CLEAR_TRACKING=false
VERBOSE=false
DRY_RUN=false

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            echo "$HELP_TEXT"
            exit 0
            ;;
        -a|--all)
            CLEAR_CONTEXTS=true
            CLEAR_LOGS=true
            CLEAR_TRACKING=true
            shift
            ;;
        -c|--contexts)
            CLEAR_CONTEXTS=true
            CLEAR_LOGS=false
            CLEAR_TRACKING=false
            shift
            ;;
        -l|--logs)
            CLEAR_CONTEXTS=false
            CLEAR_LOGS=true
            CLEAR_TRACKING=false
            shift
            ;;
        -t|--tracking)
            CLEAR_CONTEXTS=false
            CLEAR_LOGS=false
            CLEAR_TRACKING=true
            shift
            ;;
        -v|--verbose)
            VERBOSE=true
            shift
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        -*)
            echo "Unknown option $1" >&2
            echo "$HELP_TEXT" >&2
            exit 1
            ;;
        *)
            echo "Unexpected argument: $1" >&2
            echo "$HELP_TEXT" >&2
            exit 1
            ;;
    esac
done

# Verbose logging function
log_verbose() {
    if [ "$VERBOSE" = "true" ]; then
        echo "  $1" >&2
    fi
}

echo "🧹 Clear Subagent Contexts" >&2

CLEARED_COUNT=0

# Clear context files
if [ "$CLEAR_CONTEXTS" = "true" ]; then
    if [ -d "$CONTEXT_DIR" ]; then
        CONTEXT_FILES=$(find "$CONTEXT_DIR" -name "*.md" -type f 2>/dev/null || echo "")
        if [ -n "$CONTEXT_FILES" ]; then
            CONTEXT_COUNT=$(echo "$CONTEXT_FILES" | wc -l | xargs)
            log_verbose "Found $CONTEXT_COUNT context file(s)"
            
            if [ "$DRY_RUN" = "true" ]; then
                echo "Would clear $CONTEXT_COUNT context file(s):" >&2
                echo "$CONTEXT_FILES" | sed 's|.*/||' | sed 's/^/  - /' >&2
            else
                echo "$CONTEXT_FILES" | while read -r file; do
                    rm -f "$file"
                    log_verbose "Removed: $(basename "$file")"
                done
                echo "✅ Cleared $CONTEXT_COUNT context file(s)" >&2
                CLEARED_COUNT=$((CLEARED_COUNT + CONTEXT_COUNT))
            fi
        else
            log_verbose "No context files found"
        fi
    else
        log_verbose "Context directory does not exist: $CONTEXT_DIR"
    fi
fi

# Clear debug logs
if [ "$CLEAR_LOGS" = "true" ]; then
    LOG_FILES="/tmp/claude-subagent-hook-debug.log /tmp/claude-hook-test.log"
    LOG_COUNT=0
    
    for log_file in $LOG_FILES; do
        if [ -f "$log_file" ]; then
            LOG_COUNT=$((LOG_COUNT + 1))
            if [ "$DRY_RUN" = "true" ]; then
                echo "Would clear debug log: $(basename "$log_file")" >&2
            else
                rm -f "$log_file"
                log_verbose "Removed: $(basename "$log_file")"
            fi
        fi
    done
    
    if [ $LOG_COUNT -gt 0 ]; then
        if [ "$DRY_RUN" = "false" ]; then
            echo "✅ Cleared $LOG_COUNT debug log(s)" >&2
        fi
        CLEARED_COUNT=$((CLEARED_COUNT + LOG_COUNT))
    else
        log_verbose "No debug logs found"
    fi
fi

# Clear tracking files
if [ "$CLEAR_TRACKING" = "true" ]; then
    TRACKING_FILES=""
    if [ -f "$CONTEXT_DIR/.session_mapping" ]; then
        TRACKING_FILES="$TRACKING_FILES $CONTEXT_DIR/.session_mapping"
    fi
    if [ -f "$CONTEXT_DIR/.processing_log" ]; then
        TRACKING_FILES="$TRACKING_FILES $CONTEXT_DIR/.processing_log"
    fi
    if [ -f "$CONTEXT_DIR/.processed_sidechains" ]; then
        TRACKING_FILES="$TRACKING_FILES $CONTEXT_DIR/.processed_sidechains"
    fi
    if [ -f "$CONTEXT_DIR/.last_processed_sidechain" ]; then
        TRACKING_FILES="$TRACKING_FILES $CONTEXT_DIR/.last_processed_sidechain"
    fi
    if [ -f "$CONTEXT_DIR/.last_processed_tool_result" ]; then
        TRACKING_FILES="$TRACKING_FILES $CONTEXT_DIR/.last_processed_tool_result"
    fi
    if [ -f "$CONTEXT_DIR/.processed_tool_ids" ]; then
        TRACKING_FILES="$TRACKING_FILES $CONTEXT_DIR/.processed_tool_ids"
    fi
    
    if [ -n "$TRACKING_FILES" ]; then
        TRACKING_COUNT=$(echo $TRACKING_FILES | wc -w | xargs)
        if [ "$DRY_RUN" = "true" ]; then
            echo "Would clear $TRACKING_COUNT tracking file(s):" >&2
            echo "$TRACKING_FILES" | tr ' ' '\n' | sed 's|.*/||' | sed 's/^/  - /' >&2
        else
            for file in $TRACKING_FILES; do
                rm -f "$file"
                log_verbose "Removed: $(basename "$file")"
            done
            echo "✅ Cleared $TRACKING_COUNT tracking file(s)" >&2
            CLEARED_COUNT=$((CLEARED_COUNT + TRACKING_COUNT))
        fi
    else
        log_verbose "No tracking files found"
    fi
fi

# Summary
if [ "$DRY_RUN" = "true" ]; then
    echo "🔍 Dry run completed - no files were actually cleared" >&2
else
    if [ $CLEARED_COUNT -gt 0 ]; then
        echo "✨ Cleared $CLEARED_COUNT total file(s)" >&2
    else
        echo "ℹ️ No files to clear" >&2
    fi
fi

exit 0