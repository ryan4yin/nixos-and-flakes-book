# NixOS 的其他实用技巧

## 查看详细错误信息

如果你在部署配置时遇到了任何错误，都可以尝试在 `nixos-rebuild` 命令后面添加
`--show-trace --print-build-logs --verbose` 参数来获取详细的错误信息。举例如下：

```bash
cd /etc/nixos
sudo nixos-rebuild switch --flake .#myhost --show-trace --print-build-logs --verbose

# 更简洁的版本
sudo nixos-rebuild switch --flake .#myhost --show-trace -L -v
```

## 使用 Git 管理 NixOS 配置 {#git-manage-nixos-config}

NixOS 的配置文件是纯文本，因此跟普通的 dotfiles 一样可以使用 Git 管理，这样可以方便的回滚到历史版本，或者在多台机器上同步配置。

> 注意：使用 Git 后，所有未被 Git 跟踪的文件都会被 Nix 忽略，如果发现 Nix 报错说某某文件 not
> found，或许是因为你没 `git add` 它

另外一点是，Nix Flakes 配置也不一定需要放在 `/etc/nixos`
目录下，可以放在任意目录下，只要在部署时指定正确的路径即可。

> 我们在前面第 3 小节的代码注释中有说明过，可以通过
> `sudo nixos-rebuild switch --flake .#xxx` 的 `--flake`
> 参数指定 Flakes 配置的文件夹路径，并通过 `#` 后面的值来指定使用的 outputs 名称。

比如我的使用方式是将 Nix Flakes 配置放在 `~/nixos-config` 目录下，然后在 `/etc/nixos`
目录下创建一个软链接：

```shell
sudo mv /etc/nixos /etc/nixos.bak  # 备份原来的配置
sudo ln -s ~/nixos-config/ /etc/nixos
```

然后就可以在 `~/nixos-config`
目录下使用 Git 管理配置了，配置使用普通的用户级别权限即可，不要求 owner 为 root.

另一种方法是直接删除掉 `/etc/nixos`，并在每次部署时指定配置文件路径：

```shell
sudo mv /etc/nixos /etc/nixos.bak  # 备份原来的配置
cd ~/nixos-config

# 通过 --flake .#my-nixos 参数指定使用当前文件夹的 flake.nix，
# 使用的 nixosConfiguraitons 名称为 my-nixos
sudo nixos-rebuild switch --flake .#my-nixos
```

两种方式都可以，看个人喜好。搞定之后，系统的回滚也变得非常简单，只需要切换到上一个 commit 即可：

```shell
cd ~/nixos-config
# 回滚到上一个 commit
git checkout HEAD^1
# 部署
sudo nixos-rebuild switch --flake .#my-nixos
```

Git 的更多操作这里就不介绍了，总之一般情况下的回滚都能直接通过 Git 完成，只在系统完全崩溃的情况下，才需要通过重启进入 grub，从上一个历史版本启动系统。

## 查看与清理历史数据 {#view-and-delete-history}

如前所述，NixOS 的每次部署都会生成一个新的版本，所有版本都会被添加到系统启动项中，除了重启电脑外，我们也可以通过如下命令查询当前可用的所有历史版本：

```shell
nix profile history --profile /nix/var/nix/profiles/system
```

以及清理历史版本释放存储空间的命令：

```shell
# 清理 7 天之前的所有历史版本
sudo nix profile wipe-history --older-than 7d --profile /nix/var/nix/profiles/system
# 清理历史版本并不会删除数据，还需要以 root 身份运行 gc 命令来删除所有未使用的包
sudo nix-collect-garbage --delete-old

# 因为如下 issue，还需要以当前用户身份运行 gc 命令来删除 home-manager 的历史版本和包
# https://github.com/NixOS/nix/issues/8508
nix-collect-garbage --delete-old
```

## 查询为什么某个包被安装了 {#why-some-packages-are-installed}

查询为什么某个包被安装，当前环境中的谁依赖了它:

1. 进入一个带有 `nix-tree` 与 `rg` 的 shell：`nix shell nixpkgs#nix-tree nixpkgs#ripgrep`
1. ` nix-store --gc --print-roots | rg -v '/proc/' | rg -Po '(?<= -> ).*' | xargs -o nix-tree`
1. `/<package-name>` 以查找到你想查询的包
1. 输入 `w`，看看谁依赖了它（`why depends`），以及完整的依赖链。

## 节约存储空间

如下配置可以比较好的缩减 NixOS 的磁盘占用，可以考虑将它们添加到你的 NixOS 配置中：

```nix
{ lib, pkgs, ... }:

{
  # ......

  # do not need to keep too much generations
  boot.loader.systemd-boot.configurationLimit = 10;
  # boot.loader.grub.configurationLimit = 10;

  # do garbage collection weekly to keep disk usage low
  nix.gc = {
    automatic = true;
    dates = "weekly";
    options = "--delete-older-than 1w";
  };

  # Optimise storage
  # you can also optimise the store manually via:
  #    nix-store --optimise
  # https://nixos.org/manual/nix/stable/command-ref/conf-file.html#conf-auto-optimise-store
  nix.settings.auto-optimise-store = true;
}
```
