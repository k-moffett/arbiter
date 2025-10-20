#!/bin/bash

# Project Standards Audit - Audit current project compliance against documented coding standards

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





# Check project compliance with documented standards
check_project_compliance() {
    local framework=$1
    local language=$2
    local category=$3
    local framework_path="$STANDARDS_PATH/$language/$category/$framework"
    local compliance_score=0
    local total_checks=0
    local issues=""
    
    echo ""
    echo -e "${CYAN}🔍 Project Compliance Check:${NC}"
    echo "Comparing actual project structure against documented standards..."
    echo ""
    
    # Check if ProjectStructure.md exists
    if [ ! -f "$framework_path/ProjectStructure.md" ]; then
        echo -e "  ${RED}❌ No standards found to audit against${NC}"
        return 1
    fi
    
    # Python project checks
    if [ "$language" = "python" ]; then
        ((total_checks++))
        if [ -d "src" ] || [ -d "app" ] || [ -d "${framework}" ]; then
            echo -e "  ${GREEN}✅ Standard project directory found${NC}"
            ((compliance_score++))
        else
            echo -e "  ${YELLOW}⚠️  No standard src/, app/, or ${framework}/ directory${NC}"
            issues+="Project structure, "
        fi
        
        ((total_checks++))
        if [ -d "tests" ] || [ -d "test" ]; then
            echo -e "  ${GREEN}✅ Test directory found${NC}"
            ((compliance_score++))
        else
            echo -e "  ${YELLOW}⚠️  No tests/ directory found${NC}"
            issues+="Test structure, "
        fi
        
        ((total_checks++))
        if [ -f ".env.example" ] || [ -f ".env.template" ]; then
            echo -e "  ${GREEN}✅ Environment template found${NC}"
            ((compliance_score++))
        else
            echo -e "  ${YELLOW}⚠️  No .env.example or .env.template${NC}"
            issues+="Environment config, "
        fi
        
        # Check for proper Python naming conventions
        ((total_checks++))
        if find . -name "*.py" -path "*/[A-Z]*" 2>/dev/null | grep -q .; then
            echo -e "  ${YELLOW}⚠️  Found Python files with uppercase in path (PEP 8 violation)${NC}"
            issues+="Naming conventions, "
        else
            echo -e "  ${GREEN}✅ Python naming conventions followed${NC}"
            ((compliance_score++))
        fi
    fi
    
    # JavaScript/TypeScript project checks
    if [ "$language" = "typescript" ] || [ "$language" = "javascript" ]; then
        ((total_checks++))
        if [ -d "src" ]; then
            echo -e "  ${GREEN}✅ src/ directory found${NC}"
            ((compliance_score++))
        else
            echo -e "  ${YELLOW}⚠️  No src/ directory${NC}"
            issues+="Project structure, "
        fi
        
        ((total_checks++))
        if [ -f "tsconfig.json" ] || [ -f "jsconfig.json" ]; then
            echo -e "  ${GREEN}✅ TypeScript/JavaScript config found${NC}"
            ((compliance_score++))
        else
            echo -e "  ${YELLOW}⚠️  No tsconfig.json or jsconfig.json${NC}"
            issues+="Config files, "
        fi
        
        ((total_checks++))
        if [ -d "__tests__" ] || [ -d "tests" ] || [ -d "test" ] || grep -q "test" package.json 2>/dev/null; then
            echo -e "  ${GREEN}✅ Test configuration found${NC}"
            ((compliance_score++))
        else
            echo -e "  ${YELLOW}⚠️  No test directory or configuration${NC}"
            issues+="Test structure, "
        fi
    fi
    
    # Framework-specific checks
    case $framework in
        flask|fastapi|django)
            ((total_checks++))
            if [ -f "requirements.txt" ] || [ -f "pyproject.toml" ] || [ -f "Pipfile" ]; then
                echo -e "  ${GREEN}✅ Python dependency file found${NC}"
                ((compliance_score++))
            else
                echo -e "  ${YELLOW}⚠️  No requirements.txt, pyproject.toml, or Pipfile${NC}"
                issues+="Dependencies, "
            fi
            ;;
        react|vue|angular)
            ((total_checks++))
            if [ -d "public" ] || [ -d "dist" ] || [ -d "build" ]; then
                echo -e "  ${GREEN}✅ Build/public directory found${NC}"
                ((compliance_score++))
            else
                echo -e "  ${YELLOW}⚠️  No public/, dist/, or build/ directory${NC}"
                issues+="Build structure, "
            fi
            
            ((total_checks++))
            if [ -d "src/components" ] || [ -d "components" ]; then
                echo -e "  ${GREEN}✅ Components directory found${NC}"
                ((compliance_score++))
            else
                echo -e "  ${YELLOW}⚠️  No components directory${NC}"
                issues+="Component structure, "
            fi
            ;;
    esac
    
    # Additional comprehensive checks
    echo ""
    echo -e "  ${BLUE}📋 Additional Compliance Checks:${NC}"
    
    # Check for license file
    ((total_checks++))
    if [ -f "LICENSE" ] || [ -f "LICENSE.txt" ] || [ -f "LICENSE.md" ]; then
        echo -e "  ${GREEN}✅ License file found${NC}"
        ((compliance_score++))
    else
        echo -e "  ${YELLOW}⚠️  No license file${NC}"
        issues+="License, "
    fi
    
    # Check for security files
    ((total_checks++))
    if [ -f "SECURITY.md" ] || [ -f ".github/SECURITY.md" ]; then
        echo -e "  ${GREEN}✅ Security policy found${NC}"
        ((compliance_score++))
    else
        echo -e "  ${YELLOW}⚠️  No security policy${NC}"
        issues+="Security documentation, "
    fi
    
    # Check for CI/CD configuration
    ((total_checks++))
    if [ -d ".github/workflows" ] || [ -f ".gitlab-ci.yml" ] || [ -f "Jenkinsfile" ] || [ -f ".circleci/config.yml" ]; then
        echo -e "  ${GREEN}✅ CI/CD configuration found${NC}"
        ((compliance_score++))
    else
        echo -e "  ${YELLOW}⚠️  No CI/CD configuration${NC}"
        issues+="CI/CD setup, "
    fi
    
    # Check for dependency lock files
    ((total_checks++))
    case $language in
        python)
            if [ -f "poetry.lock" ] || [ -f "Pipfile.lock" ] || [ -f "requirements.lock" ]; then
                echo -e "  ${GREEN}✅ Dependency lock file found${NC}"
                ((compliance_score++))
            else
                echo -e "  ${YELLOW}⚠️  No dependency lock file${NC}"
                issues+="Dependency locking, "
            fi
            ;;
        typescript|javascript)
            if [ -f "package-lock.json" ] || [ -f "yarn.lock" ] || [ -f "pnpm-lock.yaml" ]; then
                echo -e "  ${GREEN}✅ Dependency lock file found${NC}"
                ((compliance_score++))
            else
                echo -e "  ${YELLOW}⚠️  No dependency lock file${NC}"
                issues+="Dependency locking, "
            fi
            ;;
        *)
            # Skip this check for other languages
            ((total_checks--))
            ;;
    esac
    
    # Check for code formatting configuration
    ((total_checks++))
    case $language in
        python)
            if [ -f "pyproject.toml" ] || [ -f ".black" ] || [ -f "setup.cfg" ] || [ -f ".isort.cfg" ]; then
                echo -e "  ${GREEN}✅ Code formatting config found${NC}"
                ((compliance_score++))
            else
                echo -e "  ${YELLOW}⚠️  No code formatting configuration${NC}"
                issues+="Code formatting, "
            fi
            ;;
        typescript|javascript)
            if [ -f ".prettierrc" ] || [ -f ".prettierrc.json" ] || [ -f "prettier.config.js" ] || [ -f ".eslintrc*" ]; then
                echo -e "  ${GREEN}✅ Code formatting config found${NC}"
                ((compliance_score++))
            else
                echo -e "  ${YELLOW}⚠️  No code formatting configuration${NC}"
                issues+="Code formatting, "
            fi
            ;;
        *)
            # Skip this check for other languages
            ((total_checks--))
            ;;
    esac
    
    # Check for development environment setup
    ((total_checks++))
    if [ -f ".devcontainer/devcontainer.json" ] || [ -f "docker-compose.yml" ] || [ -f "Dockerfile" ] || [ -f "Vagrantfile" ]; then
        echo -e "  ${GREEN}✅ Development environment configuration found${NC}"
        ((compliance_score++))
    else
        echo -e "  ${YELLOW}⚠️  No development environment configuration${NC}"
        issues+="Dev environment, "
    fi
    
    # Check for README
    ((total_checks++))
    if [ -f "README.md" ] || [ -f "readme.md" ] || [ -f "README.rst" ]; then
        echo -e "  ${GREEN}✅ README found${NC}"
        ((compliance_score++))
    else
        echo -e "  ${YELLOW}⚠️  No README file${NC}"
        issues+="Documentation, "
    fi
    
    # Check for .gitignore
    ((total_checks++))
    if [ -f ".gitignore" ]; then
        echo -e "  ${GREEN}✅ .gitignore found${NC}"
        ((compliance_score++))
    else
        echo -e "  ${YELLOW}⚠️  No .gitignore file${NC}"
        issues+="Git configuration, "
    fi
    
    # Calculate compliance percentage
    local percentage=0
    if [ $total_checks -gt 0 ]; then
        percentage=$(( (compliance_score * 100) / total_checks ))
    fi
    
    echo ""
    # Display compliance score with color coding
    if [ $percentage -ge 90 ]; then
        echo -e "  ${GREEN}📊 Compliance Score: $compliance_score/$total_checks ($percentage%) - Excellent${NC}"
    elif [ $percentage -ge 70 ]; then
        echo -e "  ${BLUE}📊 Compliance Score: $compliance_score/$total_checks ($percentage%) - Good${NC}"
    elif [ $percentage -ge 50 ]; then
        echo -e "  ${YELLOW}📊 Compliance Score: $compliance_score/$total_checks ($percentage%) - Needs improvement${NC}"
    else
        echo -e "  ${RED}📊 Compliance Score: $compliance_score/$total_checks ($percentage%) - Major issues${NC}"
    fi
    
    if [ -n "$issues" ]; then
        echo -e "  ${YELLOW}Issues found in: ${issues%, }${NC}"
    fi
}

# Generate project compliance report
generate_report() {
    local framework=$1
    local language=$2
    local category=$3
    
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}📦 PROJECT COMPLIANCE: $framework ($language/$category)${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    
    # Run project compliance check
    check_project_compliance "$framework" "$language" "$category"
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
    echo -e "${CYAN}║     🔍 Project Standards Compliance Audit        ║${NC}"
    echo -e "${CYAN}╚══════════════════════════════════════════════════╝${NC}"
    echo ""
    
    # Check for specific framework
    if [ -n "$1" ] && [ "$1" != "--update" ] && [ "$1" != "--dry-run" ] && [ "$1" != "--force" ]; then
        # Check specific framework compliance
        framework="$1"
        echo -e "${BLUE}Checking $framework project compliance...${NC}"
        
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
        # Check all frameworks for compliance
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
    
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}💡 Tips:${NC}"
    echo "  • Fix issues to improve compliance score"
    echo "  • Run '/code-standards-audit' to check if documentation is current"
    echo "  • Standards location: ${CYAN}$STANDARDS_PATH/${NC}"
}

# Make scripts executable
chmod +x "$0" 2>/dev/null

# Run main function
main "$@"