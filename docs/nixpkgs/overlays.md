# Overlays

In the previous section, we learned about overriding derivations using the `override` keyword. However, this approach only affects the local derivation and doesn't modify the original derivation in `pkgs`. To globally modify derivations in `pkgs`, Nix provides a feature called "overlays".

In traditional Nix environments, overlays can be configured globally using the `~/.config/nixpkgs/overlays.nix` or `~/.config/nixpkgs/overlays/*.nix` files. However, in Flakes, to ensure system reproducibility, overlays cannot rely on configurations outside of the Git repository.

When using Flakes to configure NixOS, both Home Manager and NixOS provide the `nixpkgs.overlays` option to define overlays. You can refer to the following documentation for more details:

- [Home Manager docs - `nixpkgs.overlays`](https://nix-community.github.io/home-manager/options.html#opt-nixpkgs.overlays)
- [Nixpkgs source code - `nixpkgs.overlays`](https://github.com/NixOS/nixpkgs/blob/30d7dd7e7f2cba9c105a6906ae2c9ed419e02f17/nixos/modules/misc/nixpkgs.nix#L169)

Let's take a look at an example module that loads overlays. This module can be used as a Home Manager module or a NixOS module, as the definitions are the same:

```nix
{ config, pkgs, lib, ... }:

{
  nixpkgs.overlays = [
    # Overlay 1: Use `self` and `super` to express the inheritance relationship
    (self: super: {
      google-chrome = super.google-chrome.override {
        commandLineArgs =
          "--proxy-server='https=127.0.0.1:3128;http=127.0.0.1:3128'";
      };
    })

    # Overlay 2: Use `final` and `prev` to express the relationship between the new and the old
    (final: prev: {
      steam = prev.steam.override {
        extraPkgs = pkgs: with pkgs; [
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

    # Overlay 3: Define overlays in other files
    # The content of overlay3.nix is the same as above:
    # `(final: prev: { xxx = prev.xxx.override { ... }; })`
    (import ./overlays/overlay3.nix)
  ];
}
```

In the above example, we define three overlays. Overlay 1 modifies the `google-chrome` derivation by adding a command-line argument for a proxy server. Overlay 2 modifies the `steam` derivation by adding extra packages and an environment variable. Overlay 3 is defined in a separate file `overlay3.nix`.

You can write your own overlays following this example. Import the configuration as a NixOS module or a Home Manager module, and then deploy it to see the effect.

## Modular overlays

In the previous example, all overlays were written in a single Nix file, which can become difficult to maintain over time. To address this, we can manage overlays in a modular way.

Start by creating an `overlays` folder in your

 Git repository to store all overlay configurations. Inside this folder, create a `default.nix` file with the following content:

```nix
# import all nix files in the current folder, and execute them with args as parameters
# The return value is a list of all execution results, which is the list of overlays

args:
# execute and import all overlay files in the current directory with the given args
builtins.map
  (f: (import (./. + "/${f}") args))  # execute and import the overlay file
  (builtins.filter          # find all overlay files in the current directory
    (f: f != "default.nix")
    (builtins.attrNames (builtins.readDir ./.)))
```

The `default.nix` file imports and executes all Nix files in the current folder (excluding `default.nix`) with the provided arguments. It returns a list of all overlay results.

Next, write your overlay configurations in the `overlays` folder. For example, you can create `overlays/fcitx5/default.nix` with the following content:

```nix
{ pkgs, config, lib, ... }:

(self: super: {
  rime-data = ./rime-data-flypy;  # Customized rime-data package
  fcitx5-rime = super.fcitx5-rime.override { rimeDataPkgs = [ ./rime-data-flypy ]; };
})
```

In the above example, we override the `rime-data` package with a custom version and modify the `fcitx5-rime` derivation to use the custom `rime-data` package.

To load all overlays returned by `overlays/default.nix`, add the following parameter to any NixOS module:

```nix
{ config, pkgs, lib, ... } @ args:

{
  # ...

  nixpkgs.overlays = import /path/to/overlays/dir;

  # ...
}
```

For instance, you can add it directly in `flake.nix`:

```nix
{
  description = "NixOS configuration of Ryan Yin";

  # ...

  inputs = {
    # ...
  };

  outputs = inputs@{ self, nixpkgs, ... }:
    {
      nixosConfigurations = {
        nixos-test = nixpkgs.lib.nixosSystem {
          system = "x86_64-linux";
          specialArgs = inputs;
          modules = [
            ./hosts/nixos-test

            # add the following inline module definition
            #   here, all parameters of modules are passed to overlays
            (args: { nixpkgs.overlays = import ./overlays args; })

            # ...
          ];
        };
      };
    };
}
```

By using this modular approach, you can conveniently organize and manage your overlays. In this example, the structure of the `overlays` folder would look like this:

```txt
.
├── flake.lock
├── flake.nix
├── home
├── hosts
├── modules
├── ...
├── overlays
│   ├── default.nix            # return a list of all overlays.
│   └── fcitx5                 # fcitx5 overlay
│       ├── default.nix
│       ├── README.md
│       └── rime-data-flypy    # my custom rime-data
│           └── share
│               └── rime-data
│                   ├── ...
└── README.md
```

This modular approach simplifies the management of overlays and allows you to easily add, modify, or remove overlays as needed.