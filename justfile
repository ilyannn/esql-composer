# ES|QL Composer development commands

# Default recipe to display help
_default:
    @just --list --unsorted

# Install dependencies
install:
    mise exec -- bun install

# Start the development server
start:
    mise exec -- bun run start

# Run the production build
build:
    mise exec -- bun run build

# Check the production bundle against size budgets
bundle-check:
    mise exec -- node scripts/check-bundle-size.mjs

# Run tests once
test:
    mise exec -- node ./node_modules/jest/bin/jest.js --runInBand

# Run ESLint
lint:
    mise exec -- bunx eslint src eslint.config.js jest.config.js vite.config.ts

# Run the TypeScript compiler in no-emit mode
typecheck:
    mise exec -- bunx tsc --noEmit

# Run tests with coverage report
coverage:
    mise exec -- node ./node_modules/jest/bin/jest.js --runInBand --coverage

# Run the main local verification steps
check: lint typecheck test build bundle-check

# Deploy to GitHub Pages
deploy:
    mise exec -- bun run deploy
