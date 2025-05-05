![](./docs/public/nixos-and-flakes-book.webp)

# NixOS & Flakes Book :hammer_and_wrench: :heart:

Want to know NixOS & Flakes in detail? Looking for a beginner-friendly tutorial? Then
you've come to the right place!

An unofficial and opinionated NixOS & Flakes :book: for beginners:
https://nixos-and-flakes.thiscute.world/

中文版: https://nixos-and-flakes.thiscute.world/zh/

> If you're using macOS,
> [ryan4yin/nix-darwin-kickstarter](https://github.com/ryan4yin/nix-darwin-kickstarter)
> may be a good starting point for you, you can learn how to use Nix with this book and
> take nix-darwin-kickstarter as a start point to build your own Nix configuration.

## Feedback and Discussion

I’m not an expert on NixOS, and I’ve only been using NixOS for less than 9 months until
now(2024-02), so there must be some misconceptions or inappropriate examples in the book.
If anyone finds anything incorrect or have any questions / suggestions, just let me know
about it by open an issue or join the discussion on
[GitHub Discussions](https://github.com/ryan4yin/nixos-and-flakes-book/discussions), I'm
glad continue to optimize the content of this book.

The reason why I wrote this little book was only because no one in the community did it
for me, who was a beginner at the time, so I chose to do it myself. Even though I knew I
could make mistakes, it's much better than do nothing.

My hope is that this book can help more people, enabling them to experience the joys of
NixOS. Hope you like it!

## Introduction to Flakes

The flakes experimental feature is a major development for Nix, it introduces a policy for
managing dependencies between Nix expressions, it improves reproducibility, composability
and usability in the Nix ecosystem. Although it's still an experimental feature, flakes
have been widely used by the Nix community.[^1]

Flakes is one of the most significant changes the nix project has ever seen.[^2]

## A Word of Caution about Flakes

The benefits of Flakes are evident, and the entire NixOS community has embraced it
wholeheartedly. Currently, more than half of the users utilize Flakes[^3], providing
assurance that Flakes will not be deprecated.

:warning: However, it's important to note that **Flakes is still an experimental
feature**. Some issues persist, and there is a possibility of introducing breaking changes
during the stabilization process. The extent of these breaking changes remains uncertain.

Overall, I strongly recommend everyone to use Flakes, especially since this book revolves
around NixOS and Flakes. However, it's crucial to be prepared for potential problems that
may arise due to forthcoming breaking changes.

## Contribution

> _A real community, however, exists only when its members interact in a meaningful way
> that deepens their understanding of each other and leads to learning._

If you find something which doesn't make sense, or something doesn't seem right, please
make a pull request and please add valid and well-reasoned explanations about your changes
or comments.

Before adding a pull request, please see the
[contributing guidelines](/.github/CONTRIBUTING.md).

Thank you to
[all the people](https://github.com/ryan4yin/nixos-and-flakes-book/graphs/contributors)
who already contributed to this project!

## References

- The cover is based on the image from anime
  "[The Rolling Girls](https://en.wikipedia.org/wiki/The_Rolling_Girls)"
- The NixOS logo is from [NixOS](https://nixos.org/)

## License

[NixOS & Flakes Book](https://github.com/ryan4yin/nixos-and-flakes-book) © 2023 by Ryan
Yin is licensed under [CC BY-SA 4.0](./LICENSE.md)

[^1]: [Flakes - NixOS Wiki](https://wiki.nixos.org/wiki/Flakes)
[^2]:
    [Flakes are such an obviously good thing](https://grahamc.com/blog/flakes-are-an-obviously-good-thing/)

[^3]:
    [Draft: 1 year roadmap - NixOS Foundation](https://web.archive.org/web/20250317120825/https://nixos-foundation.notion.site/1-year-roadmap-0dc5c2ec265a477ea65c549cd5e568a9)
