# NixOS 的优缺点

## 优点 {#advantages}

- **声明式配置，OS as Code**
  - NixOS 使用声明式配置来管理整个系统环境，可以直接用 Git 管理这些配置，只要你的配置文件不丢，系统就可以随时还原到任一历史状态（前面提过了，只有在 Nix 配置文件中声明了的状态才可被 NixOS 还原）。
  - Nix Flakes 还使用了 `flake.lock`
    作为版本锁文件，它记录了所有相关数据的数据源地址、hash 值，这极大地提升了 Nix 的可复现能力（或者说增强了构建结果的一致性，这个设计实际是从 cargo/npm 等一些编程语言的包管理设计中借鉴来的）。
- **高度便捷的系统自定义能力**
  - 通过改几行配置，就可以简单地更换系统的各种组件。这是因为 Nix 将底层的复杂操作全部封装在了 Nix 软件包中，只给用户提供了简洁且必要的声明式参数。
  - 而且这种修改非常安全，你可以很方便地来回切换各种桌面环境（比如 gnome/kde/i3/sway），几乎不会遇到坑。
- **可回滚**
  - 可以随时回滚到任一历史环境，NixOS 甚至默认将所有旧版本都加入到了启动项，确保系统滚挂了也能随时回退。所以 Nix 也被认为是最稳定的包管理方式。
- **没有依赖冲突问题**
  - 因为 Nix 中每个软件包都拥有唯一的 hash，其安装路径中也会包含这个 hash 值，因此可以多版本共存。
- **社区很活跃，第三方项目也挺丰富**
  - 官方包仓库 nixpkgs 贡献者众多，也有很多人分享自己的 Nix 配置，一遍浏览下来，整个生态给我一种发现新大陆的兴奋感。

<figure>
  <img src="/nixos-bootloader.avif">
  <figcaption>
    <h4 align="center">
      NixOS 启动项中列出了所有历史版本，图来自 
      <a href="https://discourse.nixos.org/t/how-to-make-uefis-grub2-menu-the-same-as-bioss-one/10074" target="_blank" rel="noopener noreferrer">
        NixOS Discourse - 10074
      </a>
    </h4>
  </figcaption>
</figure>

## 缺点 {#disadvantages}

- **学习成本高**:
  - 如果你希望系统完全可复现，并且避免各种不当使用导致的坑，那就需要学习了解 Nix 的整个设计，并以声明式的方式管理系统，不能无脑
    `nix-env -i`（这类似 `apt-get install`）。
- **文档混乱**:
  - 首先 Nix Flakes 目前仍然是实验性特性，介绍它本身的文档目前比较匮乏,
    Nix 社区绝大多数文档都只介绍了旧的 `/etc/nixos/configuration.nix`，想直接从 Nix
    Flakes(`flake.nix`) 开始学习的话，需要参考大量旧文档，从中提取出自己需要的内容。另外一些 Nix 当前的核心功能，官方文档都语焉不详（比如
    `imports` 跟 Nixpkgs Module System），想搞明白基本只能看源码了...
- **比较吃硬盘空间**:
  - 为了保证系统可以随时回退，nix 默认总是保留所有历史环境，这会使用更多的硬盘空间。
  - 多使用的这这些空间，在桌面电脑上可能不是啥事，但是在资源受限的云服务器上可能会是个问题。
- **报错信息比较隐晦**:
  - 由于[Nixpkgs 中模块系统](../other-usage-of-flakes/module-system.md)的[复杂的 Merging 算法](https://discourse.nixos.org/t/best-resources-for-learning-about-the-nixos-module-system/1177/4)，导致 NixOS 的报错信息相当糟糕。在很多情况下，不管你加不加
    `--show-trace`，它都只会告诉你代码有错误（最常见且最迷惑的报错信息是
    [Infinite recursion encountered](https://discourse.nixos.org/t/infinite-recursion-encountered-by-making-module-configurable/23508/2)），但究竟是错在哪？类型系统说我也不知道，这得你自己慢慢找了。目前我的经验来说，**遇到这种报错信息没任何意义的 bug，最简单有效的解决方法是用「二分法」一点点还原代码**。
  - 这个问题应该是 NixOS 目前最大的痛点之一。
- **底层实现更复杂**：
  - Nix 多做了一层声明式的抽象带来了诸多好处，而其代价就是底层的代码实现会比传统的命令式工具中的同类代码更复杂。
  - 这导致实现难度更高，对底层做些修改也会更麻烦。不过这个问题带来的负担主要是在 Nix 软件包的维护者身上，普通用户接触底层比较少，负担也就小很多。

## 简单总结下 {#summary}

总的来说，我觉得 NixOS 适合那些有一定 Linux 使用经验与编程经验，并且希望对自己的系统拥有更强掌控力的开发者。

我不推荐没有任何 Linux 使用经验的新人直接上手 NixOS，那可能会是一段糟糕的旅程。

> 如果你对 NixOS 还有疑问，可以看看本书的最后一章「[常见问题](../faq/)」。
