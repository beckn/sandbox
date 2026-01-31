# Agentic Coding Guidelines for Sandbox Repository

This document contains guidelines for AI agents (and human developers) working in this repository. 
Adhere to these conventions to ensure code quality and consistency.

## 1. Environment & Commands

### Project Structure
- **Language:** TypeScript (Node.js)
- **Framework:** Express
- **Database:** MongoDB (using `mongodb` driver directly)
- **Testing:** Jest
- **Package Manager:** npm

### Build & Run
- **Install Dependencies:** `npm install`
- **Development Server:** `npm run dev` (uses `ts-node-dev`)
- **Build:** `npm run build` (outputs to `dist/`)
- **Start Production:** `npm start`
- **Database Seed:** `npm run seed`

### Testing
- **Run All Tests:** `npm test`
- **Run Single Test File:** `npm test -- <path/to/file>`
  - *Example:* `npm test -- src/webhook/controller.test.ts`
- **Run Specific Test Case:** `npm test -- -t "<pattern>"`
  - *Example:* `npm test -- -t "should return valid when context has bpp_uri"`
- **Test Coverage:** `npm run test:coverage`
- **Unit Tests Only:** `npm run test:unit`
- **Integration Tests Only:** `npm run test:integration`

### Linting & Formatting
- **Linter:** No explicit linter is currently configured in `package.json`.
- **Formatting:** Mimic existing code style (see below). 
- **Type Checking:** Run `npm run build` to verify types.

## 2. Code Style & Conventions

### Formatting
- **Indentation:** 2 spaces.
- **Quotes:** Double quotes (`"`) for strings.
- **Semicolons:** Always use semicolons at the end of statements.
- **Line Length:** Aim for ~80-100 characters.

### Naming Conventions
- **Variables & Functions:** `camelCase` (e.g., `webhookRoutes`, `validateContext`, `getCallbackUrl`).
- **Files:** `kebab-case` (e.g., `controller.test.ts`, `routes.ts`).
- **Interfaces/Types:** `PascalCase` (though none explicitly seen in snippets, standard TS convention).
- **Constants:** `UPPER_SNAKE_CASE` for environment variables or global constants.

### Imports
- Use ES6 `import` / `export` syntax.
- **Ordering:**
  1. External libraries (e.g., `express`, `axios`).
  2. Internal modules (relative paths).
- **Example:**
  ```typescript
  import { Request, Response } from "express";
  import axios from "axios";
  import { validateContext } from "./controller";
  ```

### TypeScript
- **Strict Mode:** Enabled (`"strict": true` in `tsconfig.json`).
- **Types:** Explicitly type function parameters and return types where possible.
- Avoid `any` unless absolutely necessary.
- Use `Partial<T>` for mock objects in tests.

### Error Handling
- Use `async/await` for asynchronous operations.
- Wrap async route handlers in `try...catch` blocks or use a middleware wrapper.
- Return structured error responses:
  ```json
  {
    "message": { "ack": { "status": "NACK" } },
    "error": { "code": "ERROR_CODE", "message": "Description" }
  }
  ```

## 3. Testing Guidelines (Jest)

- **Mocking:** Heavily mock external dependencies using `jest.mock`.
  - Mock `axios` for network calls.
  - Mock internal utility functions to isolate the unit under test.
- **Structure:**
  - Use `describe` to group tests by function or module.
  - Use `it` for individual test cases.
  - Use `beforeEach` to reset mocks (`jest.clearAllMocks()`) and environment variables.
- **Helpers:** Create helper functions for common setup (e.g., `mockRequest`, `mockResponse`).

## 4. Architecture
- **Routes:** Defined in `routes.ts` files.
- **Controllers:** Logic resides in `controller.ts`.
- **Utils:** Shared logic in `src/utils/`.
- **Pattern:** Routes -> Controllers -> Services/Utils.

### Service Pattern
- **Implementation:** Export a singleton object (not a class) with async methods.
- **Configuration:** Separate client initialization into its own file (e.g., `services/razorpay.ts`, `services/sns.ts`).
- **Structure:**
  - `src/services/my-service.ts`: Exports `const myService = { ... }`.
  - `src/services/my-client.ts`: Handles SDK initialization and env vars.

