# Research Feature

AI-driven feature implementation research and planning assistant that provides comprehensive technology stack recommendations and implementation approaches.

## Purpose
Performs intelligent feature research that:
- **Classifies features** automatically based on description
- **Researches current tech stacks** with multiple viable options
- **Provides implementation methodologies** specific to feature type
- **Integrates with existing projects** when context is available
- **Generates actionable instructions** ready for AI-assisted development

## Usage

### Basic Feature Research
```bash
/research-feature "user authentication system"
/research-feature "recommendation engine"
/research-feature "real-time chat functionality"
```

### With Project Context
```bash
/research-feature "payment processing" --project-context
```
Analyzes existing frameworks and provides compatible recommendations.

### With Domain and Scale
```bash
/research-feature "search functionality" --domain e-commerce --scale enterprise
/research-feature "analytics dashboard" --domain fintech --scale startup
```

### With Constraints
```bash
/research-feature "file upload system" --constraints "budget-friendly, 2-week timeline, small team"
```

### Full Example
```bash
/research-feature "recommendation engine for e-commerce" --project-context --domain e-commerce --scale enterprise --constraints "3-month timeline, budget-conscious"
```

## Feature Classification

The command automatically identifies feature types and adjusts research accordingly:

### Supported Feature Types
- **Authentication** - Login, signup, OAuth, JWT, sessions
- **Payment Processing** - Checkout, billing, transactions, gateways
- **Recommendation Engine** - ML recommendations, personalization
- **Real-time Features** - Chat, notifications, WebSockets, live updates
- **Search Functionality** - Full-text search, filtering, Elasticsearch
- **File Management** - Upload, storage, document processing
- **Communication** - Email, SMS, notifications, messaging
- **Analytics** - Tracking, metrics, dashboards, reporting
- **API Development** - REST, GraphQL, endpoints, services
- **CRUD Operations** - Database operations, models, basic functionality
- **Full-stack Feature** - Complex features requiring multiple components

## Research Output

### Comprehensive Research Instructions
Each command generates structured research prompts for AI agents:

```
🛠️ Tech Stack Research:
RESEARCH_TECH_STACKS: authentication:fintech:enterprise

📋 Research Instructions:
STEP 1: CURRENT LANDSCAPE RESEARCH
• Use WebSearch to find 'best authentication tech stack 2025'
• Research 'modern authentication implementation frameworks'
• Find 'fintech authentication architecture examples'

STEP 2: FRAMEWORK COMPARISON
• Compare top 3-4 frameworks for authentication
• Research community adoption and GitHub stars
• Check documentation quality and learning curve

STEP 3: TECHNOLOGY STACK OPTIONS
• Identify Option A: Modern/cutting-edge stack
• Identify Option B: Stable/proven stack  
• Identify Option C: Lightweight/rapid-development stack
```

### Feature-Specific Methodology Research
Tailored implementation approaches based on feature type:

#### Authentication Features
- OAuth 2.0 vs JWT vs session-based approaches
- Multi-factor authentication implementation
- Social login integration patterns
- Password security and hashing methods

#### Recommendation Engines
- Collaborative filtering vs content-based approaches
- Machine learning vs rule-based systems
- Real-time vs batch processing patterns
- Data collection and user behavior tracking

#### Real-time Features
- WebSockets vs Server-Sent Events vs polling
- Message queuing and pub/sub patterns
- Real-time state synchronization approaches
- Scaling real-time connections

### Project Integration Research
When `--project-context` is used:

```
🔗 Project Integration Research:
RESEARCH_PROJECT_INTEGRATION: authentication:React Express

📋 Integration Instructions:
STEP 1: COMPATIBILITY ANALYSIS
• Research compatibility of authentication with: React Express
• Find integration patterns and examples
• Check for existing plugins or libraries

STEP 2: MIGRATION PLANNING
• Document required changes to existing codebase
• Identify new dependencies and their impact
• Plan database schema changes if needed
```

## Project Context Detection

### Automatic Framework Detection
When `--project-context` is enabled, the command detects:

#### JavaScript/TypeScript Projects
- **React** - from package.json dependencies
- **Vue** - from package.json dependencies  
- **Angular** - from @angular/core in package.json
- **Express** - from express in package.json
- **NestJS** - from @nestjs/core in package.json

