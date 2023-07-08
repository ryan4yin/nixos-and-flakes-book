# Enabling NixOS with Flakes

## Enabling Flakes Support

Flakes provide improved reproducibility and a more organized package structure, making it easier to maintain NixOS configurations compared to the traditional approach. Therefore, it is recommended to manage NixOS using Flakes.

However, as Flakes is still an experimental feature, it is not enabled by default. To enable Flakes, you need to modify the `/etc/nixos/configuration.nix` file as follows:

```nix{15,18-19}
# Edit this configuration file to define what should be installed on
# your system. Help is available in the configuration.nix(5) man page
# and in the NixOS manual (accessible by running 'nixos-help').
{ config, pkgs, ... }:

{
  imports =
    [ # Include the results of the hardware scan.
      ./hardware-configuration.nix
    ];

  # Omit the previous configuration...

  # Enable Flakes and the new command-line tool
  nix.settings.experimental-features = [ "nix-command" "flakes" ];

  environment.systemPackages = with pkgs; [
    # Flakes use Git to pull dependencies from data sources, so Git must be installed first
    git
    vim
    wget
    curl
  ];

  # Omit the rest of the configuration...
}
```

To apply the changes, run `sudo nixos-rebuild switch`. After that, you can start writing the configuration for NixOS using Flakes.

## Switching to `flake.nix` for System Configuration

After enabling `flakes`, whenever you run `sudo nixos-rebuild switch`, it will first attempt to read the `/etc/nixos/flake.nix` file. If the file is not found, it will fallback to `/etc/nixos/configuration.nix`.

To learn how to write a Flakes configuration, you can refer to the official Flakes templates provided by Nix. To check the available templates, run the following command:

```bash
nix flake show templates
```

The `templates#full` template contains examples covering various use cases. Let's take a look at them:

```bash
nix flake init -t templates#full
cat flake.nix
```

After reviewing the example, create a file named `/etc/nixos/flake.nix` and copy the content of the example into it. From now on, all system modifications will be managed by Flakes using `/etc/nixos/flake.nix`.

Note that the copied template cannot be used directly. You need to modify it to make it work. Here's an example of `/etc/nixos/flake.nix`:

```nix
{
  description = "Ryan's NixOS Flake";

  # This is the standard format for flake.nix.
  # `inputs` are the dependencies of the flake,
  # and `outputs` function will return all the build results of the flake.
  # Each item in `inputs` will be passed as a parameter to
  # the `outputs` function after being pulled and built.
  inputs = {
    # There are many ways to reference flake inputs.
    # The most widely used is `github:owner/name/reference`,
    # which represents the GitHub repository URL + branch/commit-id/tag.

    # Official NixOS package source, using nixos-unstable branch here
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    # home-manager, used for managing user configuration
    home-manager = {
      url = "github:nix-community/home-manager/release-23.05";
      # The `follows` keyword in inputs is used for inheritance.
      # Here, `inputs.nixpkgs` of home-manager is kept consistent with
      # the `inputs.nixpkgs` of the current flake,
      # to avoid problems caused by different versions of nixpkgs.
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };

  # `outputs` are all the build result of the flake.
  # A flake can have many use cases and different types of outputs.
  # parameters in `outputs` are defined in `inputs` and
  # can be referenced by their names. However, `self` is an exception,
  # this special parameter points to the `outputs` itself(self-reference)
  # The `@` syntax here is used to alias the attribute set of the
  # inputs's parameter, making it convenient to use inside the function.
  outputs = { self, nixpkgs, ... }@inputs: {
    nixosConfigurations = {
      # By default, NixOS will try to refer the nixosConfiguration with
      # its hostname, so the system named `nixos-test` will use this one.
      # However, the configuration name can also be specified using:
      #   sudo nixos-rebuild switch --flake /path/to/flakes/directory#<name>
      #
      # The `nixpkgs.lib.nixosSystem` function is used to build this
      # configuration, the following attribute set is its parameter.
      #
      # Run the following command in the flake's directory to
      # deploy this configuration on any NixOS system:
      #   sudo nixos-rebuild switch --flake .#nixos-test
      "nixos-test" = nixpkgs.lib.nixosSystem {
        system = "x86_64-linux";

        # The Nix module system can modularize configuration,
        # improving the maintainability of configuration.
        #
        # Each parameter in the `modules` is a Nix Module, and
        # there is a partial introduction to it in the nixpkgs manual:
        #    <https://nixos.org/manual/nixpkgs/unstable/#module-system-introduction>
        # It is said to be partial because the documentation is not
        # complete, only some simple introductions.
        # such is the current state of Nix documentation...
        #
        # A Nix Module can be an attribute set, or a function that
        # returns an attribute set. By default, if a Nix Module is a
        # function, this function can only have the following parameters:
        #
        #  lib:     the nixpkgs function library, which provides many
        #             useful functions for operating Nix expressions:
        #             https://nixos.org/manual/nixpkgs/stable/#id-1.4
        #  config:  all config options of the current flake
        #  options: all options defined in all NixOS Modules
        #             in the current flake
        #  pkgs:   a collection of all packages defined in nixpkgs.
        #            you can assume its default value is
        #            `nixpkgs.legacyPackages."${system}"` for now.
        #            can be customed by `nixpkgs.pkgs` option
        #  modulesPath: the default path of nixpkgs's modules folder,
        #               used to import some extra modules from nixpkgs.
        #               this parameter is rarely used,
        #               you can ignore it for now.
        #
        # Only these parameters can be passed by default.
        # If you need to pass other parameters,
        # you must use `specialArgs` by uncomment the following line:
        #
        # specialArgs = {...}  # pass custom arguments into all sub module.
        modules = [
          # Import the configuration.nix here, so that the
          # old configuration file can still take effect.
          # Note: configuration.nix itself is also a Nix Module,
          ./configuration.nix
        ];
      };
    };
  };
}
```

