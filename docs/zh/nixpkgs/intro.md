# Nixpkgs 的高级用法 {#nixpkgs-advanced-usage}

callPackage、Overriding 与 Overlays 是在使用 Nix 时偶尔会用到的技术，它们都是用来自定义 Nix 包的构建方法的。

我们知道许多程序都有大量构建参数需要配置，不同的用户会希望使用不同的构建参数，这时候就需要 Overriding 与 Overlays 来实现。我举几个我遇到过的例子：

1. [fcitx5-rime.nix](https://github.com/NixOS/nixpkgs/blob/e4246ae1e7f78b7087dce9c9da10d28d3725025f/pkgs/tools/inputmethods/fcitx5/fcitx5-rime.nix):
   fcitx5-rime 的 `rimeDataPkgs` 默认使用 `rime-data`
   包，但是也可以通过 override 来自定义该参数的值，以加载自定义的 rime 配置（比如加载小鹤音形输入法配置）。
2. [vscode/with-extensions.nix](https://github.com/NixOS/nixpkgs/blob/nixos-23.05/pkgs/applications/editors/vscode/with-extensions.nix):
   vscode 的这个包也可以通过 override 来自定义 `vscodeExtensions`
   参数的值来安装自定义插件。
   1. [nix-vscode-extensions](https://github.com/nix-community/nix-vscode-extensions): 就是利用该参数实现的 vscode 插件管理
3. [firefox/common.nix](https://github.com/NixOS/nixpkgs/blob/416ffcd08f1f16211130cd9571f74322e98ecef6/pkgs/applications/networking/browsers/firefox/common.nix):
   firefox 同样有许多可自定义的参数
4. 等等

总之如果需要自定义上述这类 Nix 包的构建参数，或者实施某些比较底层的修改，我们就得用到 callPackage、Overriding 与 Overlays 这些特性。
