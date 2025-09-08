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

- [MordragT/nix-templates](https://github.com/MordragT/nix-templates)
- [the-nix-way/dev-templates](https://github.com/the-nix-way/dev-templates)

如果你觉得 `flake.nix`
的结构还是太复杂了，希望能有更简单的方法，也可以考虑使用下面这个项目，它对 Nix 做了更彻底的封装，对用户提供了更简单的定义：

- [cachix/devenv](https://github.com/cachix/devenv)

如果你连任何一行 nix 代码都不想写，只想以最小的代价获得一个可复现的开发环境，这里也有一个或许能符合你需求的工具：

- [jetpack-io/devbox](https://github.com/jetpack-io/devbox)

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
也同样被禁用。为了提升环境的可复现能力，Nix 把它们全部废掉了。即使我们通过 `mkShell`
等方式创建一个新环境，这些命令照样会报错（猜测是 Nixpkgs 中的 pip 命令本身就被魔改了，只要是跑
`install` 等修改指令就直接嘎掉）。

但是很多项目的安装脚本都是基于 pip 的，这导致这些脚本都不能直接使用，而且另一方面 nixpkgs 中的内容有限，很多 pypi 中的包里边都没有，还得自己打包，相对麻烦很多，也加重了用户的心智负担。

解决方案之一是改用 `venv` 虚拟环境，在虚拟环境里当然就能正常使用 pip 等命令了：

```shell
python -m venv ./env
source ./env/bin/activate
```

或者使用第三方工具 `virtualenv`，缺点是这个需要额外安装。

这样用 python 直接创建的 venv，对一些人而言可能还是没有安全感，仍然希望将这个虚拟环境也弄进
`/nix/store` 里使其不可变，通过 nix 直接安装 `requirements.txt` 或者 `poetry.toml`
中的依赖项。这当然是可行的，有现成的 Nix 封装工具帮我们干这个活：

> 注意即使是在这俩环境中，直接跑 `pip install` 之类的安装命令仍然是会失败的，必须通过
> `flake.nix` 来安装 Python 依赖！因为数据还是在 `/nix/store`
> 中，这类修改命令必须在 Nix的构建阶段才能执行...

- [python venv demo](https://github.com/MordragT/nix-templates/blob/master/python-venv/flake.nix)
- [poetry2nix](https://github.com/nix-community/poetry2nix)

这俩工具的好处是，能利用上 Nix
Flakes 的锁机制来提升可复现能力，缺点是多了一层封装，底层变得更复杂了。

最后，在一些更复杂的项目上，上述两种方案可能都行不通，这时候最佳的解决方案，就是改用容器了，比如 Docker、Podman 等，容器的限制没 Nix 这么严格，能提供最佳的兼容性。

## Go 开发环境

Go 是静态链接，天然就少了很多麻烦，基本能在 NixOS 上无痛使用，不需要额外处理。

## 其他开发环境

TODO
