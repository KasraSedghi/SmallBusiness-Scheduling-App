# Git, Testing, and Logging Workflow

## Core Directives
- **Zero Conflicts:** Before any commit or push, verify that no merge conflicts exist.
- **Micro-Testing Principle:** Write isolated unit tests that target small, specific pieces of functionality. Avoid broad tests that check too much at once.
- **Verification Loop:** Run integration and unit tests before any commit. If errors occur, abort the push, debug the issue, clear out stale tests, and rerun the suite until it passes completely.
- **Documentation Updates:** Always update the README.md or relevant design documents immediately if a code change impacts their contents.
- **No Rogue Files:** Do not create additional markdown or tracking files in the repository unless explicitly instructed by the user.

## Logging Standards
- Use `info!()` log messages exclusively for critical paths where human operators need operational visibility. Do not overwhelm the system output.
- Use `debug!()` logs for deep technical trace points and structural troubleshooting.
- When debugging an issue, always parse existing logs and read documentation first to understand the system's logging patterns.

## Commit Message Formatting
Every commit message must strictly adhere to the following structure:
1. A single-sentence summary of the change at the top. 
2. A few paragraphs explaining the technical changes and the verification/testing steps taken.
3. A final line prefixed with "Prompt: " containing the exact prompt the user used to trigger the task.