#!/bin/bash

# Research Feature - AI-driven feature implementation research and planning

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Base path for standards
STANDARDS_PATH=".claude/aiContext/codingStandards"

# Global variables for research
FEATURE_DESCRIPTION=""
FEATURE_TYPE=""
COMPLEXITY=""
DOMAIN=""
SCALE=""
CONSTRAINTS=""
USE_PROJECT_CONTEXT=false
EXISTING_FRAMEWORKS=""

# Parse command line arguments
parse_arguments() {
    local args=("$@")
    local i=0
    
    # First argument should be the feature description
    if [ ${#args[@]} -eq 0 ]; then
        echo -e "${RED}Error: Feature description required${NC}"
        echo "Usage: $0 \"<feature-description>\" [options]"
        echo "Options:"
        echo "  --project-context    Use existing project context"
        echo "  --domain <domain>    Specify domain (e-commerce, social, fintech, etc.)"
        echo "  --scale <scale>      Specify scale (startup, enterprise, high-traffic)"
        echo "  --constraints <list> Specify constraints (budget, timeline, team-size)"
        exit 1
    fi
    
    FEATURE_DESCRIPTION="${args[0]}"
    i=1
    
    # Parse optional arguments
    while [ $i -lt ${#args[@]} ]; do
        case "${args[$i]}" in
            --project-context)
                USE_PROJECT_CONTEXT=true
                ;;
            --domain)
                ((i++))
                if [ $i -lt ${#args[@]} ]; then
                    DOMAIN="${args[$i]}"
                fi
                ;;
            --scale)
                ((i++))
                if [ $i -lt ${#args[@]} ]; then
                    SCALE="${args[$i]}"
                fi
                ;;
            --constraints)
                ((i++))
                if [ $i -lt ${#args[@]} ]; then
                    CONSTRAINTS="${args[$i]}"
                fi
                ;;
        esac
        ((i++))
    done
}

# Classify feature type based on description
classify_feature() {
    local description="$1"
    local lower_desc=$(echo "$description" | tr '[:upper:]' '[:lower:]')
    
    # Feature type classification
    if [[ "$lower_desc" =~ (login|auth|signup|register|password|oauth|jwt|session) ]]; then
        FEATURE_TYPE="authentication"
        COMPLEXITY="moderate"
    elif [[ "$lower_desc" =~ (payment|checkout|billing|stripe|paypal|transaction) ]]; then
        FEATURE_TYPE="payment-processing"
        COMPLEXITY="complex"
    elif [[ "$lower_desc" =~ (recommend|suggestion|algorithm|ml|ai|personalize) ]]; then
        FEATURE_TYPE="recommendation-engine"
        COMPLEXITY="complex"
    elif [[ "$lower_desc" =~ (real.?time|chat|notification|websocket|live|streaming) ]]; then
        FEATURE_TYPE="real-time-features"
        COMPLEXITY="moderate"
    elif [[ "$lower_desc" =~ (search|filter|query|elasticsearch|solr) ]]; then
        FEATURE_TYPE="search-functionality"
        COMPLEXITY="moderate"
    elif [[ "$lower_desc" =~ (upload|file|image|document|storage|s3) ]]; then
        FEATURE_TYPE="file-management"
        COMPLEXITY="moderate"
    elif [[ "$lower_desc" =~ (email|sms|notification|alert|message) ]]; then
        FEATURE_TYPE="communication"
        COMPLEXITY="simple"
    elif [[ "$lower_desc" =~ (analytics|tracking|metrics|dashboard|report) ]]; then
        FEATURE_TYPE="analytics"
        COMPLEXITY="moderate"
    elif [[ "$lower_desc" =~ (api|rest|graphql|endpoint|service) ]]; then
        FEATURE_TYPE="api-development"
        COMPLEXITY="moderate"
    elif [[ "$lower_desc" =~ (crud|create|read|update|delete|database|model) ]]; then
        FEATURE_TYPE="crud-operations"
        COMPLEXITY="simple"
    else
        # Default to full-stack if not specific enough
        FEATURE_TYPE="full-stack-feature"
        COMPLEXITY="moderate"
    fi
    
    echo -e "${BLUE}📋 Feature Classification:${NC}"
    echo -e "  Type: ${CYAN}$FEATURE_TYPE${NC}"
    echo -e "  Complexity: ${CYAN}$COMPLEXITY${NC}"
    if [ -n "$DOMAIN" ]; then
        echo -e "  Domain: ${CYAN}$DOMAIN${NC}"
    fi
    if [ -n "$SCALE" ]; then
        echo -e "  Scale: ${CYAN}$SCALE${NC}"
    fi
    echo ""
}

# Check existing project context
check_project_context() {
    if [ "$USE_PROJECT_CONTEXT" = true ]; then
        echo -e "${BLUE}📂 Checking Project Context:${NC}"
        
        # Detect existing frameworks
        if [ -f "package.json" ]; then
            if grep -q '"react"' package.json; then
                EXISTING_FRAMEWORKS+="React "
            fi
            if grep -q '"vue"' package.json; then
                EXISTING_FRAMEWORKS+="Vue "
            fi
            if grep -q '"angular"' package.json; then
                EXISTING_FRAMEWORKS+="Angular "
            fi
            if grep -q '"express"' package.json; then
                EXISTING_FRAMEWORKS+="Express "
            fi
            if grep -q '"@nestjs/core"' package.json; then
                EXISTING_FRAMEWORKS+="NestJS "
            fi
        fi
        
        if [ -f "requirements.txt" ] || [ -f "pyproject.toml" ]; then
            if grep -qi "flask" requirements.txt pyproject.toml 2>/dev/null; then
                EXISTING_FRAMEWORKS+="Flask "
            fi
            if grep -qi "fastapi" requirements.txt pyproject.toml 2>/dev/null; then
                EXISTING_FRAMEWORKS+="FastAPI "
            fi
            if grep -qi "django" requirements.txt pyproject.toml 2>/dev/null; then
                EXISTING_FRAMEWORKS+="Django "
            fi
        fi
        
        if [ -n "$EXISTING_FRAMEWORKS" ]; then
            echo -e "  ${GREEN}✅ Detected frameworks: $EXISTING_FRAMEWORKS${NC}"
        else
            echo -e "  ${YELLOW}⚠️  No frameworks detected${NC}"
        fi
        echo ""
    fi
}

# Generate tech stack research prompts
research_tech_stacks() {
    echo -e "${PURPLE}🛠️  Tech Stack Research:${NC}"
    echo ""
    echo -e "${YELLOW}RESEARCH_TECH_STACKS:${NC} $FEATURE_TYPE:$DOMAIN:$SCALE"
    echo ""
    echo -e "${BLUE}📋 Research Instructions:${NC}"
    echo ""
    echo "STEP 1: CURRENT LANDSCAPE RESEARCH"
    echo "  • Use WebSearch to find 'best $FEATURE_TYPE tech stack 2025'"
    echo "  • Research 'modern $FEATURE_TYPE implementation frameworks'"
    if [ -n "$DOMAIN" ]; then
        echo "  • Search for '$DOMAIN $FEATURE_TYPE architecture examples'"
    fi
    echo "  • Find '$FEATURE_TYPE performance benchmarks 2024-2025'"
    echo "  • Research '$FEATURE_TYPE scalability patterns'"
    echo ""
    echo "STEP 2: FRAMEWORK COMPARISON"
    echo "  • Compare top 3-4 frameworks for $FEATURE_TYPE"
    echo "  • Research community adoption and GitHub stars"
    echo "  • Check documentation quality and learning curve"
    echo "  • Find real-world implementation examples"
    echo ""
    echo "STEP 3: TECHNOLOGY STACK OPTIONS"
    echo "  • Identify Option A: Modern/cutting-edge stack"
    echo "  • Identify Option B: Stable/proven stack"
    echo "  • Identify Option C: Lightweight/rapid-development stack"
    if [ -n "$EXISTING_FRAMEWORKS" ]; then
        echo "  • Consider compatibility with existing: $EXISTING_FRAMEWORKS"
    fi
    echo "  • Document trade-offs for each option"
    echo ""
    if [ -n "$CONSTRAINTS" ]; then
        echo "STEP 4: CONSTRAINT CONSIDERATIONS"
        echo "  • Factor in constraints: $CONSTRAINTS"
        echo "  • Adjust recommendations based on limitations"
        echo ""
    fi
}

# Generate methodology research prompts  
research_methodologies() {
    echo -e "${PURPLE}📚 Implementation Methodology Research:${NC}"
    echo ""
    echo -e "${YELLOW}RESEARCH_IMPLEMENTATION_METHODS:${NC} $FEATURE_TYPE"
    echo ""
    echo -e "${BLUE}📋 Research Instructions:${NC}"
    echo ""
    echo "STEP 1: BEST PRACTICES RESEARCH"
    echo "  • Use WebSearch to find '$FEATURE_TYPE implementation best practices'"
    echo "  • Research '$FEATURE_TYPE design patterns 2024-2025'"
    echo "  • Find case studies from major companies implementing $FEATURE_TYPE"
    echo "  • Search for '$FEATURE_TYPE architecture patterns'"
    echo ""
    echo "STEP 2: IMPLEMENTATION APPROACHES"
    case $FEATURE_TYPE in
        "recommendation-engine")
            echo "  • Research collaborative filtering vs content-based approaches"
            echo "  • Compare machine learning vs rule-based systems"
            echo "  • Find real-time vs batch processing patterns"
            echo "  • Research data collection and user behavior tracking"
            ;;
        "authentication")
            echo "  • Compare OAuth 2.0 vs JWT vs session-based authentication"
            echo "  • Research multi-factor authentication implementation"
            echo "  • Find social login integration patterns"
            echo "  • Research password security and hashing methods"
            ;;
        "payment-processing")
            echo "  • Compare payment gateway options (Stripe, PayPal, Square)"
            echo "  • Research PCI compliance requirements"
            echo "  • Find subscription vs one-time payment patterns"
            echo "  • Research fraud detection and security measures"
            ;;
        "real-time-features")
            echo "  • Compare WebSockets vs Server-Sent Events vs polling"
            echo "  • Research message queuing and pub/sub patterns"
            echo "  • Find real-time state synchronization approaches"
            echo "  • Research scaling real-time connections"
            ;;
        "search-functionality")
            echo "  • Compare full-text search vs fuzzy search vs semantic search"
            echo "  • Research Elasticsearch vs Solr vs database search"
            echo "  • Find search ranking and relevance algorithms"
            echo "  • Research search performance optimization"
            ;;
        *)
            echo "  • Research different architectural approaches for $FEATURE_TYPE"
            echo "  • Compare monolithic vs microservices patterns"
            echo "  • Find data modeling and storage approaches"
            echo "  • Research API design patterns"
            ;;
    esac
    echo ""
    echo "STEP 3: ALGORITHM/TECHNICAL RESEARCH"
    echo "  • Research specific algorithms or techniques for $FEATURE_TYPE"
    echo "  • Compare performance vs accuracy trade-offs"
    echo "  • Find optimization strategies and caching patterns"
    echo "  • Research testing strategies specific to $FEATURE_TYPE"
    echo ""
    echo "STEP 4: GENERATE IMPLEMENTATION PLANS"
    echo "  • Create Approach A: Industry standard/battle-tested method"
    echo "  • Create Approach B: Modern/innovative approach"
    echo "  • Include step-by-step implementation instructions"
    echo "  • Provide code examples and architectural diagrams"
    echo "  • Document integration points with existing systems"
    echo ""
}

