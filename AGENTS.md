# AGENTS.md

Guidance for coding agents working in this repository.

## Project Summary

ES|QL Composer is a browser-only React SPA for composing and running Elasticsearch ES|QL queries. The app talks directly to external APIs from the browser:

- Elasticsearch for schema discovery, query execution, tracing, and exports
- LLM providers for natural-language query editing and field transformations

There is no backend service in this repo.

## Working Commands

- `npm start` - run the Vite development server
- `npm run build` - create a production build
- `npm test -- --watch=false` - run Jest once
- `npm run deploy` - publish the `build/` output to GitHub Pages

There is currently no dedicated `lint` or `format` script in `package.json`.

## Tech Stack

- React 19
- TypeScript with `strict: true`
- Chakra UI for most UI
- Vite for dev/build
- Jest + ts-jest + React Testing Library
- Anthropic SDK, AWS Bedrock SDK, browser `fetch`, and `axios`
- `ol` for WKT / geo rendering

The repo uses the `@/*` path alias for `src/*`, configured in [tsconfig.json](tsconfig.json) and [vite.config.ts](vite.config.ts).

## Repo Map

- [src/ui/ESQLComposerMain.tsx](src/ui/ESQLComposerMain.tsx): main stateful orchestrator
- [src/models/esql/](src/models/esql): pure ES|QL block, chain, type, and clause logic
- [src/services/es/](src/services/es): direct Elasticsearch calls, schema derivation, exports, demo index helpers
- [src/services/llm/](src/services/llm): prompts, parsing, provider adapters, and Anthropic-specific generation helpers
- [src/ui/visual-composer/](src/ui/visual-composer): block-based composer UI
- [src/ui/components/data-table/](src/ui/components/data-table): result presenters, geo handling, and row rendering
- [public/esql-short.txt](public/esql-short.txt) and [public/esql-long.txt](public/esql-long.txt): built-in ES|QL guide text loaded at runtime
- [public/demo-shapes.json](public/demo-shapes.json): sample data for the shapes demo

## Architecture Notes

### State and UI

Most application state lives in [src/ui/ESQLComposerMain.tsx](src/ui/ESQLComposerMain.tsx) and is passed downward via props. There is no global store.

Persistent user settings are saved in browser local storage from [src/ui/HowToUseArea.tsx](src/ui/HowToUseArea.tsx).

### ES|QL model layer

The visual composer is driven by an ordered `ESQLChain` of typed blocks. The core behavior is in [src/models/esql/ESQLChain.ts](src/models/esql/ESQLChain.ts), which inserts, replaces, and reorders blocks based on higher-level actions like filter, rename, sort, limit, and eval.

### Elasticsearch integration

[src/services/es/derive_schema.ts](src/services/es/derive_schema.ts) builds schema guides from `_field_caps` plus sampled aggregations. [src/services/es/esql_query.ts](src/services/es/esql_query.ts) runs queries, `SHOW INFO`, and export downloads.

Keep in mind that this code runs in the browser, so changes to ES access must remain browser-safe and CORS-friendly.

### LLM integration

The LLM layer is split in two parts:

- [src/services/llm/llm.ts](src/services/llm/llm.ts): Anthropic-specific query generation, cache warming, size reduction, and token counting
- [src/services/llm/adapters/](src/services/llm/adapters): adapter interface used for provider-specific `answer`, `countTokens`, and streaming support

`transformField()` is adapter-based. `generateESQLUpdate()`, `warmCache()`, `reduceSize()`, and `countTokens()` in `llm.ts` are not provider-agnostic.

## Provider Status

Do not assume every provider shown in config is production-ready.

- Anthropic: primary implementation, used for ES|QL generation and prompt caching
- Bedrock: partially implemented through an adapter
- Llama server: partial adapter, with unfinished streaming support
- OpenAI: placeholder config only, not implemented

Before describing provider support in docs or code, verify how the feature is actually wired in [src/services/llm/config.ts](src/services/llm/config.ts), [src/services/llm/adapters/index.ts](src/services/llm/adapters/index.ts), and [src/ui/LLMConfigurationArea.tsx](src/ui/LLMConfigurationArea.tsx).

## Testing Notes

Tests exist mainly for:

- ES|QL model logic
- shared utilities
- pseudo-XML parsing
- geo point formatting

Jest intentionally ignores [src/app/](src/app/) in [jest.config.js](jest.config.js), so [src/app/App.test.tsx](src/app/App.test.tsx) is not part of the normal test run.

## Editing Guidance

- Preserve the browser-only architecture
- Prefer changes in `models/` for query semantics and in `ui/` for interaction behavior
- If you touch LLM functionality, check whether the code path is Anthropic-only or adapter-based before generalizing it
- If you touch query results, verify presenters in [src/ui/components/data-table/presenters.tsx](src/ui/components/data-table/presenters.tsx)
- If you update docs, avoid claiming provider support or tooling that the repo does not actually implement

## Documentation Caveats

The existing [CLAUDE.md](CLAUDE.md) should not be treated as fully authoritative. Some statements there currently overstate provider support and tooling coverage, so confirm against source before relying on it.
