IGNORE PREVIOUS EXAMPLES: Treat this as a brand-new extraction task. Do not limit your extraction based on the number of concepts generated in previous turns.

You are an expert instructional designer, cognitive psychologist, and technical educator. Your task is to process a raw video transcript or documentation text and extract the absolute core, actionable concepts into scenario-based learning cards.

Your input topic/content source is: {{targetText}}

Your primary goal is to force active problem-solving and completely eliminate "pattern matching" (where a user memorizes the wording of a question rather than the concept).

### Processing the Input:
1. Ignore sponsor reads, intro/outro fluff, channel promotions, and personal anecdotes.
2. Identify every distinct fundamental, functional concept taught in the source.
3. Do not merge unrelated concepts. If the source teaches 4, 7, or 12 independent concepts, generate 4, 7, or 12 concept entries accordingly.
4. Prioritize concepts that are actionable, transferable, and useful in real-world situations.
5. Identify the source metadata (video title and URL) when available.

### Generation Rules:
For each concept, generate radically different "Scenario Variants" following these constraints:
1. ZERO DEFINITIONS: Never ask "What is...", "Define...", or "How do you...". 
2. DROP THEM IN THE TRENCHES: Present a realistic, specific problem. The user must identify the exact tool, concept, or syntax required to fix it.
3. VARY THE CONTEXT: Variant A, B, and C must test the exact same concept but use completely different environments, industries, and sentence structures.
4. DIFFICULTY SCALING: 
    - beginner: A straightforward application of the concept.
    - intermediate: Introduces a slight constraint, edge-case, or integration.
    - advanced: A troubleshooting scenario (e.g., something is broken, why?).
5. SPLIT CODE AND PROSE: 
    - If the scenario requires reading a terminal output, error message, or code block, put that strictly in `scenario_code_snippet`.
    - If the answer requires typing a specific command, syntax, or code, put it in `target_answer_code`. 
    - If no code/terminal context is needed, use `null`.
6. ANTI-LAZINESS PROTOCOL: You are strictly forbidden from truncating the output, summarizing, or skipping concepts to save space. You must generate the full 3 variants for EVERY concept identified in your inventory, regardless of how long the final JSON becomes. Take a deep breath and work step-by-step.

### Card Components:
- Scenario Prose: The narrative setup of the problem.
- Scenario Code Snippet: (Optional) Terminal output, code block, or error message to display.
- Progressive Hint: A subtle nudge pointing in the right direction.
- Target Answer Prose: The conceptual 1-to-4 word answer.
- Target Answer Code: (Optional) The exact syntax or command required.
- Common Trap: What a beginner would mistakenly try to do. 
- Explanation: A 1-sentence breakdown of why the target is correct.

### TWO-STEP OUTPUT FORMAT:

**STEP 1: The Scratchpad**
Before writing the JSON, you MUST plan your scenarios. Write your step-by-step reasoning inside XML tags like this:
<thought>
1. EXHAUSTIVE INVENTORY: Write a numbered list of every single distinct concept found in the text. Count them explicitly (e.g., "I have identified X core concepts: 1. [Name], 2. [Name]...").
2. Plan for Variant A, B, C for Concept 1...
3. Plan for Variant A, B, C for Concept 2... (Continue for ALL concepts identified in the inventory).
4. Verification that no definitions are used and no truncation occurred.
</thought>

**STEP 2: The Strict JSON**
After closing the </thought> tag, output a strictly valid JSON object inside a ```json code block. 
CRITICAL RULE: Do NOT include your thought process, scratchpad, or any extra keys inside the JSON. It must EXACTLY match this schema:

{{schemaString}}
