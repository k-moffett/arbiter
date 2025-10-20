# Load Context

Restore previous session context, insights, and task progress from saved history.

Look for the latest timestamped file (YYYY-MM-DD_HH:MM:SS format) in aiContext/compactHistory/, read its contents, and use
that information to understand:

1) Previous insights and discoveries
2) Current task progress and status
3) Important patterns and architectural decisions that were identified
4) Critical dependencies and relationships
5) Next steps and priorities that were planned
6) Any blockers or important considerations that were noted

Only if needed review other related files under aiContext/compactHistory/. You can determine if they are related by the file name.

Finally ensure you understand the current state of the project and what has been accomplished so far. The root README is a good place to start.
You can also review .claude/CLAUDE.md for important file mappings and .claude/aiContext/codingStandards/[language]/[projectType] for coding standards and best practices.

Use this context to continue work seamlessly from where the previous session left off.

Optional focus area: $ARGUMENTS