# Generate integration recommendations
research_integration() {
    if [ "$USE_PROJECT_CONTEXT" = true ] && [ -n "$EXISTING_FRAMEWORKS" ]; then
        echo -e "${PURPLE}🔗 Project Integration Research:${NC}"
        echo ""
        echo -e "${YELLOW}RESEARCH_PROJECT_INTEGRATION:${NC} $FEATURE_TYPE:$EXISTING_FRAMEWORKS"
        echo ""
        echo -e "${BLUE}📋 Integration Instructions:${NC}"
        echo ""
        echo "STEP 1: COMPATIBILITY ANALYSIS"
        echo "  • Research compatibility of $FEATURE_TYPE with: $EXISTING_FRAMEWORKS"
        echo "  • Find integration patterns and examples"
        echo "  • Check for existing plugins or libraries"
        echo "  • Research potential conflicts or limitations"
        echo ""
        echo "STEP 2: MIGRATION PLANNING"
        echo "  • Document required changes to existing codebase"
        echo "  • Identify new dependencies and their impact"
        echo "  • Plan database schema changes if needed"
        echo "  • Research deployment and configuration changes"
        echo ""
        echo "STEP 3: TESTING STRATEGY"
        echo "  • Plan integration testing with existing features"
        echo "  • Research testing frameworks compatible with current setup"
        echo "  • Document potential breaking changes"
        echo "  • Plan rollback strategies"
        echo ""
    fi
}

