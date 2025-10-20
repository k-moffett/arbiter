#!/bin/bash

# Historical Subagent Context Extractor
# Extracts subagent contexts from historical sessions or time periods

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Navigate to project root (two levels up from .claude/commands/)
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Get the directory for subagent contexts (relative to project root)
CONTEXT_DIR="$PROJECT_ROOT/.claude/aiContext/subAgentContexts"

# Ensure directory exists
mkdir -p "$CONTEXT_DIR"

# Parse command line arguments
HELP_TEXT="
Historical Subagent Context Extractor

Usage: $0 [OPTIONS] [SESSION_ID]

OPTIONS:
  -h, --help              Show this help message
  -a, --all-sessions      Extract from all sessions in mapping file
  -d, --days DAYS         Extract from last N days (default: 7)
  -s, --since DATE        Extract since specific date (YYYY-MM-DD)
  -u, --until DATE        Extract until specific date (YYYY-MM-DD)
  -o, --output-dir DIR    Output directory (default: current context dir)
  -v, --verbose           Verbose output
  --dry-run              Show what would be extracted without actually extracting

EXAMPLES:
  $0                                    # Extract from all sessions in last 7 days
  $0 -a                                # Extract from all sessions
  $0 abc123-session-id                 # Extract from specific session
  $0 -d 30                            # Extract from last 30 days
  $0 -s 2025-08-01 -u 2025-08-15     # Extract from specific date range
  $0 --dry-run -a                     # Preview what would be extracted
"

# Default values
ALL_SESSIONS=false
DAYS=""
SINCE_DATE=""
UNTIL_DATE=""
OUTPUT_DIR="$CONTEXT_DIR"
VERBOSE=false
DRY_RUN=false
TARGET_SESSION=""

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            echo "$HELP_TEXT"
            exit 0
            ;;
        -a|--all-sessions)
            ALL_SESSIONS=true
            shift
            ;;
        -d|--days)
            DAYS="$2"
            shift 2
            ;;
        -s|--since)
            SINCE_DATE="$2"
            shift 2
            ;;
        -u|--until)
            UNTIL_DATE="$2"
            shift 2
            ;;
        -o|--output-dir)
            OUTPUT_DIR="$2"
            shift 2
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
            if [ -z "$TARGET_SESSION" ]; then
                TARGET_SESSION="$1"
            else
                echo "Multiple session IDs not supported: $1" >&2
                exit 1
            fi
            shift
            ;;
    esac
done

# Validation
if [ -n "$TARGET_SESSION" ] && [ "$ALL_SESSIONS" = "true" ]; then
    echo "Error: Cannot specify both session ID and --all-sessions" >&2
    exit 1
fi

# Set default to 7 days if no other filters specified
if [ -z "$TARGET_SESSION" ] && [ "$ALL_SESSIONS" = "false" ] && [ -z "$DAYS" ] && [ -z "$SINCE_DATE" ]; then
    DAYS=7
fi

# Verbose logging function
log_verbose() {
    if [ "$VERBOSE" = "true" ]; then
        echo "  $1" >&2
    fi
}

echo "🕰️ Historical Subagent Context Extractor" >&2

# Read session mapping file
MAPPING_FILE="$CONTEXT_DIR/.session_mapping"
if [ ! -f "$MAPPING_FILE" ]; then
    echo "❌ No session mapping file found at: $MAPPING_FILE" >&2
    echo "   Run subagent contexts first to create session history" >&2
    exit 1
fi

# Calculate date filters
CURRENT_TIME=$(date +%s)
if [ -n "$DAYS" ]; then
    CUTOFF_TIME=$((CURRENT_TIME - (DAYS * 24 * 60 * 60)))
    echo "📅 Extracting from last $DAYS days" >&2
elif [ -n "$SINCE_DATE" ]; then
    SINCE_EPOCH=$(date -j -f "%Y-%m-%d" "$SINCE_DATE" +%s 2>/dev/null || echo "0")
    if [ "$SINCE_EPOCH" -eq "0" ]; then
        echo "❌ Invalid since date format: $SINCE_DATE (use YYYY-MM-DD)" >&2
        exit 1
    fi
    CUTOFF_TIME="$SINCE_EPOCH"
    echo "📅 Extracting since: $SINCE_DATE" >&2
fi

if [ -n "$UNTIL_DATE" ]; then
    UNTIL_EPOCH=$(date -j -f "%Y-%m-%d" "$UNTIL_DATE" +%s 2>/dev/null || echo "$CURRENT_TIME")
    if [ "$UNTIL_EPOCH" -eq "$CURRENT_TIME" ] && [ -n "$UNTIL_DATE" ]; then
        echo "❌ Invalid until date format: $UNTIL_DATE (use YYYY-MM-DD)" >&2
        exit 1
    fi
    echo "📅 Extracting until: $UNTIL_DATE" >&2
