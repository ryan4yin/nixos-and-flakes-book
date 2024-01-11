# 加速 Dotfiles 的调试

在使用了 Home Manager 管理我们的 Dotfiles 后，会遇到的一个问题是，每次修改完我们的 Dotfiles，都需要通过跑一遍 `sudo nixos-rebuild switch`(或者如果你是单独使用 home manager 的话，应该是这个指令 `home-manager switch`) 才能生效，但每次运行这个指令都会重新计算整个系统的状态，即使 Nix 内部现在已经有了很多缓存机制可以加速这个计算，这仍然是很痛苦的。

以我的 Neovim/Emacs 配置为例，我日常修改它们的频率非常高，有时候一天要改几十上百次，如果每次修改都要等 `nixos-rebuild` 跑个几十秒，这简直是在浪费时间。

幸运的是，在有了 [使用 Justfile 简化 NixOS 相关命令](./simplify-nixos-related-commands.md) 这个方案后，我们可以通过往 `Justfile` 里添加些配置来实现快速的测试验证这些需要频繁修改的 Dotfiles.

比如我现在添加了这些 Justfile 内容：

> 我使用的 Justfile 最新版: [ryan4yin/nix-config/Justfile](https://github.com/ryan4yin/nix-config/blob/main/Justfile)

```Makefile
###############################################################
# Quick Test - Neovim
###############################################################


nvim-clean:
  rm -rf ${HOME}.config/astronvim/lua/user

nvim-test: nvim-clean
  rsync -avz --copy-links --chmod=D2755,F744 home/base/desktop/editors/neovim/astronvim_user/ ${HOME}/.config/astronvim/lua/user
```

然后在需要快速测试 Neovim 配置时，每次修改完配置后，跑一下 `just nvim-test`，我的配置就更新了。
测试完毕后，运行下 `just nvim-clean`，再重新用 `nixos-rebuild` 部署下配置，就完成了配置的还原。

这种方法能生效的前提是，你的 Dotfiles 内容不是由 Nix 生成的，比如我的 Emacs/Neovim 配置都是原生的，仅通过 Nix Home-Manager 的 `home.file` 或 `xdg.configFile` 将它们链接到正确的位置。

