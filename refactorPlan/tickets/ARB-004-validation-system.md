# ARB-004: Self-RAG Validation Layer

**Status**: 🔶 READY
**Priority**: P0 - Blocker
**Epic**: ARB-EPIC-001
**Effort**: 18-20 hours
**Assignee**: @kmoffett

---

## Description

Implement a Self-RAG validation layer that verifies every answer against source documents, detects hallucinations, provides confidence scoring, and tracks source provenance. This is what makes Arbiter trustworthy and differentiates it from Cogitator.

---

## Goals

1. Validate answers are supported by source documents
2. Detect hallucinations and unsupported claims
3. Provide confidence scores for all answers
4. Track source provenance (citations)
5. Enable self-correction when confidence is low

---

## Acceptance Criteria

### Must Have

- [ ] **Validation Pipeline** implemented
  - [ ] Relevance check (ISREL): Are sources relevant to query?
  - [ ] Support check (ISSUP): Is answer supported by sources?
  - [ ] Usefulness check (ISUSE): Does answer address the query?
  - [ ] Confidence scoring: 0.0 - 1.0

- [ ] **Hallucination Detection** implemented
  - [ ] Extract factual claims from answers
  - [ ] Verify each claim against sources
  - [ ] Flag unsupported claims
  - [ ] Compute hallucination score

- [ ] **Provenance Tracking** implemented
  - [ ] Citation for every claim
  - [ ] Source document metadata
  - [ ] Chunk-level references
  - [ ] Vector search scores preserved

- [ ] **Confidence Gating** implemented
  - [ ] If confidence >= threshold (0.7): Return answer
  - [ ] If confidence < threshold: Trigger retry or reject
  - [ ] If hallucinations detected: Regenerate or reject

- [ ] **Integration with Tool System**
  - [ ] Validation as MCP tool (can be called by orchestrator)
  - [ ] Automatic validation for all synthesis steps
  - [ ] Results include validation metadata

### Should Have

- [ ] Self-correction loop (retry with better prompt if low confidence)
- [ ] Contradiction detection (internal consistency check)
- [ ] Source quality scoring

### Nice to Have

- [ ] Learning from user corrections
- [ ] Adaptive confidence thresholds
- [ ] Validation explanation generation

---

## Implementation Plan

### Phase 1: Validation Pipeline (6-8 hours)

**Files to Create**:
```
src/engine/validation/
├── SelfRAGValidator.ts
├── RelevanceChecker.ts
├── SupportChecker.ts
├── UsefulnessChecker.ts
├── ConfidenceScorer.ts
└── interfaces/
    ├── ISelfRAGValidator.ts
    └── IValidationResult.ts
```

**Implementation Steps**:

1. **Create Validation Interfaces**
```typescript
interface ISelfRAGValidator {
  validate(
    query: string,
    answer: string,
    sources: ISource[]
  ): Promise<IValidationResult>;
}

interface IValidationResult {
  isRelevant: boolean;
  isSupported: boolean;
  isUseful: boolean;
  confidence: number;
  reasoning: string;
  citations: ICitation[];
  issues: IValidationIssue[];
  recommendation: 'accept' | 'retry' | 'reject';
}

enum ValidationType {
  RELEVANCE = 'relevance',
  SUPPORT = 'support',
  USEFULNESS = 'usefulness',
  HALLUCINATION = 'hallucination',
  COMPLETENESS = 'completeness',
  CONSISTENCY = 'consistency'
}

interface IValidationIssue {
  type: ValidationType;
  severity: 'error' | 'warning' | 'info';
  message: string;
  claim?: string;
  suggestion?: string;
}
```

2. **Implement RelevanceChecker (ISREL Token)**
   - Use LLM to check if sources are relevant to query
   - Prompt: "Are these documents relevant for answering this question?"
   - Output: relevant | irrelevant + reasoning

   **Implementation**:
   ```typescript
   async checkRelevance(
     query: string,
     sources: ISource[]
   ): Promise<{ isRelevant: boolean; reasoning: string }> {
     const prompt = `
       **Question**: ${query}

       **Retrieved Documents**:
       ${sources.map(s => s.content).join('\n\n---\n\n')}

       Are these documents relevant for answering the question?
       Respond with JSON:
       {
         "isRelevant": true/false,
         "reasoning": "..."
       }
     `;

     const response = await this.llm.generate(prompt);
     return JSON.parse(response);
   }
   ```

