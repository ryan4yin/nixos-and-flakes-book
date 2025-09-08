# 前言

## NixOS 初学者之痛 - 文档与 Flakes

NixOS 是个非常特殊的 Linux 发行版，它构建在 Nix 包管理器之上，设计哲学也跟传统的 Ubuntu,
CentOS, Arch Linux 等发行版大相径庭。

NixOS 相比其他发行版最大的优势，是它的可复现能力（即在多台机器上复现出一致的系统环境的能力）以及声明式配置。

NixOS 很强大，但它的强大也带来了系统复杂度的提升，提高了使用门槛。一方面你在其他 Linux 发行版上积累很多经验很难在 NixOS 上复用，另一方面 NixOS 又一直因为官方文档与社区文档的散乱陈旧而饱受诟病。这些问题都困扰着许多 NixOS 新手。

再说到 Nix 包管理器的实验特性 Flakes，它借鉴了 npm/cargo 等包管理器的设计思路，使用 flake.nix 记录所有外部依赖项，使用 flake.lock 锁定所有依赖的版本，极大地增强了 Nix 包管理器及 NixOS 的可复现能力跟配置可组合能力。

因为 Flakes 的好处很大，社区非常喜欢它。据官方调查，目前 GitHub 新建的 nix 仓库超过半数都使用了 Flakes，传统的 Nix 配置方式已经不再是主流。

但是另一方面 Flakes 作为一个实验性能力存在不确定性，官方文档为了保持稳定性，几乎未包含任何 Flakes 相关的内容。这使许多 Nix/NixOS 用户感到相当困惑——他们看到大家都在用 Flakes，也想学习下它，但却发现无处学起，只能到处拼凑零散的资料、翻 Nixpkgs 源码，或者找前辈高人请教。

## 本书的由来

本书最初源于我入坑 NixOS 时的一份零散学习笔记。

我在今年（2023） 4 月份入坑 NixOS 时就深深地爱上了它的设计哲学，同时在朋友的推荐下我了解到了 Nix 的 Flakes 实验特性。在对比了 Flakes 与传统的 NixOS 配置方式后，我意识到只有带上了 Flakes 的 NixOS 才符合我对它的期待。于是我完全忽略掉了传统的 Nix 配置方式，在入门阶段就直接学习使用 Flakes 来配置我的 NixOS 系统。

在学习的过程中，我发现适合新手的 Flakes 文档几乎没有，大量的文档都是传统的 Nix 配置方法，我需要从 NixOS
Wiki、Zero to Nix、Nixpkgs
Manual、Nixpkgs 源码等各种资料中提取出我需要的信息，同时还要忽略掉所有非 Flakes 的内容。这个学习过程非常曲折痛苦。为了避免后面再次踩坑，我在学习过程中记录了大量的零散笔记。

在拥有了一定使用经验后，今年 5 月初的时候我将自己的主力 PC 切换到了 NixOS，然后将这份写了大半个月的 NixOS 新手笔记整理润色后发布到了我的博客[^1]
，并分享到了 NixOS 中文社区。中文社区的朋友们表示写得很棒，在他们的建议下，我又将这篇文章翻译成了英文并分享到了 Reddit，收到了非常强烈的正反馈[^2]。

这份笔记分享出来后好评不断，这让我备感振奋，继续完善它的热情也高涨。在我的持续更新下这份笔记的内容不断增多，逐渐扩充到了 2 万多字，有读者反馈阅读体验不太好，于是在他的建议下[^3]，我将文章内容迁移到了一个 GitHub 仓库，搭建了一个专门的文档站点，方便大家阅读与贡献。同时也调整了内容的表述，去掉了一些过于个人化的内容，使其更贴近一本新手指南的风格，而不是一份随性而为的个人笔记。

至此，一本中英双语的开源书籍诞生了，我给它取名叫 <NixOS & Flakes
Book>，中文名叫《NixOS 与 Flakes 新手指南》。

这本开源书籍的内容是我在使用 NixOS 的过程中，以及与读者的沟通中一步步优化的，读者的好评带来的成就感是我更新的最大动力，一些读者的反馈也对它的「进化」产生了很大的帮助。我最初只是想分享一下自己的 NixOS 折腾心得，内容也写得比较随意，没想到最后却成了一本开源书籍，国外的阅读量甚至是国内的两倍，而且还得到了许多 stars ，这真是完全没预料到的。

