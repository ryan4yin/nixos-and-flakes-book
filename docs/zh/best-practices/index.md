
## 十一、最佳实践 {#best-practices}

> [Tips&Tricks for NixOS Desktop - NixOS Discourse][Tips&Tricks for NixOS Desktop - NixOS Discourse]

Nix 非常强大且灵活，做一件事有非常多的方法，这就导致了很难找到最合适的方法来做你的工作。
这里记录了一些我在使用 NixOS 中学习到的最佳实践，希望能帮到你。

### 1. 运行非 NixOS 的二进制文件 {#run-non-nixos-binaries}

NixOS 不遵循 FHS 标准，因此你从网上下载的二进制程序在 NixOS 上大概率是跑不了的。
为了在 NixOS 上跑这些非 NixOS 的二进制程序，需要做一些骚操作。有位老兄在这里总结了 10 种实现此目的的方法：[Different methods to run a non-nixos executable on Nixos](https://unix.stackexchange.com/questions/522822/different-methods-to-run-a-non-nixos-executable-on-nixos)，推荐一读。

我个人用的比较多的方法是，直接创建一个 FHS 环境来运行二进制程序，这种方法非常方便易用。

大概玩法是这样的，首先在你的 `environment.systemPackages` 中添加这个包：

```nix
{ config, pkgs, lib, ... }:

{
  # ......

  environment.systemPackages = with pkgs; [
    # ......o

    # create a fhs environment by command `fhs`, so we can run non-nixos packages in nixos!
    (pkgs.buildFHSUserEnv (base // {
      name = "fhs";
      targetPkgs = pkgs: (
        # pkgs.buildFHSUserEnv 只提供一个最小的 FHS 环境，缺少很多常用软件所必须的基础包
        # 所以直接使用它很可能会报错
        #
        # pkgs.appimageTools 提供了大多数程序常用的基础包，所以我们可以直接用它来补充
        (pkgs.appimageTools.defaultFhsEnvArgs.targetPkgs pkgs) ++ with pkgs; [
          pkg-config
          ncurses
          # 如果你的 FHS 程序还有其他依赖，把它们添加在这里
        ]
      );
      profile = "export FHS=1";
      runScript = "bash";
      extraOutputsToInstall = ["dev"];
    }))
  ];

  # ......
}
```

部署好上面的配置后，你就能用 `fhs` 命令进入我们定义好的 FHS 环境了，然后就可以运行你下载的二进制程序了，比如：

```shell
# 进入我们定义好的 fhs 环境，它就跟其他 Linux 发行版一样了
$ fhs
# 看看我们的 /usr/bin 里是不是多了很多东西
(fhs) $ ls /usr/bin
# 尝试下跑一个非 nixos 的二进制程序
(fhs) $ ./bin/code
```

### 2. 通过 `nix repl` 查看源码、调试配置 {#view-source-code-via-nix-repl}

前面我们已经使用 `nix repl '<nixpkgs>'` 看过很多次源码了，这是一个非常强大的工具，可以帮助我们理解 Nix 的工作原理。

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
outputs.nixosConfigurations.ai.config.home-manager.users.ryan.home.enableNixpkgsReleaseCheck
outputs.nixosConfigurations.ai.config.home-manager.users.ryan.home.extraActivationPath
outputs.nixosConfigurations.ai.config.home-manager.users.ryan.home.extraBuilderCommands
outputs.nixosConfigurations.ai.config.home-manager.users.ryan.home.extraOutputsToInstall
outputs.nixosConfigurations.ai.config.home-manager.users.ryan.home.extraProfileCommands
outputs.nixosConfigurations.ai.config.home-manager.users.ryan.home.file
# ......omit other outputs


nix-repl> outputs.nixosConfigurations.ai.config.home-manager.users.ryan.home.sessionVariables.<TAB>
outputs.nixosConfigurations.ai.config.home-manager.users.ryan.home.sessionVariables.BROWSER
outputs.nixosConfigurations.ai.config.home-manager.users.ryan.home.sessionVariables.DELTA_PAGER
outputs.nixosConfigurations.ai.config.home-manager.users.ryan.home.sessionVariables.EDITOR
outputs.nixosConfigurations.ai.config.home-manager.users.ryan.home.sessionVariables.GLFW_IM_MODULE
outputs.nixosConfigurations.ai.config.home-manager.users.ryan.home.sessionVariables.MANPAGER
outputs.nixosConfigurations.ai.config.home-manager.users.ryan.home.sessionVariables.QT_IM_MODULE
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
outputs.nixosConfigurations.ai.config.home-manager.users.ryan.home.file..config/i3/keybindings
outputs.nixosConfigurations.ai.config.home-manager.users.ryan.home.file..config/i3/layouts
outputs.nixosConfigurations.ai.config.home-manager.users.ryan.home.file..config/i3/scripts
outputs.nixosConfigurations.ai.config.home-manager.users.ryan.home.file..config/i3/wallpaper.png
outputs.nixosConfigurations.ai.config.home-manager.users.ryan.home.file..config/rofi
#......
```

能看到，通过 `nix repl` 加载好我的 flake 配置后，就能很方便地检查所有的配置项了，这对于调试非常有用。

### 3. 远程部署

社区的一些工具，比如 [NixOps](https://github.com/NixOS/nixops), [deploy-rs](https://github.com/serokell/deploy-rs), 跟 [colmena](https://github.com/zhaofengli/colmena)，都可以用来部署 NixOS 配置到远程主机，但是都太复杂了，所以先全部跳过。

实际上我们前面使用了多次的 NixOS 本机部署命令 `nixos-rebuild`，这个工具也支持通过 ssh 协议进行远程部署，非常方便。

美中不足的是，`nixos-rebuild` 不支持使用密码认证进行部署，所以要想使用它进行远程部署，我们需要：

1. 为远程主机配置 ssh 公钥认证。
2. 为了避免 sudo 密码认证失败，需要使用 `root` 用户进行部署，或者给用户授予 sudo 权限不需要密码认证。
   1. 相关 issue: <https://github.com/NixOS/nixpkgs/issues/118655>

在搞定上面两点后，我们就可以使用 `nixos-rebuild` 进行远程部署了：

```bash
# 1. 首先将本地的 ssh 私钥加载到 ssh-agent 中，以便后续使用
ssh-add ~/.ssh/ai-idols

# 2. 将 NixOS 配置部署到远程主机，使用第一步添加的 ssh key 进行认证，用户名默认为 `$USER`
nixos-rebuild --flake .#aquamarine --target-host 192.168.4.1 --build-host 192.168.4.1 switch --use-remote-sudo --verbose
```

上面的命令会将 NixOS 配置部署到 `aquamarine` 这台主机上，参数解释如下：

1. `--target-host`: 设置远程主机的 ip 地址
2. `--build-host` 指定了构建 NixOS 配置的主机，这里设置为跟 `--target-host` 相同，表示在远程主机上构建配置。
3. `--use-remote-sudo` 表示部署需要用到远程主机的 sudo 权限，如果不设置这个参数，部署会失败。

如果你希望在本地构建配置，然后再部署到远程主机，可以命令中的 `--build-host aquamarinr` 替换为 `--build-host localhost`。

另外如果你不想直接使用 ip 地址，可以在 `~/.ssh/config` 或者 `/etc/ssh/ssh_config` 中定义一些主机别名，比如：

> 当然如下这份配置也完全可以通过 Nix 来管理，这个就留给读者自己去实现了。

```bash
› cat ~/.ssh/config

# ......

Host ai
  HostName 192.168.5.100
  Port 22

Host aquamarine
  HostName 192.168.5.101
  Port 22

Host ruby
  HostName 192.168.5.102
  Port 22

Host kana
  HostName 192.168.5.103
  Port 22
```

这样我们就可以使用主机别名进行部署了：

```bash
nixos-rebuild --flake .#aquamarine --target-host aquamarine --build-host aquamarine switch --use-remote-sudo --verbose
```

### 4. 使用 Makefile 简化命令

> 注意: Makefile 的 target 名称不能与当前目录下的文件或者目录重名，否则 target 将不会被执行！

在使用 NixOS 的过程中，我们会经常使用 `nixos-rebuild` 命令，经常需要输入一大堆参数，比较繁琐。

所以我使用 Makefile 来管理我的 flake 配置相关的命令，简化使用。

我的 Makefile 大概内容截取如下：

```makefile
############################################################################
#
#  Nix commands related to the local machine
#
############################################################################

deploy:
	nixos-rebuild switch --flake . --use-remote-sudo

debug:
	nixos-rebuild switch --flake . --use-remote-sudo --show-trace --verbose

update:
	nix flake update

history:
	nix profile history --profile /nix/var/nix/profiles/system

gc:
	# remove all generations older than 7 days
	sudo nix profile wipe-history --profile /nix/var/nix/profiles/system  --older-than 7d

	# garbage collect all unused nix store entries
	sudo nix store gc --debug

############################################################################
#
#  Idols, Commands related to my remote distributed building cluster
#
############################################################################

add-idols-ssh-key:
	ssh-add ~/.ssh/ai-idols

aqua: add-idols-ssh-key
	nixos-rebuild --flake .#aquamarine --target-host aquamarine --build-host aquamarine switch --use-remote-sudo

aqua-debug: add-idols-ssh-key
	nixos-rebuild --flake .#aquamarine --target-host aquamarine --build-host aquamarine switch --use-remote-sudo --show-trace --verbose

ruby: add-idols-ssh-key
	nixos-rebuild --flake .#ruby --target-host ruby --build-host ruby switch --use-remote-sudo

ruby-debug: add-idols-ssh-key
	nixos-rebuild --flake .#ruby --target-host ruby --build-host ruby switch --use-remote-sudo --show-trace --verbose

kana: add-idols-ssh-key
	nixos-rebuild --flake .#kana --target-host kana --build-host kana switch --use-remote-sudo

kana-debug: add-idols-ssh-key
	nixos-rebuild --flake .#kana --target-host kana --build-host kana switch --use-remote-sudo --show-trace --verbose

idols: aqua ruby kana

idols-debug: aqua-debug ruby-debug kana-debug
```

将上述 Makefile 放到 NixOS 配置的根目录下，然后我们就可以使用 `make` 命令来执行相关的命令了。
比如说我这里 `make deploy` 就是部署 NixOS 配置到本地主机，`make idols` 就是部署到我的远程主机集群。