# Nixpkgs's Advanced Usage

`callPackage`, `Overriding`, and `Overlays` are the techniques occasionally used when
using Nix to customize the build method of Nix packages.

We know that many programs have a large number of build parameters that need to be
configured, and different users may want to use different build parameters. This is where
`Overriding` and `Overlays` come in handy. Let me give you a few examples I have
encountered:

1. [`fcitx5-rime.nix`](https://github.com/NixOS/nixpkgs/blob/e4246ae1e7f78b7087dce9c9da10d28d3725025f/pkgs/tools/inputmethods/fcitx5/fcitx5-rime.nix):
   By default, `fcitx5-rime` use `rime-data` as the value of `rimeDataPkgs`, but this
   parameter can be customized by `override`.
2. [`vscode/with-extensions.nix`](https://github.com/NixOS/nixpkgs/blob/nixos-23.05/pkgs/applications/editors/vscode/with-extensions.nix):
   This package for VS Code can also be customized by overriding the value of
   `vscodeExtensions`, thus we can install some custom plugins into VS Code.
   - [`nix-vscode-extensions`](https://github.com/nix-community/nix-vscode-extensions):
     This is a vscode plugin manager implemented by overriding `vscodeExtensions`.
3. [`firefox/common.nix`](https://github.com/NixOS/nixpkgs/blob/416ffcd08f1f16211130cd9571f74322e98ecef6/pkgs/applications/networking/browsers/firefox/common.nix):
   Firefox has many customizable parameters too.
4. ...

In short, `callPackage`, `Overriding` and `Overlays` can be used to customize the build
parameters of Nix packages.
