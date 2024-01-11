# Accelerating Dotfiles Debugging

When managing our Dotfiles with Home Manager, a common challenge arises – each modification to our Dotfiles requires executing `sudo nixos-rebuild switch`(or `home-manager switch` if you use don't integrate home-manager into NixOS) to take effect. However, running this command recalculates the entire system state each time, even though Nix internally employs various caching mechanisms to expedite the process, it can still be cumbersome.

Take my Neovim/Emacs configurations as an example; I frequently make high-frequency modifications to them, sometimes dozens or hundreds of times a day. If each modification necessitates waiting for `nixos-rebuild` to run for several seconds, it becomes a significant time drain.

Fortunately, with the solution outlined in [Simplifying NixOS Commands using Justfile](./en/best-practices/simplify-nixos-related-commands.md), we can expedite testing and verification of frequently modified Dotfiles by adding specific configurations to the `Justfile`.

For instance, I've added the following content to my Justfile:

> The latest Justfile I'm using: [ryan4yin/nix-config/Justfile](https://github.com/ryan4yin/nix-config/blob/main/Justfile)

```Makefile

###############################################################
# Quick Test - Neovim
###############################################################

nvim-test:
  rm -rf $"($env.HOME)/.config/astronvim/lua/user"
  rsync -avz --copy-links --chmod=D2755,F744 home/base/desktop/editors/neovim/astronvim_user/ $"($env.HOME)/.config/astronvim/lua/user"

nvim-clean:
  rm -rf $"($env.HOME)/.config/astronvim/lua/user"
```

Now, when I need to quickly test my Neovim configuration after making changes, I simply run `just nvim-test`. Once testing is complete, I execute `just nvim-clean`, followed by redeploying the configuration using `nixos-rebuild`. This allows for swift testing and seamless restoration of the configuration.


