# Husky Git Hooks

This project uses Husky to manage Git hooks for code quality and consistency.

## Configured Hooks

### Pre-commit Hook (`.husky/pre-commit`)
- Runs lint-staged on staged files (if available)
- Falls back to full linting if lint-staged is not available
- Checks TypeScript type errors
- Blocks commits if checks fail

### Commit Message Hook (`.husky/commit-msg`)
- Validates commit message length (minimum 3 characters)
- Warns if commit message first line exceeds 72 characters
- Optional: Can enforce conventional commit format (commented out by default)

### Pre-push Hook (`.husky/pre-push`)
- Runs tests before pushing
- Builds the project to ensure compilation
- Blocks push if tests fail or build fails
- Can be skipped with: `git push --no-verify`

## Usage

Hooks run automatically when you:
- `git commit` - triggers pre-commit and commit-msg hooks
- `git push` - triggers pre-push hook

## Skipping Hooks

If needed, you can skip hooks:

```bash
# Skip pre-commit hook
git commit --no-verify -m "your message"

# Skip pre-push hook
git push --no-verify
```

## Configuration

- `lint-staged` configuration is in `package.json`
- Hook scripts are in `.husky/` directory
- The `prepare` script in `package.json` automatically sets up Husky on `npm install`

