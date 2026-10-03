# Dev Environments

在 NixOS 上，我们有许多种安装开发环境的途径，最理想的方式当然是每个项目的开发环境都完全通过它自己的
`flake.nix` 定义，但实际使用上这样做有些繁琐，每次都得弄个 `flake.nix` 出来再
`nix develop` 一下，对于一些临时项目或者只是想简单看看代码的情况，这样做显然有些大材小用。

一个折衷的方案是将开发环境分为三个层次：

1. **全局环境**：通常这是指由 home-manager 管理的用户环境。
   - 通用的开发工具：`git`、`vim`、`emacs`、`tmux` 等等。
   - 常见语言的 SDK 与包管理器：`rust`、`openjdk`、`python`、`go` 等等。
1. **IDE 环境**：
   - 以 neovim 为例，home-manager 为 neovim 做了一个 wrapper 用于将 neovim 自身的依赖封装到它本身的环境中，避免污染全局环境。
   - 可通过 `programs.neovim.extraPackages`
     参数将 neovim 的插件依赖加入到 neovim 的环境中，保证 IDE 本身能正常运行。
   - 但如果你有多个 IDE（如 emacs 跟 neovim），它们常常会依赖许多相同的程序（譬如 lsp,
     tree-sitter, debugger,
     formatter 等），为了方便管理，可以将这些共享的依赖放到全局。但要注意可能会跟全局环境中的其他程序产生依赖冲突（尤其是 python 包，比较容易冲突）。
1. **项目环境**：每个项目都可以通过 `flake.nix` 定义自己的开发环境（`devShells`）。
   - 为了简便，可以提前为常用语言创建一些通用的 `flake.nix`
     模板，在需要的时候复制模板改一改就能用。
   - 项目环境的优先级是最高的（会被加到 PATH 最前面），其中的依赖会覆盖掉全局环境中同名的依赖程序。所以你可以通过项目的
     `flake.nix` 来控制项目的依赖版本，不受全局环境的影响。

## 开发环境的配置模板

前面我们已经学习了构建开发环境的实现原理，但是每次都要自己写一堆重复性较高的
`flake.nix`，略显繁琐。

幸运的是，社区已经有人为我们做好了这件事，如下这个仓库中包含了绝大多数编程语言的开发环境模板，直接复制粘贴下来就能用：

- [the-nix-way/dev-templates](https://github.com/the-nix-way/dev-templates)

如果你觉得 `flake.nix`
的结构还是太复杂了，希望能有更简单的方法，也可以考虑使用下面这个项目，它对 Nix 做了更彻底的封装，对用户提供了更简单的定义：

- [cachix/devenv](https://github.com/cachix/devenv)

如果你连任何一行 nix 代码都不想写，只想以最小的代价获得一个可复现的开发环境，这里也有一个或许能符合你需求的工具：

- [jetify-com/devbox](https://github.com/jetify-com/devbox)

## Python 开发环境

Python 的开发环境比 Java/Go 等语言要麻烦许多，因为它默认就往全局环境装软件，要往当前项目装，还必须得先创建虚拟环境（JS/Go 等语言里可没虚拟环境这种幺蛾子）。这对 Nix 而言是非常不友好的行为。

Python 的 pip 默认会将软件安装到全局，在 NixOS 中 `pip install` 会直接报错：

```shell
› pip install -r requirements.txt
error: externally-managed-environment

× This environment is externally managed
╰─> This command has been disabled as it tries to modify the immutable
    `/nix/store` filesystem.

    To use Python with Nix and nixpkgs, have a look at the online documentation:
    <https://nixos.org/manual/nixpkgs/stable/#python>.

note: If you believe this is a mistake, please contact your Python installation or OS distribution provider. You can override this, at the risk of breaking your Python installation or OS, by passing --break-system-packages.
hint: See PEP 668 for the detailed specification.
```

根据错误信息，`pip install` 直接被 NixOS 禁用掉了，测试了 `pip install --user`
也同样被禁用。

这条拦截源自
[PEP 668](https://peps.python.org/pep-0668/)：只要 Python 环境被标记为「外部管理」的（也就是它的包由外部包管理器维护，比如操作系统发行版），pip 就拒绝往里安装。这条规则来自以前传统发行版里的血泪教训：
`pip install`
和发行版管理的 Python 文件混用，经常把系统工具搞坏。很多系统工具本身就是 Python 写的，Fedora 的
`yum`、`dnf` 就是如此，于是随便一个 `sudo pip install`，系统包管理器都可能直接被搞坏掉...

NixOS 同样启用了这条规则，它的 Python 自带一个 `EXTERNALLY-MANAGED`
标记文件，上面报错中关于 `/nix/store` 的提示语就来自这个文件。

对于新项目，建议直接使用 [uv](https://github.com/astral-sh/uv)：`uv venv`
创建虚拟环境，`uv add` / `uv run`
负责依赖管理和命令执行；uv 也兼容 pip 用法，虚拟环境里可以直接
`uv pip install`。uv 本身在 nixpkgs 中就有打包，装上就能用。

如果对可复现性有更高的要求，还可以让 Nix 直接把虚拟环境构建进 `/nix/store`
里做成不可变产物，在构建期安装 `pyproject.toml` + `uv.lock`
中声明的依赖。目前还在积极维护的 Nix 封装工具是
[uv2nix](https://github.com/pyproject-nix/uv2nix)：

> 注意即使是在这种环境中，直接跑 `pip install` 之类的安装命令仍然是会失败的，必须通过
> `flake.nix` 来安装 Python 依赖！因为数据还是在 `/nix/store`
> 中，这类修改命令必须在 Nix的构建阶段才能执行...

它的好处是能利用上 Nix
Flakes 的锁机制来提升可复现能力，缺点是多了一层封装，底层变得更复杂了。

`uvx`
则直接解决前面提到的问题：全局环境装不了 Python 命令行工具。它的用法类似 Node 的 npx：`uvx <tool>`（等价于
`uv tool run <tool>`）会把工具下载到隔离环境里直接运行，不碰系统Python；想长期使用就用
`uv tool install <tool>` 持久安装。

对于旧项目，安装脚本、依赖管理全都建立在 pip 之上，遇到这种情况没啥好办法，先创建个虚拟环境，在虚拟环境里用：

```shell
python -m venv ./env
source ./env/bin/activate
```

部分连虚拟环境、FHS 环境都搞不定的项目，就只能上容器化方案了，比如 Docker、Podman 等，容器里跑个正常的 Ubuntu/Debian/Alpine，容器的限制没 Nix 这么严格，能提供最佳的兼容性。

## Go 开发环境

Go 是静态链接，天然就少了很多麻烦，基本能在 NixOS 上无痛使用，不需要额外处理。

## 其他开发环境

TODO
