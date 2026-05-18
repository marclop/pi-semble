# pi-semble

Pi extension that exposes [Semble](https://github.com/MinishLab/semble) as a native Pi tool.

Author: [Jonathan Stevano](https://github.com/hoverflow)

Policy: prefer Semble before `grep`/`find`; fall back to built-ins only when Semble is insufficient or the user needs exhaustive literal matching.

## Install

```bash
pi install npm:pi-semble
```

## Requirements

- `uv` / `uvx` installed locally
- Semble is fetched on demand via `uvx --from "semble[mcp]" semble`

## Tool

### `semble`

Arguments:
- `action`: `search` | `find_related`
- `repo`: local path or git URL (defaults to current project directory)
- `top_k`: number of results
- `include_text_files`: also index text files

Examples:

```text
Find where auth is implemented
```

Semble should be the first search step; use `grep`/`find` only if Semble returns nothing useful.

```json
{"action":"search","query":"auth flow","repo":"."}
```

```json
{"action":"find_related","file_path":"src/auth.ts","line":42,"repo":"."}
```
