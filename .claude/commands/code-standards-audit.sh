#!/bin/bash

# Code Standards Audit - Validate and update framework documentation against current industry standards

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Base path for standards
STANDARDS_PATH=".claude/aiContext/codingStandards"

# Get current date for metadata
CURRENT_DATE=$(date +%Y-%m-%d)

# Get framework versions from project
get_framework_versions() {
    local versions=""
    
    # Python frameworks
    if [ -f "requirements.txt" ]; then
        flask_ver=$(grep "^flask" requirements.txt 2>/dev/null | sed 's/.*==//' | sed 's/[<>~].*//')
        [ -n "$flask_ver" ] && versions+="flask:$flask_ver "
        
        fastapi_ver=$(grep "^fastapi" requirements.txt 2>/dev/null | sed 's/.*==//' | sed 's/[<>~].*//')
        [ -n "$fastapi_ver" ] && versions+="fastapi:$fastapi_ver "
        
        django_ver=$(grep "^django" requirements.txt 2>/dev/null | sed 's/.*==//' | sed 's/[<>~].*//')
        [ -n "$django_ver" ] && versions+="django:$django_ver "
    fi
    
    if [ -f "pyproject.toml" ]; then
        # Extract versions from pyproject.toml if not found in requirements.txt
        if [ -z "$flask_ver" ]; then
            flask_ver=$(grep "flask" pyproject.toml 2>/dev/null | sed 's/.*"//' | sed 's/".*//' | sed 's/[<>~=].*//')
            [ -n "$flask_ver" ] && versions+="flask:$flask_ver "
        fi
    fi
    
    # JavaScript/TypeScript frameworks
    if [ -f "package.json" ]; then
        # Use jq if available, otherwise use grep
        if command -v jq &> /dev/null; then
            react_ver=$(jq -r '.dependencies.react // .devDependencies.react // ""' package.json | sed 's/[\^~]//')
            [ -n "$react_ver" ] && versions+="react:$react_ver "
            
            express_ver=$(jq -r '.dependencies.express // .devDependencies.express // ""' package.json | sed 's/[\^~]//')
            [ -n "$express_ver" ] && versions+="express:$express_ver "
        else
            react_ver=$(grep '"react"' package.json 2>/dev/null | head -1 | sed 's/.*: "//' | sed 's/".*//' | sed 's/[\^~]//')
            [ -n "$react_ver" ] && versions+="react:$react_ver "
        fi
    fi
    
    echo "$versions"
}

# Check metadata file
check_metadata() {
    local framework_path=$1
    local framework_name=$(basename "$framework_path")
    local metadata_file="$framework_path/.metadata.json"
    
    if [ -f "$metadata_file" ]; then
        if command -v jq &> /dev/null; then
            local last_updated=$(jq -r '.last_updated // "unknown"' "$metadata_file")
            local framework_version=$(jq -r '.framework_version // "unknown"' "$metadata_file")
            local quality_score=$(jq -r '.quality_score // 0' "$metadata_file")
        else
            local last_updated="unknown"
            local framework_version="unknown"
            local quality_score=0
        fi
        
        # Calculate age in days
        if [ "$last_updated" != "unknown" ]; then
            if [[ "$OSTYPE" == "darwin"* ]]; then
                # macOS date command
                if command -v gdate &> /dev/null; then
                    age=$(( ($(date +%s) - $(gdate -d "$last_updated" +%s)) / 86400 ))
                else
                    age="unknown"
                fi
            else
                # Linux date command
                age=$(( ($(date +%s) - $(date -d "$last_updated" +%s)) / 86400 ))
            fi
        else
            age="unknown"
        fi
        
        echo -e "  Last updated: ${CYAN}$last_updated${NC} ($age days ago)"
        echo -e "  Documented version: ${CYAN}$framework_version${NC}"
        echo -e "  Quality score: ${CYAN}$quality_score/100${NC}"
    else
        echo -e "  ${YELLOW}No metadata found${NC}"
    fi
}

