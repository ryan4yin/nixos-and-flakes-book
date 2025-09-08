# 使用 Justfile 简化 NixOS 相关命令

在使用 NixOS 的过程中，我们会经常使用 `nixos-rebuild`
命令，经常需要输入一大堆参数，比较繁琐。

我使用了 [just](https://github.com/casey/just)
来管理我的 flake 配置相关的命令，简化使用。你也可以使用其他类似的工具来干这个活（比如说 Makefile 或
[cargo-make](https://github.com/sagiegurari/cargo-make)），这里我仅介绍下我的用法以供参考。

我的 Justfile 大概内容截取如下：

> 我使用的 Justfile 最新版:
> [ryan4yin/nix-config/Justfile](https://github.com/ryan4yin/nix-config/blob/main/Justfile)

```Makefile
# just is a command runner, Justfile is very similar to Makefile, but simpler.

############################################################################
#
#  Nix commands related to the local machine
#
############################################################################

deploy:
  nixos-rebuild switch --flake . --use-remote-sudo

debug:
  nixos-rebuild switch --flake . --use-remote-sudo --show-trace --verbose

up:
  nix flake update

# Update specific input
# usage: make upp i=home-manager
upp:
  nix flake update $(i)

history:
  nix profile history --profile /nix/var/nix/profiles/system

repl:
  nix repl -f flake:nixpkgs

clean:
  # remove all generations older than 7 days
  sudo nix profile wipe-history --profile /nix/var/nix/profiles/system  --older-than 7d

gc:
  # garbage collect all unused nix store entries
  sudo nix store gc --debug
  sudo nix-collect-garbage --delete-old

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

将上述 `Justfile` 文件存放到 NixOS 配置的根目录下，然后我们就可以使用 `just`
命令来执行相关的命令了。比如说我这里 `just deploy`
就是部署 NixOS 配置到本地主机，`just idols` 就是部署到我的远程主机集群。
