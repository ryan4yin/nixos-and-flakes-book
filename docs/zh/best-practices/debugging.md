# 调试 Derivation 跟 Nix 表达式

## 查看详细错误信息

如果你在部署配置时遇到了任何错误，都可以尝试在 `nixos-rebuild` 命令后面添加
`--show-trace --print-build-logs --verbose` 参数来获取详细的错误信息。举例如下：

```bash
cd /etc/nixos
sudo nixos-rebuild switch --flake .#myhost --show-trace --print-build-logs --verbose

# 更简洁的版本
sudo nixos-rebuild switch --flake .#myhost --show-trace -L -v
```

## 通过 `nix repl` 查看源码、调试配置

> 注：如果你禁用了 `NIX_PATH`，那么 `<nixpkgs>` 这样的语法将无法使用，你需要改用
> `nix repl -f flake:nixpkgs` 来加载 nixpkgs。

前面我们已经使用 `nix repl '<nixpkgs>'`
看过很多次源码了，这是一个非常强大的工具，可以帮助我们理解 Nix 的工作原理。

要学会用 `nix repl`，最好先看看它的 help 信息：

```
› nix repl -f '<nixpkgs>'
Welcome to Nix 2.13.3. Type :? for help.

Loading installable ''...
Added 17755 variables.
nix-repl> :?
The following commands are available:

  <expr>        Evaluate and print expression
  <x> = <expr>  Bind expression to variable
  :a <expr>     Add attributes from resulting set to scope
  :b <expr>     Build a derivation
  :bl <expr>    Build a derivation, creating GC roots in the working directory
  :e <expr>     Open package or function in $EDITOR
  :i <expr>     Build derivation, then install result into current profile
  :l <path>     Load Nix expression and add it to scope
  :lf <ref>     Load Nix flake and add it to scope
  :p <expr>     Evaluate and print expression recursively
  :q            Exit nix-repl
  :r            Reload all files
  :sh <expr>    Build dependencies of derivation, then start nix-shell
  :t <expr>     Describe result of evaluation
  :u <expr>     Build derivation, then start nix-shell
  :doc <expr>   Show documentation of a builtin function
  :log <expr>   Show logs for a derivation
  :te [bool]    Enable, disable or toggle showing traces for errors
```

我最常用的命令是 `:lf <ref>` 跟 `:e <expr>`.

`:e <expr>` 非常直观，所以这里不再赘述，我们来看看 `:lf <ref>`：

