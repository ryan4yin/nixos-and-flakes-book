
## VIII. Nixpkgs's Advanced Usage

`callPackage`, `Overriding`, and `Overlays` are the techniques occasionally used when using Nix to customize the build method of Nix packages.

We know that many programs have a large number of build parameters that need to be configured, and different users may want to use different build parameters. This is where `Overriding` and `Overlays` come in handy. Let me give you a few examples I have encountered:

1. [`fcitx5-rime.nix`](https://github.com/NixOS/nixpkgs/blob/e4246ae1e7f78b7087dce9c9da10d28d3725025f/pkgs/tools/inputmethods/fcitx5/fcitx5-rime.nix): By default, `fcitx5-rime` use `rime-data` as the value of `rimeDataPkgs`, but this parameter can be customized by `override`.
2. [`vscode/with-extensions.nix`](https://github.com/NixOS/nixpkgs/blob/master/pkgs/applications/editors/vscode/with-extensions.nix): This package for VS Code can also be customized by overriding the value of `vscodeExtensions`, thus we can install some custom plugins into VS Code.
   - [`nix-vscode-extensions`](https://github.com/nix-community/nix-vscode-extensions): This is a vscode plugin manager implemented by overriding `vscodeExtensions`.
3. [`firefox/common.nix`](https://github.com/NixOS/nixpkgs/blob/416ffcd08f1f16211130cd9571f74322e98ecef6/pkgs/applications/networking/browsers/firefox/common.nix): Firefox has many customizable parameters too.
4. ...

In short, `Overriding` or `Overlays` can be used to customize the build parameters of Nix packages.

### 1. pkgs.callPackage {#callpackage}

> [Chapter 13. Callpackage Design Pattern - Nix Pills](https://nixos.org/guides/nix-pills/callpackage-design-pattern.html)

In the previous content, We have used `import xxx.nix` to import Nix files many times, this syntax simply returns the execution result of the file, without any further processing of the it.

`pkgs.callPackage` is also used to import Nix files, its syntax is `pkgs.callPackage xxx.nix { ... }`, but unlike `import`, the Nix file imported by it must be a Derivation or a function that returns a Derivation. Its result is a Derivation(a software package) too.

So what does the Nix file that can be used as a parameter of `pkgs.callPackge` look like? You can take a look at the `hello.nix` `fcitx5-rime.nix` `vscode/with-extensions.nix` `firefox/common.nix` we mentioned earlier, they can all be imported by `pkgs.callPackage`.

When the `xxx.nix` used in `pkgs.callPackge xxx.nix {...}` is a function (most Nix packages are like this), the execution flow is as follows:

1. `pkgs.callPackge xxx.nix {...}` will first `import xxx.nix` to get the function defined in it. The parameters of this function usually have `lib`, `stdenv`, `fetchurl` and other parameters, as well as some custom parameters, which usually have default values.
2. Then `pkgs.callPackge` will first look up the value matching the name from the current environment as the parameter to be passed to the function. parameters like `lib` `stdenv` `fetchurl` are defined in nixpkgs, and they will be found in this step.
3. Then `pkgs.callPackge` will merge its second parameter `{...}` with the attribute set obtained in the previous step, and then pass it to the function imported from `xxx.nix` and execute it.
4. Finally we get a Derivation as the result of the function execution.

So the common usage of `pkgs.callPackage` is to import custom Nix packages and used it in Nix Module.
For example, we wrote a `hello.nix` ourselves, and then we can use `pkgs.callPackage ./hello.nix {}` in any Nix Module to import and use it.

### 2. Overriding {#overriding}

> [Chapter 4. Overriding - nixpkgs Manual](https://nixos.org/manual/nixpkgs/stable/#chap-overrides)

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

### 3. Overlays

> [Chapter 3. Overlays - nixpkgs Manual](https://nixos.org/manual/nixpkgs/stable/#chap-overlays)

The `override` we introduced previously will generate a new Derivation, which does not affect the original Derivation in `pkgs`, and is only suitable for use as a local parameter,
if you need to override a Derivation that is also depended on by other Nix packages, then other Nix packages will still use the original Derivation.

To solve this problem, Nix provides the ability to use `overlays`. Simply put, `overlays` can globally modify the Derivation in `pkgs`.

In the classic Nix environment, Nix automatically applies all `overlays` configuration under the paths `~/.config/nixpkgs/overlays.nix` `~/.config/nixpkgs/overlays/*.nix`,
but in Flakes, in order to ensure the reproducibility of the system, it cannot depend on any configuration outside the Git repository, so this classic method cannot be used now.

When using Flakes to write configuration for NixOS, home Manager and NixOS both provide the `nixpkgs.overlays` option to define `overlays`, related documentation:

- [home-manager docs - `nixpkgs.overlays`](https://nix-community.github.io/home-manager/options.html#opt-nixpkgs.overlays)
- [nixpkgs source code - `nixpkgs.overlays`](https://github.com/NixOS/nixpkgs/blob/30d7dd7e7f2cba9c105a6906ae2c9ed419e02f17/nixos/modules/misc/nixpkgs.nix#L169)

For example, the following content is a Module that loads Overlays, which can be used as either a home Manager Module or a NixOS Module, because the two definitions are exactly the same:

> home Manager is an external component after all, and most people use the unstable branch of home Manager & nixpkgs, which sometimes causes problems with home Manager Module, so it is recommended to import `overlays` in a NixOS Module.

```nix
{ config, pkgs, lib, ... }:

{
  nixpkgs.overlays = [
    # overlayer1 - use self and super to express the inheritance relationship
    (self: super: {
     google-chrome = super.google-chrome.override {
       commandLineArgs =
         "--proxy-server='https=127.0.0.1:3128;http=127.0.0.1:3128'";
     };
    })

    # overlayer2 - you can also use `extend` to inherit other overlays
    # use `final` and `prev` to express the relationship between the new and the old
    (final: prev: {
      steam = prev.steam.override {
        extraPkgs = pkgs:
          with pkgs; [
            keyutils
            libkrb5
            libpng
            libpulseaudio
            libvorbis
            stdenv.cc.cc.lib
            xorg.libXcursor
            xorg.libXi
            xorg.libXinerama
            xorg.libXScrnSaver
          ];
        extraProfile = "export GDK_SCALE=2";
      };
    })

    # overlay3 - define overlays in other files
    # here the content of overlay3.nix is the same as above:
    #   `final: prev: { xxx = prev.xxx.override { ... }; }`
    (import ./overlays/overlay3.nix)
  ];
}
```

refer to this example to write your own overlays, import the configuration as a NixOS Module or a home Manager Module, and then deploy it to see the effect.

#### Modular overlays

The previous example shows how to write overlays, but all overlays are written in a single nix file, which is a bit difficult to maintain.

To resolve this problem,here is a best practice of how to manage overlays in a modular way.

First, create an `overlays` folder in the Git repository to store all overlays configuration, and then create `overlays/default.nix`, whose content is as follows:

```nix
args:
  # import all nix files in the current folder, and execute them with args as parameters
  # The return value is a list of all execution results, which is the list of overlays
  builtins.map
  (f: (import (./. + "/${f}") args))  # the first parameter of map, a function that import and execute a nix file
  (builtins.filter          # the second parameter of map, a list of all nix files in the current folder except default.nix
    (f: f != "default.nix")
    (builtins.attrNames (builtins.readDir ./.)))
```

Then you can write all overlays configuration in the `overlays` folder, an example configuration `overlays/fcitx5/default.nix` is as follows:

```nix
# to add my custom input method, I override the default rime-data here
# refer to https://github.com/NixOS/nixpkgs/blob/e4246ae1e7f78b7087dce9c9da10d28d3725025f/pkgs/tools/inputmethods/fcitx5/fcitx5-rime.nix
{pkgs, config, lib, ...}:

(self: super: {
  # my custom input method's rime-data, downloaded from https://flypy.com
  rime-data = ./rime-data-flypy;
  fcitx5-rime = super.fcitx5-rime.override { rimeDataPkgs = [ ./rime-data-flypy ]; };
})
```

I custom the `rime-data` package through the overlay shown above.

At last, you need to load all overlays returned by `overlays/default.nix` through the `nixpkgs.overlays` option, add the following parameter to any NixOS Module to achieve this:

```nix
{ config, pkgs, lib, ... } @ args:

{
  # ......

  # add this parameter
  nixpkgs.overlays = import /path/to/overlays/dir;

  # ......
}
```

For example, you can just add it directly in `flake.nix`:

```nix
{
  description = "NixOS configuration of Ryan Yin";

  # ......

  inputs = {
    # ......
  };

  outputs = inputs@{ self, nixpkgs, ... }: {
    nixosConfigurations = {
      nixos-test = nixpkgs.lib.nixosSystem {
        system = "x86_64-linux";
        specialArgs = inputs;
        modules = [
          ./hosts/nixos-test

          # add the following inline module definition
          #   here, all parameters of modules are passed to overlays
          (args: { nixpkgs.overlays = import ./overlays args; })

          # ......
        ];
      };
    };
  };
}
```

By using this modular approach, it is very convenient to modularize all your overlays. Taking my configuration as an example, the structure of the `overlays` folder is roughly as follows:

```nix
.
├── flake.lock
├── flake.nix
├── home
├── hosts
├── modules
├── ......
├── overlays
│   ├── default.nix         # it returns a list of all overlays.
│   └── fcitx5              # fcitx5 overlay
│       ├── default.nix
│       ├── README.md
│       └── rime-data-flypy  # my custom rime-data
│           └── share
│               └── rime-data
│                   ├── ......  # rime-data files
└── README.md
```


## IV. Package Repositories of Nix

Similar to Arch Linux, Nix also has official and community software package repositories:

1. [nixpkgs](https://github.com/NixOS/nixpkgs) is a Git repository containing all Nix packages and NixOS modules.
   1. Its `master` branch contains the latest Nix packages and modules.
   2. The `nixos-unstable` branch contains the latest tested modules, but some bugs may still exist.
   3. And the `nixos-XX.YY` branch(the stable branch) contains the latest stable Nix packages and modules.
2. [NUR](https://github.com/nix-community/NUR) is similar to Arch Linux's AUR.
   1. NUR is a third-party Nix package repository and serves as a supplement to nixpkgs, use it at your own risk.
3. Flakes can also install software packages directly from Git repositories, which can be used to install Flakes provided by anyone, we will talk about this later.
