# frontend-config

Shared configuration for BC Law Next.js apps. Each app installs these packages instead of keeping its own copies, so a rule changes in one place and reaches every app through a Dependabot PR.

| Package | What it gives an app |
|---|---|
| [`@bclawlibrary/eslint-config`](packages/eslint-config) | Next.js lint rules plus our guardrails: size, complexity, functional style, accessibility |
| [`@bclawlibrary/tsconfig`](packages/tsconfig) | Extra TypeScript strictness on top of the `tsconfig.json` Next.js generates |
| [`@bclawlibrary/prettier-config`](packages/prettier-config) | Prettier defaults plus Tailwind class sorting |

The packages are **private** and published to **GitHub Packages**. Installing them needs a token (see [One-time setup](#one-time-setup-per-developer)).

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

**Test files** (`*.test.ts`, `*.test.tsx`) are exempt from the function length, one-component and nested-callback rules.

**Not checked by lint, but expected:** one hook or helper per `.ts` file. Reviewers check this.

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

## One-time setup (per developer)

You need Node.js 22.13 or newer. Check with `node --version`.

1. Create a GitHub **classic** personal access token with only the **`read:packages`** scope.
2. Save it as a user environment variable named `NPM_TOKEN`.
3. Quit and reopen your terminal and editor.
4. Check it worked. This should print a version number:

   ```bash
   npm view "@bclawlibrary/eslint-config" version
   ```

---

## Editor setup

Optional: lint, type checks and formatting also run in CI.

- **Zed:** nothing to install. The template's `.zed/settings.json` formats and fixes on save.
- **VS Code:** install the **ESLint** and **Prettier** extensions. The template's `.vscode/settings.json` formats on save. If VS Code asks **"Use workspace version of TypeScript?"**, choose **Allow**.

---

## Adding the packages to an app

New apps start from our **template repository** (GitHub's **Use this template** button), which already includes steps 1–7. For a new app, skip to [step 8](#8-settings-that-the-template-repository-cant-copy).

Steps 1–7 are only for building the template itself, or for adding the packages to an older app (like the events calendar).

### 1. Point the `@bclawlibrary` scope at GitHub Packages

Add `.npmrc` to the app root:

```
@bclawlibrary:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${NPM_TOKEN}
```

### 2. Install

```bash
npm i -D "@bclawlibrary/eslint-config" "@bclawlibrary/tsconfig" "@bclawlibrary/prettier-config" "eslint@^10" eslint-config-next prettier "typescript@~6.0.0"
```

Keep `eslint-config-next` on the same version as `next`. A few `ERESOLVE overriding peer dependency` warnings are expected and harmless.

### 3. `tsconfig.json`

Keep the file `create-next-app` generated and add one line at the top:

```json
{
  "extends": "@bclawlibrary/tsconfig",
  "compilerOptions": { "...": "leave as generated" }
}
```

### 4. `eslint.config.mjs`

```js
import { defineConfig, globalIgnores } from "eslint/config";
import bclaw from "@bclawlibrary/eslint-config";

export default defineConfig([
  ...bclaw,
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
]);
```

### 5. `package.json`

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

### 6. Line endings (`.gitattributes`)

Add `.gitattributes` to the app root so every computer uses the line endings Prettier expects:

```
* text=auto eol=lf
```

### 7. CI

Run these on every pull request:

```bash
npm run lint
npx tsc --noEmit
npm run format:check
```

In GitHub Actions, give the workflow `permissions: packages: read` and set `NPM_TOKEN: ${{ secrets.GITHUB_TOKEN }}` for the install step.

### 8. Settings that the template repository can't copy

Do these once for each new app repo:

- [ ] **Package access:** in each package's settings on GitHub → **Manage Actions access** → add the app repo with **Read**.
- [ ] **Firebase App Hosting:** let the backend read the token during builds:

  ```bash
  firebase apphosting:secrets:grantaccess NPM_TOKEN --backend YOUR_BACKEND_NAME
  ```

  and in `apphosting.yaml`:

  ```yaml
  env:
    - variable: NPM_TOKEN
      secret: NPM_TOKEN
      availability:
        - BUILD
  ```

  (The `NPM_TOKEN` secret itself is created once per Firebase project with `firebase apphosting:secrets:set NPM_TOKEN`.)
- [ ] **Dependabot:** turn on alerts and security updates in the repo's settings.

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

Each package is versioned and published on its own. Pushing a tag named `<package>-v<version>` publishes that package. Run these one line at a time:

```bash
npm version minor --workspace packages/eslint-config
git commit -am "eslint-config 1.1.0"
git tag eslint-config-v1.1.0
git push
git push origin eslint-config-v1.1.0
```

Which version number to bump:

| Change | Bump |
|---|---|
| Loosening a rule, fixing a bug, docs | `patch` or `minor` |
| Adding a rule as a warning | `minor` |
| Adding a rule as an error, or tightening a limit | `major` (apps may need code changes) |

After the release, Dependabot opens an upgrade PR in each app, and that app's CI shows whether the change breaks anything.

---

## Version notes

- **ESLint 10:** ESLint 9 is no longer supported.
- **TypeScript `~6.0`:** our lint tools don't support newer TypeScript yet, so each app's Dependabot config holds it back. Lift both once `typescript-eslint` supports it.

---

## Repo layout

```
frontend-config/
├── package.json              npm workspaces root (private, never published)
├── .gitattributes            forces LF line endings
├── .github/workflows/
│   └── publish.yml           publishes a package when its tag is pushed
└── packages/
    ├── eslint-config/        index.mjs, package.json
    ├── tsconfig/             tsconfig.json, package.json
    └── prettier-config/      index.mjs, package.json
```