感谢所有对本书做出过贡献、提出过建议的朋友们，感谢所有读者的支持与鼓励，没有你们，这本书的内容可能会一直停留在我个人的博客上，也不会有今天的样子。

## 捐赠

如果你觉得这本书对你有帮助，请考虑捐赠以支持它的开发。

- GitHub: <https://github.com/sponsors/ryan4yin>
- Patreon: <https://patreon.com/ryan4yin>
- Buy me a coffee: <https://buymeacoffee.com/ryan4yin>
- 爱发电: <https://afdian.com/a/ryan4yin>
- Ethereum: `0xB74Aa43C280cDc8d8236952400bF6427E4390855`

## 反馈与讨论

我不是什么 NixOS 专家，到目前为止（2024-02）我只使用了不到 9 个月的 NixOS，所以书中肯定存在一些误解或者不当的例子。如果你发现了任何错误或者有任何问题/建议，可以直接通过开 issue 或者加入
[GitHub Discussions](https://github.com/ryan4yin/nixos-and-flakes-book/discussions)
讨论，我很乐意根据大家的反馈持续优化本书的内容。

我写这本小书的原因只是因为没有人为当时还是新手的我做这件事，如上所述，社区的文档太乱了，所以我选择自己动手，丰衣足食。即使我知道我可能会犯错，但这总比什么都不做要好得多。

我希望这本书能帮助更多的人，让他们能够体验到 NixOS 的乐趣。希望你们喜欢它！

## 本书的特点

1. 以 NixOS 与 Flakes 为核心进行讲解，摈弃了传统的 Nix 配置方式
2. 新手友好，内容尽可能地从拥有一定 Linux 使用经验与编程经验的 NixOS 初学者角度出发进行讲解
3. step-by-step，渐进式地学习
4. 本书的大部分章节的末尾都给出了其中内容的参考链接，方便读者进一步深入学习，也方便读者对内容的可信度进行评估
5. 内容连贯，组织良好，比较成体系。读者既可以渐进式地阅读本书，也可以快速定位自己需要的信息

## 本书的历史反馈与相关讨论

英文反馈与相关讨论：

- [[2023-05-11] NixOS & Nix Flakes - A Guide for Beginners - Reddit](https://www.reddit.com/r/NixOS/comments/13dxw9d/nixos_nix_flakes_a_guide_for_beginners/)
- [[2023-06-22] Updates: NixOS & Nix Flakes - A Guide for Beginners - Reddit](https://www.reddit.com/r/NixOS/comments/14fvz1q/updates_nixos_nix_flakes_a_guide_for_beginners/)
- [[2023-06-24] An unofficial NixOS & Flakes book for beginners - Discourse](https://discourse.nixos.org/t/an-unofficial-nixos-flakes-book-for-beginners/29561)
- [[2023-07-06] This isn't an issue but it has to be said: - Discussions](https://github.com/ryan4yin/nixos-and-flakes-book/discussions/43)

中文反馈与相关讨论：

- [[2023-05-09] NixOS 与 Nix Flakes 新手入门 - v2ex 社区](https://www.v2ex.com/t/938569#reply45)
- [[2023-06-24] NixOS 与 Flakes | 一份非官方的新手指南 - v2ex 社区](https://www.v2ex.com/t/951190#reply9)
- [[2023-06-24] NixOS 与 Flakes | 一份非官方的新手指南 - 0xffff 社区](https://0xffff.one/d/1547-nixos-yu-flakes-yi-fen-fei-guan)

[^1]: [NixOS 与 Nix Flakes 新手入门](https://thiscute.world/posts/nixos-and-flake-basics/)

[^2]:
    [NixOS & Nix Flakes - A Guide for Beginners - Reddit](https://www.reddit.com/r/NixOS/comments/13dxw9d/nixos_nix_flakes_a_guide_for_beginners/)

[^3]:
    [Updates: NixOS & Nix Flakes - A Guide for Beginners - Reddit](https://www.reddit.com/r/NixOS/comments/14fvz1q/comment/jp4xhj3/?context=3)
