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
| Complexity | `sonarjs/cognitive-complexity` | 15 |
| Complexity | `max-depth` | 3 levels of nesting |
| Complexity | `max-params` | 3 parameters (pass an options object instead) |
| Complexity | `max-nested-callbacks` | 3 |
| Functional style | `functional/no-let` | Use `const` |
| Functional style | `functional/no-loop-statements` | Use `map` / `filter` / `reduce` |
| Functional style | `functional/no-classes`, `functional/no-this-expressions` | Functions only |
| Functional style | `functional/immutable-data` | Don't change data in place: return new data (`toSorted`, spread) |
| Functional style | `no-param-reassign` (with `props: true`) | Don't change a function's inputs |
| Async | `@typescript-eslint/no-floating-promises` | Every promise is awaited or handled |
| Accessibility | `jsx-a11y` strict set, as errors | Keyboard support, labels, alt text, valid ARIA |

**Test files** (`*.test.ts`, `*.test.tsx`) are exempt from the function length, one-component and nested-callback rules.

`immutable-data` and `no-floating-promises` use type information, so they run on `.ts` / `.tsx` files only.

**Not checked by lint, but expected:** one hook or helper per `.ts` file. Reviewers check this.

### TypeScript (`@bclawlibrary/tsconfig`)

Adds these flags on top of the app's own `tsconfig.json` (which already has `strict: true`):

| Flag | Catches |
|---|---|
| `noUncheckedIndexedAccess` | Reading a list item or object key that might not exist |
| `noImplicitReturns` | Code paths that forget to return |
| `noFallthroughCasesInSwitch` | `switch` cases that fall into the next one |
| `noImplicitOverride` | Overriding a method without saying so |
| `allowUnreachableCode: false` | Code that can never run |

The package holds **only** these flags. Next.js keeps maintaining its own settings in each app's `tsconfig.json`.

### Prettier (`@bclawlibrary/prettier-config`)

Prettier's defaults (double quotes, semicolons, 80-character lines, trailing commas) plus `prettier-plugin-tailwindcss`, which sorts Tailwind classes into a consistent order.

The plugin reads the app's Tailwind stylesheet from **`./src/app/globals.css`**, so apps use the `src/` folder layout.

---

## One-time setup (per developer)

Commands in this README are for a terminal: **zsh on macOS** (the default in Terminal) and **PowerShell on Windows**. An editor's built-in terminal works too. Where the two differ, both are shown.

**Prerequisite:** Node.js 20.19+, 22.13+ or 24+ (ESLint 10 requires one of these). Check with `node --version`.