# Generate final recommendations prompt
generate_final_prompt() {
    echo -e "${PURPLE}📊 Final Research Report Generation:${NC}"
    echo ""
    echo -e "${YELLOW}GENERATE_FEATURE_RESEARCH_REPORT:${NC} $FEATURE_TYPE"
    echo ""
    echo -e "${BLUE}📋 Report Generation Instructions:${NC}"
    echo ""
    echo "Using all research findings above, create a comprehensive report with:"
    echo ""
    echo "1. EXECUTIVE SUMMARY"
    echo "   • Feature description and classification"
    echo "   • Recommended approach and reasoning"
    echo "   • Implementation timeline estimate"
    echo ""
    echo "2. TECH STACK OPTIONS (minimum 3)"
    echo "   • Option A: Modern/cutting-edge with pros/cons"
    echo "   • Option B: Stable/proven with pros/cons"
    echo "   • Option C: Lightweight/rapid with pros/cons"
    if [ -n "$EXISTING_FRAMEWORKS" ]; then
        echo "   • Integration recommendations for existing: $EXISTING_FRAMEWORKS"
    fi
    echo ""
    echo "3. IMPLEMENTATION APPROACHES (minimum 2)"
    echo "   • Approach A: Industry standard with step-by-step instructions"
    echo "   • Approach B: Modern/innovative with step-by-step instructions"
    echo "   • Code examples and architectural patterns"
    echo "   • Testing and deployment strategies"
    echo ""
    echo "4. RESOURCE REQUIREMENTS"
    echo "   • Development time estimates"
    echo "   • Team skill requirements"
    echo "   • Infrastructure needs"
    if [ -n "$CONSTRAINTS" ]; then
        echo "   • Constraint considerations: $CONSTRAINTS"
    fi
    echo ""
    echo "5. NEXT STEPS"
    echo "   • Immediate action items"
    echo "   • Research validation steps"
    echo "   • Prototype development plan"
    echo ""
    echo -e "${GREEN}IMPORTANT:${NC} Ensure all recommendations are based on current (2024-2025) best practices"
    echo "and include specific, actionable instructions that can be followed by an AI development agent."
}