3. **Implement SupportChecker (ISSUP Token)**
   - Use LLM to check if answer is supported by sources
   - Prompt: "Is this answer fully supported by these documents?"
   - Output: fully_supported | partially_supported | no_support + reasoning

   **Implementation**:
   ```typescript
   async checkSupport(
     answer: string,
     sources: ISource[]
   ): Promise<{
     supportLevel: 'full' | 'partial' | 'none';
     reasoning: string;
     unsupportedClaims: string[];
   }> {
     const prompt = `
       **Answer**: ${answer}

       **Source Documents**:
       ${sources.map(s => s.content).join('\n\n---\n\n')}

       Is the answer fully supported by the sources?
       Identify any claims not supported by the documents.

       Respond with JSON:
       {
         "supportLevel": "full" | "partial" | "none",
         "reasoning": "...",
         "unsupportedClaims": ["claim1", "claim2"]
       }
     `;

     const response = await this.llm.generate(prompt);
     return JSON.parse(response);
   }
   ```

4. **Implement UsefulnessChecker (ISUSE Token)**
   - Use LLM to check if answer addresses the user's question
   - Prompt: "Does this answer adequately address the question?"
   - Output: useful | not_useful + reasoning

   **Implementation**:
   ```typescript
   async checkUsefulness(
     query: string,
     answer: string
   ): Promise<{ isUseful: boolean; reasoning: string }> {
     const prompt = `
       **Question**: ${query}
       **Answer**: ${answer}

       Does this answer adequately address the question?
       Is it complete, relevant, and helpful?

       Respond with JSON:
       {
         "isUseful": true/false,
         "reasoning": "..."
       }
     `;

     const response = await this.llm.generate(prompt);
     return JSON.parse(response);
   }
   ```

5. **Implement ConfidenceScorer**
   - Aggregate relevance + support + usefulness into single confidence score
   - Formula: `confidence = (relevance_score + support_score + usefulness_score) / 3`
   - Adjust weights based on validation type:
     - Factual queries: Support is most important (50%)
     - Conversational: Usefulness is most important (50%)

   **Implementation**:
   ```typescript
   computeConfidence(
     isRelevant: boolean,
     supportLevel: 'full' | 'partial' | 'none',
     isUseful: boolean,
     queryType: QueryType
   ): number {
     const relevanceScore = isRelevant ? 1.0 : 0.0;

     let supportScore = 0.0;
     if (supportLevel === 'full') supportScore = 1.0;
     else if (supportLevel === 'partial') supportScore = 0.5;

     const usefulnessScore = isUseful ? 1.0 : 0.0;

     // Weighted average based on query type
     let weights = { relevance: 0.3, support: 0.4, usefulness: 0.3 };
     if (queryType === QueryType.CONVERSATIONAL) {
       weights = { relevance: 0.2, support: 0.3, usefulness: 0.5 };
     }

     return (
       relevanceScore * weights.relevance +
       supportScore * weights.support +
       usefulnessScore * weights.usefulness
     );
   }
   ```

**Testing**:
- Fully supported answer → confidence >= 0.9
- Partially supported answer → confidence ~0.5-0.7
- Unsupported answer → confidence <0.3
- Irrelevant sources → confidence <0.5

---

### Phase 2: Hallucination Detection (6-8 hours)

**Files to Create**:
```
src/engine/validation/
├── HallucinationDetector.ts
├── ClaimExtractor.ts
├── ClaimVerifier.ts
└── interfaces/
    ├── IHallucinationDetector.ts
    ├── IClaim.ts
    └── IHallucinationReport.ts
```

**Implementation Steps**:

1. **Create Hallucination Interfaces**
```typescript
interface IHallucinationDetector {
  detect(answer: string, sources: ISource[]): Promise<IHallucinationReport>;
  extractClaims(answer: string): Promise<IClaim[]>;
  verifyClaim(claim: IClaim, sources: ISource[]): Promise<IVerificationResult>;
}

interface IClaim {
  text: string;
  type: 'fact' | 'opinion' | 'inference';
  confidence: number;
}

interface IVerificationResult {
  claim: IClaim;
  isSupported: boolean;
  supportingSources: ISource[];
  similarityScore: number;
  reasoning: string;
}

interface IHallucinationReport {
  hasHallucinations: boolean;
  hallucinations: IClaim[];
  confidence: number;
  recommendation: 'accept' | 'regenerate' | 'reject';
}
```

2. **Implement ClaimExtractor**
   - Use LLM to extract factual claims from answer
   - Prompt: "Extract all factual claims from this answer"
   - Filter to verification-worthy claims (facts, not opinions)

   **Implementation**:
   ```typescript
   async extractClaims(answer: string): Promise<IClaim[]> {
     const prompt = `
       Extract all factual claims from this answer.
       Focus on verification-worthy facts (stats, rules, costs, etc.).

       **Answer**: ${answer}

       Respond with JSON array:
       [
         {
           "text": "Terminators have 3 wounds",
           "type": "fact",
           "confidence": 0.9
         }
       ]
     `;

     const response = await this.llm.generate(prompt);
     return JSON.parse(response);
   }
   ```

