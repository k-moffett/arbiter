# Historical Subagent Context Extractor

Extracts subagent contexts from historical sessions or time periods, separate from the current interaction contexts captured by the SubagentStop hook.

## Purpose

While `save-subagent-context.sh` automatically extracts contexts from recent subagent interactions (last 10 minutes), this command allows you to:

- Extract contexts from older sessions
- Review historical research and analysis
- Recover contexts from specific time periods
- Analyze patterns in past subagent work

## Usage

```bash
# Basic usage - extract from last 7 days
bash .claude/commands/extract-historical-contexts.sh

# Extract from specific session
bash .claude/commands/extract-historical-contexts.sh abc123-session-id

# Extract from last 30 days
bash .claude/commands/extract-historical-contexts.sh -d 30

# Extract from all sessions
bash .claude/commands/extract-historical-contexts.sh -a

# Extract from date range
bash .claude/commands/extract-historical-contexts.sh -s 2025-08-01 -u 2025-08-15

# Preview what would be extracted (dry run)
bash .claude/commands/extract-historical-contexts.sh --dry-run -a
```

## Options

- `-h, --help` - Show help message
- `-a, --all-sessions` - Extract from all sessions in mapping file
- `-d, --days DAYS` - Extract from last N days (default: 7)
- `-s, --since DATE` - Extract since specific date (YYYY-MM-DD)
- `-u, --until DATE` - Extract until specific date (YYYY-MM-DD)
- `-o, --output-dir DIR` - Output directory (default: current context dir)
- `-v, --verbose` - Verbose output showing detailed processing
- `--dry-run` - Show what would be extracted without actually extracting

## Examples

### Extract Recent Historical Contexts
```bash
# Last 7 days (default)
bash .claude/commands/extract-historical-contexts.sh

# Last month
bash .claude/commands/extract-historical-contexts.sh -d 30
```

### Extract from Specific Session
```bash
# When you know the session ID
bash .claude/commands/extract-historical-contexts.sh 2334128b-6b08-4ef0-886f-bb7f19d46d7c
```

### Extract from Date Range
```bash
# Specific week
bash .claude/commands/extract-historical-contexts.sh -s 2025-08-01 -u 2025-08-08

# Everything since a date
bash .claude/commands/extract-historical-contexts.sh -s 2025-07-01
```

### Preview Before Extracting
```bash
# See what would be extracted from all sessions
bash .claude/commands/extract-historical-contexts.sh --dry-run -a

# Preview last 30 days with verbose output
bash .claude/commands/extract-historical-contexts.sh --dry-run -d 30 -v
```

## Output

Historical contexts are saved with the prefix `historical_` to distinguish them from current contexts:

```
2025-08-19_11:30:45_historical_research-vue-3-5_sc7.md
2025-08-19_11:30:45_historical_research-python-3-13_sc4.md
```

Each file includes:
- Original task description and prompt
- Complete subagent output
- Session ID and original date
- Sidechain number for reference

## Session Mapping

The command reads from `.claude/aiContext/subAgentContexts/.session_mapping` to find available sessions. This file is automatically maintained by the SubagentStop hook system.

## Use Cases

1. **Research Review**: Extract contexts from research sessions last week
2. **Pattern Analysis**: Compare how different subagents approached similar tasks over time
3. **Context Recovery**: Retrieve specific analysis that was done in a previous session
4. **Archive Management**: Extract and organize historical contexts by project phases

## Difference from Current Contexts

| Current Contexts | Historical Contexts |
|------------------|-------------------|
| Automatic via SubagentStop hook | Manual command execution |
| Last 10 minutes only | Any time period |
| Recent interactions | All sessions |
| Filename: `task_sc1.md` | Filename: `historical_task_sc1.md` |

## Integration

Add to your CLAUDE.md for easy access:

```markdown
### Context Management
- Current contexts: Automatic via SubagentStop hook
- Historical contexts: `bash .claude/commands/extract-historical-contexts.sh [options]`
```

## Troubleshooting

**No session mapping file found**
- Run some subagent tasks first to create session history
- The SubagentStop hook must have run at least once

**No contexts extracted**
- Check date filters with `--dry-run` first
- Verify transcript files exist with `-v` flag
- Try `-a` to see all available sessions

**Timestamp parsing errors**
- macOS and Linux have different `date` command syntax
- The script handles both automatically