We defined a NixOS system called `nixos-test` with a configuration file at `./configuration.nix`, which is the classic configuration we modified before. Therefore, we can still make use of it.

To apply the configuration, run `sudo nixos-rebuild switch`. No changes will be made to the system because we imported the old configuration file in `/etc/nixos/flake.nix`, so the actual state we declared remains unchanged.

## Managing System Packages with Flakes

After the switch, we can manage the system using Flakes. One common requirement is installing packages. We have previously seen how to install packages using `environment.systemPackages` from the official `nixpkgs` repository.

Now let's learn how to install packages from other sources using Flakes. This provides greater flexibility, particularly when it comes to specifying software versions. Let's use [Helix](https://github.com/helix-editor/helix) editor as an example.

First, we need to add Helix as an input in `flake.nix`:

```nix{10,20}
{
  description = "NixOS configuration of Ryan Yin";

  # ...

  inputs = {
    # ...

    # Helix editor, using version 23.05
    helix.url = "github:helix-editor/helix/23.05";
  };

  outputs = inputs@{ self, nixpkgs, ... }: {
    nixosConfigurations = {
      nixos-test = nixpkgs.lib.nixosSystem {
        system = "x86_64-linux";

        # Set all input parameters as specialArgs of all sub-modules
        # so that we can use the `helix` input in sub-modules
        specialArgs = inputs;
        modules = [
          ./configuration.nix
        ];
      };
    };
  };
}
```

Next, update `configuration.nix` to install `helix` from the `helix` input:

```nix{3,14-15}
# Nix will automatically inject `helix` from specialArgs
# into the third parameter of this function through name matching
{ config, pkgs, helix, ... }:

{
  # Omit other configurations...

  environment.systemPackages = with pkgs; [
    git
    vim
    wget
    curl

    # Install Helix from the `helix` input
    helix.packages."${pkgs.system}".helix
  ];

  # Omit other configurations...
}
```

To deploy the changes, run `sudo nixos-rebuild switch`. After that, you can start the Helix editor by running the `hx` command.

## Adding Custom Cache Mirrors

> If you don't need to customize the cache mirror, you can safely skip this section.

To accelerate package building, Nix provides <https://cache.nixos.org> to cache build results and avoid rebuilding packages locally.

With the classic configuration method in NixOS, additional cache sources can be added using `nix-channel`. However, Nix Flakes strives to avoid using any system-level configurations or environment variables as much as possible, ensuring that its build results are not affected by the environment. Therefore, after switching to Flakes, the `nix-channel` command becomes ineffective.

To customize the cache source, we must add the related configuration in `flake.nix` using the `nixConfig` parameter. Here's an example:

```nix{4-19}
{
  description = "NixOS configuration of Ryan Yin";

  nixConfig = {
    experimental-features = [ "nix-command" "flakes" ];
    substituters = [
      # Replace the official cache with a mirror located in China
      "https://mirrors.bfsu.edu.cn/nix-channels/store"
      "https://cache.nixos.org/"
    ];

    extra-substituters = [
      # Nix community's cache server
      "https://nix-community.cachix.org"
    ];
    extra-trusted-public-keys = [
      "nix-community.cachix.org-1:mB9FSh9qf2dCimDSUo8Zy7bkq5CX+/rkCWyvRCYg3Fs="
    ];
  };

  inputs = {
    # Omit some configurations...
  };

  outputs = {
    # Omit some configurations...
  };
}
```

After making the modifications, run `sudo nixos-rebuild switch` to apply the updates.
