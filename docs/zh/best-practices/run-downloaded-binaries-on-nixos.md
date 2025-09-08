# 运行非 NixOS 的二进制文件

NixOS 不遵循 FHS 标准，因此你从网上下载的二进制程序在 NixOS 上大概率是跑不了的。为了在 NixOS 上跑这些非 NixOS 的二进制程序，需要做一些骚操作。有位老兄在这里总结了 10 种实现此目的的方法：[Different methods to run a non-nixos executable on Nixos](https://unix.stackexchange.com/questions/522822/different-methods-to-run-a-non-nixos-executable-on-nixos)，推荐一读。此外如果你懒得自己折腾，只想实现需求，也可以直接看看这个傻瓜式工具
[nix-alien](https://github.com/thiagokokada/nix-alien). 或者如果你熟悉 Docker，直接用 Docker 跑也是个不错的选择。

我个人用的比较多的方法是，直接创建一个 FHS 环境来运行二进制程序，这种方法非常方便易用。

大概玩法是这样的，首先在你的 `environment.systemPackages` 中添加这个包：

```nix
{ config, pkgs, lib, ... }:

{
  # ......

  environment.systemPackages = with pkgs; [
    # ......o

    # create a fhs environment by command `fhs`, so we can run non-nixos packages in nixos!
    (let base = pkgs.appimageTools.defaultFhsEnvArgs; in
      pkgs.buildFHSUserEnv (base // {
      name = "fhs";
      targetPkgs = pkgs:
        # pkgs.buildFHSUserEnv 只提供一个最小的 FHS 环境，缺少很多常用软件所必须的基础包
        # 所以直接使用它很可能会报错
        #
        # pkgs.appimageTools 提供了大多数程序常用的基础包，所以我们可以直接用它来补充
        (base.targetPkgs pkgs) ++ (with pkgs; [
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

部署好上面的配置后，你就能用 `fhs`
命令进入我们定义好的 FHS 环境了，然后就可以运行你下载的二进制程序了，比如：

```shell
# 进入我们定义好的 fhs 环境，它就跟其他 Linux 发行版一样了
$ fhs
# 看看我们的 /usr/bin 里是不是多了很多东西
(fhs) $ ls /usr/bin
# 尝试下跑一个非 nixos 的二进制程序
(fhs) $ ./bin/code
```

## 参考

- [Tips&Tricks for NixOS Desktop - NixOS
  Discourse][Tips&Tricks for NixOS Desktop - NixOS Discourse]: Just as the title says, it
  is a collection of tips and tricks for NixOS desktop.
- [nix-alien](https://github.com/thiagokokada/nix-alien): Run unpatched binaries on
  Nix/NixOS
- [nix-ld](https://github.com/Mic92/nix-ld): Run unpatched dynamic binaries on NixOS.
- [用 Nix 打包闭源软件 - Lan Tian @ Blog](https://lantian.pub/article/modify-computer/nixos-packaging.lantian/#%E5%AE%9E%E4%BE%8B%E9%97%AD%E6%BA%90%E8%BD%AF%E4%BB%B6%E4%BB%A5%E5%8F%8A%E4%BB%A5%E4%BA%8C%E8%BF%9B%E5%88%B6%E5%BD%A2%E5%BC%8F%E5%88%86%E5%8F%91%E7%9A%84%E8%BD%AF%E4%BB%B6)

[Tips&Tricks for NixOS Desktop - NixOS Discourse]:
  https://discourse.nixos.org/t/tips-tricks-for-nixos-desktop/28488
