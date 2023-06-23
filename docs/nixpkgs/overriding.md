## Overriding


Simply put, all Nix packages in nixpkgs can be customized with `<pkg>.override {}` to define some build parameters, which returns a new Derivation that uses custom parameters. For example:

```nix
pkgs.fcitx5-rime.override {rimeDataPkgs = [
    ./rime-data-flypy
];}
```

The result of this Nix expression is a new Derivation, where `rimeDataPkgs` is overridden as `[./rime-data-flypy]`, while other parameters remain their original values.

How to know which parameters of `fcitx5-rime` can be overridden? There are several ways:

1. Try to find the source code of the package in the nixpkgs repository on GitHub, such as [fcitx5-rime.nix](https://github.com/NixOS/nixpkgs/blob/e4246ae1e7f78b7087dce9c9da10d28d3725025f/pkgs/tools/inputmethods/fcitx5/fcitx5-rime.nix)
   1. Note: Be sure to select the correct branch, for example, if you are using the nixos-unstable branch, you need to find it in the nixos-unstable branch.
2. Check by using `nix repl '<nixpkgs>'`, then enter `:e pkgs.fcitx5-rime`, which will open the source code of this package through the default editor, and then you can see all the parameters of this package.
   1. Note: To learn the basic usage of `nix repl`, just type `:?` to see the help information

Through these two methods, you can see that the `fcitx5-rime` package has the following input parameters, which can all be modified by `override`:

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

Instead of override the function's parameters, we can also override the attributes of the Derivation created by `stdenv.mkDerivation`.

Take `pkgs.hello` as an example, first check the source code of this package through the method we mentioned earlier:

```nix
# https://github.com/NixOS/nixpkgs/blob/nixos-unstable/pkgs/applications/misc/hello/default.nix
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

The attributes showed above, such as `pname` `version` `src` `doCheck`, can all be overridden by `overrideAttrs`, for example:

```nix
helloWithDebug = pkgs.hello.overrideAttrs (finalAttrs: previousAttrs: {
  doCheck = false;
});
```

Here we use `overrideAttrs` to override `doCheck`, while other attributes remain their original values.

Some default attributes defined in `stdenv.mkDerivation` can also be overridden by `overrideAttrs`, for example:

```nix
helloWithDebug = pkgs.hello.overrideAttrs (finalAttrs: previousAttrs: {
  separateDebugInfo = true;
});
```

The attribute we override here, `separateDebugInfo`, is defined in `stdenv.mkDerivation`, not in the source code of `hello`.
We can check the source code of `stdenv.mkDerivation` to see all the attributes defined in it by using `nix repl '<nixpkgs>'` and then enter `:e stdenv.mkDerivation`(To learn the basic usage of `nix repl`, just type `:?` to see the help information).
