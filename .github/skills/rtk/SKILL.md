---
name: rtk
description: Use RTK to dramatically reduce token usage when running terminal commands. Always wrap verbose commands (testing, git, file reading/search) with 'rtk'.
---

# RTK (Rust Token Killer)

`rtk` is a CLI proxy that filters, compresses, and deduplicates terminal output. As an AI agent, **you must prioritize using `rtk`** to avoid context window bloat.

## 🛠️ Essential Commands

### 1. Files & Search
- `rtk read <file>`: Smart file reading (strips boilerplate).
- `rtk read <file> -l aggressive`: Shows only function/class signatures.
- `rtk smart <file>`: Generates a 2-line heuristic code summary.
- `rtk ls .`: Condensed directory tree.
- `rtk find "*.ts" .`: Compact find results.
- `rtk grep "pattern" .`: Clean, grouped search results.
- `rtk json config.json`: Displays JSON structure **without values**.

### 2. Testing, Building & Linting
- **Tests (Failures Only)**: `rtk test <cmd>` (e.g., `rtk test npm run test`, `rtk test cargo test`, `rtk pytest`, `rtk vitest run`).
- **Builds (Errors Only)**: `rtk err <cmd>` (e.g., `rtk err npm run build`).
- **Linters**: `rtk lint` / `rtk tsc` (Groups errors logically by file).

### 3. Git & DevOps
- **Git**: `rtk git status`, `rtk git diff`, `rtk git log -n 10`.
- **Docker**: `rtk docker logs <container>` (**deduplicates** repetitive streaming logs), `rtk docker ps`.
- **Kubernetes**: `rtk kubectl get pods`, `rtk kubectl logs <pod>`.

## 💡 Critical Rules
1. **Prefer CLI over Built-ins**: For large codebases, use `run_in_terminal` with `rtk read` or `rtk grep` instead of the default `Read`/`Grep` tools to guarantee token safety.
2. **Raw Output Recovery**: If a command fails and `rtk` hides crucial error details, it saves the raw output in `~/.local/share/rtk/tee/` (the path is printed in the terminal). Use `cat <path>` on that file to read the raw, unfiltered logs.

## 🔄 Core Tool Aliases
To process outputs efficiently, prefer substituting these raw commands with their direct `rtk` equivalents whenever running tasks manually:

| Raw Command | Rewritten To / Recommended |
|-------------|-------------|
| `git status/diff/log/add/commit/push` | `rtk git ...` |
| `gh pr/issue/run` | `rtk gh ...` |
| `cargo test/build/clippy` | `rtk cargo ...` |
| `cat/head/tail <file>` | `rtk read <file>` |
| `rg/grep <pattern>` | `rtk grep <pattern>` |
| `ls` | `rtk ls` |
| `vitest/jest` | `rtk vitest run` |
| `tsc` | `rtk tsc` |
| `eslint/biome` | `rtk lint` |
| `prettier` | `rtk prettier` |
| `playwright` | `rtk playwright` |
| `prisma` | `rtk prisma` |
| `ruff check/format` | `rtk ruff ...` |
| `pytest` | `rtk pytest` |
| `pip list/install` | `rtk pip ...` |
| `go test/build/vet` | `rtk go ...` |
| `golangci-lint` | `rtk golangci-lint` |
| `docker ps/images/logs` | `rtk docker ...` |
| `kubectl get/logs` | `rtk kubectl ...` |
| `curl` | `rtk curl` |
| `pnpm list/outdated` | `rtk pnpm ...` |
