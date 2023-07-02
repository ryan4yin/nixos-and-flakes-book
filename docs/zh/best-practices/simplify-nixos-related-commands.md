# 使用 Makefile 简化 NixOS 相关命令

> 注意: Makefile 的 target 名称不能与当前目录下的文件或者目录重名，否则 target 将不会被执行！

在使用 NixOS 的过程中，我们会经常使用 `nixos-rebuild` 命令，经常需要输入一大堆参数，比较繁琐。

所以我使用 Makefile 来管理我的 flake 配置相关的命令，简化使用。
你也可以使用其他类似的工具来干这个活（比如说 [just](https://github.com/casey/just) 跟 [cargo-make](https://github.com/sagiegurari/cargo-make)），这里我仅介绍下我的用法以供参考。

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
