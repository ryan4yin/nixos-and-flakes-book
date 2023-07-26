# Introduction to Flakes

The flakes experimental feature is a major development for Nix, it introduces a policy for managing dependencies between Nix expressions, it improves reproducibility, composability and usability in the Nix ecosystem. Although it's still an experimental feature, flakes have been widely used by the Nix community.[^1]

Flakes is one of the most significant changes the nix project has ever seen.[^2]

In simple terms, if you've worked with some JavaScript/Go/Rust/Python, you should be familiar with files like `package.json`/`go.mod`/`Cargo.toml`/`pyproject.toml`. In these programming languages, these files are used to describe the dependencies between software packages and how to build projects.

Similarly, the package managers in these programming languages also use files like `package-lock.json`/`go.sum`/`Cargo.lock`/`poetry.lock` to lock the versions of dependencies, ensuring the reproducibility of projects.

Flakes borrow ideas from these package managers to enhance the reproducibility, composability, and usability of the Nix ecosystem.
Flakes introduce `flake.nix`, similar to `package.json`, to describe the dependencies between Nix packages and how to build projects. 
Additionally, it provides `flake.lock`, akin to `package-lock.json`, to lock the versions of dependencies, ensuring project reproducibility.

## A Word of Caution about Flakes <Badge type="danger" text="caution" />

The benefits of Flakes are evident, and the entire NixOS community has embraced it wholeheartedly. Currently, more than half of the users utilize Flakes[^3], providing assurance that Flakes will not be deprecated.

:warning: However, it's important to note that **Flakes is still an experimental feature**. Some issues persist, and there is a possibility of introducing breaking changes during the stabilization process. The extent of these breaking changes remains uncertain.

Overall, I strongly recommend everyone to use Flakes, especially since this book revolves around NixOS and Flakes. However, it's crucial to be prepared for potential problems that may arise due to forthcoming breaking changes.

## Nix Flakes and Classic Nix

Since the `nix-command` and `flakes` features are still experimental, the official documentation lacks detailed coverage, and the community's documentation on them is also scattered. From the perspective of reproducibility, ease of management, and maintenance, the classic Nix package structure and CLI are no longer recommended. Therefore, I will not delve into the usage of classic Nix. Beginners are advised to start with `nix-command` and `flakes` while disregarding any content related to classic Nix.

The following are classic Nix commands and associated concepts that are no longer necessary after enabling `nix-command` and `flakes`. When searching for information, you can safely ignore them:

1. `nix-channel`: `nix-channel` manages software package versions through stable/unstable/test channels, similar to other package management tools such as apt/yum/pacman.
   1. In Flakes, the functionality of `nix-channel` is entirely replaced by the `inputs` section in `flake.nix`.
2. `nix-env`: `nix-env` is a core command-line tool for classic Nix used to manage software packages in the user environment.
   1. It installs packages from the data sources added by `nix-channel`, causing the installed package's version to be influenced by the channel. Packages installed with `nix-env` are not automatically recorded in Nix's declarative configuration and are completely independent of its control, making them challenging to reproduce on other machines. Therefore, it is not recommended to use this tool.
   2. The corresponding command in Flakes is `nix profile`. Personally, I don't recommend it either.
3. `nix-shell`: `nix-shell` creates a temporary shell environment, which is useful for development and testing.
   1. In Flakes, this tool is divided into three sub-commands: `nix develop`, `nix shell`, and `nix run`. We will discuss these three commands in detail in the "[Development](../development/intro.md)" chapter.
4. `nix-build`: `nix-build` builds Nix packages and places the build results in `/nix/store`, but it does not record them in Nix's declarative configuration.
   1. In Flakes, `nix-build` is replaced by `nix build`.
5. `nix-collect-garbage`: Garbage collection command used to clean up unused Store Objects in `/nix/store`.
   1. In Nix Flakes, the corresponding command is `nix store gc --debug`.
6. And other less commonly used commands are not listed here.
   1. You can refer to the detailed command comparison list in [Try to explain nix commands](https://qiita.com/Sumi-Sumi/items/6de9ee7aab10bc0dbead?_x_tr_sl=auto&_x_tr_tl=en&_x_tr_hl=en).

> NOTE: `nix-env -qa` may still be useful in some cases, as it returns all packages installed in the system.

## When Will Flakes Be Stabilized?

I delved into some details regarding Flakes:

- [[RFC 0136] A Plan to Stabilize Flakes and the New CLI Incrementally](https://github.com/NixOS/rfcs/pull/136): A plan to incrementally stabilize Flakes and the new CLI, still a work in progress.
- [Why Are Flakes Still Experimental? - NixOS Discourse](https://discourse.nixos.org/t/why-are-flakes-still-experimental/29317): A post discussing why Flakes are still considered experimental.
- [Flakes Are Such an Obviously Good Thing - Graham Christensen](https://grahamc.com/blog/flakes-are-an-obviously-good-thing/): An article emphasizing the advantages of Flakes while suggesting areas for improvement in its design and development process.
- [Draft: 1-year Roadmap - NixOS Foundation](https://nixos-foundation.notion.site/1-year-roadmap-0dc5c2ec265a477ea65c549cd5e568a9): A roadmap provided by the NixOS Foundation, which includes plans regarding the stabilization of Flakes.

After reviewing these resources, it seems likely that Flakes will be stabilized within one or two years, possibly accompanied by some breaking changes.

[^1]: [Flakes - NixOS Wiki](https://nixos.wiki/index.php?title=Flakes)
[^2]: [Flakes are such an obviously good thing](https://grahamc.com/blog/flakes-are-an-obviously-good-thing/)
[^3]: [Draft: 1 year roadmap - NixOS Foundation](https://nixos-foundation.notion.site/1-year-roadmap-0dc5c2ec265a477ea65c549cd5e568a9)
