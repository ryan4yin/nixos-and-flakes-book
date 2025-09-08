# Overriding

简单的说，所有 nixpkgs 中的 Nix 包都可以通过 `<pkg>.override {}`
来自定义某些构建参数，它返回一个使用了自定义参数的新 Derivation. 举个例子：

```nix
pkgs.fcitx5-rime.override {rimeDataPkgs = [
    ./rime-data-flypy
];}
```

上面这个 Nix 表达式的执行结果就是一个新的 Derivation，它的 `rimeDataPkgs` 参数被覆盖为
`[./rime-data-flypy]`，而其他参数则沿用原来的值。

如何知道 `fcitx5-rime` 这个包有哪些参数可以覆写呢？有几种方法：

1. 直接在 GitHub 的 nixpkgs 源码中找：[fcitx5-rime.nix](https://github.com/NixOS/nixpkgs/blob/e4246ae1e7f78b7087dce9c9da10d28d3725025f/pkgs/tools/inputmethods/fcitx5/fcitx5-rime.nix)
   1. 注意要选择正确的分支，加入你用的是 nixos-unstable 分支，那就要在 nixos-unstable 分支中找。
2. 通过 `nix repl` 交互式查看：`nix repl -f '<nixpkgs>'`，然后输入
   `:e pkgs.fcitx5-rime`，会通过编辑器打开这个包的源码，然后就可以看到这个包的所有参数了。

通过上述两种方法，都可以看到 `fcitx5-rime` 这个包拥有如下输入参数，它们都是可以通过
`override` 修改的：

```nix
{ lib, stdenv
, fetchFromGitHub
, pkg-config
, cmake
, extra-cmake-modules
, gettext
, fcitx5
, librime
, rime-data
, symlinkJoin
, rimeDataPkgs ? [ rime-data ]
}:

stdenv.mkDerivation rec {
  ...
}
```

除了覆写参数，还可以通过 `overrideAttrs` 来覆写使用 `stdenv.mkDerivation`
构建的 Derivation 的属性。以
[pkgs.hello](https://github.com/NixOS/nixpkgs/blob/nixos-23.05/pkgs/applications/misc/hello/default.nix)
为例，首先通过前述方法查看这个包的源码：

```nix
{ callPackage
, lib
, stdenv
, fetchurl
, nixos
, testers
, hello
}:

stdenv.mkDerivation (finalAttrs: {
  pname = "hello";
  version = "2.12.1";

  src = fetchurl {
    url = "mirror://gnu/hello/hello-${finalAttrs.version}.tar.gz";
    sha256 = "sha256-jZkUKv2SV28wsM18tCqNxoCZmLxdYH2Idh9RLibH2yA=";
  };

  doCheck = true;

  # ......
})
```

其中 `pname` `version` `src` `doCheck` 等属性都是可以通过 `overrideAttrs` 来覆写的，比如：

```nix
helloWithDebug = pkgs.hello.overrideAttrs (finalAttrs: previousAttrs: {
  doCheck = false;
});
```

上面这个例子中，`helloWithDebug` 就是一个新的 Derivation，它的 `doCheck` 参数被改写为
`false`，而其他参数则沿用原来的值。

除了包源码中自定义的参数值外，我们也可以通过 `overrideAttrs` 直接改写
`stdenv.mkDerivation` 内部的默认参数，比如：

```nix
helloWithDebug = pkgs.hello.overrideAttrs (finalAttrs: previousAttrs: {
  separateDebugInfo = true;
});
```

具体的内部参数可以通过 `nix repl -f '<nixpkgs>'` 然后输入 `:e stdenv.mkDerivation`
来查看其源码。

## 参考

- [Chapter 4. Overriding - nixpkgs Manual](https://nixos.org/manual/nixpkgs/stable/#chap-overrides)
