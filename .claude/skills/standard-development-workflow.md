# Standard Development Workflow & Architecture Alignment

## Discovery Phase
- Before editing or writing a service, locate and read its design documentation. If no document exists, analyze the local file context thoroughly.
- Ask questions to clarify ambiguity. Do not make blind assumptions about business logic or architecture.
- Make sure to not hard code routings 

## Scope & Token Efficiency
- Do not make unauthorized changes outside the scope of the original prompt.
- **Efficiency Exception:** If you identify a significantly more efficient, cost-effective, or token-saving solution, halt and present a clear argument to the user. Ask for explicit permission before executing it.
- **Quick Fixes:** If a superior solution is a trivial, low-risk fix, implement it, but explicitly flag it to the engineer afterward for double-checking.