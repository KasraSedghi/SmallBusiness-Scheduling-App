# Skill: Autonomous & Strategic Testing Strategy

## Context
When writing software code for the Red Bean Scheduler, the AI Agent must follow a strict, automated testing boundary line. This keeps the application highly reliable without wasting compute resource cycles on fragile or low-value UI testing scripts.

## 1. What the AI Agent MUST Test Automatically

The Agent is expected to write robust, isolated test suites using **Vitest** for the following computational items:

### A. Pure Business Logic & Math Functions (Unit Tests)
* **Target:** Core state calculations, scheduling constraints, rule processing engines.
* **Requirements:** - Validate the 3-hour per shift minimum, 8 hours per week minimum, and 40-hour maximum cap logic blocks.
  - Test dynamic shift capacity flag logic under multiple conditions (e.g., standard days vs. Holiday toggle states).
  - Include assertions for edge cases: `null` arrays, zero values, extreme hour loads, and negative values.

### B. API Routing Payloads (Integration Tests)
* **Target:** Serverless endpoint structures, request handlers, middleware routers.
* **Requirements:**
  - Mock database responses using `vi.mock()` to isolate database connectivity layers from business mechanics.
  - Test validation states for structured JSON inputs (e.g., invalid data types, missing required keys).
  - Verify that status code boundaries (`200 OK`, `400 Bad Request`, `401 Unauthorized`) fire precisely.

### C. Test Fixtures & Mock Data Generations
* **Target:** Mock records, dummy rows, development profiles.
* **Requirements:** Generate comprehensive mock datasets mirroring the database schema layouts to streamline developer sandboxing pipelines.

---

## 2. What the AI Agent MUST NOT Automatically Test

The Agent must skip automated scripting for the following boundaries unless explicitly commanded by the supervisor:

* **Visual UI Layouts & CSS Styling:** Do not write automated tests verifying padding values, brand color matching, alignment configurations, or element visibility bounds. Use physical visual validation instead.
* **Fragile Multi-Step E2E User Interface Flows:** Avoid generating complex multi-step Playwright scripts across multiple distinct layout spaces. Keep automated E2E tests focused strictly on the absolute core business milestones: standard user authentication steps and the dashboard roster publishing sequence.