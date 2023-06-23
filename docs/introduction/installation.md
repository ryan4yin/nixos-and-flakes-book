
Nix can be installed in multiple ways:

1. Install on macOS/Linux/WSL as a package manager.
2. Install NixOS, it's a Linux distribution that uses Nix to manage the entire system environment.

I chose to directly install NixOS using its official ISO image, to manage the entire system through Nix as much as possible.

The installation process is simple, and I won't go into details here.

Some materials that may be useful:

1. [Official installation method of Nix](https://nixos.org/download.html): written in bash script, `nix-command` & `flakes` are still experimental features as of 2023-04-23, and need to be manually enabled.
   1. You need to refer to the instructions in [Enable flakes - NixOS Wiki](https://nixos.wiki/wiki/Flakes) to enable `nix-command` & `flakes`.
   2. The official installer does not provide any uninstallation method. To uninstall Nix on Linux/macOS, you need to manually delete all related files, users, and groups.
2. [The Determinate Nix Installer](https://github.com/DeterminateSystems/nix-installer): a third-party installer written in Rust, which enables `nix-command` & `flakes` by default and provides an uninstallation command.
