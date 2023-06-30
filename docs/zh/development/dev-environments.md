# Dev Environments

前面我们已经学习了构建开发环境的实现原理，但是每次都要自己写一堆重复性较高的 `flake.nix`，略显繁琐。

幸运的是，社区已经有人为我们做好了这件事，如下这个仓库中包含了绝大多数编程语言的开发环境模板，直接复制粘贴下来就能用：

- [dev-templates](https://github.com/the-nix-way/dev-templates)

如果你觉得 `flake.nix` 的结构还是太复杂了，希望能有更简单的方法，也可以考虑使用下面这个项目，它对 Nix 做了更彻底的封装，对用户提供了更简单的定义：

- [cachix/devenv](https://github.com/cachix/devenv)
