# 前言

## NixOS 初学者之痛 - 文档与 Flakes

NixOS 是个非常特殊的 Linux 发行版，它基于 Nix 包管理器构建，其设计哲学跟传统的 Ubuntu/CentOS/ArchLinux 大相径庭。

NixOS 相比其他发行版最大的优势，是它的可复现能力（即在多台机器上复现出一致的系统环境的能力）以及声明式配置。

NixOS 很强大，但它的强大也带来了系统复杂度的提升，提高了使用门槛。
你使用其他 Linux 发行版的很多经验很难在 NixOS 上复用，另一方面 NixOS 又一直因为官方文档与社区文档的散乱陈旧而饱受诟病，劝退新手。

再说到 Nix 包管理器的实验特性 Flakes，它借鉴了 npm/cargo 的设计思路，使用 flake.nix 记录所有外部依赖项，使用 flake.lock 锁定所有依赖的版本，极大地增强了 Nix 包管理器及 NixOS 的可复现能力跟配置可组合能力。
因为 Flakes 的好处很大，它已经在社区被广泛使用，据官方调查，目前 GitHub 新建的 nix 仓库超过半数都使用了 Flakes.

但是另一方面 Flakes 作为一个实验性能力存在不确定性，官方文档为了保持稳定性，几乎未包含任何 Flakes 相关的内容。
这使非常多的 Nix/NixOS 用户感到非常困惑，看到大家都在用 Flakes，想学习下它但却无处学起，只能到处拼凑零散的资料、翻 Nixpkgs 源码、找前辈高人请教。


## 本书的由来

我在今年（2023） 4 月份入坑 NixOS 时就深深地爱上了它的设计哲学，同时在朋友的推荐我了解到了 Flakes 这个实验特性，在对比了 Flakes 与传统的 NixOS 配置方式后，我意识到只有带上了 Flakes 的 NixOS 才符合我对它的期待。
于是我完全忽略掉了传统的 Nix 配置方式，在入门阶段就直接学习使用 Flakes 来配置我的 NixOS 系统，遇到的最大困难就是 Flakes 的文档稀少且琐碎，大量的文档写的都是传统的 Nix 配置方法，为了避免后面再次踩坑，我在学习过程中记录了大量的零散笔记。

在拥有了一定使用经验后，今年 5 月初的时候我将自己的主力 PC 切换到了 NixOS，然后将这份写了大半个月的 NixOS 新手笔记整理润色后发布到了我的博客[^1] ，并分享到了 NixOS 中文社区。
中文社区的朋友们表示写得很棒，在他们的建议下，我将这篇文章翻译成了英文并分享到了 Reddit，收到非常强烈的正反馈[^2] 

这份笔记分享出来后好评不断，这让我备感振奋，也就很有动力持续迭代内容。在我的持续更新下其内容不断增多，逐渐扩充到了 2 万多字，阅读体验不太好。于是在读者的建议下[^3]，
我将文章内容迁移到了一个 GitHub 仓库，搭建了一个专门的文档站点，方便大家阅读与贡献。

至此，一本中英双语的开源书籍诞生了，我给它取名叫 <NixOS & Flakes Book>，中文名叫《NixOS 与 Flakes 新手指南》。

这本开源书籍的内容是我在使用 NixOS 的过程中，以及与读者的沟通中一步步优化的，读者的好评带来的成就感是我更新的最大动力，一些读者的反馈也对它的「进化」产生了很大的帮助。
我最初只是想分享一下自己的 NixOS 折腾心得，内容也写得比较随意，没想到最后却成了一本开源书籍，国外的阅读量甚至是国内的两倍，而且还得到了许多 stars ，这真是完全没预料到的。

感谢所有对本书做出过贡献、提出过建议的朋友们，感谢所有读者的支持与鼓励，没有你们，这本书的内容可能会一直停留在我个人的博客上，也不会有今天的样子。

我希望这本书能够帮助到更多的人，让更多的人能够享受到 NixOS 带来的乐趣，也希望这本书能够帮助到 NixOS 社区，让更多的人加入到 NixOS 社区的建设中来。

本书内容仍在持续更新，还有许多内容有待完善，欢迎大家在 [GitHub](https://github.com/ryan4yin/nixos-and-flakes-book) 上提出建议与贡献。

## 本书的特点

1. 以 NixOS 与 Flakes 为核心进行讲解，摈弃了传统的 Nix 配置方式
1. 新手友好，内容尽可能地从拥有一定 Linux 使用经验与编程经验的 NixOS 初学者角度出发进行讲解
2. step-by-step，渐进式地学习
3. 内容连贯，组织良好，比较成体系。读者既可以渐进式地阅读本书，也可以通过快速找到他/她需要的信息

## 本书的历史反馈与相关讨论

英文反馈与相关讨论：

- [[2023-05-11] NixOS & Nix Flakes - A Guide for Beginners - Reddit](https://www.reddit.com/r/NixOS/comments/13dxw9d/nixos_nix_flakes_a_guide_for_beginners/)
- [[2023-06-22] Updates: NixOS & Nix Flakes - A Guide for Beginners - Reddit](https://www.reddit.com/r/NixOS/comments/14fvz1q/updates_nixos_nix_flakes_a_guide_for_beginners/)
- [[2023-06-24] An unofficial NixOS & Flakes book for beginners - Discourse](https://discourse.nixos.org/t/an-unofficial-nixos-flakes-book-for-beginners/29561)
- [[2023-07-06] This isn't an issue but it has to be said: - Issues](https://github.com/ryan4yin/nix-config/issues/3)

中文反馈与相关讨论：

- [[2023-05-09] NixOS 与 Nix Flakes 新手入门 - v2ex 社区](https://www.v2ex.com/t/938569#reply45)
- [[2023-06-24] NixOS 与 Flakes | 一份非官方的新手指南 - v2ex 社区](https://www.v2ex.com/t/951190#reply9)
- [[2023-06-24] NixOS 与 Flakes | 一份非官方的新手指南 - 0xffff 社区](https://0xffff.one/d/1547-nixos-yu-flakes-yi-fen-fei-guan)


[^1]: [NixOS 与 Nix Flakes 新手入门](https://thiscute.world/posts/nixos-and-flake-basics/)
[^2]: [NixOS & Nix Flakes - A Guide for Beginners - Reddit](https://www.reddit.com/r/NixOS/comments/13dxw9d/nixos_nix_flakes_a_guide_for_beginners/)
[^3]: [Updates: NixOS & Nix Flakes - A Guide for Beginners - Reddit](https://www.reddit.com/r/NixOS/comments/14fvz1q/comment/jp4xhj3/?context=3)