# Main execution
main() {
    echo -e "${CYAN}╔══════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║           🔬 Feature Research Assistant           ║${NC}"
    echo -e "${CYAN}╚══════════════════════════════════════════════════╝${NC}"
    echo ""
    
    # Parse command line arguments
    parse_arguments "$@"
    
    # Display feature description
    echo -e "${BLUE}🎯 Feature Description:${NC}"
    echo -e "  \"${YELLOW}$FEATURE_DESCRIPTION${NC}\""
    echo ""
    
    # Classify the feature
    classify_feature "$FEATURE_DESCRIPTION"
    
    # Check project context if requested
    check_project_context
    
    # Generate research prompts
    research_tech_stacks
    research_methodologies
    research_integration
    generate_final_prompt
    
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}💡 Next Steps:${NC}"
    echo "  1. Follow the research instructions above to gather current information"
    echo "  2. Use WebSearch extensively to find latest best practices"
    echo "  3. Create temporary research files in .claude/aiContext/temp_research/"
    echo "  4. Generate the final report based on findings"
    echo "  5. Clean up temporary files after report generation"
    echo ""
    echo -e "${YELLOW}📝 Note:${NC} All research should focus on current (2024-2025) practices and"
    echo "provide actionable instructions suitable for AI-assisted development."
}

# Make script executable
chmod +x "$0" 2>/dev/null

# Run main function
main "$@"