```nix
# 进入我的 nix 配置目录（建议替换成你自己的配置目录）
› cd ~/nix-config/

# 进入 nix repl 解释器
› nix repl
Welcome to Nix 2.13.3. Type :? for help.

# 将我的 nix 配置作为一个 flake 加载到当前作用域中
nix-repl> :lf .
Added 16 variables.

# 按 <TAB> 看看当前作用域中有哪些变量，果然 nixosConfigurations inputs outputs 跟 packages 都在里面
# 这意味着我们可以很方便地检查这些配置的内部状态
nix-repl><TAB>
# ......omit some outputs
__isInt                          nixosConfigurations
__isList                         null
__isPath                         outPath
__isString                       outputs
__langVersion                    packages
# ......omit some outputs

# 看看 inputs 里都有些啥
nix-repl> inputs.<TAB>
inputs.agenix            inputs.nixpkgs
inputs.darwin            inputs.nixpkgs-darwin
inputs.home-manager      inputs.nixpkgs-unstable
inputs.hyprland          inputs.nixpkgs-wayland
inputs.nil
inputs.nixos-generators

# 看看 inputs.nil.packages 里都有些啥
nix-repl> inputs.nil.packages.
inputs.nil.packages.aarch64-darwin
inputs.nil.packages.aarch64-linux
inputs.nil.packages.x86_64-darwin
inputs.nil.packages.x86_64-linux

# 看看 outputs 里都有些啥
nix-repl> outputs.nixosConfigurations.<TAB>
outputs.nixosConfigurations.ai
outputs.nixosConfigurations.aquamarine
outputs.nixosConfigurations.kana
outputs.nixosConfigurations.ruby

# 看看 ai 的配置都有些啥
nix-repl> outputs.nixosConfigurations.ai.<TAB>
outputs.nixosConfigurations.ai._module
outputs.nixosConfigurations.ai._type
outputs.nixosConfigurations.ai.class
outputs.nixosConfigurations.ai.config
outputs.nixosConfigurations.ai.extendModules
outputs.nixosConfigurations.ai.extraArgs
outputs.nixosConfigurations.ai.options
outputs.nixosConfigurations.ai.pkgs
outputs.nixosConfigurations.ai.type

nix-repl> outputs.nixosConfigurations.ai.config.
outputs.nixosConfigurations.ai.config.age
outputs.nixosConfigurations.ai.config.appstream
outputs.nixosConfigurations.ai.config.assertions
outputs.nixosConfigurations.ai.config.boot
outputs.nixosConfigurations.ai.config.console
outputs.nixosConfigurations.ai.config.containers
# ......omit other outputs

nix-repl> outputs.nixosConfigurations.ai.config.home-manager.users.ryan.home.<TAB>
outputs.nixosConfigurations.ai.config.home-manager.users.ryan.home.activation
outputs.nixosConfigurations.ai.config.home-manager.users.ryan.home.activationPackage
outputs.nixosConfigurations.ai.config.home-manager.users.ryan.home.emptyActivationPath
outputs.nixosConfigurations.ai.config.home-manager.users.ryan.home.enableDebugInfo
outputs.nixosConfigurations.ai.config.home-manager.users.ryan.home.file
# ......omit other outputs


nix-repl> outputs.nixosConfigurations.ai.config.home-manager.users.ryan.home.sessionVariables.<TAB>
outputs.nixosConfigurations.ai.config.home-manager.users.ryan.home.sessionVariables.BROWSER
outputs.nixosConfigurations.ai.config.home-manager.users.ryan.home.sessionVariables.DELTA_PAGER
outputs.nixosConfigurations.ai.config.home-manager.users.ryan.home.sessionVariables.EDITOR
outputs.nixosConfigurations.ai.config.home-manager.users.ryan.home.sessionVariables.TERM
# ......omit other outputs

# 看看 `TERM` 这个环境变量的值是啥
nix-repl> outputs.nixosConfigurations.ai.config.home-manager.users.ryan.home.sessionVariables.TERM
"xterm-256color"


# 看下我使用 `home.file` 定义的所有文件
nix-repl> outputs.nixosConfigurations.ai.config.home-manager.users.ryan.home.file.<TAB>
outputs.nixosConfigurations.ai.config.home-manager.users.ryan.home.file..bash_profile
outputs.nixosConfigurations.ai.config.home-manager.users.ryan.home.file..bashrc
outputs.nixosConfigurations.ai.config.home-manager.users.ryan.home.file..config/fcitx5/profile
outputs.nixosConfigurations.ai.config.home-manager.users.ryan.home.file..config/fcitx5/profile-bak
outputs.nixosConfigurations.ai.config.home-manager.users.ryan.home.file..config/i3/config
outputs.nixosConfigurations.ai.config.home-manager.users.ryan.home.file..config/i3/i3blocks.conf
#......
```

能看到，通过 `nix repl`
加载好我的 flake 配置后，就能很方便地检查所有的配置项了，这对于调试非常有用。

## 使用 nixpkgs 中提供的调试函数

TODO

## 使用 derivation 的 `NIX_DEBUG` 参数调试

TODO

## 参考文档

- [How to make nix build display all commands executed by make?](https://www.reddit.com/r/NixOS/comments/14stdgy/how_to_make_nix_build_display_all_commands/)
  - use `NIX_DEBUG=7` in derivation
- [Collection of functions useful for debugging broken nix expressions.](https://github.com/NixOS/nixpkgs/blob/nixos-23.05/lib/debug.nix)
