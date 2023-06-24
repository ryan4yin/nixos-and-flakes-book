## Overlays

The `override` we introduced previously will generate a new Derivation, which does not affect the original Derivation in `pkgs`, and is only suitable for use as a local parameter,
if you need to override a Derivation that is also dependent on other Nix packages, then other Nix packages will still use the original Derivation.

To solve this problem, Nix provides the ability to use `overlays`. Simply put, `overlays` can globally modify the Derivation in `pkgs`.

In the classic Nix environment, Nix automatically applies all `overlays` configuration under the paths `~/.config/nixpkgs/overlays.nix` `~/.config/nixpkgs/overlays/*.nix`,
but in Flakes, in order to ensure the reproducibility of the system, it cannot depend on any configuration outside the Git repository, so this classic method cannot be used now.

When using Flakes to write configuration for NixOS, home Manager and NixOS both provide the `nixpkgs.overlays` option to define `overlays`. Related documentation:

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

## Modular overlays

The previous example shows how to write overlays, but all overlays are written in a single nix file, which is a bit difficult to maintain.

To resolve this problem, here is a best practice of how to manage overlays in a modular way.

First, create an `overlays` folder in the Git repository to store all overlays configurations, and then create `overlays/default.nix`, whose content is as follows:

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

Then you can write all overlays configurations in the `overlays` folder, an example configuration `overlays/fcitx5/default.nix` is as follows:

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

We customized the `rime-data` package through the overlay shown above.

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

By using this modular approach, it is very convenient to modularize all your overlays. Taking my configuration as an example, the structure of the `overlays` folder is rough as follows:

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
