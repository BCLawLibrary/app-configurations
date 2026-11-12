# shared-packages (archived)

> **This repo is archived and read-only.** These packages were published to npm but have not been used by a BC Law application. The same code now lives as plain files in the BC Law app nextjs template repository, and new nextjs apps start from that template. The npm packages are deprecated and will eventually be deleted from npmjs.com. The NPM organization @bclawlibrary is still accessible if we do decide publishing packages makes sense for scaling, although that is not obviously needed as of November 2026.
>
> The repo stays as a record of the code as it was when it was archived. To see whether an app's copy of the shared files has changed since, compare it against this repo.

| Package | What it was for | Last version |
|---|---|---|
| [`@bclawlibrary/eslint-config`](packages/eslint-config) | Next.js lint rules plus our guardrails: size, complexity, functional style, accessibility | 2.0.0 |
| [`@bclawlibrary/tsconfig`](packages/tsconfig) | Extra TypeScript strictness on top of the `tsconfig.json` Next.js generates | 1.0.1 |
| [`@bclawlibrary/prettier-config`](packages/prettier-config) | Prettier defaults plus Tailwind class sorting | 1.0.1 |
| [`@bclawlibrary/firebase-routes`](packages/firebase-routes) | The standard way to build API routes: every route needs a signed-in BC user (Google sign-in through Firebase), with the browser code to sign in and call them | 0.1.0 on npm; 0.2.0 (security-review fixes) is in this repo only and was never published |

## Why it was archived

A shared package needs someone to own its releases, and the ATR team is relatively small to make that one person's job right now. Keeping the same files in the template means:

- no npm releases to maintain;
- each app owns its own copy of the configuration files and firebase route logic;
- a change to a shared file is a normal pull request in the template repository.

## If packages make sense again

Packaging shared code is still the better setup in the long run. Copies drift, and every app has to pick up a fix by hand. Bring packages back when both of these are true:

- **At least two people can own the releases.** They need to understand npm versioning, publishing and the `bclawlibrary` npm organization, and a single person leaving shouldn't strand the packages.
- **Several apps share the code.** A package pays for itself once two or three live apps would otherwise each copy and patch the same files.

If that happens, don't unarchive this repo. Start a new one from what the template has by then, since the template's copies will be the current ones. And you can just point claude or any other agent to this repository as an example for how to set up the new repository for packages. This repo still shows how it was set up the first time:

- npm workspaces;
- a Check workflow on every pull request;
- tag-triggered publishing from GitHub Actions with trusted publishing;
- Dependabot upgrade PRs in each app.

Choose new package names or new major versions, so nobody gets the old deprecated releases by mistake.

---

## What the packages enforce

### ESLint (`@bclawlibrary/eslint-config`)

Starts from `eslint-config-next` (Core Web Vitals + TypeScript), then adds:

| Area | Rule | Limit |
|---|---|---|
| Size | `max-lines-per-function` | 100 lines (blank lines and comments don't count) |
| Size | `max-lines` | 150 lines per `.ts` / `.tsx` file |
| Size | `react/no-multi-comp` | One component per file |
| Complexity | `sonarjs/cognitive-complexity` | Max 15 |
| Complexity | `max-depth` | 3 levels of nesting |
| Complexity | `max-params` | 3 parameters |
| Complexity | `max-nested-callbacks` | 3 deep |
| Functional style | `functional/no-let` | Use `const` |
| Functional style | `functional/no-loop-statements` | Use `map` / `filter` / `reduce` |
| Functional style | `functional/no-classes`, `functional/no-this-expressions` | Functions only |
| Functional style | `functional/immutable-data` | Don't change data in place |
| Functional style | `no-param-reassign` (with `props: true`) | Don't change a function's inputs |
| Async | `@typescript-eslint/no-floating-promises` | Every promise is awaited or handled |
| Accessibility | `jsx-a11y` strict set, as errors | Keyboard support, labels, alt text, valid ARIA |
| Data fetching | `@tanstack/eslint-plugin-query` recommended set | TanStack Query mistakes |
| Icons | `no-restricted-imports`, `react/forbid-elements` | Font Awesome's free icons only; no Pro packages, other icon libraries or hand-written `<svg>` |

Test files (`*.test.ts`, `*.test.tsx`) are exempt from the function length, one-component and nested-callback rules.

### TypeScript (`@bclawlibrary/tsconfig`)

| Flag | Catches |
|---|---|
| `noUncheckedIndexedAccess` | Reading a list item or object key that might not exist |
| `noImplicitReturns` | Code paths that forget to return |
| `noFallthroughCasesInSwitch` | `switch` cases that fall into the next one |
| `noImplicitOverride` | Overriding a method without saying so |
| `allowUnreachableCode: false` | Code that can never run |

### Prettier (`@bclawlibrary/prettier-config`)

Prettier's defaults plus `prettier-plugin-tailwindcss`.

### firebase-routes

See [its README](packages/firebase-routes/README.md).

---

## Repo layout

```
shared-packages/
├── package.json              npm workspaces root (private, never published)
├── package-lock.json
├── .gitattributes            forces LF line endings
├── .github/workflows/
│   ├── check.yml             ran type checks, builds and tests on every pull request
│   └── publish.yml           published a package when its tag was pushed
└── packages/
    ├── eslint-config/
    ├── tsconfig/
    ├── prettier-config/
    └── firebase-routes/
```