fi

# Process sessions
TOTAL_SESSIONS=0
TOTAL_CONTEXTS=0
PROCESSED_SESSIONS=0

while IFS='|' read -r SESSION_DATE SESSION_ID TRANSCRIPT_PATH; do
    # Skip empty lines and trim whitespace
    [ -z "$SESSION_ID" ] && continue
    SESSION_ID=$(echo "$SESSION_ID" | xargs)
    SESSION_DATE=$(echo "$SESSION_DATE" | xargs)
    TRANSCRIPT_PATH=$(echo "$TRANSCRIPT_PATH" | xargs)
    
    TOTAL_SESSIONS=$((TOTAL_SESSIONS + 1))
    
    # Filter by session ID if specified
    if [ -n "$TARGET_SESSION" ] && [ "$SESSION_ID" != "$TARGET_SESSION" ]; then
        log_verbose "Skipping session (not target): $SESSION_ID"
        continue
    fi
    
    # Filter by date if specified
    if [ -n "$CUTOFF_TIME" ]; then
        SESSION_EPOCH=$(date -j -f "%Y-%m-%d %H:%M:%S" "$SESSION_DATE" +%s 2>/dev/null || echo "0")
        if [ "$SESSION_EPOCH" -lt "$CUTOFF_TIME" ]; then
            log_verbose "Skipping session (too old): $SESSION_ID ($SESSION_DATE)"
            continue
        fi
    fi
    
    if [ -n "$UNTIL_EPOCH" ]; then
        SESSION_EPOCH=$(date -j -f "%Y-%m-%d %H:%M:%S" "$SESSION_DATE" +%s 2>/dev/null || echo "$CURRENT_TIME")
        if [ "$SESSION_EPOCH" -gt "$UNTIL_EPOCH" ]; then
            log_verbose "Skipping session (too new): $SESSION_ID ($SESSION_DATE)"
            continue
        fi
    fi
    
    echo "🔍 Processing session: $SESSION_ID ($SESSION_DATE)" >&2
    PROCESSED_SESSIONS=$((PROCESSED_SESSIONS + 1))
    
    # Check if transcript exists
    if [ ! -f "$TRANSCRIPT_PATH" ]; then
        echo "  ⚠️ Transcript not found: $TRANSCRIPT_PATH" >&2
        continue
    fi
    
    if [ "$DRY_RUN" = "true" ]; then
        # Just show what would be extracted
        SIDECHAIN_COUNT=$(cat "$TRANSCRIPT_PATH" | jq -r '[.isSidechain] | @csv' 2>/dev/null | \
            awk -F',' 'BEGIN{prev="false"; count=0} 
            {
                gsub(/"/, "", $1)
                if(prev == "false" && $1 == "true") count++
                prev=$1
            } END {print count}')
        
        echo "  📋 Would extract $SIDECHAIN_COUNT context(s) from session $SESSION_ID" >&2
        TOTAL_CONTEXTS=$((TOTAL_CONTEXTS + SIDECHAIN_COUNT))
        continue
    fi
    
    # Use similar extraction logic as save-subagent-context.sh but without time filtering
    # (This is the historical extractor, so we want ALL sidechains from selected sessions)
    
    # Find all sidechain boundaries
    SIDECHAIN_BOUNDARIES=$(cat "$TRANSCRIPT_PATH" | jq -r '[.isSidechain] | @csv' 2>/dev/null | \
        nl | awk -F'[,\t]' 'BEGIN{prev="false"; count=0} 
        {
            gsub(/"/, "", $2)
            gsub(/[ \t]/, "", $1)
            if(prev == "false" && $2 == "true") {
                count++
                print count "|" $1
            }
            prev=$2
        }')
    
    SIDECHAIN_COUNT=$(echo "$SIDECHAIN_BOUNDARIES" | grep -c "|" || echo "0")
    log_verbose "Found $SIDECHAIN_COUNT sidechain(s) in session"
    
    # Extract Task invocations
    TASK_INVOCATIONS=$(cat "$TRANSCRIPT_PATH" | jq -c '
        select(.message.content) | 
        select(.message.content | type == "array") |
        select(.message.content[] | select(.type == "tool_use" and .name == "Task")) | 
        {
            line: input_line_number,
            uuid,
            task: (.message.content[] | select(.type == "tool_use" and .name == "Task") | {
                description: .input.description,
                prompt: .input.prompt,
                subagent_type: .input.subagent_type
            })
        }' 2>/dev/null)
    
    # Process each sidechain
    SESSION_CONTEXTS=0
    while IFS='|' read -r SIDECHAIN_NUM START_LINE; do
        [ -z "$SIDECHAIN_NUM" ] && continue
        
        log_verbose "Processing sidechain #$SIDECHAIN_NUM"
        
        # Find corresponding Task (simplified matching)
        TASK_DESC="historical-context"
        TASK_PROMPT=""
        TASK_UUID=""
        
        if [ -n "$TASK_INVOCATIONS" ]; then
            # Find the closest Task before this sidechain
            while IFS= read -r task_json; do
                [ -z "$task_json" ] && continue
                TASK_LINE=$(echo "$task_json" | jq -r '.line')
                if [ "$TASK_LINE" -lt "$START_LINE" ]; then
                    TASK_DESC=$(echo "$task_json" | jq -r '.task.description // "historical-context"')
                    TASK_PROMPT=$(echo "$task_json" | jq -r '.task.prompt // ""')
                    TASK_UUID=$(echo "$task_json" | jq -r '.uuid // ""')
                fi
            done <<< "$TASK_INVOCATIONS"
        fi
        
        # Find the end of this sidechain
        NEXT_LINE=$(echo "$SIDECHAIN_BOUNDARIES" | grep "^$((SIDECHAIN_NUM + 1))|" | cut -d'|' -f2)
        
        # Extract content
        if [ -n "$NEXT_LINE" ]; then
            END_LINE=$((NEXT_LINE - 1))
            SUBAGENT_OUTPUT=$(sed -n "${START_LINE},${END_LINE}p" "$TRANSCRIPT_PATH" | \
                jq -r 'select(.isSidechain == true and .type == "assistant" and .message.content != null) |
                       .message.content |
                       if type == "array" then
                           .[] | select(.type == "text") | .text
                       elif type == "string" then
                           .
                       else
                           empty
                       end' 2>/dev/null | sed '/^$/d')
        else
            # Last sidechain
            SUBAGENT_OUTPUT=$(tail -n +"$START_LINE" "$TRANSCRIPT_PATH" | \
                jq -r 'select(.isSidechain == true and .type == "assistant" and .message.content != null) |
                       .message.content |
                       if type == "array" then
                           .[] | select(.type == "text") | .text
                       elif type == "string" then
                           .
                       else
                           empty
                       end' 2>/dev/null | sed '/^$/d')
        fi
        
        # Save if we have output
        if [ -n "$SUBAGENT_OUTPUT" ]; then
            SAFE_TASK=$(echo "$TASK_DESC" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9-]/-/g' | sed 's/--*/-/g' | sed 's/^-//;s/-$//' | cut -c1-50)
            TIMESTAMP=$(date "+%Y-%m-%d_%H:%M:%S")
            FILENAME="$OUTPUT_DIR/${TIMESTAMP}_historical_${SAFE_TASK}_sc${SIDECHAIN_NUM}.md"
            
            cat > "$FILENAME" << EOF
# Historical Subagent Context: $TASK_DESC

**Generated**: $TIMESTAMP
**Sidechain**: #$SIDECHAIN_NUM
**Task UUID**: $TASK_UUID
**Session ID**: $SESSION_ID
**Original Date**: $SESSION_DATE

## Original Task Prompt
$TASK_PROMPT

## Subagent Output

$SUBAGENT_OUTPUT

---
*Extracted by historical context extractor at $(date)*
*Original Transcript: $(basename $TRANSCRIPT_PATH)*
EOF
            
            log_verbose "Saved: $(basename $FILENAME)"
            SESSION_CONTEXTS=$((SESSION_CONTEXTS + 1))
            TOTAL_CONTEXTS=$((TOTAL_CONTEXTS + 1))
        fi
    done <<< "$SIDECHAIN_BOUNDARIES"
    
    echo "  ✅ Extracted $SESSION_CONTEXTS context(s) from session" >&2
    
done < "$MAPPING_FILE"

# Summary
echo "" >&2
echo "📊 Summary:" >&2
echo "   Sessions reviewed: $TOTAL_SESSIONS" >&2
echo "   Sessions processed: $PROCESSED_SESSIONS" >&2
if [ "$DRY_RUN" = "true" ]; then
    echo "   Contexts that would be extracted: $TOTAL_CONTEXTS" >&2
    echo "   (Run without --dry-run to actually extract)" >&2
else
    echo "   Contexts extracted: $TOTAL_CONTEXTS" >&2
    echo "   Output directory: $OUTPUT_DIR" >&2
fi

exit 0