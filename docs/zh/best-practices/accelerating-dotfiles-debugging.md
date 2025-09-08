# 加速 Dotfiles 的调试

在使用了 Home
Manager 管理我们的 Dotfiles 后，会遇到的一个问题是，每次修改完我们的 Dotfiles，都需要通过跑一遍
`sudo nixos-rebuild switch`(或者如果你是单独使用 home manager的话，应该是这个指令
`home-manager switch`) 才能生效，但每次运行这个指令都会重新计算整个系统的状态，即使 Nix 内部现在已经有了很多缓存机制可以加速这个计算，这仍然是很痛苦的。

以我的 Neovim/Emacs 配置为例，我日常修改它们的频率非常高，有时候一天要改几十上百次，如果每次修改都要等
`nixos-rebuild` 跑个几十秒，这简直是在浪费时间。

幸运的是，Home Manager 提供了一个 [mkOutOfStoreSymlink][mkOutOfStoreSymlink]
函数, 它可以创建一个指向你 Dotfiles 绝对路径的软链接, 这样就能绕过 Home
Manager 自身，你对 Dotfiles 的修改就能立即生效了.

这种方法能有用的前提是，你的 Dotfiles 内容不是由 Nix 生成的，比如我的 Emacs/Neovim 配置都是原生的，仅通过 Nix
Home-Manager 的 `home.file` 或 `xdg.configFile` 将它们链接到正确的位置。

下面简单说明下如何通过这个函数加速 Dotfiles 的调试.

假设你将你的 Neovim 配置放在了 `~/nix-config/home/nvim` 下，在你的 Home Manager 配置(如
`/etc/nixos/home.nix`) 中添加如下代码:

```nix
{ config, pkgs, ... }: let
  # path to your nvim config directory
  nvimPath = "${config.home.homeDirectory}/nix-config/home/nvim";
  # path to your doom emacs config directory
  doomPath = "${config.home.homeDirectory}/nix-config/home/doom";
in
{
  xdg.configFile."nvim".source = config.lib.file.mkOutOfStoreSymlink nvimPath;
  xdg.configFile."doom".source = config.lib.file.mkOutOfStoreSymlink doomPath;

  # other configurations
}
```

修改完配置后，运行 `sudo nixos-rebuild switch` (或者如果你是单独使用 home
manager的话，应该是这个指令 `home-manager switch`)即可生效。这之后，你对
`~/nix-config/home/nvim` 或 `~/nix-config/home/doom`
的修改就能立即被 Neovim/Emacs 观察到了.

这样你就既能使用一个 nix-config 仓库统一管理所有 Dotfiles, 一些频繁修改的非 Nix 配置也能快速生效，不受 Nix 的影响.

[mkOutOfStoreSymlink]:
  https://github.com/search?q=repo%3Anix-community%2Fhome-manager%20outOfStoreSymlink&type=code
