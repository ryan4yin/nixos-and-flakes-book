# Preface

## The Pain of NixOS Beginners - Documentation and Flakes

NixOS is a highly distinctive Linux distribution built upon the Nix package manager, with
a design philosophy that sets it apart from traditional distributions like Ubuntu, CentOS,
Arch Linux and others.

One of NixOS's major advantages over other distributions lies in its reproducibility and
declarative configuration, allowing users to replicate consistent system environments
across multiple machines.

While NixOS is powerful, its strength also comes with increased system complexity. This
makes it more challenging for newcomers. One major challenge is that the knowledge
accumulated on other Linux distributions is not easily transferable to NixOS. Another is
that official and community documentation is often scattered and outdated. These issues
have troubled many NixOS beginners.

One can observe these issues with the experimental feature of the Nix package manager
called Flakes. Inspired by package managers like npm and Cargo, Flakes uses `flake.nix` to
record all external dependencies and `flake.lock` to lock their versions. This
significantly enhances the reproducibility and composability of the Nix package manager
and NixOS configurations.

Flakes' advantages have made it widely popular within the community: according to official
surveys, over half of the new Nix repositories created on GitHub now utilize Flakes.

However, to maintain stability, the official documentation covers barely any
Flakes-related content. This has left many Nix/NixOS users feeling confused. They see
everyone using Flakes and want to learn it too, but find nowhere to start, often having to
piece together scattered information, search through Nixpkgs source code, or seek help
from more experienced users.

## The Origin of This Book

This book originated from my scattered notes when I first started with NixOS.

In April of this year (2023), when I got into NixOS, I fell in love with its design
philosophy. At the recommendation of a friend, I learned about Nix's Flakes experimental
feature. After comparing Flakes with the traditional NixOS configuration method, I
realized that only a Flakes-enabled NixOS met my expectations. Consequently, I completely
ignored the traditional Nix configuration approach and directly learned to configure my
NixOS system using Flakes during my initial steps.

Throughout my learning process, I found that there were very few beginner-friendly Flakes
resources. The vast majority of documentation focused on the traditional Nix configuration
approach, forcing me to extract the information I needed from various sources such as the
NixOS Wiki, Zero to Nix, Nixpkgs Manual, and Nixpkgs source code while disregarding any
non-Flakes-related content. This learning journey was quite convoluted and painful. To
prevent future stumbling, I diligently documented numerous scattered notes as I
progressed.

With some experience under my belt, in early May of this year, I switched my main PC to
NixOS. After organizing and refining my NixOS newcomer notes, I published them on my
blog[^1] and shared them in the NixOS Chinese community. The Chinese community responded
positively, and based on their advice, I translated the article into English and shared it
on Reddit, receiving strong feedback[^2].

The positive reception of this shared document encouraged me and drove me to continue
improving it. Through continuous updates, the content of this document expanded to over
20,000 words. Some readers suggested that the reading experience could be improved,
leading me to their suggestions[^3]. As a result, I migrated the article's content to a
GitHub repository, established a dedicated documentation site, and adjusted the
presentation to make it more aligned with a beginner's guide rather than a personal
notebook.

And so, a bilingual open-source book was born, which I named "<NixOS & Flakes Book>" with
the Chinese title "NixOS & Flakes 新手指南" ("NixOS & Flakes Beginner's Guide").

This open-source book's content evolved step by step as I used NixOS and engaged with
readers. The sense of accomplishment from readers' positive feedback has been my greatest
motivation for updates. Some readers' feedback has been immensely helpful in its
"evolution." Initially, I only wanted to share my experiences with NixOS in a somewhat
casual manner, but it unexpectedly turned into an open-source book. Its readership abroad
even surpassed that within my own country, and it garnered many stars - a result I never
anticipated.

I am grateful to all friends who have contributed to this book and offered suggestions,
and I appreciate all the support and encouragement from the readers. Without all of you,
this book's content might have remained confined to my personal blog, and it wouldn't have
reached its current form.

## The Features of This Book

1. Focused on NixOS and Flakes, disregarding the traditional Nix configuration approach.
2. Beginner-friendly, with explanations from the perspective of NixOS newcomers who have
   some experience with Linux usage and programming.
3. Step-by-step, progressive learning.
4. Most of the chapters in this book provide reference links at the end, making it easy
   for readers to delve deeper into the topics and evaluate the content's credibility.
5. Coherent content, well-organized, and structured. Readers can either read the book
   gradually or quickly find the information they need.

## Donation

If you find this book helpful, please consider donating to support its development.

- GitHub: <https://github.com/sponsors/ryan4yin>
- Patreon: <https://patreon.com/ryan4yin>
- Buy me a coffee: <https://buymeacoffee.com/ryan4yin>
- 爱发电: <https://afdian.net/a/ryan4yin>
- Ethereum: `0xB74Aa43C280cDc8d8236952400bF6427E4390855`

## Feedback and Discussion

I’m not an expert on NixOS, and I’ve only been using NixOS for less than 9 months until
now(2024-02), so there must be some misconceptions or complex cases in the book. If anyone
finds anything incorrect or have any questions / suggestions, just let me know about it by
opening an issue or joining the discussion on
[GitHub Discussions](https://github.com/ryan4yin/nixos-and-flakes-book/discussions). I'm
happy to continue improving the content of this book.

The reason why I wrote this little book was only because no one in the community did it
for me, who was a beginner at the time, so I chose to do it myself. Even though I knew I
could make mistakes, it's much better than doing nothing.

My hope is that this book can help more people, enabling them to experience the joys of
NixOS. Hope you like it!

## Historical Feedback and Discussions on This Book

English feedback and related discussions:

- [[2023-05-11] NixOS & Nix Flakes - A Guide for Beginners - Reddit](https://www.reddit.com/r/NixOS/comments/13dxw9d/nixos_nix_flakes_a_guide_for_beginners/)
- [[2023-06-22] Updates: NixOS & Nix Flakes - A Guide for Beginners - Reddit](https://www.reddit.com/r/NixOS/comments/14fvz1q/updates_nixos_nix_flakes_a_guide_for_beginners/)
- [[2023-06-24] An unofficial NixOS & Flakes book for beginners - Discourse](https://discourse.nixos.org/t/an-unofficial-nixos-flakes-book-for-beginners/29561)
- [[2023-07-06] This isn't an issue but it has to be said: - Discussions](https://github.com/ryan4yin/nixos-and-flakes-book/discussions/43)

Chinese feedback and discussions:

- [[2023-05-09] NixOS 与 Nix Flakes 新手入门 - v2ex 社区](https://www.v2ex.com/t/938569#reply45)
- [[2023-06-24] NixOS 与 Flakes | 一份非官方的新手指南 - v2ex 社区](https://www.v2ex.com/t/951190#reply9)
- [[2023-06-24] NixOS 与 Flakes | 一份非官方的新手指南 - 0xffff 社区](https://0xffff.one/d/1547-nixos-yu-flakes-yi-fen-fei-guan)

[^1]:
    [NixOS & Nix Flakes - A Guide for Beginners - This Cute World](https://thiscute.world/en/posts/nixos-and-flake-basics/)

[^2]:
    [NixOS & Nix Flakes - A Guide for Beginners - Reddit](https://www.reddit.com/r/NixOS/comments/13dxw9d/nixos_nix_flakes_a_guide_for_beginners/)

[^3]:
    [Updates: NixOS & Nix Flakes - A Guide for Beginners - Reddit](https://www.reddit.com/r/NixOS/comments/14fvz1q/comment/jp4xhj3/?context=3)
