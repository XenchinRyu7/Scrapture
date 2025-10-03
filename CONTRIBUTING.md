# Contributing to Scrapture

First off, thank you for considering contributing to Scrapture! It's people like you that make Scrapture such a great tool.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
  - [Reporting Bugs](#reporting-bugs)
  - [Suggesting Enhancements](#suggesting-enhancements)
  - [Pull Requests](#pull-requests)
- [Development Setup](#development-setup)
- [Style Guidelines](#style-guidelines)
  - [Git Commit Messages](#git-commit-messages)
  - [TypeScript Style Guide](#typescript-style-guide)
- [Additional Notes](#additional-notes)

## Code of Conduct

This project and everyone participating in it is governed by the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior to the project maintainers via GitHub issues.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the existing issues as you might find out that you don't need to create one. When you are creating a bug report, please include as many details as possible:

- **Use a clear and descriptive title** for the issue
- **Describe the exact steps to reproduce the problem**
- **Provide specific examples** to demonstrate the steps
- **Describe the behavior you observed** and what behavior you expected to see
- **Include screenshots or animated GIFs** if possible
- **Include your environment details** (OS, Node version, etc.)

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, please include:

- **Use a clear and descriptive title**
- **Provide a detailed description** of the suggested enhancement
- **Explain why this enhancement would be useful** to most users
- **List some examples** of how the enhancement would be used

### Pull Requests

Please follow these steps for pull requests:

1. **Fork the repository** and create your branch from `main`
2. **Make your changes** following our style guidelines
3. **Test your changes** thoroughly
4. **Update documentation** if needed
5. **Ensure the test suite passes**
6. **Make sure your code lints** without errors
7. **Write a clear commit message**

## Development Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/XenchinRyu7/Scrapture.git
   cd Scrapture
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up the database:**
   ```bash
   npm run db:push
   npm run db:generate
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```

5. **Run the worker (optional):**
   ```bash
   npm run worker
   # or
   npm run worker:session
   ```

## Style Guidelines

### Git Commit Messages

- Use the present tense ("Add feature" not "Added feature")
- Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
- Limit the first line to 72 characters or less
- Reference issues and pull requests liberally after the first line

**Examples:**
```
feat: Add support for structured data extraction
fix: Resolve memory leak in crawler worker
docs: Update README with Docker instructions
style: Format code with Prettier
refactor: Simplify URL normalization logic
test: Add unit tests for robots parser
chore: Update dependencies
```

### TypeScript Style Guide

- **Use TypeScript** for all new code
- **Avoid `any` types** - use proper typing or `unknown`
- **Use functional components** with hooks in React
- **Follow ESLint rules** configured in the project
- **Write meaningful variable and function names**
- **Add JSDoc comments** for public APIs
- **Use async/await** instead of callbacks

**Example:**
```typescript
/**
 * Crawls a webpage and extracts structured data
 * @param url - The URL to crawl
 * @param options - Crawling options
 * @returns Promise with crawled data
 */
async function crawlPage(
  url: string,
  options: CrawlOptions
): Promise<CrawlResult> {
  // Implementation
}
```

## Project Structure

```
scrapture/
├── src/
│   ├── app/              # Next.js app directory
│   ├── components/       # React components
│   ├── lib/              # Core library code
│   └── types/            # TypeScript type definitions
├── prisma/               # Database schema
├── public/               # Static assets
├── worker.ts             # Background worker
└── cli.ts                # CLI interface
```

## Testing

- Write unit tests for utility functions
- Write integration tests for API endpoints
- Ensure all tests pass before submitting PR
- Aim for good code coverage

```bash
npm test
```

## Additional Notes

### Issue and Pull Request Labels

- `bug` - Something isn't working
- `enhancement` - New feature or request
- `documentation` - Improvements or additions to documentation
- `good first issue` - Good for newcomers
- `help wanted` - Extra attention is needed
- `question` - Further information is requested

### Development Workflow

1. Create a new branch for your feature/fix
2. Make your changes
3. Run linter: `npm run lint`
4. Test your changes
5. Commit your changes with a clear message
6. Push to your fork
7. Create a Pull Request

## Questions?

Don't hesitate to ask questions by creating an issue with the `question` label. We're here to help!

## License

By contributing to Scrapture, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to Scrapture! 🎉
