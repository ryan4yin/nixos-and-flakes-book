# About This Book

## The Pain of NixOS Beginners - Documentation and Flakes

NixOS is a highly distinctive Linux distribution built on top of the Nix package manager, with a design philosophy vastly different from traditional distributions like Ubuntu, CentOS, ArchLinux, etc.

The biggest advantage of NixOS compared to other distributions lies in its reproducibility, which means it can consistently reproduce the same system environment across multiple machines, and its declarative configuration.

NixOS is powerful, but its power also brings an increase in system complexity, making it more challenging for newcomers. Many experiences gained from using other Linux distributions are difficult to apply on NixOS. Furthermore, NixOS has long been criticized for its scattered and outdated official and community documentation, which has discouraged beginners.

Speaking of Nix package manager's experimental feature called Flakes, it takes inspiration from the design philosophies of npm, cargo and other package managers. Flakes utilize `flake.nix` to record all external dependencies and `flake.lock` to pin the versions of those dependencies, greatly enhancing the reproducibility and composability of the Nix package manager and NixOS configurations. Due to its numerous benefits, Flakes have been widely adopted in the community, and according to official surveys, over half of the new Nix repositories on GitHub now use Flakes.

However, on the other hand, Flakes being an experimental feature introduces uncertainties, and to maintain stability, the official documentation barely covers any content related to Flakes. This has left many Nix/NixOS users confused. They see everyone using Flakes and want to learn it, but they have no proper starting point, leading them to gather scattered information, dig into Nixpkgs source code, and seek guidance from experienced individuals.

## The Origin of This Book

When I dived into NixOS in April this year (2023), I fell in love with its design philosophy. Later, a friend recommended I explore the experimental feature Flakes. After comparing Flakes with the traditional NixOS configuration approach, I realized that only NixOS with Flakes fulfilled my expectations. So, I completely ignored the traditional Nix configuration and began learning to configure my NixOS system using Flakes. The most significant difficulty I encountered was the scarcity and fragmentation of Flakes documentation. A large portion of the available documentation focused on traditional Nix configuration methods. To avoid stumbling into issues later, I documented many scattered notes while learning.

After gaining some experience, in early May of this year, I switched my main PC to NixOS and then organized and refined the notes I had written for about half a month. I published them on my blog[^1] and shared them in the NixOS Chinese community. My friends in the Chinese community praised the content, and upon their suggestion, I translated the article into English and shared it on Reddit, receiving strong positive feedback[^2].

The continuous stream of positive feedback after sharing my notes was exhilarating, and it motivated me to keep iterating on the content. As I kept updating it, the content grew to over 20,000 words, making the reading experience less than ideal. Consequently, based on readers' suggestions[^3], I migrated the content to a GitHub repository and set up a dedicated documentation site to facilitate reading and contributions.

Thus, a bilingual open-source book was born, and I named it <NixOS & Flakes Book>, with the Chinese title being "NixOS & Flakes: A Beginner's Guide."

The content of this open-source book has been continuously refined through my experience using NixOS and interactions with readers. The sense of achievement from positive feedback has been the driving force behind my updates, and feedback from readers has been immensely helpful in its evolution. Initially, I just wanted to share my NixOS tinkering experiences, and the content was relatively casual. I never expected it to become an open-source book, with foreign readership even surpassing that in China, and it has garnered many stars—a completely unforeseen outcome.

I want to express my gratitude to all friends who contributed and provided suggestions for this book and to all readers for their support and encouragement. Without all of you, the content of this book might have remained on my personal blog, never reaching its current form.

I hope this book can help more people enjoy the pleasures of NixOS and contribute to the NixOS community by encouraging more people to join in its development.

The book's content is still continuously updated, and there is much room for improvement. I welcome everyone to suggest and contribute on [GitHub](https://github.com/ryan4yin/nixos-and-flakes-book).

## Characteristics of This Book

1. Focuses on NixOS and Flakes, abandoning the traditional Nix configuration approach.
2. Beginner-friendly, with content explained from the perspective of NixOS beginners who have some experience with Linux and programming.
3. Step-by-step learning for a gradual understanding.
4. Coherent and well-organized content, forming a structured system. Readers can read the book progressively or quickly find the information they need.

## Historical Feedback and Related Discussions

English feedback and discussions:

- [[2023-05-11] NixOS & Nix Flakes - A Guide for Beginners - Reddit](https://www.reddit.com/r/NixOS/comments/13dxw9d/nixos_nix_flakes_a_guide_for_beginners/)
- [[2023-06-22] Updates: NixOS & Nix Flakes - A Guide for Beginners - Reddit](https://www.reddit.com/r/NixOS/comments/14fvz1q/updates_nixos_nix_flakes_a_guide_for_beginners/)
- [[2023-06-24] An unofficial NixOS & Flakes book for beginners - Discourse](https://discourse.nixos.org/t/an-unofficial-nixos-flakes-book-for-beginners/29561)
- [[2023-07-06] This isn't an issue but it has to be said: - Issues](https://github.com/ryan4yin/nix-config/issues/3)

Chinese feedback and discussions:

- [[2023-05-09] NixOS 与 Nix Flakes 新手入门 - v2ex 社区](https://www.v2ex.com/t/938569#reply45)
- [[2023-06-24] NixOS 与 Flakes | 一份非官方的新手指南 - v2ex 社区](https://www.v2ex.com/t/951190#reply9)
- [[2023-06-24] NixOS 与 Flakes | 一份非官方的新手指南 - 0xffff 社区](https://0xffff.one/d/1547-nixos-yu-flakes-yi-fen-fei-guan)

[^1]: [NixOS & Nix Flakes - A Guide for Beginners - This Cute World](https://thiscute.world/en/posts/nixos-and-flake-basics/)
[^2]: [NixOS & Nix Flakes - A Guide for Beginners - Reddit](https://www.reddit.com/r/NixOS/comments/13dxw9d/nixos_nix_flakes_a_guide_for_beginners/)
[^3]: [Updates: NixOS & Nix Flakes - A Guide for Beginners - Reddit](https://www.reddit.com/r/NixOS/comments/14fvz1q/comment/jp4xhj3/?context=3)
