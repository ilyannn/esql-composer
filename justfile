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

# Run tests once
test:
    mise exec -- node ./node_modules/jest/bin/jest.js --runInBand

# Run ESLint
lint:
    mise exec -- bunx eslint src eslint.config.js craco.config.js jest.config.js

# Run tests with coverage report
coverage:
    mise exec -- node ./node_modules/jest/bin/jest.js --runInBand --coverage

# Run the main local verification steps
check: lint test build

# Deploy to GitHub Pages
deploy:
    mise exec -- bun run deploy
