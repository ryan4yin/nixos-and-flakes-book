# Dev Environments

在 NixOS 上，全局环境中（home-manager）可以只安装一些通用的开发工具与 SDK，比如
`git`、`vim`、`emacs`、`tmux`、`zsh` 等等。对于项目本身的依赖，最好是每个项目都有一个独立
的 `flake.nix` 用于管理各自的开发环境。

为了简便，你也可以考虑提前为常用语言创建一些通用的 `flake.nix` 模板，在需要的时候复制模板
改一改就能用了。

`neovim` 等编辑器的各种插件本身也会有各种依赖，这些依赖可以考虑通过 home-manager 的
`programs.neovim.extraPackages` 等参数来将其加入到 IDE 本身的环境中，这样就能保证 IDE 本身
能正常运行，又不会污染全局环境。

## 开发环境的配置模板

前面我们已经学习了构建开发环境的实现原理，但是每次都要自己写一堆重复性较高的 `flake.nix`，
略显繁琐。

幸运的是，社区已经有人为我们做好了这件事，如下这个仓库中包含了绝大多数编程语言的开发环境模
板，直接复制粘贴下来就能用：

- [MordragT/nix-templates](https://github.com/MordragT/nix-templates)
- [the-nix-way/dev-templates](https://github.com/the-nix-way/dev-templates)

如果你觉得 `flake.nix` 的结构还是太复杂了，希望能有更简单的方法，也可以考虑使用下面这个项
目，它对 Nix 做了更彻底的封装，对用户提供了更简单的定义：

- [cachix/devenv](https://github.com/cachix/devenv)

如果你连任何一行 nix 代码都不想写，只想以最小的代价获得一个可复现的开发环境，这里也有一个
或许能符合你需求的工具：

- [jetpack-io/devbox](https://github.com/jetpack-io/devbox)

## Python 开发环境

Python 的开发环境比 Java/Go 等语言要麻烦许多，因为它默认就往全局环境装软件，要往当前项目
装，还必须得先创建虚拟环境（JS/Go 等语言里可没虚拟环境这种幺蛾子）。这对 Nix 而言是非常不
友好的行为。

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

根据错误信息，`pip install` 直接被 NixOS 禁用掉了，测试了 `pip install --user` 也同样被禁
用。为了提升环境的可复现能力，Nix 把它们全部废掉了。即使我们通过 `mkShell` 等方式创建一个
新环境，这些命令照样会报错（猜测是 Nixpkgs 中的 pip 命令本身就被魔改了，只要是跑 `install`
等修改指令就直接嘎掉）。

但是很多项目的安装脚本都是基于 pip 的，这导致这些脚本都不能直接使用，而且另一方面 nixpkgs
中的内容有限，很多 pypi 中的包里边都没有，还得自己打包，相对麻烦很多，也加重了用户的心智负
担。

解决方案之一是改用 `venv` 虚拟环境，在虚拟环境里当然就能正常使用 pip 等命令了：

```shell
python -m venv ./env
source ./env/bin/activate
```

或者使用第三方工具 `virtualenv`，缺点是这个需要额外安装。

这样用 python 直接创建的 venv，对一些人而言可能还是没有安全感，仍然希望将这个虚拟环境也弄
进 `/nix/store` 里使其不可变，通过 nix 直接安装 `requirements.txt` 或者 `poetry.toml` 中的
依赖项。这当然是可行的，有现成的 Nix 封装工具帮我们干这个活：

> 注意即使是在这俩环境中，直接跑 `pip install` 之类的安装命令仍然是会失败的，必须通过
> `flake.nix` 来安装 Python 依赖！因为数据还是在 `/nix/store` 中，这类修改命令必须在 Nix的
> 构建阶段才能执行...

- [python venv demo](https://github.com/MordragT/nix-templates/blob/master/python-venv/flake.nix)
- [poetry2nix](https://github.com/nix-community/poetry2nix)

这俩工具的好处是，能利用上 Nix Flakes 的锁机制来提升可复现能力，缺点是多了一层封装，底层变
得更复杂了。

最后，在一些更复杂的项目上，上述两种方案可能都行不通，这时候最佳的解决方案，就是改用容器
了，比如 Docker、Podman 等，容器的限制没 Nix 这么严格，能提供最佳的兼容性。

## Go 开发环境

Go 是静态链接，天然就少了很多麻烦，基本能在 NixOS 上无痛使用，不需要额外处理。

## 其他开发环境

TODO
