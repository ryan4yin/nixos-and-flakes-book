# 模块化 NixOS 配置 {#modularize-nixos-configuration}

到这里整个系统的骨架基本就配置完成了，当前我们 `/etc/nixos` 中的系统配置结构应该如下：

```
$ tree
.
├── flake.lock
├── flake.nix
├── home.nix
└── configuration.nix
```

下面分别说明下这四个文件的功能：

- `flake.lock`: 自动生成的版本锁文件，它记录了整个 flake 所有输入的数据源、hash 值、版本
  号，确保系统可复现。
- `flake.nix`: flake 的入口文件，执行 `sudo nixos-rebuild switch` 时会识别并部署它。
- `configuration.nix`: 在 flake.nix 中被作为系统模块导入，目前所有系统级别的配置都写在此文
  件中。
  - 此配置文件中的所有配置项，参见官方文档
    [Configuration - NixOS Manual](https://nixos.org/manual/nixos/unstable/index.html#ch-configuration)
- `home.nix`: 在 flake.nix 中被 home-manager 作为 ryan 用户的配置导入，也就是说它包含了
  ryan 这个用户的所有 Home Manager 配置，负责管理其 Home 文件夹。
  - 此配置文件的所有配置项，参见
    [Appendix A. Configuration Options - Home Manager](https://nix-community.github.io/home-manager/options.xhtml)

通过修改上面几个配置文件就可以实现对系统与 Home 目录状态的修改。但是随着配置的增多，单纯依
靠 `configuration.nix` 跟 `home.nix` 会导致配置文件臃肿，难以维护。更好的解决方案是通过
Nix 的模块机制，将配置文件拆分成多个模块，分门别类地编写维护。

在前面的 Nix 语法一节有介绍过：「`import` 的参数如果为文件夹路径，那么会返回该文件夹下的
`default.nix` 文件的执行结果」，实际 Nix 还提供了一个 `imports` 参数，它可以接受一个
`.nix` 文件列表，并将该列表中的所有配置**合并**（Merge）到当前的 attribute set 中。注意这
里的用词是「合并」，它表明 `imports` 如果遇到重复的配置项，不会简单地按执行顺序互相覆盖，
而是更合理地处理。比如说我在多个 modules 中都定义了 `program.packages = [...]`，那么
`imports` 会将所有 modules 中的 `program.packages` 这个 list 合并。不仅 list 能被正确合
并，attribute set 也能被正确合并，具体行为各位看官可以自行探索。

> 我只在
> [nixpkgs-unstable 官方手册 - evalModules parameters](https://nixos.org/manual/nixpkgs/unstable/#module-system-lib-evalModules-parameters)
> 中找到一句关于 `imports` 的描
> 述：`A list of modules. These are merged together to form the final configuration.`，可
> 以意会一下...（Nix 的文档真的一言难尽...这么核心的参数文档就这么一句...）

我们可以借助 `imports` 参数，将 `home.nix` 与 `configuration.nix` 拆分成多个 `.nix` 文件。

推荐一个非常好的模块化配置的例子，可以参考一下：

- [Misterio77/nix-starter-configs](https://github.com/Misterio77/nix-starter-configs)

再举个更复杂一点的例子，如下是我之前 i3wm 配置的目录结构
[ryan4yin/nix-config/i3-kickstarter](https://github.com/ryan4yin/nix-config/tree/i3-kickstarter)：

```shell
├── flake.lock
├── flake.nix
├── home
│   ├── default.nix         # 在这里通过 imports = [...] 导入所有子模块
│   ├── fcitx5              # fcitx5 中文输入法设置，我使用了自定义的小鹤音形输入法
│   │   ├── default.nix
│   │   └── rime-data-flypy
│   ├── i3                  # i3wm 桌面配置
│   │   ├── config
│   │   ├── default.nix
│   │   ├── i3blocks.conf
│   │   ├── keybindings
│   │   └── scripts
│   ├── programs
│   │   ├── browsers.nix
│   │   ├── common.nix
│   │   ├── default.nix   # 在这里通过 imports = [...] 导入 programs 目录下的所有 nix 文件
│   │   ├── git.nix
│   │   ├── media.nix
│   │   ├── vscode.nix
│   │   └── xdg.nix
│   ├── rofi              #  rofi 应用启动器配置，通过 i3wm 中配置的快捷键触发
│   │   ├── configs
│   │   │   ├── arc_dark_colors.rasi
│   │   │   ├── arc_dark_transparent_colors.rasi
│   │   │   ├── power-profiles.rasi
│   │   │   ├── powermenu.rasi
│   │   │   ├── rofidmenu.rasi
│   │   │   └── rofikeyhint.rasi
│   │   └── default.nix
│   └── shell             # shell 终端相关配置
│       ├── common.nix
│       ├── default.nix
│       ├── nushell
│       │   ├── config.nu
│       │   ├── default.nix
│       │   └── env.nu
│       ├── starship.nix
│       └── terminals.nix
├── hosts
│   ├── msi-rtx4090      # PC 主机的配置
│   │   ├── default.nix                 # 这就是之前的 configuration.nix，不过大部分内容都拆出到 modules 了
│   │   └── hardware-configuration.nix  # 与系统硬件相关的配置，安装 nixos 时自动生成的
│   └── my-nixos       # 测试用的虚拟机配置
│       ├── default.nix
│       └── hardware-configuration.nix
├── modules          # 从 configuration.nix 中拆分出的一些通用配置
│   ├── i3.nix
│   └── system.nix
└── wallpaper.jpg    # 桌面壁纸，在 i3wm 配置中被引用
```

Nix Flakes 对目录结构没有任何要求，你可以参考上面的例子，摸索出适合你自己的目录结构。其中
关键点就是通过 `imports` 参数导入其他 `.nix` 文件。

## `lib.mkOverride`, `lib.mkDefault` and `lib.mkForce`

你可能会发现有些人在 Nix 文件中使用 `lib.mkDefault` `lib.mkForce` 来定义值，顾名思
义，`lib.mkDefault` 和 `lib.mkForce` 用于设置选项的默认值，或者强制设置选项的值。

直接这么说可能不太好理解，官方文档也没啥对这几个函数的详细解释，最直接的理解方法，是看源
码。

开个新窗口，输入命令 `nix repl -f '<nixpkgs>'` 进入 REPL 解释器，然后输入
`:e lib.mkDefault`，就可以看到 `lib.mkDefault` 的源码了（不太懂 `:e` 是干啥的？请直接输入
`:?` 查看帮助信息学习下）。

源码截取如下：

```nix
  # ......

  mkOverride = priority: content:
    { _type = "override";
      inherit priority content;
    };

  mkOptionDefault = mkOverride 1500; # priority of option defaults
  mkDefault = mkOverride 1000; # used in config sections of non-user modules to set a default
  mkImageMediaOverride = mkOverride 60; # image media profiles can be derived by inclusion into host config, hence needing to override host config, but do allow user to mkForce
  mkForce = mkOverride 50;
  mkVMOverride = mkOverride 10; # used by ‘nixos-rebuild build-vm’

  # ......
```

所以 `lib.mkDefault` 就是用于设置选项的默认值，它的优先级是 1000，而 `lib.mkForce` 则用于
强制设置选项的值，它的优先级是 50。如果你直接设置选项的值，那么它的优先级就是 1000（和
`lib.mkDefault` 一样）。

`priority` 的值越低，它实际的优先级就越高，所以 `lib.mkForce` 的优先级比 `lib.mkDefault`
高。而如果你定义了多个优先级相同的值，Nix 会报错说存在参数冲突，需要你手动解决。

这几个函数在模块化 NixOS 配置中非常有用，因为你可以在低层级的模块（base module）中设置默认
值，然后在高层级的模块（high-level module）中设置优先级更高的值。

举个例子，我在这里定义了一个默认
值：<https://github.com/ryan4yin/nix-config/blob/c515ea9/modules/nixos/core-server.nix#L32>

```nix{6}
{ lib, pkgs, ... }:

{
  # ......

  nixpkgs.config.allowUnfree = lib.mkDefault false;

  # ......
}
```

然后在桌面机器的配置中，我强制覆盖了默认值：
<https://github.com/ryan4yin/nix-config/blob/c515ea9/modules/nixos/core-desktop.nix#L18>

```nix{10}
{ lib, pkgs, ... }:

{
  # 导入 base module
  imports = [
    ./core-server.nix
  ];

  # 覆盖 base module 中定义的默认值
  nixpkgs.config.allowUnfree = lib.mkForce true;

  # ......
}
```

## `lib.mkOrder`, `lib.mkBefore` 与 `lib.mkAfter`

`lib.mkBefore` 跟 `lib.mkAfter` 用于设置**列表类型**的合并顺序，它们跟 `lib.mkDefault` 和
`lib.mkForce` 一样，也被用于模块化配置。

> 列表类型的定义我没找到官方文档，但我简单理解，应该就是合并结果与合并先后顺序有关的类型。
> 按这个理解，list 跟 string 类型都是列表类型，实际测试这几个函数也确实能用在这两个类型
> 上。

前面说了如果你定义了多个优先级相同的值，Nix 会报错说存在参数冲突，需要你手动解决。

但是如果你定义的是**列表类型**的值，Nix 就不会报错了，因为 Nix 会把你定义的多个值合并成一
个列表，而 `lib.mkBefore` 跟 `lib.mkAfter` 就是用于设置这个列表的合并顺序的。

还是先来看看源码，开个终端键入 `nix repl -f '<nixpkgs>'` 进入 REPL 解释器，然后输入
`:e lib.mkBefore`，就可以看到 `lib.mkBefore` 的源码了（不太懂 `:e` 是干啥的？请直接输入
`:?` 查看帮助信息学习下）。

```nix
  # ......

  mkOrder = priority: content:
    { _type = "order";
      inherit priority content;
    };

  mkBefore = mkOrder 500;
  defaultOrderPriority = 1000;
  mkAfter = mkOrder 1500;

  # ......
```

能看到 `lib.mkBefore` 只是个 `lib.mkOrder 500` 的别名，而 `lib.mkAfter` 则是个
`lib.mkOrder 1500` 的别名。

为了更直观地理解这两个函数，现在来创建一个 flake 测试下：

```nix{10-38}
# flake.nix
{
  inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixos-24.11";
  outputs = {nixpkgs, ...}: {
    nixosConfigurations = {
      "my-nixos" = nixpkgs.lib.nixosSystem {
        system = "x86_64-linux";

        modules = [
          ({lib, ...}: {
            programs.bash.shellInit = lib.mkBefore ''
              echo 'insert before default'
            '';
            programs.zsh.shellInit = lib.mkBefore "echo 'insert before default';";
            nix.settings.substituters = lib.mkBefore [
              "https://nix-community.cachix.org"
            ];
          })

          ({lib, ...}: {
            programs.bash.shellInit = lib.mkAfter ''
              echo 'insert after default'
            '';
            programs.zsh.shellInit = lib.mkAfter "echo 'insert after default';";
            nix.settings.substituters = lib.mkAfter [
              "https://ryan4yin.cachix.org"
            ];
          })

          ({lib, ...}: {
            programs.bash.shellInit = ''
              echo 'this is default'
            '';
            programs.zsh.shellInit = "echo 'this is default';";
            nix.settings.substituters = [
              "https://nix-community.cachix.org"
            ];
          })
        ];
      };
    };
  };
}
```

上面的例子包含了在多行字符串、单行字符串，以及列表三种类型上应用 `lib.mkBefore` 和
`lib.mkAfter`，下面测试下结果：

```bash
# 示例一：多行字符串合并
› echo $(nix eval .#nixosConfigurations.my-nixos.config.programs.bash.shellInit)
trace: warning: system.stateVersion is not set, defaulting to 24.11. Read why this matters on https://nixos.org/manual/nixos/stable/options.html#opt-system.stateVersio
n.
"echo 'insert before default'

echo 'this is default'

if [ -z \"$__NIXOS_SET_ENVIRONMENT_DONE\" ]; then
 . /nix/store/60882lm9znqdmbssxqsd5bgnb7gybaf2-set-environment
fi



echo 'insert after default'
"

# 示例二：单行字符串合并
› echo $(nix eval .#nixosConfigurations.my-nixos.config.programs.zsh.shellInit)
"echo 'insert before default';
echo 'this is default';
echo 'insert after default';"

# 示例三：列表合并
› nix eval .#nixosConfigurations.my-nixos.config.nix.settings.substituters
[ "https://nix-community.cachix.org" "https://nix-community.cachix.org" "https://cache.nixos.org/" "https://ryan4yin.cachix.org" ]

```

可以看到，`lib.mkBefore` 会将后面的值插入到前面，而 `lib.mkAfter` 会将后面的值插入到后面。

> 对模块系统更深入的介绍，参见
> [模块系统与自定义 options](../other-usage-of-flakes/module-system.md).

## References

- [Nix modules: Improving Nix's discoverability and usability ](https://cfp.nixcon.org/nixcon2020/talk/K89WJY/)
- [Module System - Nixpkgs](https://github.com/NixOS/nixpkgs/blob/nixos-24.11/doc/module-system/module-system.chapter.md)
- [Misterio77/nix-starter-configs](https://github.com/Misterio77/nix-starter-configs)
