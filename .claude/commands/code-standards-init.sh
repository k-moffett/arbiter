#!/bin/bash

# Code Standards Init - Initialize framework-specific coding standards for project auditing

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Base path for standards (always relative to project root)
STANDARDS_PATH=".claude/aiContext/codingStandards"

# Detect frameworks in the project
detect_frameworks() {
    local frameworks=()
    
    # Python frameworks
    if [ -f "requirements.txt" ] || [ -f "pyproject.toml" ] || [ -f "Pipfile" ]; then
        # Check for specific frameworks
        if grep -qi "flask" requirements.txt pyproject.toml Pipfile 2>/dev/null; then
            frameworks+=("flask:python:server")
        fi
        if grep -qi "fastapi" requirements.txt pyproject.toml Pipfile 2>/dev/null; then
            frameworks+=("fastapi:python:server")
        fi
        if grep -qi "django" requirements.txt pyproject.toml Pipfile 2>/dev/null; then
            frameworks+=("django:python:server")
        fi
        if grep -qi "streamlit" requirements.txt pyproject.toml Pipfile 2>/dev/null; then
            frameworks+=("streamlit:python:data-science")
        fi
    fi
    
    # JavaScript/TypeScript frameworks
    if [ -f "package.json" ]; then
        # Backend frameworks
        if grep -q '"express"' package.json; then
            frameworks+=("express:typescript:server")
        fi
        if grep -q '"@nestjs/core"' package.json; then
            frameworks+=("nestjs:typescript:server")
        fi
        
        # Frontend frameworks
        if grep -q '"react"' package.json; then
            frameworks+=("react:typescript:client")
        fi
        if grep -q '"vue"' package.json; then
            frameworks+=("vue:typescript:client")
        fi
        if grep -q '"@angular/core"' package.json; then
            frameworks+=("angular:typescript:client")
        fi
        if grep -q '"svelte"' package.json; then
            frameworks+=("svelte:typescript:client")
        fi
    fi
    
    # Go frameworks
    if [ -f "go.mod" ]; then
        if grep -q "github.com/gin-gonic/gin" go.mod; then
            frameworks+=("gin:go:server")
        fi
        if grep -q "github.com/labstack/echo" go.mod; then
            frameworks+=("echo:go:server")
        fi
        if grep -q "github.com/gofiber/fiber" go.mod; then
            frameworks+=("fiber:go:server")
        fi
    fi
    
    # Rust frameworks
    if [ -f "Cargo.toml" ]; then
        if grep -q "actix-web" Cargo.toml; then
            frameworks+=("actix:rust:server")
        fi
        if grep -q "rocket" Cargo.toml; then
            frameworks+=("rocket:rust:server")
        fi
    fi
    
    # Java frameworks
    if [ -f "pom.xml" ] || [ -f "build.gradle" ]; then
        if grep -qi "spring-boot" pom.xml build.gradle 2>/dev/null; then
            frameworks+=("springboot:java:server")
        fi
    fi
    
    # Ruby frameworks
    if [ -f "Gemfile" ]; then
        if grep -q "rails" Gemfile; then
            frameworks+=("rails:ruby:server")
        fi
        if grep -q "sinatra" Gemfile; then
            frameworks+=("sinatra:ruby:server")
        fi
    fi
    
    printf '%s\n' "${frameworks[@]}"
}

# Check if standards already exist
check_existing_standards() {
    local framework=$1
    local language=$2
    local category=$3
    local path="$STANDARDS_PATH/$language/$category/$framework"
    
    if [ -d "$path" ] && [ -f "$path/ProjectStructure.md" ]; then
        return 0  # Standards exist
    fi
    return 1  # Standards don't exist
}

# Check file size
check_file_size() {
    local file=$1
    local max_size=$2
    local label=$3
    
    if [ ! -f "$file" ]; then
        return 1
    fi
    
    local size=$(wc -c < "$file")
    
    if [ $size -gt $max_size ]; then
        echo -e "${YELLOW}⚠️  $label is ${size} bytes (limit: ${max_size})${NC}"
        return 1
    else
        echo -e "${GREEN}✅ $label is ${size} bytes (within ${max_size} limit)${NC}"
        return 0
    fi
}


