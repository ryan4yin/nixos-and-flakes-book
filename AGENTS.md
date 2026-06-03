# AGENTS.md — NixOS & Flakes Book

An opinionated VitePress book (bilingual EN/ZH) about NixOS & Flakes.

## Architecture

- `docs/en/` and `docs/zh/` — parallel content trees; **every change must be mirrored in
  both**
- `docs/.vitepress/config/` — VitePress config (shared.ts + en.ts + zh.ts)
- `flake.nix` — dev environment (nodejs_22, pnpm, prettier, typos, nixfmt, pandoc)

## Commands

```sh
nix develop          # enter dev shell (installs pre-commit hooks)
pnpm install         # install JS deps
pnpm run docs:dev    # dev server on localhost:5173
pnpm run docs:build  # production build (run before committing doc changes)
typos -w             # auto-fix typos
prettier --write .   # format all files
```

- **Pre-commit hooks** (nixfmt, typos, prettier) run automatically via `nix develop`
  shellHook.
- Verify builds pass before committing: `pnpm run docs:build`

## Version Upgrades

The NixOS release branch is hardcoded in ~20 files. When upgrading:

1. `flake.nix`: change `nixpkgs.url` branch
2. `flake.lock`: run `nix flake update` to regenerate
3. Mass-replace in all `docs/**/*.md`:
   - `nixos-XX.YY` → `nixos-NEW.VER` (flake URLs, GitHub source links)
   - `release-XX.YY` → `release-NEW.VER` (home-manager references)
4. **Verify line numbers** in GitHub blob links (e.g. `#L25-L54`). File structure may
   shift between branches.

## Content Sync

- Sidebar/nav defined in `docs/.vitepress/config/en.ts` and `zh.ts` — keep in sync when
  adding/removing pages.
- Chinese and English markdown files mirror each other 1:1 per chapter.

## Style

- Prettier: `semi: false`, `printWidth: 90`, `proseWrap: always` (see `.prettierrc.yaml`)
- Nix: `nixfmt-rfc-style` with `width: 100`
