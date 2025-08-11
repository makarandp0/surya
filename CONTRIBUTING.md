# Contributing to ChromePass

## Code Style Guidelines

### Function Declarations

- **Always use arrow functions** instead of function declarations
- ✅ Preferred: `const myFunction = (): ReturnType => {}`
- ❌ Avoid: `function myFunction(): ReturnType {}`
- ✅ Async: `const myAsyncFunction = async (): Promise<ReturnType> => {}`
- ❌ Avoid: `async function myAsyncFunction(): Promise<ReturnType> {}`

### General Style

- Use single quotes for strings
- 2-space indentation
- Trailing semicolons required
- No trailing whitespace
- Object destructuring where possible
- Prefer `const` over `let` when possible

### ESLint Configuration

The project uses ESLint with rules to enforce these preferences automatically. Run:

```bash
yarn lint        # Check for issues
yarn lint:fix    # Auto-fix where possible
```

### Type Checking

```bash
yarn typecheck   # Ensure TypeScript compliance
```

### Testing

```bash
yarn test        # Run all tests
yarn test:watch  # Watch mode for development
```
