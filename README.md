# shared-packages

Shared configuration for BC Law Next.js apps. Each app installs these packages instead of keeping its own copies, so a rule changes in one place and reaches every app through a Dependabot PR.

| Package | What it gives an app |
|---|---|
| [`@bclawlibrary/eslint-config`](packages/eslint-config) | Next.js lint rules plus our guardrails: size, complexity, functional style, accessibility |
| [`@bclawlibrary/tsconfig`](packages/tsconfig) | Extra TypeScript strictness on top of the `tsconfig.json` Next.js generates |
| [`@bclawlibrary/prettier-config`](packages/prettier-config) | Prettier defaults plus Tailwind class sorting |

The packages are public on [npm](https://www.npmjs.com/org/bclawlibrary), so installing them needs no token or account. You need Node.js 22.13 or newer.

---

## What the packages enforce

### ESLint (`@bclawlibrary/eslint-config`)

Starts from `eslint-config-next` (Core Web Vitals + TypeScript), then adds:

| Area | Rule | Limit |
|---|---|---|
| Size | `max-lines-per-function` | 100 lines (blank lines and comments don't count) |
| Size | `max-lines` | 150 lines per `.ts` / `.tsx` file |
| Size | `react/no-multi-comp` | One component per file |
| Complexity | `sonarjs/cognitive-complexity` | A score of how hard a function is to follow, max 15. Each `if`, `else`, loop, `switch`, `catch`, ternary or `&&` / `\|\|` chain adds a point, and more when it's nested inside another. Short functions can still fail if their logic is tangled. |
| Complexity | `max-depth` | 3 levels of nesting |
| Complexity | `max-params` | 3 parameters (pass an options object instead) |
| Complexity | `max-nested-callbacks` | A function passed inside a function passed inside another, max 3 deep. For example, a `.map` inside a `.then` inside a `useEffect` is 3. Go deeper and pull the inner one out into a named function. |
| Functional style | `functional/no-let` | Use `const` |
| Functional style | `functional/no-loop-statements` | Use `map` / `filter` / `reduce` |
| Functional style | `functional/no-classes`, `functional/no-this-expressions` | Functions only |
| Functional style | `functional/immutable-data` | Don't change data in place: return new data (`toSorted`, spread) |
| Functional style | `no-param-reassign` (with `props: true`) | Don't change a function's inputs |
| Async | `@typescript-eslint/no-floating-promises` | Every promise is awaited or handled |
| Accessibility | `jsx-a11y` strict set, as errors | Keyboard support, labels, alt text, valid ARIA |
| Data fetching | `@tanstack/eslint-plugin-query` recommended set | TanStack Query mistakes, such as a cache key that leaves out something the request uses, or a new `QueryClient` on every render |
| Icons | `no-restricted-imports`, `react/forbid-elements` | Font Awesome's free icons only: `FontAwesomeIcon` from `@fortawesome/react-fontawesome` with icons from `@fortawesome/free-solid-svg-icons`, `free-regular-svg-icons` or `free-brands-svg-icons`. No Pro packages or kits, no other icon libraries, no hand-written `<svg>` |

**Test files** (`*.test.ts`, `*.test.tsx`) are exempt from the function length, one-component and nested-callback rules.

### TypeScript (`@bclawlibrary/tsconfig`)

Adds these flags on top of the app's own `tsconfig.json`, which Next.js creates and keeps up to date:

| Flag | Catches |
|---|---|
| `noUncheckedIndexedAccess` | Reading a list item or object key that might not exist |
| `noImplicitReturns` | Code paths that forget to return |
| `noFallthroughCasesInSwitch` | `switch` cases that fall into the next one |
| `noImplicitOverride` | Overriding a method without saying so |
| `allowUnreachableCode: false` | Code that can never run |

### Prettier (`@bclawlibrary/prettier-config`)

Prettier's defaults plus `prettier-plugin-tailwindcss`, which sorts Tailwind classes into a consistent order. Apps use the `src/` folder layout, because the plugin reads `./src/app/globals.css`.

---

## Editor setup

Optional: lint, type checks and formatting also run in CI.

- **Zed:** nothing to install. The template's `.zed/settings.json` formats and fixes on save.
- **VS Code:** install the **ESLint** and **Prettier** extensions. The template's `.vscode/settings.json` formats on save. If VS Code asks **"Use workspace version of TypeScript?"**, choose **Allow**.

---

## Adding the packages to an app

New apps start from our **template repository** (GitHub's **Use this template** button), which already includes steps 1–6. For a new app, skip to [step 7](#7-settings-that-the-template-repository-cant-copy).

Steps 1–6 are only for building the template itself, or for adding the packages to an older app (like the events calendar).

### 1. Install

```bash
npm i -D "@bclawlibrary/eslint-config" "@bclawlibrary/tsconfig" "@bclawlibrary/prettier-config" "eslint@^10" eslint-config-next prettier "typescript@~6.0.0"
```

Keep `eslint-config-next` on the same version as `next`. A few `ERESOLVE overriding peer dependency` warnings are expected and harmless.

### 2. `tsconfig.json`

Keep the file `create-next-app` generated and add one line at the top:

```json
{
  "extends": "@bclawlibrary/tsconfig",
  "compilerOptions": { "...": "leave as generated" }
}
```

### 3. `eslint.config.mjs`

```js
import { defineConfig, globalIgnores } from "eslint/config";
import bclaw from "@bclawlibrary/eslint-config";

export default defineConfig([
  ...bclaw,
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
]);
```

### 4. `package.json`

```json
{
  "prettier": "@bclawlibrary/prettier-config",
  "scripts": {
    "lint": "eslint --max-warnings 0",
    "format": "prettier --write .",
    "format:check": "prettier --check ."
  }
}
```

`--max-warnings 0` makes warnings fail too. Run `npm run format` once after `create-next-app`.

### 5. Line endings (`.gitattributes`)

Add `.gitattributes` to the app root so every computer uses the line endings Prettier expects:

```
* text=auto eol=lf
```

### 6. CI

Run these on every pull request:

```bash
npm run lint
npx tsc --noEmit
npm run format:check
```

### 7. Settings that the template repository can't copy

Turn on Dependabot alerts and security updates in the new repo's settings.

---

## Turning a rule off

Prefer fixing the code. When a rule genuinely doesn't fit, disable it **on that line, with a reason**, so it shows up in review:

```ts
// eslint-disable-next-line functional/no-loop-statements -- uploads must run one at a time, in order
for (const file of files) {
  await upload(file);
}
```

Don't loosen rules in an app's `eslint.config.mjs`. If a rule is wrong for everyone, change it here instead.

---

## Releasing a change

Each package is versioned and published on its own. Pushing a tag named `<package>-v<version>` publishes that package from GitHub Actions, so nobody needs to sign in to npm.

1. On a branch, bump the version along with your change, then open a pull request and merge it:

   ```bash
   npm version minor --workspace packages/eslint-config --no-workspaces-update
   ```

   `--no-workspaces-update` stops npm from trying to install everything afterward, which fails on ESLint 10 peer warnings.

2. After merging, tag the merged commit on `main`:

   ```bash
   git switch main
   git pull
   git tag eslint-config-v1.1.0
   git push origin eslint-config-v1.1.0
   ```

3. In the repo's **Actions** tab, open the waiting "Publish package" run → **Review deployments** → approve `npm`.

Which version number to bump:

| Change | Bump |
|---|---|
| Loosening a rule, fixing a bug, docs | `patch` or `minor` |
| Adding a rule as a warning | `minor` |
| Adding a rule as an error, or tightening a limit | `major` (apps may need code changes) |

After the release, Dependabot opens an upgrade PR in each app, and that app's CI shows whether the change breaks anything.

The npm organization `bclawlibrary` is owned by the `bclaw-atr-team` account. Its login is in the LAW.ATR vault in 1Password, for admin tasks only.

---

## Version notes

- **ESLint 10:** ESLint 9 is no longer supported.
- **TypeScript `~6.0`:** our lint tools don't support newer TypeScript yet, so each app's Dependabot config holds it back. Lift both once `typescript-eslint` supports it.

---

## Repo layout

```
shared-packages/
├── package.json              npm workspaces root (private, never published)
├── .gitattributes            forces LF line endings
├── .github/workflows/
│   └── publish.yml           publishes a package when its tag is pushed
└── packages/
    ├── eslint-config/        index.mjs, package.json
    ├── tsconfig/             tsconfig.json, package.json
    └── prettier-config/      index.mjs, package.json
```
