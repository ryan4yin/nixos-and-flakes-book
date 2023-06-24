## NixOS with Flakes Enabled

### Enabling Flakes Support

Compared to the default configuration approach of NixOS, Flakes provide better reproducibility and a clearer package structure that is easier to maintain. Therefore, it is recommended to manage NixOS with Flakes.

However, as Flakes is still an experimental feature currently, it's not enabled by default yet, we need to enable it manually by modifying `/etc/nixos/configuration.nix`, example as follows:

```nix
# Edit this configuration file to define what should be installed on
# your system.  Help is available in the configuration.nix(5) man page
# and in the NixOS manual (accessible by running 'nixos-help').
{ config, pkgs, ... }:

{
  imports =
    [ # Include the results of the hardware scan.
      ./hardware-configuration.nix
    ];

  # omit the previous configuration.......

  # enable Flakes and the new command line tool
  nix.settings.experimental-features = [ "nix-command" "flakes" ];

  environment.systemPackages = with pkgs; [
    # Flakes uses git to pull dependencies from data sources, so git must be installed first
    git
    vim
    wget
    curl

  ];

  # omit the rest of the configuration.......
}
```

Now run `sudo nixos-rebuild switch` to apply the changes, and then you can write the configuration for NixOS with Flakes.

### Switching System Configuration to `flake.nix`

After enabling `flakes`, `sudo nixos-rebuild switch` will try to read`/etc/nixos/flake.nix` first every time you run it, if not found, it will fallback to `/etc/nixos/configuration.nix`.

Now to learn how to write a flake, let's take a look at the official flake templates provided by Nix. First, check which templates are available:

```bash
nix flake show templates
```

The templates `templates#full` contain all possible use cases, let's take a look at them:

```bash
nix flake init -t templates#full
cat flake.nix
```

After reading this example, let's create a file `/etc/nixos/flake.nix` and copy the content of the example into it.
With `/etc/nixos/flake.nix`, all system modifications will be taken over by Flakes from now on.

The template we copied CAN NOT be used directly, we need to modify it to make it work, an example of `/etc/nixos/flake.nix` is as follows:

