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
    # Flakes use Git to pull dependencies from data sources 
    git
    vim
    wget
    curl
  ];
  # Set default editor to vim
  environment.variables.EDITOR = "vim";

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

    # Official NixOS package source, using nixos-23.11 branch here
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-23.11";
    # home-manager, used for managing user configuration
    home-manager = {
      url = "github:nix-community/home-manager/release-23.11";
      # The `follows` keyword in inputs is used for inheritance.
      # Here, `inputs.nixpkgs` of home-manager is kept consistent with
      # the `inputs.nixpkgs` of the current flake,
      # to avoid problems caused by different versions of nixpkgs.
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };

  # `outputs` are all the build result of the flake.
  #
  # A flake can have many use cases and different types of outputs.
  # 
  # parameters in function `outputs` are defined in `inputs` and
  # can be referenced by their names. However, `self` is an exception,
  # this special parameter points to the `outputs` itself(self-reference)
  # 
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
        # Each parameter in the `modules` is a Nixpkgs Module, and
        # there is a partial introduction to it in the nixpkgs manual:
        #    <https://nixos.org/manual/nixpkgs/unstable/#module-system-introduction>
        # It is said to be partial because the documentation is not
        # complete, only some simple introductions.
        # such is the current state of Nix documentation...
        #
        # A Nixpkgs Module can be an attribute set, or a function that
        # returns an attribute set. By default, if a Nixpkgs Module is a
        # function, this function has the following default parameters:
        #
        #  lib:     the nixpkgs function library, which provides many
        #             useful functions for operating Nix expressions:
        #             https://nixos.org/manual/nixpkgs/stable/#id-1.4
        #  config:  all config options of the current flake, very useful
        #  options: all options defined in all NixOS Modules
        #             in the current flake
        #  pkgs:   a collection of all packages defined in nixpkgs,
        #            plus a set of functions related to packaging.
        #            you can assume its default value is
        #            `nixpkgs.legacyPackages."${system}"` for now.
        #            can be customed by `nixpkgs.pkgs` option
        #  modulesPath: the default path of nixpkgs's modules folder,
        #               used to import some extra modules from nixpkgs.
        #               this parameter is rarely used,
        #               you can ignore it for now.
        #
        # The default parameters mentioned above are automatically
        # generated by Nixpkgs. 
        # However, if you need to pass other non-default parameters
        # to the submodules, 
        # you'll have to manually configure these parameters using
        # `specialArgs`. 
        # you must use `specialArgs` by uncomment the following line:
        #
        # specialArgs = {...};  # pass custom arguments into all sub module.
        modules = [
          # Import the configuration.nix here, so that the
          # old configuration file can still take effect.
          # Note: configuration.nix itself is also a Nixpkgs Module,
          ./configuration.nix
        ];
      };
    };
  };
}
```

We defined a NixOS system called `nixos-test` with a configuration file at `./configuration.nix`, which is the classic configuration we modified before. Therefore, we can still make use of it.

To apply the configuration to a system with hostname `nixos-test`, run `sudo nixos-rebuild switch --flake /etc/nixos#nixos-test`. No changes will be made to the system because we imported the old configuration file in `/etc/nixos/flake.nix`, so the actual state we declared remains unchanged.

The comments in the above code are already quite detailed, but let's emphasize a few points here:

1. Default parameters like `lib`, `pkgs`, `config`, and others are automatically generated by Nixpkgs and can be automatically injected into submodules without the need for additional declarations here.

2. In `specialArgs = {...};`, the content of the attribute set is omitted here. Its contents are automatically injected into submodules through name matching.
   
   1. A common usage, for instance, is to directly write `specialArgs = inputs;`, enabling all data sources from the `inputs` attribute set to be used in the submodules.
   2. If you do not want to mixed all the data sources in `inputs` with the defaults, use `specialArgs = {inherit inputs;};`(akin `specialArgs = {inputs = inputs;};`) instead.

## Managing System Packages with Flakes

After the switch, we can manage the system using Flakes. One common requirement is installing packages. We have previously seen how to install packages using `environment.systemPackages` from the official `nixpkgs` repository.

Now let's learn how to install packages from other sources using Flakes. This is really useful when you want to use a newer version of some package that is not added into Nixpkgs yet.

Let's use [Helix](https://github.com/helix-editor/helix) editor as an example.

First, we need to add Helix as an input in `flake.nix`:

```nix{10,20}
{
  description = "NixOS configuration of Ryan Yin";

  # ...

  inputs = {
    # ...

    # Helix editor, the master branch
    helix.url = "github:helix-editor/helix/master";
  };

  outputs = inputs@{ self, nixpkgs, ... }: {
    nixosConfigurations = {
      nixos-test = nixpkgs.lib.nixosSystem {
        system = "x86_64-linux";

        # Set all input parameters as specialArgs of all sub-modules
        # so that we can use the `helix`(an attribute in inputs) in
        # sub-modules directly.
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

To deploy the changes, run `sudo nixos-rebuild switch`, this will take a while to compile the latest Helix.

After that, you can start the Helix editor by running the `hx` command.

> If your system's hostname is not `nixos-test`, you need to modify the name of `nixosConfigurations` in `flake.nix`, or use `--flake /etc/nixos#nixos-test` to specify the configuration name.

> You can always try to add `--show-trace -L` to the `nixos-rebuild` command to get the detailed error message if you encounter any errors during the deployment.

Furthermore, if you merely want to experiment with the latest version of Helix before deciding whether to install it system-wide, there's a simpler way – just a single command:

> Similarly, if you wish to use the latest version, compiling from source is usually unavoidable and may take some time.

```bash
nix run github:helix-editor/helix/master
```

We will introduce `nix run` in detail at [Usage of the New CLI](/other-usage-of-flakes/the-new-cli.md)

## Leveraging Features from Other Flakes Packages

In fact, this is the primary functionality of Flakes — a Flake can depend on other Flakes, allowing it to utilize the features they provide. It's akin to how we incorporate functionalities from other libraries when writing programs in TypeScript, Go, Rust, and other programming languages.

The example above, using the latest version from the official Helix Flake, illustrates this functionality. More use cases will be discussed later, and here are a few examples referenced for future mention:

- [Getting Started with Home Manager](./start-using-home-manager.md): This introduces the community's Home-Manager as a dependency, enabling direct utilization of the features provided by this Flake.
- [Downgrading or Upgrading Packages](./downgrade-or-upgrade-packages.md): Here, different versions of Nixpkgs are introduced as dependencies, allowing for flexible selection of packages from various versions of Nixpkgs.