# Check file size
check_file_size() {
    local file=$1
    local max_size=$2
    local label=$3
    
    if [ ! -f "$file" ]; then
        echo -e "  ${RED}❌ $label missing${NC}"
        return 1
    fi
    
    local size=$(wc -c < "$file")
    
    if [ $size -gt $max_size ]; then
        echo -e "  ${YELLOW}⚠️  $label is ${size} bytes (limit: ${max_size})${NC}"
        return 1
    else
        echo -e "  ${GREEN}✅ $label is ${size} bytes (within limit)${NC}"
        return 0
    fi
}

# Validate structure quality
validate_structure_quality() {
    local file=$1
    local score=0
    local max_score=100
    local missing_sections=""
    
    if [ ! -f "$file" ]; then
        echo -e "  ${RED}❌ ProjectStructure.md missing${NC}"
        return 1
    fi
    
    # Check required sections
    if grep -q "## Root Directory" "$file" 2>/dev/null; then
        ((score+=15))
    else
        missing_sections+="Root Directory, "
    fi
    
    if grep -q "## Core Application Structure" "$file" 2>/dev/null; then
        ((score+=15))
    else
        missing_sections+="Core Application Structure, "
    fi
    
    if grep -q "## Configuration Files" "$file" 2>/dev/null; then
        ((score+=15))
    else
        missing_sections+="Configuration Files, "
    fi
    
    if grep -q "## Testing Structure" "$file" 2>/dev/null; then
        ((score+=10))
    else
        missing_sections+="Testing Structure, "
    fi
    
    if grep -q "## File Naming Conventions" "$file" 2>/dev/null; then
        ((score+=10))
    else
        missing_sections+="File Naming Conventions, "
    fi
    
    if grep -q "## Best Practices" "$file" 2>/dev/null; then
        ((score+=15))
    else
        missing_sections+="Best Practices, "
    fi
    
    # Check for code examples
    local code_blocks=$(grep -c '```' "$file" 2>/dev/null || echo "0")
    if [ $code_blocks -ge 10 ]; then
        ((score+=10))
    else
        missing_sections+="Insufficient code examples, "
    fi
    
    # Check minimum length
    local line_count=$(wc -l < "$file" 2>/dev/null || echo "0")
    if [ $line_count -ge 200 ]; then
        ((score+=10))
    else
        missing_sections+="Too short (${line_count} lines), "
    fi
    
    # Display quality score with color coding
    if [ $score -ge 90 ]; then
        echo -e "  ${GREEN}📊 Quality Score: $score/$max_score (Excellent)${NC}"
    elif [ $score -ge 70 ]; then
        echo -e "  ${BLUE}📊 Quality Score: $score/$max_score (Good)${NC}"
    elif [ $score -ge 50 ]; then
        echo -e "  ${YELLOW}📊 Quality Score: $score/$max_score (Needs improvement)${NC}"
    else
        echo -e "  ${RED}📊 Quality Score: $score/$max_score (Regenerate recommended)${NC}"
    fi
    
    if [ -n "$missing_sections" ]; then
        echo -e "  ${YELLOW}Missing: ${missing_sections%, }${NC}"
    fi
    
    return 0
}

