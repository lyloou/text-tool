## Repository Notes

### Project Shape

This project is a macOS text utility built with Tauri, Rust, and React.

- Rust workspace root: `Cargo.toml`
- Core text-processing crate: `crates/text_core`
- Tauri desktop shell: `src-tauri`
- React/Vite frontend: `frontend`
- Current product/roadmap notes: `PLAN.md`

### Current Behavior

The app has two main work areas:

- Left source workspace:
  - source text input
  - search highlighting
  - find/replace
  - reverse lines
- Right result workspace:
  - ignore-empty-lines toggle
  - conversion into three comma-separated formats:
    - double quoted
    - single quoted
    - plain
  - copy per result card

The Rust core currently exposes:

- `convert_lines(input, mode, ignore_empty_lines)`
- `replace_text(input, find, replace_with)`
- `search_matches(output, query, case_sensitive)`
- `reverse_lines(input)`

### Important Files

- `crates/text_core/src/lib.rs`: public Rust core API and unit tests.
- `crates/text_core/src/transform.rs`: line conversion logic.
- `crates/text_core/src/replace.rs`: plain text replacement.
- `crates/text_core/src/search.rs`: match location calculation.
- `crates/text_core/src/reorder.rs`: line reordering.
- `src-tauri/src/commands.rs`: Tauri command wrappers for Rust core functions.
- `src-tauri/src/main.rs`: Tauri app startup and command registration.
- `frontend/src/App.tsx`: main frontend state and workflow orchestration.
- `frontend/src/services/tauriApi.ts`: frontend API boundary to Tauri commands.
- `frontend/src/components/ActionButton.tsx`: shared immediate-action button for editor-focused workflows.
- `frontend/src/components/Toolbar.tsx`: source-side controls.
- `frontend/src/components/InputEditor.tsx`: editable source area with highlighting.
- `frontend/src/components/ResultView.tsx`: result-side controls and output cards.

### Verification Commands

Use these as the first checks for most changes:

```sh
cargo test -p text_core
```

```sh
npm run build
```

Run the frontend command from `frontend/`.

Full workspace Rust tests currently have a known blocker:

```sh
cargo test
```

This fails while compiling the Tauri binary because `src-tauri/icons/icon.png` is missing. The `src-tauri/icons/` directory exists but is empty.

### Known Implementation Notes

- `reverse_lines` exists in Rust core, but the frontend currently reverses lines locally in `frontend/src/App.tsx` with `reverseLinesLocal`.
- If adding more line operations, prefer keeping core transformation logic in `crates/text_core` and exposing it through Tauri commands when the frontend needs it.
- The frontend already has installed dependencies under `frontend/node_modules`, so do not scan or edit dependency files unless explicitly needed.
- This directory is not currently seen as a Git repository by `git status`; be extra careful to avoid unrelated edits.

### Next Likely Work

The roadmap in `PLAN.md` lists these likely next features:

1. Tauri dev-mode and macOS app packaging verification.
2. Deduplicate source lines while preserving original order.
3. Sort source lines, starting with ascending order.
4. Add prefix/suffix to each line.
5. Add SQL `IN (...)` output.
6. Add JSON array string output.
7. Add uppercase/lowercase conversion.

### Working Rules For This Repository

- State assumptions when requirements are ambiguous.
- Prefer the smallest implementation that satisfies the requested behavior.
- Only edit files directly required by the task.
- Match existing code style, even where a different style might be preferable.
- Add tests for behavior changes in `crates/text_core` when changing Rust core logic.
- Keep frontend changes scoped to the relevant component or service boundary.
- Do not remove unrelated dead code; mention it instead.

### Frontend Interaction Rules

- The main editor is a high-frequency focus target. Immediate action buttons around it should use `ActionButton` instead of raw `<button>` when a mouse click is expected to work without first moving focus.
- Use `ActionButton` for editor toolbar actions, editor-adjacent toggles such as soft wrap and numeric sort, and result-panel actions such as copy, expand, and collapse.
- `ActionButton` runs mouse actions on `pointerdown` with `preventDefault()`, ignores non-left mouse buttons, and keeps keyboard activation through `click`.
- Do not duplicate custom `onPointerDown`/`onClick` action splitting in feature components unless `ActionButton` cannot express the required behavior.
- Raw `<button>` is still fine for settings windows, normal form controls, and buttons that intentionally need native focus/click behavior.