1. Create a GitHub **classic** personal access token with only the **`read:packages`** scope. (Fine-grained tokens don't work with the GitHub npm registry.)
2. Save it as an environment variable named `NPM_TOKEN`. Replace `YOUR_TOKEN` with the token.

   **macOS (zsh)** — add this line to `~/.zshrc`:

   ```bash
   export NPM_TOKEN=YOUR_TOKEN
   ```

   **Windows (PowerShell)** — run once (saves it for your user account):

   ```powershell
   [Environment]::SetEnvironmentVariable("NPM_TOKEN", "YOUR_TOKEN", "User")
   ```

3. **Quit and reopen your terminal and your editor.** Programs only see environment variables that existed when they started. If you use an editor's built-in terminal (VS Code, for example), quit the whole editor, not just the terminal tab.
4. Check it worked. This should print a version number:

   ```bash
   npm view "@bclawlibrary/eslint-config" version
   ```

**Windows: if PowerShell says `npm.ps1 cannot be loaded because running scripts is disabled`,** your PowerShell script policy is blocking npm. Run this once (it only affects your user account), then open a new terminal:

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

---

## Editor setup

Not required: lint, type checks and formatting all run from the terminal and in CI. Editor integration just shows problems while you type.

### Zed

ESLint and Prettier support are built in: no extensions to install. Each app's `.zed/settings.json` (already in the template repository) formats with Prettier on save and applies ESLint's automatic fixes first:

```json
{
  "format_on_save": "on",
  "languages": {
    "TypeScript": {
      "code_actions_on_format": { "source.fixAll.eslint": true }
    },
    "TSX": {
      "code_actions_on_format": { "source.fixAll.eslint": true }
    }
  }
}
```

### VS Code

1. Install the **ESLint** (`dbaeumer.vscode-eslint`) and **Prettier** (`esbenp.prettier-vscode`) extensions.
2. Each app's `.vscode/settings.json` (already in the template repository) turns on format-on-save, keeps Unix line endings on Windows, and makes VS Code use the project's TypeScript version (`~6.0`) instead of its built-in one:

   ```json
   {
     "editor.defaultFormatter": "esbenp.prettier-vscode",
     "editor.formatOnSave": true,
     "files.eol": "\n",
     "typescript.tsdk": "node_modules/typescript/lib",
     "typescript.enablePromptUseWorkspaceTsdk": true
   }
   ```

3. When VS Code asks **"Use workspace version of TypeScript?"**, choose **Allow**.

---

## Adding the packages to an app

New apps start from our **template repository**: a GitHub repository marked as a template, so a new app is created with its **Use this template** button and starts with a copy of all its files.

**Creating a new app from the template repository?** Skip to [step 8](#8-settings-that-the-template-repository-cant-copy). The template repository already includes steps 1–7: the `.npmrc`, the installed packages, the `tsconfig.json` / `eslint.config.mjs` / `package.json` changes, `.gitattributes` and the CI workflow. Step 8 lists repo settings that GitHub doesn't copy from a template repository, so every new app still needs those.

Steps 1–7 are only for building the template repository itself, or for adding the packages to an app that existed before it (like the events calendar).

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

Keep the quotes. In PowerShell, a word starting with `@` can be read as PowerShell syntax instead of a package name; quoting makes the command behave the same on Windows and macOS.

Keep `eslint-config-next` on the same version as `next`. Expect a few `ERESOLVE overriding peer dependency` warnings: some plugins inside `eslint-config-next` don't list ESLint 10 yet. They work; see [Why these versions](#why-these-versions).

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

`--max-warnings 0` matters: `eslint-config-next` leaves some rules (unused variables, hook dependencies) as warnings, which would otherwise pass unnoticed. Run `npm run format` once after `create-next-app`, since its generated files aren't Prettier-formatted.

### 6. Line endings (`.gitattributes`)

Windows Git can check files out with Windows line endings (CRLF). Prettier expects Unix line endings (LF), so `format:check` would then fail on every file for Windows users. Add `.gitattributes` to the app root so Git always uses LF:

```
* text=auto eol=lf
```

If a repo already has CRLF files, run `git add --renormalize .` once and commit.

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

- [ ] **Package access:** in each package's settings on GitHub → **Manage Actions access** → add the app repo with **Read**. Without this, the app's CI can't install the packages.
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
- [ ] **Dependabot:** turn on alerts and security updates in the repo's settings. The org-level configuration doesn't cover new private repos.

### Dependabot in each app

Block TypeScript versions our lint tooling can't handle yet:

```yaml
ignore:
  - dependency-name: typescript
    versions: [">=6.1.0"]
```

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

Each package is versioned and published on its own. Pushing a tag named `<package>-v<version>` publishes that package.

Run these one line at a time. They work the same in zsh and PowerShell. (Windows PowerShell 5.1, the version built into Windows, doesn't support joining commands with `&&`, so keep them on separate lines.)

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

The publish workflow (`.github/workflows/publish.yml`) checks that the tag matches the version in the package's `package.json` before publishing.

---

## Why these versions

Checked 2026-11-06 against the Next.js, ESLint and typescript-eslint docs (via Context7) and npm package data, and tested in a fresh `create-next-app` 16.4.5 project.

| Choice | Reason | Revisit when |
|---|---|---|
| **ESLint 10** | ESLint 9 reached end of life on 2026-08-06. `eslint-config-next` supports ESLint 10 from 16.4.0. | Peer warnings go away once `eslint-plugin-react`, `eslint-plugin-import` and `eslint-plugin-jsx-a11y` list ESLint 10 |
| **TypeScript `~6.0`** | typescript-eslint supports TypeScript `>=4.8.4 <6.1.0` and stops entirely on TypeScript 7. Next.js recommends 6.x. | typescript-eslint supports 6.1+ / 7: then loosen the pin and the Dependabot ignore together |
| **No `@tsconfig/next`** | Next.js already creates and updates each app's `tsconfig.json`, so our package only adds stricter checks on top. `@tsconfig/next` hasn't caught up with Next 16 and would override settings Next needs. | `@tsconfig/next` catches up with the current Next.js version |
| **`onUnsupportedTypeScriptVersion: "error"`** | If an unsupported TypeScript slips in, lint fails with a clear message instead of a warning. | — |

---

## Repo layout

```
frontend-config/
├── package.json              npm workspaces root (private, never published)
├── .gitattributes            forces LF line endings (see "Line endings")
├── .github/workflows/
│   └── publish.yml           publishes a package when its tag is pushed
└── packages/
    ├── eslint-config/        index.mjs, package.json
    ├── tsconfig/             tsconfig.json, package.json
    └── prettier-config/      index.mjs, package.json
```
