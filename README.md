![](./docs/public/nixos-and-flakes-book.webp)

# NixOS & Flakes Book :hammer_and_wrench: :heart:

Want to know NixOS & Flakes in detail? Looking for a beginner-friendly tutorial? Then you've come to the right place!

An unofficial and opinionated NixOS & Flakes :book: for beginners: https://nixos-and-flakes.thiscute.world/introduction/

中文版: https://nixos-and-flakes.thiscute.world/zh/introduction/

## Feedback and Discussion

Want to discuss the content of this book? Have any questions? Please feel free to open an issue or join the discussion on [GitHub Discussions](https://github.com/ryan4yin/nixos-and-flakes-book/discussions).

Historical feedback and discussion:

- [[2023-05-11] NixOS & Nix Flakes - A Guide for Beginners - Reddit](https://www.reddit.com/r/NixOS/comments/13dxw9d/nixos_nix_flakes_a_guide_for_beginners/)
- [[2023-06-22] Updates: NixOS & Nix Flakes - A Guide for Beginners - Reddit](https://www.reddit.com/r/NixOS/comments/14fvz1q/updates_nixos_nix_flakes_a_guide_for_beginners/)
- [[2023-06-24] An unofficial NixOS & Flakes book for beginners - Discourse](https://discourse.nixos.org/t/an-unofficial-nixos-flakes-book-for-beginners/29561)
- [[2023-07-06] This isn't an issue but it has to be said: - Issues](https://github.com/ryan4yin/nix-config/issues/3)

中文反馈与相关讨论：

- [[2023-05-09] NixOS 与 Nix Flakes 新手入门 - v2ex 社区](https://www.v2ex.com/t/938569#reply45)
- [[2023-06-24] NixOS 与 Flakes | 一份非官方的新手指南 - v2ex 社区](https://www.v2ex.com/t/951190#reply9)
- [[2023-06-24] NixOS 与 Flakes | 一份非官方的新手指南 - 0xffff 社区](https://0xffff.one/d/1547-nixos-yu-flakes-yi-fen-fei-guan)

## Introduction to Flakes

The flakes experimental feature is a major development for Nix, it introduces a policy for managing dependencies between Nix expressions, it improves reproducibility, composability and usability in the Nix ecosystem. Although it's still an experimental feature, flakes have been widely used by the Nix community.[^1]

Flakes is one of the most significant changes the nix project has ever seen.[^2]

## A Word of Caution about Flakes

The benefits of Flakes are evident, and the entire NixOS community has embraced it wholeheartedly. Currently, more than half of the users utilize Flakes[^3], providing assurance that Flakes will not be deprecated.

:warning: However, it's important to note that **Flakes is still an experimental feature**. Some issues persist, and there is a possibility of introducing breaking changes during the stabilization process. The extent of these breaking changes remains uncertain.

Overall, I strongly recommend everyone to use Flakes, especially since this book revolves around NixOS and Flakes. However, it's crucial to be prepared for potential problems that may arise due to forthcoming breaking changes.

## Contribution

> _A real community, however, exists only when its members interact in a meaningful way that deepens their understanding of each other and leads to learning._

If you find something which doesn't make sense, or something doesn't seem right, please make a pull request and please add valid and well-reasoned explanations about your changes or comments.

Before adding a pull request, please see the [contributing guidelines](/.github/CONTRIBUTING.md).

Thank you to [all the people](https://github.com/ryan4yin/nixos-and-flakes-book/graphs/contributors) who already contributed to this project!

## References

- The cover is based on the image from anime "[The Rolling Girls](https://en.m.wikipedia.org/wiki/The_Rolling_Girls)"

## License

[MIT](https://opensource.org/licenses/MIT)

[^1]: [Flakes - NixOS Wiki](https://nixos.wiki/index.php?title=Flakes)
[^2]: [Flakes are such an obviously good thing](https://grahamc.com/blog/flakes-are-an-obviously-good-thing/)
[^3]: [Draft: 1 year roadmap - NixOS Foundation](https://nixos-foundation.notion.site/1-year-roadmap-0dc5c2ec265a477ea65c549cd5e568a9)