# Prompt for bootstrap
prompt_bootstrap() {
    local framework=$1
    local language=$2
    local category=$3
    
    echo ""
    echo -e "${YELLOW}📚 $framework detected but no standards found.${NC}"
    echo -e "${BLUE}Would you like Claude to research and create $framework standards?${NC}"
    echo ""
    echo "This will create:"
    echo -e "  ${GREEN}•${NC} Language baseContext.md update (<3KB)"
    echo -e "  ${GREEN}•${NC} $framework/FrameworkContext.md (<2KB) - Quick AI reference"
    echo -e "  ${GREEN}•${NC} $framework/ProjectStructure.md (~400 lines) - Full documentation"
    echo ""
    echo -e "${YELLOW}CREATE_FRAMEWORK_STANDARDS:${NC} $framework:$language:$category"
    echo ""
    echo -e "${BLUE}📊 Research Phase Instructions:${NC}"
    echo ""
    echo "STEP 1: RESEARCH CURRENT INDUSTRY STANDARDS"
    echo "  • Search for the LATEST official $framework documentation and best practices"
    echo "  • Research the MOST CURRENT $language language conventions and patterns"
    echo "  • Investigate up-to-date security guidelines for $category applications"
    echo "  • Review contemporary testing strategies recommended for $framework"
    echo "  • Examine actively maintained open-source $framework projects for modern patterns"
    echo "  • Verify findings by checking multiple authoritative sources (official docs, major tech blogs)"
    echo "  • Note version numbers and release dates of referenced documentation"
    echo ""
    echo "STEP 2: COLLECT AND ORGANIZE FINDINGS"
    echo "  • Create temporary research notes in .claude/aiContext/temp_research/"
    echo "  • Document key patterns, structures, and conventions found"
    echo "  • Note framework-specific best practices and anti-patterns"
    echo "  • Capture configuration examples from official sources"
    echo "  • Include concrete code examples showing DO and DON'T patterns"
    echo "  • Record common pitfalls and how to avoid them"
    echo ""
    echo "STEP 3: GENERATE STANDARDS DOCUMENTATION"
    echo "Using the researched information, create:"
    echo "  • Modern project structure based on the latest best practices"
    echo "  • Configuration examples from the most recent official documentation"
    echo "  • Best practices and patterns currently recommended by industry leaders"
    echo "  • Testing strategies from the latest $framework community guidelines"
    echo "  • Security guidelines from the most recent OWASP standards and framework maintainers"
    echo ""
    echo "STEP 4: CLEANUP"
    echo "  • Remove temporary research files from .claude/aiContext/temp_research/"
    echo "  • Ensure all generated documentation follows size constraints"
    echo "  • Run '/code-standards-audit' after creation to validate quality"
    echo ""
    echo -e "${YELLOW}Note:${NC} Research should reflect the MOST RECENT industry standards,"
    echo "not outdated practices. Always use WebSearch to find the latest available documentation."
    echo ""
    echo -e "${GREEN}IMPORTANT:${NC} Generated standards are a STARTING POINT that should be:"
    echo "  • Reviewed and customized for your team's specific needs"
    echo "  • Updated as frameworks evolve (run /code-standards-audit periodically)"
    echo "  • Enhanced with project-specific patterns as they emerge"
    echo ""
}

# Main execution
main() {
    echo -e "${BLUE}🔍 Code Standards Init - Framework Detection${NC}"
    echo ""
    
    # Check for manual framework specification
    if [ -n "$1" ]; then
        # Manual mode
        framework="$1"
        echo -e "${BLUE}Manual mode: Initializing $framework audit standards${NC}"
        
        # Map framework to language and category
        case $framework in
            flask|fastapi|django)
                language="python"
                category="server"
                ;;
            streamlit)
                language="python"
                category="data-science"
                ;;
            express|nestjs)
                language="typescript"
                category="server"
                ;;
            react|vue|angular|svelte)
                language="typescript"
                category="client"
                ;;
            gin|echo|fiber)
                language="go"
                category="server"
                ;;
            actix|rocket)
                language="rust"
                category="server"
                ;;
            springboot)
                language="java"
                category="server"
                ;;
            rails|sinatra)
                language="ruby"
                category="server"
                ;;
            *)
                echo -e "${RED}Unknown framework: $framework${NC}"
                exit 1
                ;;
        esac
        
        if check_existing_standards "$framework" "$language" "$category"; then
            echo -e "${YELLOW}Standards already exist for $framework${NC}"
            echo "Run '/code-standards-audit $framework' to validate quality and compliance"
            echo "Use --force to regenerate standards"
        else
            prompt_bootstrap "$framework" "$language" "$category"
        fi
    else
        # Auto-detection mode
        echo "Scanning project for frameworks..."
        frameworks=$(detect_frameworks)
        
        if [ -z "$frameworks" ]; then
            echo -e "${YELLOW}No recognized frameworks detected.${NC}"
            echo ""
            echo "You can manually specify a framework:"
            echo "  /code-standards-init flask"
            echo "  /code-standards-init react"
            echo "  /code-standards-init fastapi"
            exit 0
        fi
        
        echo -e "${GREEN}Detected frameworks:${NC}"
        for framework_info in $frameworks; do
            IFS=':' read -r framework language category <<< "$framework_info"
            echo "  • $framework ($language/$category)"
        done
        echo ""
        
        # Check each detected framework
        for framework_info in $frameworks; do
            IFS=':' read -r framework language category <<< "$framework_info"
            
            if ! check_existing_standards "$framework" "$language" "$category"; then
                prompt_bootstrap "$framework" "$language" "$category"
                
                # Size validation for context files
                echo ""
                echo -e "${BLUE}📏 Size Validation:${NC}"
                check_file_size ".claude/aiContext/baseContext.md" 2048 "Universal context"
                check_file_size "$STANDARDS_PATH/$language/baseContext.md" 3072 "$language context"
            else
                echo -e "${GREEN}✅ $framework standards already exist${NC}"
                echo "  Run '/code-standards-audit $framework' to validate quality and compliance"
            fi
            echo ""
        done
    fi
    
    echo ""
    echo -e "${BLUE}💡 Tips:${NC}"
    echo "  • Run '/code-standards-audit' to audit project compliance"
    echo "  • Standards are in .claude/aiContext/codingStandards/"
    echo "  • Edit generated files to add company-specific patterns"
}

# Run main function
main "$@"