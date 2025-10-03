# Contributing to Saxobank Client

Thank you for your interest in contributing to the Saxobank Client! We welcome contributions from the community and are pleased to have you join us.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [How to Contribute](#how-to-contribute)
- [Pull Request Process](#pull-request-process)
- [Coding Guidelines](#coding-guidelines)
- [Testing](#testing)
- [Documentation](#documentation)
- [Issue Reporting](#issue-reporting)
- [Feature Requests](#feature-requests)

## Code of Conduct

This project adheres to a code of conduct that we expect all contributors to follow. Please be respectful and constructive in all interactions.

### Our Standards

- Use welcoming and inclusive language
- Be respectful of differing viewpoints and experiences
- Gracefully accept constructive criticism
- Focus on what is best for the community
- Show empathy towards other community members

## Getting Started

### Prerequisites

- Node.js 18.0.0 or higher
- Bun (recommended) or npm/yarn/pnpm
- Git
- TypeScript knowledge
- Basic understanding of trading APIs and financial markets
- Saxobank developer account (for testing)

### Development Setup

1. **Fork and Clone the Repository**
   ```bash
   git clone https://github.com/ch99q/sxc.git
   cd sxc
   ```

2. **Install Dependencies**
   ```bash
   bun install
   # or
   npm install
   ```

3. **Build the Project**
   ```bash
   bun run build
   ```

4. **Set Up Environment Variables**
   
   Create a `.env` file for testing:
   ```bash
   SAXO_APP_KEY=your-app-key
   SAXO_APP_SECRET=your-app-secret
   SAXO_USERNAME=your-username
   SAXO_PASSWORD=your-password
   SAXO_REDIRECT_URI=http://localhost:5000/callback
   ```

5. **Run Tests**
   ```bash
   bun test
   ```

6. **Type Check**
   ```bash
   bun run typecheck
   ```

## How to Contribute

### Types of Contributions

We welcome several types of contributions:

- **Bug fixes** - Help us fix issues in the codebase
- **Features** - Add new functionality or improve existing features
- **Documentation** - Improve or add to our documentation
- **Tests** - Add test coverage or improve existing tests
- **Examples** - Create examples showing how to use the library
- **Performance** - Optimize existing code for better performance

### Before You Start

1. **Check existing issues** - Look through existing issues and pull requests to avoid duplicating work
2. **Create an issue** - For significant changes, create an issue first to discuss the approach
3. **Small changes** - For small bug fixes or improvements, you can directly create a pull request

## Pull Request Process

### 1. Create a Feature Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/issue-description
```

### 2. Make Your Changes

- Write clean, readable code following our coding guidelines
- Add tests for new functionality
- Update documentation as needed
- Ensure all tests pass

### 3. Commit Your Changes

Use clear, descriptive commit messages:

```bash
git commit -m "feat: add support for trailing stop orders

- Add trailing stop order type to OrderOptions
- Update type definitions
- Add tests for trailing stop functionality
- Update documentation with examples"
```

#### Commit Message Format

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

- `feat:` - A new feature
- `fix:` - A bug fix
- `docs:` - Documentation only changes
- `style:` - Changes that don't affect code meaning (whitespace, formatting)
- `refactor:` - Code change that neither fixes a bug nor adds a feature
- `perf:` - Code change that improves performance
- `test:` - Adding missing tests or correcting existing tests
- `chore:` - Changes to the build process or auxiliary tools

### 4. Push and Create Pull Request

```bash
git push origin feature/your-feature-name
```

Then create a pull request through GitHub with:

- Clear title describing the change
- Detailed description of what was changed and why
- Reference any related issues
- Screenshots or examples if applicable

### 5. Code Review Process

- Maintainers will review your pull request
- Address any feedback or requested changes
- Once approved, your PR will be merged

## Coding Guidelines

### TypeScript Standards

- Use TypeScript for all new code
- Provide proper type definitions
- Avoid `any` types when possible
- Use meaningful variable and function names
- Add JSDoc comments for public APIs

### Code Style

We use automated formatting, but here are the general principles:

- Use 2 spaces for indentation
- Use semicolons
- Use double quotes for strings
- Use trailing commas where applicable
- Maximum line length of 100 characters

### File Organization

```
src/
├── index.ts           # Main client implementation
test/
├── client/            # Client-level tests
├── integration/       # Integration tests
├── unit/              # Unit tests
└── utils.ts           # Test utilities
```

### API Design Principles

- **Consistency** - Similar functions should have similar signatures
- **Type Safety** - Leverage TypeScript's type system
- **Error Handling** - Provide clear error messages and types
- **Documentation** - All public APIs should be well documented
- **Security** - Never log or expose credentials

## Testing

### Running Tests

```bash
# Run all tests
bun test

# Run tests in watch mode
bun test:watch

# Run specific test file
bun test test/client/account.test.ts
```

### Writing Tests

- Write tests for all new functionality
- Use descriptive test names
- Test both success and error cases
- Mock external dependencies appropriately
- **Never commit real credentials** to test files

Example test structure:

```typescript
import { describe, it, expect, beforeAll } from 'vitest';
import { createClient } from '../src/index.js';

describe('Account Operations', () => {
  let client: any;
  let account: any;

  beforeAll(async () => {
    // Use test credentials from environment
    client = await createClient(
      { type: "account", username: process.env.SAXO_USERNAME!, password: process.env.SAXO_PASSWORD! },
      {
        appKey: process.env.SAXO_APP_KEY!,
        appSecret: process.env.SAXO_APP_SECRET!,
        redirectUri: process.env.SAXO_REDIRECT_URI!
      }
    );
    
    const accounts = await client.getAccounts();
    account = accounts[0];
  });

  it('should retrieve account balance', async () => {
    const balance = await account.getBalance();
    
    expect(balance).toBeDefined();
    expect(balance.cashAvailable).toBeTypeOf('number');
    expect(balance.currency).toBeTypeOf('string');
  });

  it('should handle errors gracefully', async () => {
    try {
      await account.buy(999999, 100000, "market");
      expect(false).toBe(true); // Should not reach here
    } catch (error) {
      expect(error).toBeDefined();
      expect(error instanceof Error).toBe(true);
    }
  });
});
```

### Test Categories

- **Unit Tests** - Test individual functions and classes
- **Integration Tests** - Test interactions with Saxobank API
- **Client Tests** - Test account and trading operations
- **Validation Tests** - Test input validation and error handling

### Important Testing Notes

- Always use the **simulation environment** for testing
- Never place real trades in production during testing
- Clean up orders and positions after tests
- Use delays between API calls to respect rate limits
- Mock sensitive operations when appropriate

## Documentation

### Code Documentation

- Use JSDoc comments for all public APIs
- Include examples in documentation
- Document parameters and return values
- Explain complex algorithms or business logic

Example:

```typescript
/**
 * Places a buy order for the specified instrument
 * 
 * @param uic - Unique instrument code (UIC)
 * @param quantity - Order quantity
 * @param type - Order type ("market", "limit", "stop", "stop_limit")
 * @param price - Order price (required for limit and stop_limit orders)
 * @param stopLimit - Stop limit price (required for stop orders)
 * @param options - Additional order options
 * @returns Promise resolving to Order or Position
 * 
 * @example
 * ```typescript
 * // Place a market order
 * const order = await account.buy(21, 100000, "market");
 * 
 * // Place a limit order
 * const limitOrder = await account.buy(21, 100000, "limit", 1.1000);
 * ```
 */
export function buy(/* ... */): Promise<Position | Order> {
  // Implementation
}
```

### README Updates

When adding new features:

1. Update the feature list
2. Add examples to the Quick Start section
3. Update the API Reference
4. Add any new dependencies or requirements

## Issue Reporting

### Bug Reports

When reporting bugs, please include:

1. **Clear description** - What happened vs. what you expected
2. **Reproduction steps** - Minimal code to reproduce the issue
3. **Environment details** - OS, Node.js version, package version
4. **Error messages** - Full error stack traces (redact credentials!)
5. **Additional context** - Screenshots, logs, etc.

Use this template:

```markdown
**Bug Description**
A clear description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Create client with '...'
2. Call method '...'
3. See error

**Expected Behavior**
What you expected to happen.

**Code Sample**
```typescript
// Minimal code sample that reproduces the issue
// NEVER include real credentials!
```

**Environment**
- OS: [e.g. macOS 14.0]
- Node.js: [e.g. 18.17.0]
- Package version: [e.g. 1.0.0]
- Environment: [simulation/live]

**Additional Context**
Any other context about the problem.
```

### Security Issues

For security vulnerabilities, please **DO NOT** open a public issue. Instead:

1. Email the maintainers directly
2. Provide a clear description of the vulnerability
3. Include steps to reproduce if applicable
4. Allow time for the issue to be addressed before public disclosure

## Feature Requests

We welcome feature requests! Please:

1. **Check existing requests** - Avoid duplicating existing requests
2. **Provide clear use case** - Explain why the feature would be valuable
3. **Consider implementation** - Think about how it might work
4. **Be patient** - Features take time to design and implement

Use this template:

```markdown
**Feature Description**
A clear description of what you want to happen.

**Use Case**
Describe the problem this feature would solve and who would benefit.

**Proposed Solution**
Describe how you envision this feature working.

**Alternative Solutions**
Any alternative approaches you've considered.

**Additional Context**
Any other context, mockups, or examples.
```

## Development Workflow

### Branch Naming

- `feature/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation updates
- `refactor/description` - Code refactoring
- `test/description` - Test additions/improvements

### Release Process

1. Update version in `package.json`
2. Update `CHANGELOG.md`
3. Create release tag
4. Publish to npm
5. Create GitHub release

## Getting Help

If you need help with contributing:

- Check existing documentation and issues
- Ask questions in GitHub Discussions
- Reach out to maintainers
- Join our community channels

## Recognition

Contributors will be recognized in:

- README.md contributors section
- Release notes
- GitHub contributors page

## Important Reminders

### Security

- **Never commit credentials** to the repository
- Always use environment variables for sensitive data
- Test in simulation environment only
- Review code for potential security issues

### Trading Safety

- Use simulation environment for all development
- Never place real trades during testing
- Always validate orders before execution
- Clean up test positions and orders

Thank you for contributing to make this library better for everyone! 🚀
