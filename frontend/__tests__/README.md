# Frontend Tests

This directory contains tests for the Moji frontend application.

## Running Tests

```bash
# Install dependencies (if not already installed)
npm install

# Run tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage
```

## Test Structure

- Component tests: Test React components in isolation
- Integration tests: Test component interactions
- E2E tests: Test full user flows (if using Playwright/Cypress)

## Writing Tests

Tests should:
- Use React Testing Library for component tests
- Mock API calls using MSW (Mock Service Worker)
- Test user interactions and accessibility
- Verify error handling and edge cases

## Example Test

```typescript
import { render, screen } from '@testing-library/react';
import { TaskList } from '@/components/TaskList';

describe('TaskList', () => {
  it('renders tasks correctly', () => {
    render(<TaskList workspaceId="test-id" />);
    // Add assertions
  });
});
```
