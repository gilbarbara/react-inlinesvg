# CLAUDE.md

## Project

React component library (`react-inlinesvg`) that loads inline, local, or remote SVGs into React components. Supports data URIs, base64, URL-encoded, inline strings, and remote URLs with automatic caching.

## Stack

- **Package manager:** pnpm
- **React:** supports 16.8–19 (peer dep), dev/tests use React 19
- **TypeScript:** 6.x, target ES2020
- **Vitest:** 5.x with globals enabled (no need to import `describe`/`it`/`expect`)
- **ESLint:** 10.x (flat config) via `@gilbarbara/eslint-config`
- **Vite plugin:** `@vitejs/plugin-react` 6.x

## Commands

```bash
pnpm build          # tsdown build (cleans dist by default)
pnpm lint           # ESLint with --fix on src/ and test/
pnpm typecheck      # tsc on test/tsconfig.json
pnpm test           # Starts fixture server on :1337, runs vitest with coverage
pnpm test:watch     # Vitest watch mode (requires fixture server: pnpm start)
pnpm format         # Prettier --write on yml, json, md, css
pnpm validate       # Full pipeline: lint → typecheck → test → format → build → size → typevalidation
```

Run a single test file: `npx vitest run test/modules/cache.spec.ts` (needs fixture server for integration tests).

## Architecture

Two entry points: `src/index.tsx` (main component) and `src/provider.tsx` (CacheProvider).

### Core flow

`InlineSVG` component → `useInlineSVG` hook (state machine via `useReducer`) → `CacheStore` for request caching → `convertToElement` (element cache lookup when `cacheElements` is on) → `getNode` for SVG processing → `react-from-dom` for React element conversion.

**State machine:** `IDLE` → `LOADING` → `LOADED` → `READY` (or `FAILED`/`UNSUPPORTED`). States defined in `src/config.ts`.

### Key modules (`src/modules/`)

- **useInlineSVG.ts** — Main hook. Handles fetching, inline SVG detection, caching, and lifecycle. Dispatches state transitions.
- **cache.ts** — `CacheStore` class with dual-layer caching: in-memory `Map` + Browser Cache API (persistent). Handles concurrent request deduplication.
- **elementCache.ts** — Module-level LRU (`ELEMENT_CACHE_MAX_SIZE` = 100) of converted React elements, used when `cacheElements` is on. Independent of `CacheProvider`; cleared via the exported `clearElementCache()`.
- **utils.ts** — `convertToElement` (element cache key + `getNode` + `convert`) and SVG DOM processing: parsing, ID uniquification, title/description manipulation, baseURL handling.
- **helpers.ts** — DOM detection, fetch wrapper, SVG support checks.
- **hooks.tsx** — `useMount()` and `usePrevious()` hooks.

### CacheProvider (`src/provider.tsx`)

Optional context provider that creates a persistent `CacheStore` using the Cache API. Without it, a global in-memory `cacheStore` instance is used.

## Testing

- **Framework:** Vitest + jsdom + @testing-library/react
- **Mocking:** `vitest-fetch-mock` for HTTP, `browser-cache-mock` for Cache API
- **Fixtures:** SVG files served by `http-server` on port 1337 from `test/__fixtures__/`
- **Coverage thresholds:** 90% (statements, branches, functions, lines)
- Tests import `cacheStore` directly to clear between tests via `cacheStore.clear()`
- Specs that use `cacheElements` call `clearElementCache()` in `beforeEach`, since the element cache is module-level

## Build

- **Bundler:** tsdown → CJS + ESM with `"use client"` banner
- **Size limit:** 10 KB per format
- **Type validation:** `@arethetypeswrong/cli` via `pnpm run typevalidation`