```nix
{
  description = "Ryan's NixOS Flake";

  # This is the standard format for flake.nix. `inputs` are the dependencies of the flake,
  # and `outputs` function will return all the build results of the flake.
  # Each item in `inputs` will be passed as a parameter to the `outputs` function after being pulled and built.
  inputs = {
    # There are many ways to reference flake inputs. The most widely used is github:owner/name/reference,
    # which represents the GitHub repository URL + branch/commit-id/tag.

    # Official NixOS package source, using nixos-unstable branch here
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    # home-manager, used for managing user configuration
    home-manager = {
      url = "github:nix-community/home-manager/release-22.11";
      # The `follows` keyword in inputs is used for inheritance.
      # Here, `inputs.nixpkgs` of home-manager is kept consistent with the `inputs.nixpkgs` of the current flake,
      # to avoid problems caused by different versions of nixpkgs.
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };

  # `outputs` are all the build result of the flake.
  # A flake can have many use cases and different types of outputs.
  # parameters in `outputs` are defined in `inputs` and can be referenced by their names.
  # However, `self` is an exception, This special parameter points to the `outputs` itself (self-reference)
  # The `@` syntax here is used to alias the attribute set of the inputs's parameter, making it convenient to use inside the function.
  outputs = { self, nixpkgs, ... }@inputs: {
    nixosConfigurations = {
      # By default, NixOS will try to refer the nixosConfiguration with its hostname.
      # so the system named `nixos-test` will use this configuration.
      # However, the configuration name can also be specified using `sudo nixos-rebuild switch --flake /path/to/flakes/directory#<name>`.
      # The `nixpkgs.lib.nixosSystem` function is used to build this configuration, the following attribute set is its parameter.
      # Run `sudo nixos-rebuild switch --flake .#nixos-test` in the flake's directory to deploy this configuration on any NixOS system
      "nixos-test" = nixpkgs.lib.nixosSystem {
        system = "x86_64-linux";

        # The Nix module system can modularize configuration, improving the maintainability of configuration.
        #
        # Each parameter in the `modules` is a Nix Module, and there is a partial introduction to it in the nixpkgs manual:
        #    <https://nixos.org/manual/nixpkgs/unstable/#module-system-introduction>
        # It is said to be partial because the documentation is not complete, only some simple introductions
        #    (such is the current state of Nix documentation...)
        # A Nix Module can be an attribute set, or a function that returns an attribute set.
        # If a Module is a function, this function can only have the following parameters:
        #
        #  lib:     the nixpkgs function library, which provides many useful functions for operating Nix expressions
        #            https://nixos.org/manual/nixpkgs/stable/#id-1.4
        #  config:  all config options of the current flake
        #  options: all options defined in all NixOS Modules in the current flake
        #  pkgs:   a collection of all packages defined in nixpkgs.
        #           you can assume its default value is `nixpkgs.legacyPackages."${system}"` for now.
        #           can be customed by `nixpkgs.pkgs` option
        #  modulesPath: the default path of nixpkgs's builtin modules folder,
        #               used to import some extra modules from nixpkgs.
        #               this parameter is rarely used, you can ignore it for now.
        #
        # Only these parameters can be passed by default.
        # If you need to pass other parameters, you must use `specialArgs` by uncomment the following line
        # specialArgs = {...}  # pass custom arguments into sub module.
        modules = [
          # Import the configuration.nix we used before, so that the old configuration file can still take effect.
          # Note: /etc/nixos/configuration.nix itself is also a Nix Module, so you can import it directly here
          ./configuration.nix
        ];
      };
    };
  };
}
```

Here we defined a NixOS system called `nixos-test`, whose configuration file is `./configuration.nix`, which is the classic configuration we modified before, so we can still make use of it.

Now run `sudo nixos-rebuild switch` to apply the configuration, and no changes will be made to the system, because we imported the old configuration file in `/etc/nixos/flake.nix`, so the actual state we declared remains unchanged.

### Manage system software through Flakes

After the switch, we can now manage the system through Flakes. The most common requirement for managing a system is to install packges. We have seen how to install packages through `environment.systemPackages` before, and these packages are all from the official nixpkgs repository.

Now let's learn how to install packages from other sources through Flakes. This is much more flexible than installing from nixpkgs directly. The most obvious benefit is that you can easily set the version of the software.

Use [helix](https://github.com/helix-editor/helix) editor as an example, first, we need to add the helix as an input into `flake.nix`:

```nix
{
  description = "NixOS configuration of Ryan Yin";

  # ......

  inputs = {
    # ......

    # helix editor, use the tag 23.05
    helix.url = "github:helix-editor/helix/23.05";
  };

  outputs = inputs@{ self, nixpkgs, ... }: {
    nixosConfigurations = {
      nixos-test = nixpkgs.lib.nixosSystem {
        system = "x86_64-linux";

        # set all inputs parameters as specialArgs of all sub module
        # so that we can use `helix` input in sub modules
        specialArgs = inputs;
        modules = [
          ./configuration.nix
        ];
      };
    };
  };
}
```

Then update `configuration.nix` to install `helix` from the input `helix`:

```nix
# Nix will automatically inject `helix` from specialArgs
# into the third parameter of this function through name matching
{ config, pkgs, helix, ... }:

{
  # omit other configuration......

  environment.systemPackages = with pkgs; [
    git
    vim
    wget
    curl

    # install helix from the input `helix`
    helix.packages."${pkgs.system}".helix
  ];

  # omit other configuration......
}
```

Now deploy the changes by `sudo nixos-rebuild switch`, and then we can start the helix editor by `helix` command.

### Add Custom Cache Mirror

> You can safely skip this section if you don't need to customize the cache mirror.

To speed up package building, Nix provides <https://cache.nixos.org> to cache build results to avoid building every package locally.

With the NixOS's classic configuration method, other cache sources can be added by using `nix-channel`, but Flakes avoids using any system-level configuration and environment variables to ensure that its build results are not affected by the environment(so the build results are reproducible).

Therefore, to customize the cache source, we must add the related configuration in `flake.nix` by using the parameter `nixConfig`. An example is as follows:

```nix
{
  description = "NixOS configuration of Ryan Yin";

  # 1. To ensure purity, Flakes does not rely on the system's `/etc/nix/nix.conf`, so we have to set related configuration here.
  # 2. To ensure security, flake allows only a few nixConfig parameters to be set directly by default.
  #    you need to add `--accept-flake-config` when executing the nix command,
  #    otherwise all other parameters will be ignored, and an warning will printed by nix.
  nixConfig = {
    experimental-features = [ "nix-command" "flakes" ];
    substituters = [
      # replace official cache with a mirror located in China
      "https://mirrors.bfsu.edu.cn/nix-channels/store"
      "https://cache.nixos.org/"
    ];

    extra-substituters = [
      # nix community's cache server
      "https://nix-community.cachix.org"
    ];
    extra-trusted-public-keys = [
      "nix-community.cachix.org-1:mB9FSh9qf2dCimDSUo8Zy7bkq5CX+/rkCWyvRCYg3Fs="
    ];
  };

  inputs = {
    # omit some configuration...
  };

  outputs = {
    # omit some configuration...
  };
}

```

After the modification, run `sudo nixos-rebuild switch` to apply the updates.
