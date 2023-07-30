# Preface

## The Pain of NixOS Beginners - Documentation and Flakes

NixOS is a highly distinctive Linux distribution built upon the Nix package manager, with a design philosophy that sets it apart from traditional distributions like Ubuntu, CentOS, Arch Linux and others.

One of NixOS's major advantages over other distributions lies in its reproducibility and declarative configuration, allowing users to replicate consistent system environments across multiple machines.

While NixOS is powerful, its strength also comes with increased system complexity, making it more challenging for newcomers. 
On the one hand, the knowledge accumulated on other Linux distributions is not easily transferable to NixOS. 
On the other hand, NixOS has long been criticized for its scattered and outdated official and community documentation.
These issues have troubled many NixOS beginners.

Speaking of the experimental feature of the Nix package manager called Flakes. Inspired by package managers like npm and cargo, Flakes use `flake.nix` to record all external dependencies and `flake.lock` to lock their versions. This significantly enhances the reproducibility and composability of the Nix package manager and NixOS configurations. Flakes' advantages have made it widely popular within the community. According to official surveys, over half of the new Nix repositories created on GitHub now utilize Flakes, making the traditional Nix configuration method less prevalent.

However, on the flip side, Flakes, being an experimental feature, comes with uncertainties. To maintain stability, the official documentation barely covers any Flakes-related content. This has left many Nix/NixOS users feeling confused. They see everyone using Flakes and want to learn it too, but find nowhere to start, often having to piece together scattered information, search through Nixpkgs source code, or seek help from more experienced users.

## The Origin of This Book

This book originated from my scattered notes when I first started with NixOS.

In April of this year (2023), when I got into NixOS, I fell in love with its design philosophy. At the recommendation of a friend, I learned about Nix's Flakes experimental feature. After comparing Flakes with the traditional NixOS configuration method, I realized that only a Flakes-enabled NixOS met my expectations. Consequently, I completely ignored the traditional Nix configuration approach and directly learned to configure my NixOS system using Flakes during my initial steps.

Throughout my learning process, I found that there were very few beginner-friendly Flakes resources. The vast majority of documentation focused on the traditional Nix configuration approach, forcing me to extract the information I needed from various sources such as the NixOS Wiki, Zero to Nix, Nixpkgs Manual, and Nixpkgs source code while disregarding any non-Flakes-related content. This learning journey was quite convoluted and painful. To prevent future stumbling, I diligently documented numerous scattered notes as I progressed.

With some experience under my belt, in early May of this year, I switched my main PC to NixOS. After organizing and refining my NixOS newcomer notes, I published them on my blog[^1] and shared them in the NixOS Chinese community. The Chinese community responded positively, and based on their advice, I translated the article into English and shared it on Reddit, receiving strong feedback[^2].

The positive reception of this shared document encouraged me and drove me to continue improving it. Through continuous updates, the content of this document expanded to over 20,000 words. Some readers suggested that the reading experience could be improved, leading me to their suggestions[^3]. As a result, I migrated the article's content to a GitHub repository, established a dedicated documentation site, and adjusted the presentation to make it more aligned with a beginner's guide rather than a personal notebook.

And so, a bilingual open-source book was born, which I named "<NixOS & Flakes Book>" with the Chinese title "NixOS & Flakes 新手指南" ("NixOS & Flakes Beginner's Guide").

This open-source book's content evolved step by step as I used NixOS and engaged with readers. The sense of accomplishment from readers' positive feedback has been my greatest motivation for updates. Some readers' feedback has been immensely helpful in its "evolution." Initially, I only wanted to share my experiences with NixOS in a somewhat casual manner, but it unexpectedly turned into an open-source book. Its readership abroad even surpassed that within my own country, and it garnered many stars - a result I never anticipated.

I am grateful to all friends who have contributed to this book and offered suggestions, and I appreciate all the support and encouragement from the readers. Without all of you, this book's content might have remained confined to my personal blog, and it wouldn't have reached its current form.

My hope is that this book can help more people, enabling them to experience the joys of NixOS. I also wish for this book to benefit the NixOS community by encouraging more people to contribute to its development.

The content of this book is continually being updated, with much room for improvement. I welcome everyone to provide suggestions and contribute on [GitHub](https://github.com/ryan4yin/nixos-and-flakes-book).

## The Features of This Book

1. Focused on NixOS and Flakes, disregarding the traditional Nix configuration approach.
2. Beginner-friendly, with explanations from the perspective of NixOS newcomers who have some experience with Linux usage and programming.
3. Step-by-step, progressive learning.
4. Coherent content, well-organized, and structured. Readers can either read the book gradually or quickly find the information they need.

## Historical Feedback and Discussions on This Book

English feedback and related discussions:

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
