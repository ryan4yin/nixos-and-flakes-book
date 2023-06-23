The flakes experimental feature is a major development for Nix, it introduces a policy for managing dependencies between Nix expressions, it improves reproducibility, composability and usability in the Nix ecosystem. Although it's still an experimental feature, flakes have been widely used by the Nix community.[^1]

It's Flakes is one of the most significant changes the nix project has ever seen.[^2]


## Warning about Flakes

The benefits of Flakes are obvious, and the entire NixOS community likes it very much. Currently, more than half of the users are using Flakes[^3], so we're pretty sure that Flakes will never be deprecated.

:warning: But **Flakes is still an experimental feature**, there are still many problems with it, and it is likely to introduce some breaking changes in the process of stablizing it, and it’s uncertain how greatly the breaking changes will be.

So overall, I still recommend everyone to use Flakes, this book is also written around NixOS and Flakes, but please be prepared for the problems that may be caused by the upcomming breaking changes.



## Nix Flakes and the classic Nix

As `nix-command` & `flakes` are still experimental features, the official documentation does not cover them in detail, and the community's documentation about them is also very scattered.
However, from the perspective of reproducibility and ease of management and maintenance, the classic Nix package structure and cli are no longer recommended for use.
So I will not introduce the usage of the classic Nix. It's recommended that beginners just start with `nix-command` & `flakes` and ignore all the contents about the classic Nix.

Here are the classic Nix commands and related concepts that are no longer needed after you enabling `nix-command` and `flakes`, when searching for information, you can safely ignore them:

1. `nix-channel`: `nix-channel` is similar to other package management tools such as apt/yum/pacman, managing software package versions through stable/unstable/test channels.
   1. In Flakes, the functionality of `nix-channel` is completely replaced by `inputs` in `flake.nix`.
2. `nix-env`: `nix-env` is a core command-line tool for classic Nix used to manage software packages in the user environment. It installs packages from the data sources added by `nix-channel`, so the installed package's version are influenced by the channel. Packages installed with `nix-env` are not automatically recorded in Nix's declarative configuration and are entirely outside of its control, making them difficult to reproduce on other machines. Therefore, it is not recommended to use this tool.
   1. The corresponding command in Flakes is `nix profile`, it's not recommended to use it either.
3. `nix-shell`: `nix-shell` is used to create a temporary shell environment, which is useful for development and testing.
   1. In Flakes, it is replaced by `nix develop` and `nix shell`.
4. `nix-build`: `nix-build` is used to build Nix packages, and it places the build results in `/nix/store`, but it does not record them in Nix's declarative configuration.
   1. In Flakes, `nix-build` is replaced by `nix build`.
5. ...

> maybe `nix-env -qa` is still useful some times, which returns all packages installed in the System.


## When will flakes stablized {#when-will-flakes-stablized}

I dived into some details about flakes:

- https://github.com/NixOS/rfcs/pull/136: A plan to stabilize Flakes and the new CLI incrementally, still WIP.
- https://discourse.nixos.org/t/why-are-flakes-still-experimental/29317: A post, Why are flakes still experimental?
- https://grahamc.com/blog/flakes-are-an-obviously-good-thing/: Flakes are such an obviously good thing... but the design and development process should be better.
- [Draft: 1 year roadmap - NixOS Foundation](https://nixos-foundation.notion.site/1-year-roadmap-0dc5c2ec265a477ea65c549cd5e568a9)： A roadmap of nixos fundation, which includes plan about the stabilization of flakes.

After reading all of these, I feel like that flakes will eventually be stabilized in one or two years, maybe with some breaking changes.


[^1]: [Flakes - NixOS Wiki](https://nixos.wiki/index.php?title=Flakes) 
[^2]: [Flakes are such an obviously good thing](https://grahamc.com/blog/flakes-are-an-obviously-good-thing/)
[^3]: [Draft: 1 year roadmap - NixOS Foundation](https://nixos-foundation.notion.site/1-year-roadmap-0dc5c2ec265a477ea65c549cd5e568a9)
