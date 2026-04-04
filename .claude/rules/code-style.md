# Code Style Rules

## TypeScript

- Strict mode enabled — do not disable strict checks.
- Prefer `interface` over `type` for object shapes; use `type` for unions/intersections.
- Named exports only — no default exports.
- Use `const` by default; `let` only when reassignment is needed; never `var`.
- Destructure function parameters when there are 3+ args — use an options object.
- Return early to reduce nesting — guard clauses over deep if/else.

## Naming

- **Files:** kebab-case (`voice-session.ts`, `audio-processor.ts`).
- **Components:** PascalCase (`VoiceSession.tsx`).
- **Functions/variables:** camelCase.
- **Constants:** UPPER_SNAKE_CASE for true compile-time constants only.
- **Types/Interfaces:** PascalCase, no `I` prefix.
- **Enums:** PascalCase name, PascalCase members.

## Formatting

- Follow project Prettier config. Do not override.
- Max line length: 100 characters (Prettier default).
- Trailing commas: `all`.
- Single quotes for strings.
- Semicolons: always.

## Imports

- Group imports: node builtins > external packages > internal modules > relative.
- Sort alphabetically within each group.
- No circular imports.

## Comments

- Don't add comments to self-explanatory code.
- Use `// TODO:` for deferred work — include context on why.
- JSDoc only for public API surfaces and non-obvious utility functions.
