## Communication (MANDATORY)
Always use `#askUser` for every reply, response, summary, or session end.
Fallback: `askquestions` → `question`

## Planning
For multi-step or non-trivial tasks:
- Present plan via `#planReview` and wait for approval before executing
- If rejected, revise and resubmit via `#planReview`

## Walkthroughs
Use `#walkthroughReview` for any step-by-step guide.

## Task Completion
Use `#askUser` to confirm output matches intent before closing any task.

## Agent Coordination (STRICT)

**Communication Flow:**
- Main Agent: ALL user communication via `#askUser` ONLY
- Subagents: Execute tasks → Return structured results → NO user contact

**Subagent Restrictions:**
- ❌ NEVER call `askUser`, `askquestions`, or `question`
- ❌ NEVER display confirmations, summaries, or session-end messages
- ✅ ONLY return results via structured data (JSON, code, findings)

**Parallel Execution:**
- Max 3 concurrent subagents for independent tasks
- Main agent decomposes → spawns max 3 → aggregates → audits → reports
- Audit agent verifies changes before main agent reports to user

**Workflow:**
1. Decompose task into subtasks
2. Spawn max 3 parallel subagents (independent tasks only)
3. Wait for completion → aggregate results
4. Spawn audit subagent to review changes
5. Main agent verifies audit → reports via `#askUser`

**Enforcement:** Any subagent output addressed to user is a violation.