# Check for deprecated patterns
check_deprecated_patterns() {
    local framework=$1
    local framework_path=$2
    local deprecated_found=false
    
    echo ""
    echo -e "${YELLOW}🔍 Checking for deprecated patterns...${NC}"
    
    case $framework in
        flask)
            if grep -q "flask_script" "$framework_path"/*.md 2>/dev/null; then
                echo -e "  ${YELLOW}⚠️  Flask-Script found (deprecated, use Click)${NC}"
                deprecated_found=true
            fi
            if grep -q "\.query\." "$framework_path"/*.md 2>/dev/null; then
                echo -e "  ${YELLOW}⚠️  Old SQLAlchemy query() syntax found${NC}"
                deprecated_found=true
            fi
            ;;
        react)
            if grep -q "componentWillMount\|componentWillReceiveProps" "$framework_path"/*.md 2>/dev/null; then
                echo -e "  ${YELLOW}⚠️  Deprecated lifecycle methods found${NC}"
                deprecated_found=true
            fi
            if grep -q "React.createClass" "$framework_path"/*.md 2>/dev/null; then
                echo -e "  ${YELLOW}⚠️  createClass found (use function components)${NC}"
                deprecated_found=true
            fi
            ;;
        django)
            if grep -q "url(" "$framework_path"/*.md 2>/dev/null; then
                echo -e "  ${YELLOW}⚠️  url() found (use path() or re_path())${NC}"
                deprecated_found=true
            fi
            ;;
    esac
    
    if [ "$deprecated_found" = false ]; then
        echo -e "  ${GREEN}✅ No deprecated patterns detected${NC}"
    fi
}

# Generate research recommendations
research_recommendations() {
    local framework=$1
    local language=$2
    local category=$3
    
    echo ""
    echo -e "${CYAN}🔬 Research Recommendations:${NC}"
    echo "To update this framework's standards with current industry practices:"
    echo ""
    echo -e "${YELLOW}RESEARCH_FRAMEWORK_STANDARDS:${NC} $framework:$language:$category"
    echo ""
    echo -e "${BLUE}📋 Research Instructions:${NC}"
    echo ""
    echo "STEP 1: CURRENT INDUSTRY RESEARCH"
    echo "  • Use WebSearch to find the LATEST $framework official documentation"
    echo "  • Search for '$framework best practices $(date +%Y)' to find current standards"
    echo "  • Look for '$framework security guidelines' and recent vulnerability reports"
    echo "  • Find '$framework performance optimization' latest techniques"
    echo "  • Check for '$framework migration guide' for breaking changes"
    echo ""
    echo "STEP 2: VERSION AND COMPATIBILITY"
    echo "  • Research latest stable version of $framework"
    echo "  • Check for $language version compatibility requirements"
    echo "  • Find breaking changes in recent $framework releases"
    echo "  • Document new features and recommended patterns"
    echo ""
    echo "STEP 3: ECOSYSTEM UPDATES"
    echo "  • Search for commonly used $framework libraries and their current versions"
    echo "  • Look for new testing frameworks recommended for $framework"
    echo "  • Check for updated deployment and CI/CD practices"
    echo "  • Find current monitoring and observability patterns"
    echo ""
    echo "STEP 4: GENERATE UPDATE RECOMMENDATIONS"
    echo "  • Create list of outdated patterns in current documentation"
    echo "  • Suggest specific sections that need updates"
    echo "  • Provide concrete examples of modern patterns to add"
    echo "  • Include migration paths for deprecated features"
    echo ""
    echo -e "${GREEN}IMPORTANT:${NC} Focus on changes since the last documentation update."
    echo "Compare findings against current standards to identify gaps."
}

# Generate validation report
generate_report() {
    local framework=$1
    local language=$2
    local category=$3
    local framework_path="$STANDARDS_PATH/$language/$category/$framework"
    
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}📦 FRAMEWORK: $framework ($language/$category)${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    
    # Check metadata
    echo ""
    echo -e "${CYAN}📅 Metadata:${NC}"
    check_metadata "$framework_path"
    
    # Check context hierarchy
    echo ""
    echo -e "${CYAN}📚 Context Files:${NC}"
    check_file_size ".claude/aiContext/baseContext.md" 2048 "Universal context" || true
    check_file_size "$STANDARDS_PATH/$language/baseContext.md" 3072 "$language context" || true
    check_file_size "$framework_path/FrameworkContext.md" 2048 "$framework context" || true
    
    # Check if framework is in language context
    if [ -f "$STANDARDS_PATH/$language/baseContext.md" ]; then
        if grep -q "$framework" "$STANDARDS_PATH/$language/baseContext.md" 2>/dev/null; then
            echo -e "  ${GREEN}✅ $framework found in $language context${NC}"
        else
            echo -e "  ${YELLOW}⚠️  $framework not in $language context${NC}"
        fi
    fi
    
    # Check project structure
    echo ""
    echo -e "${CYAN}📁 Project Structure:${NC}"
    validate_structure_quality "$framework_path/ProjectStructure.md"
    
    # Check for version updates
    echo ""
    echo -e "${CYAN}🔄 Version Check:${NC}"
    current_versions=$(get_framework_versions)
    for version_info in $current_versions; do
        IFS=':' read -r fw ver <<< "$version_info"
        if [ "$fw" = "$framework" ]; then
            echo -e "  Current version: ${GREEN}$ver${NC}"
            break
        fi
    done
    
    # Check for deprecated patterns in documentation
    check_deprecated_patterns "$framework" "$framework_path"
    
    # Provide research recommendations
    research_recommendations "$framework" "$language" "$category"
}

# Prompt for update action
prompt_update_action() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}🔄 Update Options:${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo "Would you like to:"
    echo -e "  ${CYAN}1.${NC} Update outdated sections only"
    echo -e "  ${CYAN}2.${NC} Add missing modern patterns"
    echo -e "  ${CYAN}3.${NC} Remove deprecated patterns"
    echo -e "  ${CYAN}4.${NC} Full refresh (complete regeneration)"
    echo -e "  ${CYAN}5.${NC} Skip update"
    echo ""
    echo -e "${YELLOW}UPDATE_STANDARDS_ACTION:${NC} [Select 1-5]"
}

# Create backup
create_backup() {
    local framework_path=$1
    local backup_path="${framework_path}.backup-$(date +%Y%m%d-%H%M%S)"
    
    if [ -d "$framework_path" ]; then
        echo -e "${BLUE}📂 Creating backup at: $backup_path${NC}"
        cp -r "$framework_path" "$backup_path"
        return 0
    fi
    return 1
}

# Find all existing standards
find_existing_standards() {
    local standards=()
    
    # Search for ProjectStructure.md files
    while IFS= read -r -d '' file; do
        dir=$(dirname "$file")
        framework=$(basename "$dir")
        category=$(basename "$(dirname "$dir")")
        language=$(basename "$(dirname "$(dirname "$dir")")")
        
        standards+=("$framework:$language:$category")
    done < <(find "$STANDARDS_PATH" -name "ProjectStructure.md" -print0 2>/dev/null)
    
    printf '%s\n' "${standards[@]}"
}

# Main execution
main() {
    echo -e "${CYAN}╔══════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║     🔍 Code Standards Documentation Audit        ║${NC}"
    echo -e "${CYAN}╚══════════════════════════════════════════════════╝${NC}"
    echo ""
    
    # Check for specific framework
    if [ -n "$1" ] && [ "$1" != "--update" ] && [ "$1" != "--dry-run" ] && [ "$1" != "--force" ]; then
        # Validate specific framework
        framework="$1"
        echo -e "${BLUE}Validating $framework standards...${NC}"
        
        # Find framework in standards
        found=false
        while IFS= read -r standard; do
            IFS=':' read -r fw lang cat <<< "$standard"
            if [ "$fw" = "$framework" ]; then
                generate_report "$fw" "$lang" "$cat"
                found=true
                break
            fi
        done < <(find_existing_standards)
        
        if [ "$found" = false ]; then
            echo -e "${RED}No standards found for $framework${NC}"
            echo "Run '/code-standards-init $framework' to create them"
            exit 1
        fi
    else
        # Validate all existing standards
        echo -e "${BLUE}Scanning for existing standards...${NC}"
        standards=$(find_existing_standards)
        
        if [ -z "$standards" ]; then
            echo -e "${YELLOW}No standards found.${NC}"
            echo "Run '/code-standards-init' to create framework standards"
            exit 0
        fi
        
        echo -e "${GREEN}Found standards for:${NC}"
        for standard in $standards; do
            IFS=':' read -r fw lang cat <<< "$standard"
            echo "  • $fw ($lang/$cat)"
        done
        
        # Generate report for each framework
        for standard in $standards; do
            IFS=':' read -r fw lang cat <<< "$standard"
            generate_report "$fw" "$lang" "$cat"
        done
    fi
    
    # Check for update flag
    if [[ "$*" == *"--update"* ]]; then
        prompt_update_action
    else
        echo ""
        echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo -e "${GREEN}💡 Tips:${NC}"
        echo "  • Run with ${CYAN}--update${NC} to apply recommended changes"
        echo "  • Run with ${CYAN}--dry-run${NC} to preview changes"
        echo "  • Standards location: ${CYAN}$STANDARDS_PATH/${NC}"
    fi
}

# Make scripts executable
chmod +x "$0" 2>/dev/null

# Run main function
main "$@"