3. **Implement ClaimVerifier**
   - For each claim, find supporting source
   - Use semantic similarity to match claim to source chunks
   - If no high-similarity match → potential hallucination

   **Implementation**:
   ```typescript
   async verifyClaim(
     claim: IClaim,
     sources: ISource[]
   ): Promise<IVerificationResult> {
     // Embed claim
     const claimEmbedding = await this.embeddingService.embed(claim.text);

     // Compare to each source chunk
     let bestMatch: ISource | null = null;
     let bestScore = 0;

     for (const source of sources) {
       const sourceEmbedding = await this.embeddingService.embed(source.content);
       const similarity = this.cosineSimilarity(claimEmbedding, sourceEmbedding);

       if (similarity > bestScore) {
         bestScore = similarity;
         bestMatch = source;
       }
     }

     // Threshold: 0.8 = supported, <0.8 = potential hallucination
     const isSupported = bestScore >= 0.8;

     return {
       claim,
       isSupported,
       supportingSources: bestMatch ? [bestMatch] : [],
       similarityScore: bestScore,
       reasoning: isSupported
         ? `Claim supported by source (similarity: ${bestScore.toFixed(2)})`
         : `No supporting source found (best similarity: ${bestScore.toFixed(2)})`
     };
   }
   ```

4. **Implement HallucinationDetector**
   - Extract claims
   - Verify each claim
   - Compute hallucination score
   - Make recommendation

   **Implementation**:
   ```typescript
   async detect(
     answer: string,
     sources: ISource[]
   ): Promise<IHallucinationReport> {
     // Extract claims
     const claims = await this.extractClaims(answer);

     // Verify each claim
     const verifications = await Promise.all(
       claims.map(claim => this.verifyClaim(claim, sources))
     );

     // Find hallucinations
     const hallucinations = verifications
       .filter(v => !v.isSupported)
       .map(v => v.claim);

     const hallucinationRate = hallucinations.length / claims.length;

     // Recommendation
     let recommendation: 'accept' | 'regenerate' | 'reject' = 'accept';
     if (hallucinationRate > 0.3) recommendation = 'reject';
     else if (hallucinationRate > 0.1) recommendation = 'regenerate';

     return {
       hasHallucinations: hallucinations.length > 0,
       hallucinations,
       confidence: 1 - hallucinationRate,
       recommendation
     };
   }
   ```

**Testing**:
- Fully accurate answer → no hallucinations detected
- Answer with 1 unsupported claim → hallucination detected
- Answer with 50% false claims → recommendation = 'reject'

---

### Phase 3: Provenance Tracking (3-4 hours)

**Files to Create**:
```
src/engine/validation/
├── ProvenanceTracker.ts
└── interfaces/
    ├── ICitation.ts
    └── ISource.ts
```

**Implementation Steps**:

1. **Create Provenance Interfaces**
```typescript
interface ICitation {
  claim: string;
  sources: ISource[];
  confidence: number;
  verificationMethod: 'semantic_similarity' | 'exact_match' | 'llm_verification';
}

interface ISource {
  id: string;
  document: string;
  chunkId: string;
  content: string;
  metadata: {
    title?: string;
    page?: number;
    section?: string;
    url?: string;
    domain?: string;
  };
  score: number;  // Vector search score
  embedding?: number[];
}
```

2. **Implement ProvenanceTracker**
   - Map each claim to supporting sources
   - Preserve vector search scores
   - Include metadata for user-facing citations

   **Implementation**:
   ```typescript
   async trackProvenance(
     claims: IClaim[],
     verifications: IVerificationResult[]
   ): Promise<ICitation[]> {
     return verifications.map(v => ({
       claim: v.claim.text,
       sources: v.supportingSources,
       confidence: v.similarityScore,
       verificationMethod: 'semantic_similarity'
     }));
   }
   ```

3. **Format Citations for Display**
   ```typescript
   formatCitations(citations: ICitation[]): string {
     return citations.map(c => {
       const sources = c.sources.map(s => {
         const meta = s.metadata;
         return `${meta.title} (pg. ${meta.page})`;
       }).join(', ');

       return `- "${c.claim}" - Sources: ${sources}`;
     }).join('\n');
   }
   ```

**Testing**:
- Verify each claim has associated sources
- Verify metadata is preserved
- Verify citation formatting is readable

---

### Phase 4: Confidence Gating & Self-Correction (3-4 hours)

**Files to Create**:
```
src/engine/validation/
├── ConfidenceGate.ts
├── SelfCorrector.ts
└── interfaces/
    └── IConfidenceGate.ts
```