#### Python Projects  
- **Flask** - from requirements.txt or pyproject.toml
- **FastAPI** - from requirements.txt or pyproject.toml
- **Django** - from requirements.txt or pyproject.toml

### Integration Benefits
- **Compatible recommendations** - Suggests technologies that work with existing stack
- **Migration guidance** - Provides specific integration steps
- **Conflict avoidance** - Identifies potential compatibility issues
- **Leverages existing standards** - Uses initialized coding standards for context

## AI Agent Workflow

### Research Execution Steps
1. **Parse feature description** and classify automatically
2. **Execute WebSearch commands** to find current best practices
3. **Create temporary research files** in `.claude/aiContext/temp_research/`
4. **Compile findings** into structured recommendations
5. **Generate final report** with actionable instructions
6. **Clean up temporary files** after completion

### Research Quality Guidelines
- **Current focus** - All research emphasizes 2024-2025 practices
- **Multiple sources** - Verify recommendations across sources
- **Real-world examples** - Include production implementation cases
- **Actionable instructions** - Provide step-by-step guidance for AI agents

## Output Format

### Expected Final Report Structure
```
=== Feature Research Report ===

🎯 FEATURE: recommendation engine for e-commerce
📊 COMPLEXITY: complex
🏷️ CATEGORY: recommendation-engine

🛠️ RECOMMENDED TECH STACKS:

Option A: Modern/Cutting-Edge
├─ Backend: Python + FastAPI + PostgreSQL + Redis
├─ ML Pipeline: Apache Airflow + MLflow + Docker
├─ Analytics: Apache Kafka + ClickHouse
└─ Trade-offs: Latest ML capabilities, learning curve

Option B: Stable/Proven  
├─ Backend: Python + Django + PostgreSQL + Celery
├─ ML Pipeline: Jenkins + scikit-learn + Docker
├─ Analytics: RabbitMQ + PostgreSQL
└─ Trade-offs: Battle-tested, extensive documentation

Option C: Lightweight/Rapid
├─ Backend: Node.js + Express + MongoDB
├─ ML Pipeline: Simple cron jobs + TensorFlow.js
├─ Analytics: MongoDB aggregation
└─ Trade-offs: Fast development, limited ML capabilities

📋 IMPLEMENTATION APPROACHES:

Approach A: Collaborative Filtering
├─ Algorithm: Matrix factorization with implicit feedback
├─ Data: User behavior tracking + purchase history
├─ Implementation: Surprise library + Redis caching
└─ Instructions: [Detailed AI-ready steps]

Approach B: Hybrid Content + Collaborative
├─ Algorithm: Content similarity + user preferences
├─ Data: Product features + user interactions
├─ Implementation: scikit-learn + custom pipeline
└─ Instructions: [Detailed AI-ready steps]
```

## Integration with Standards System

### Recommended Workflow
1. **Feature Research**: `/research-feature "user authentication"`
2. **Standards Setup**: `/code-standards-init <recommended-framework>`
3. **Implementation**: Use research output to guide development
4. **Compliance Check**: `/project-standards-audit` to verify implementation

### Context Sharing
- **Leverages existing standards** for compatible recommendations
- **Provides framework-specific guidance** when context is available
- **Suggests standards initialization** for new technology choices

## Examples

### Simple Feature Research
```bash
/research-feature "file upload functionality"
```
Provides general file upload research without project constraints.

### E-commerce Feature with Context
```bash
/research-feature "product search and filtering" --project-context --domain e-commerce
```
Analyzes existing project and provides e-commerce-specific search recommendations.

### Enterprise Feature with Constraints
```bash
/research-feature "real-time notifications" --scale enterprise --constraints "high-availability, 1-month timeline"
```
Researches enterprise-grade notification systems within timeline constraints.

### Full-Stack Feature Planning
```bash
/research-feature "social media platform with feeds and messaging" --domain social --scale startup
```
Comprehensive research for complex social media features at startup scale.

## Notes

- **AI-optimized output** - All instructions designed for AI agent consumption
- **Current best practices** - Focuses on 2024-2025 industry standards
- **Multiple options** - Always provides 3+ technology choices
- **Implementation-ready** - Includes step-by-step development guidance
- **Context-aware** - Integrates with existing project setup when available
- **Constraint-conscious** - Adapts recommendations to specified limitations