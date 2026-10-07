# 加速 Dotfiles 的调试

在使用了 Home
Manager 管理我们的 Dotfiles 后，会遇到的一个问题是，每次修改完我们的 Dotfiles，都需要通过跑一遍
`sudo nixos-rebuild switch`(或者如果你是单独使用 home manager的话，应该是这个指令
`home-manager switch`) 才能生效，但每次运行这个指令都会重新计算整个系统的状态，即使 Nix 内部现在已经有了很多缓存机制可以加速这个计算，这仍然是很痛苦的。

以我的 Neovim/Emacs 配置为例，我日常修改它们的频率非常高，有时候一天要改几十上百次，如果每次修改都要等
`nixos-rebuild` 跑个几十秒，这简直是在浪费时间。

幸运的是，Home Manager 提供了一个 [mkOutOfStoreSymlink][mkOutOfStoreSymlink]
函数，它会创建一个指向你 Dotfiles 绝对路径的软链接。文件内容留在你的 Home 目录里，不会复制进 Nix
store，因此你对 Dotfiles 的修改能立即生效。

这种方法能有用的前提是，你的 Dotfiles 内容不是由 Nix 生成的，比如我的 Emacs/Neovim 配置都是原生的，仅通过 Nix
Home-Manager 的 `home.file` 或 `xdg.configFile` 将它们链接到正确的位置。

下面简单说明下如何通过这个函数加速 Dotfiles 的调试。

假设你将你的 Neovim 配置放在了 `~/nix-config/home/nvim` 下，在你的 Home Manager 配置（如
`~/nix-config/home/default.nix`）中添加如下代码：

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
的修改就能立即被 Neovim/Emacs 观察到了。

这样你就既能使用一个 nix-config 仓库统一管理所有 Dotfiles，一些频繁修改的非 Nix 配置也能快速生效，不受 Nix 的影响。

> **注意事项**
>
> - 路径必须传**绝对路径字符串**，就像上面的例子。像 `./nvim` 这样的 path
>   literal 在 flake 求值时会先被复制进 Nix
>   store，软链接会指向一份只读快照：之后改原目录不再生效，文件属主也会变成
>   `root`/`nixbld`。
> - 链接的内容位于 Nix store 之外：不记录在 `flake.lock`
>   里，也不受 GC 管理。软链接本身仍由 Nix 声明，所以内容需要你自己提供：提前保证那个绝对路径下已经有对应文件（比如把 dotfiles 仓库 clone 到该路径）。求值本身仍是纯的（不需要
>   `--impure`）。
> - 这里的 `config` 必须是 Home Manager 模块的 `config`。如果拿到的是 NixOS 的
>   `config`（比如把用户定义和 Home Manager 配置放在同一个模块里），`config.lib.file`
>   是不存在的。
> - 不要指向某个 program 模块已经在管理的路径。如果 `programs.<name>.enable = true`
>   会写入同一个文件，Home Manager 会报冲突；此时应关掉该模块，改由你自己管理这个文件。
> - 链接一个目录时整目录是单个软链接，天然递归（不需要
>   `recursive = true`），但目录里的所有文件也就不再受 Home Manager 控制。

[mkOutOfStoreSymlink]:
  https://github.com/nix-community/home-manager/blob/master/modules/files.nix