**Implementation Steps**:

1. **Implement ConfidenceGate**
   - Check if confidence meets threshold
   - If yes: Accept answer
   - If no: Trigger retry or reject

   **Implementation**:
   ```typescript
   interface IConfidenceGate {
     shouldAccept(
       validationResult: IValidationResult,
       threshold: number
     ): boolean;

     getRecommendation(
       validationResult: IValidationResult
     ): 'accept' | 'retry' | 'reject';
   }

   class ConfidenceGate implements IConfidenceGate {
     shouldAccept(result: IValidationResult, threshold = 0.7): boolean {
       return result.confidence >= threshold && !result.issues.some(i => i.severity === 'error');
     }

     getRecommendation(result: IValidationResult): 'accept' | 'retry' | 'reject' {
       if (result.confidence >= 0.7 && result.isSupported) return 'accept';
       if (result.confidence >= 0.4 || result.isSupported === false) return 'retry';
       return 'reject';
     }
   }
   ```

2. **Implement SelfCorrector**
   - If low confidence: Retry with improved prompt
   - If hallucinations: Regenerate with explicit grounding instructions
   - Max 2 retries, then reject

   **Implementation**:
   ```typescript
   interface ISelfCorrector {
     correct(
       query: string,
       answer: string,
       validationResult: IValidationResult,
       sources: ISource[]
     ): Promise<string>;
   }

   class SelfCorrector implements ISelfCorrector {
     async correct(
       query: string,
       answer: string,
       validationResult: IValidationResult,
       sources: ISource[]
     ): Promise<string> {
       // Build correction prompt
       const issues = validationResult.issues.map(i => i.message).join('\n');

       const prompt = `
         The previous answer had issues:
         ${issues}

         **Question**: ${query}

         **Source Documents**:
         ${sources.map(s => s.content).join('\n\n---\n\n')}

         **Instructions**:
         - Only use information from the source documents
         - If information is not in sources, say "I don't have that information"
         - Cite specific sources for claims

         Provide a corrected answer:
       `;

       const correctedAnswer = await this.llm.generate(prompt);
       return correctedAnswer;
     }
   }
   ```

**Testing**:
- Low confidence answer → retry triggered
- Second attempt has higher confidence → accepted
- Hallucination detected → regenerate with grounding
- Still low confidence after 2 retries → reject

---

## Technical Details

### Reusable Components from Cogitator

**Concepts Only (Don't Copy)**:
- Confidence scoring patterns
- Self-correction loop concepts

**New Dependencies**:
- None (use existing LLM and embedding services)

---

## Configuration

**Environment Variables**:
```bash
# Validation
VALIDATION_ENABLED=true
VALIDATION_CONFIDENCE_THRESHOLD=0.7
VALIDATION_LLM=anthropic  # or 'ollama'
VALIDATION_MODEL=claude-sonnet-4

# Hallucination Detection
HALLUCINATION_DETECTION_ENABLED=true
HALLUCINATION_SIMILARITY_THRESHOLD=0.8
HALLUCINATION_MAX_RATE=0.1  # 10% max hallucinations

# Self-Correction
SELF_CORRECTION_ENABLED=true
SELF_CORRECTION_MAX_RETRIES=2
```

---

## Risks & Mitigations

### Risk: Validation is Too Slow
**Mitigation**: Run validation steps in parallel. Cache validation results.

### Risk: False Positives (Correct Answers Rejected)
**Mitigation**: Tune thresholds carefully. Start conservative (low threshold).

### Risk: Semantic Similarity Misses Paraphrases
**Mitigation**: Use LLM verification as fallback if similarity is borderline (0.7-0.8).

---

## Success Metrics

- [ ] Validation accuracy >95% (manual review of 100 queries)
- [ ] Hallucination detection catches >90% of false claims
- [ ] False positive rate <10% (correct answers not rejected)
- [ ] Self-correction improves confidence by average 0.2
- [ ] Citations are accurate and complete

---

## Dependencies

- **Blockers**:
  - ARB-001 (Base Repo) - ✅ Complete
  - ARB-002 (Context System) - Provides queries
  - ARB-003 (Tool Planning) - Provides tool results to validate

---

## Follow-up Tasks

After completion:
- ARB-005: MCP Server (expose validation as MCP tool)
- ARB-007: Integration & Testing (end-to-end validation)

---

## Notes

- Validation is what makes Arbiter trustworthy
- Start with high thresholds (strict validation)
- Tune thresholds based on real-world performance
- Log all validation decisions for analysis

---

**Created**: 2025-10-20
**Last Updated**: 2025-10-20
**Status**: Ready for Development
