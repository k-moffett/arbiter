#!/bin/bash

# Detect the primary language of the current project

detect_language() {
    # TypeScript/JavaScript detection
    if [ -f "package.json" ]; then
        if [ -f "tsconfig.json" ]; then
            echo "typescript"
        else
            echo "javascript"
        fi
    # Python detection
    elif [ -f "requirements.txt" ] || [ -f "pyproject.toml" ] || [ -f "Pipfile" ] || [ -f "setup.py" ]; then
        echo "python"
    # Go detection
    elif [ -f "go.mod" ]; then
        echo "go"
    # Rust detection
    elif [ -f "Cargo.toml" ]; then
        echo "rust"
    # Java detection
    elif [ -f "pom.xml" ] || [ -f "build.gradle" ]; then
        echo "java"
    # C# detection
    elif [ -f "*.csproj" ] || [ -f "*.sln" ]; then
        echo "csharp"
    # Ruby detection
    elif [ -f "Gemfile" ]; then
        echo "ruby"
    # Default
    else
        echo "unknown"
    fi
}

# Store the detected language
LANGUAGE=$(detect_language)

# Output for Claude to see
echo "Detected project language: $LANGUAGE" >&2
echo "Claude will use $LANGUAGE as the base language for this session." >&2
echo "" >&2

# Set context based on language
case $LANGUAGE in
    typescript|javascript)
        echo "Loading TypeScript/JavaScript context..." >&2
        echo "Available commands: npm run typecheck, npm run lint, npm test" >&2
        ;;
    python)
        echo "Loading Python context..." >&2
        echo "Available commands: mypy, ruff check, black, pytest" >&2
        ;;
    *)
        echo "Loading generic context..." >&2
        ;;
esac

# Export for use in other scripts
export PROJECT_LANGUAGE=$LANGUAGE