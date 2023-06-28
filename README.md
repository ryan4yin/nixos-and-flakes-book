# NixOS & Flakes Book :hammer_and_wrench: :heart:

An unofficial and opinionated NixOS & Flakes :book: for beginners: https://nixos-and-flakes.thiscute.world

中文版: https://nixos-and-flakes.thiscute.world/zh/

## TODO

- Fix spelling and grammatic mistakes in the English version.

## Introduction to Flakes

The flakes experimental feature is a major development for Nix, it introduces a policy for managing dependencies between Nix expressions, it improves reproducibility, composability and usability in the Nix ecosystem. Although it's still an experimental feature, flakes have been widely used by the Nix community.[^1]

Flakes is one of the most significant changes the nix project has ever seen.[^2]

## Warning about Flakes

The benefits of Flakes are obvious, and the entire NixOS community likes it very much. Currently, more than half of the users are using Flakes[^3], so we're pretty sure that Flakes will never be deprecated.

:warning: But **Flakes is still an experimental feature**, there are still some problems with it, it is likely to introduce some breaking changes in the process of stablizing it, and it’s uncertain how greatly the breaking changes will be.

Overall, I still recommend everyone to use Flakes, this book is also written around NixOS and Flakes after all, but please be prepared for the problems that may be caused by the upcomming breaking changes.

## Contribution

> _A real community, however, exists only when its members interact in a meaningful way that deepens their understanding of each other and leads to learning._

If you find something which doesn't make sense, or something doesn't seem right, please make a pull request and please add valid and well-reasoned explanations about your changes or comments.

Before adding a pull request, please see the [contributing guidelines](/.github/CONTRIBUTING.md).

Thank you to [all the people](https://github.com/ryan4yin/nixos-and-flakes-book/graphs/contributors) who already contributed to this project!

## License

[MIT](https://opensource.org/licenses/MIT)

[^1]: [Flakes - NixOS Wiki](https://nixos.wiki/index.php?title=Flakes)
[^2]: [Flakes are such an obviously good thing](https://grahamc.com/blog/flakes-are-an-obviously-good-thing/)
[^3]: [Draft: 1 year roadmap - NixOS Foundation](https://nixos-foundation.notion.site/1-year-roadmap-0dc5c2ec265a477ea65c549cd5e568a9)
