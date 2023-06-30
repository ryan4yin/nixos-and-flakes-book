# Introduction to Flakes

The flakes experimental feature is a major development for Nix, it introduces a policy for managing dependencies between Nix expressions, it improves reproducibility, composability and usability in the Nix ecosystem. Although it's still an experimental feature, flakes have been widely used by the Nix community.[^1]

Flakes is one of the most significant changes the nix project has ever seen.[^2]

## Warning about Flakes

The benefits of Flakes are obvious, and the entire NixOS community likes it very much. Currently, more than half of the users are using Flakes[^3], so we're pretty sure that Flakes will never be deprecated.

:warning: But **Flakes is still an experimental feature**, there are still some problems with it, it is likely to introduce some breaking changes in the process of stablizing it, and it’s uncertain how greatly the breaking changes will be.

Overall, I still recommend everyone to use Flakes, this book is also written around NixOS and Flakes after all, but please be prepared for the problems that may be caused by the upcomming breaking changes.

## Nix Flakes and Classic Nix

As `nix-command` and `flakes` are still experimental features, the official documentation does not cover them in detail, and the community's documentation about them is also scattered. However, from the perspective of reproducibility and ease of management and maintenance, the classic Nix package structure and CLI are no longer recommended for use. Therefore, I will not introduce the usage of the classic Nix. It's recommended that beginners start with `nix-command` and `flakes` and ignore all the contents about the classic Nix.

Here are the classic Nix commands and related concepts that are no longer needed after enabling `nix-command` and `flakes`. When searching for information, you can safely ignore them:

1. `nix-channel`: `nix-channel` manages software package versions through stable/unstable/test channels, similar to other package management tools such as apt/yum/pacman.
   1. In Flakes, the functionality of `nix-channel` is completely replaced by `inputs` in `flake.nix`.
2. `nix-env`: `nix-env` is a core command-line tool for classic Nix used to manage software packages in the user environment.
   1. It installs packages from the data sources added by `nix-channel`, so the installed package's version is influenced by the channel. Packages installed with `nix-env` are not automatically recorded in Nix's declarative configuration and are entirely outside of its control, making them difficult to reproduce on other machines. Therefore, it is not recommended to use this tool.
   2. The corresponding command in Flakes is `nix profile`, which is also not recommended for use.
3. `nix-shell`: `nix-shell` creates a temporary shell environment, which is useful for development and testing.
   1. In Flakes, this tool is split into three sub-commands: `nix develop`, `nix shell`, and `nix run`. We will introduce these three commands in detail in the "Development" chapter.
4. `nix-build`: `nix-build` builds Nix packages and places the build results in `/nix/store`, but it does not record them in Nix's declarative configuration.
   1. In Flakes, `nix-build` is replaced by `nix build`.
5. ...

> NOTE: `nix-env -qa` may still be useful sometimes, as it returns all packages installed in the system.

## When will flakes stablized {#when-will-flakes-stablized}

I dived into some details about flakes:

- [[RFC 0136] A plan to stabilize Flakes and the new CLI incrementally](https://github.com/NixOS/rfcs/pull/136): A plan to stabilize Flakes and the new CLI incrementally, still WIP.
- [Why are flakes still experimental? - NixOS Discourse](https://discourse.nixos.org/t/why-are-flakes-still-experimental/29317): A post, Why are flakes still experimental?
- [Flakes are such an obviously good thing - Graham Christensen](https://grahamc.com/blog/flakes-are-an-obviously-good-thing/): Flakes are such an obviously good thing... but the design and development process should be better.
- [Draft: 1 year roadmap - NixOS Foundation](https://nixos-foundation.notion.site/1-year-roadmap-0dc5c2ec265a477ea65c549cd5e568a9): A roadmap of nixos fundation, which includes plan about the stabilization of flakes.

After reading all of these, I feel like that flakes will eventually be stabilized in one or two years, maybe with some breaking changes.

[^1]: [Flakes - NixOS Wiki](https://nixos.wiki/index.php?title=Flakes)
[^2]: [Flakes are such an obviously good thing](https://grahamc.com/blog/flakes-are-an-obviously-good-thing/)
[^3]: [Draft: 1 year roadmap - NixOS Foundation](https://nixos-foundation.notion.site/1-year-roadmap-0dc5c2ec265a477ea65c549cd5e568a9)
