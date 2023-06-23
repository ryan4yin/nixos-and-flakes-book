
## VII. Usage of Nix Flakes

Up to now, we have written a lot of configuration with Flakes to manage NixOS. Here is a brief introduction to the more detailed content of the Flakes, as well as the new command lines commonly used with flakes.

### 1. Flake inputs {#flake-inputs}

The `inputs` in `flake.nix` is a attribute set, used to specify the dependencies of the current flake, there are many types of `inputs`, for example:

```nix
{
  inputs = {
    # use master branch of the GitHub repository as input, this is the most common input format
    nixpkgs.url = "github:Mic92/nixpkgs/master";
    # Git URL, can be used for any Git repository based on https/ssh protocol
    git-example.url = "git+https://git.somehost.tld/user/path?ref=branch&rev=fdc8ef970de2b4634e1b3dca296e1ed918459a9e";
    # The above example will also copy .git, use this for (shallow) local Git repos
    git-directory-example.url = "git+file:/path/to/repo?shallow=1";
    # Local directories (for absolute paths you can omit 'path:')
    directory-example.url = "path:/path/to/repo";

    bar = {
      url = "github:foo/bar/branch";
      # if the input is not a flake, you need to set flake=false
      flake = false;
    };

    sops-nix = {
      url = "github:Mic92/sops-nix";
      # The `follows` keyword in inputs is used for inheritance.
      # Here, `inputs.nixpkgs` of sops-nix is kept consistent with the `inputs.nixpkgs` in
      # the current flake, to avoid problems caused by different versions of nixpkgs.
      inputs.nixpkgs.follows = "nixpkgs";
    };

    # Pin flakes to a specific revision
    nix-doom-emacs = {
      url = "github:vlaci/nix-doom-emacs?rev=238b18d7b2c8239f676358634bfb32693d3706f3";
      flake = false;
    };

    # To use a subdirectory of a repo, pass `dir=xxx`
    nixpkgs.url = "github:foo/bar?dir=shu";
  }
}
```

### 2. Flake outputs

the `outputs` in `flake.nix` are what a flake produces as part of its build. Each flake can have many different outputs simultaneously, including but not limited to:

- Nix packages: named `apps.<system>.<name>`, `packages.<system>.<name>`, or `legacyPackages.<system>.<name>`
  - we can build a package by command `nix build .#<name>`
- Nix Helper Functions: named `lib`., which means a library for other flakes.
- Nix development environments: named `devShells`
  - `devShells` can be used by command `nix develop`, will be introduced later.
- NixOS configuration: named `nixosConfiguration`
  - `nixosConfiguration` will be used by command `nixos-rebuild switch --flake .#<name>`
- Nix templates: named `templates`
  - templates can be used by command `nix flake init --template <reference>`
- Other user defined outputs, may be parsed by other nix-related tools.

An example copy from NixOS Wiki:

```nix
{ self, ... }@inputs:
{
  # Executed by `nix flake check`
  checks."<system>"."<name>" = derivation;
  # Executed by `nix build .#<name>`
  packages."<system>"."<name>" = derivation;
  # Executed by `nix build .`
  packages."<system>".default = derivation;
  # Executed by `nix run .#<name>`
  apps."<system>"."<name>" = {
    type = "app";
    program = "<store-path>";
  };
  # Executed by `nix run . -- <args?>`
  apps."<system>".default = { type = "app"; program = "..."; };

  # Formatter (alejandra, nixfmt or nixpkgs-fmt)
  formatter."<system>" = derivation;
  # Used for nixpkgs packages, also accessible via `nix build .#<name>`
  legacyPackages."<system>"."<name>" = derivation;
  # Overlay, consumed by other flakes
  overlays."<name>" = final: prev: { };
  # Default overlay
  overlays.default = {};
  # Nixos module, consumed by other flakes
  nixosModules."<name>" = { config }: { options = {}; config = {}; };
  # Default module
  nixosModules.default = {};
  # Used with `nixos-rebuild --flake .#<hostname>`
  # nixosConfigurations."<hostname>".config.system.build.toplevel must be a derivation
  nixosConfigurations."<hostname>" = {};
  # Used by `nix develop .#<name>`
  devShells."<system>"."<name>" = derivation;
  # Used by `nix develop`
  devShells."<system>".default = derivation;
  # Hydra build jobs
  hydraJobs."<attr>"."<system>" = derivation;
  # Used by `nix flake init -t <flake>#<name>`
  templates."<name>" = {
    path = "<store-path>";
    description = "template description goes here?";
  };
  # Used by `nix flake init -t <flake>`
  templates.default = { path = "<store-path>"; description = ""; };
}
```

### 3. Flake Command Line Usage

after enabled `nix-command` & `flake`, you can use `nix help` to get all the info of [New Nix Commands][New Nix Commands], some useful examples are listed below:

```bash
# `nixpkgs#ponysay` means `ponysay` from `nixpkgs` flake.
# [nixpkgs](https://github.com/NixOS/nixpkgs) contains `flake.nix` file, so it's a flake.
# `nixpkgs` is a falkeregistry id for `github:NixOS/nixpkgs/nixos-unstable`.
# you can find all the falkeregistry ids at <https://github.com/NixOS/flake-registry/blob/master/flake-registry.json>
# so this command means install and run package `ponysay` in `nixpkgs` flake.
echo "Hello Nix" | nix run "nixpkgs#ponysay"

# this command is the same as above, but use a full flake URI instead of falkeregistry id.
echo "Hello Nix" | nix run "github:NixOS/nixpkgs/nixos-unstable#ponysay"

# instead of treat flake package as an application,
# this command use `devShells.example` in flake `zero-to-nix`'s outputs, to setup the development environment,
# and then open a bash shell in that environment.
nix develop "github:DeterminateSystems/zero-to-nix#example"

# instead of using a remote flake, you can open a bash shell using the flake located in the current directory.
mkdir my-flake && cd my-flake
## init a flake with template
nix flake init --template "github:DeterminateSystems/zero-to-nix#javascript-dev"
# open a bash shell using the flake in current directory
nix develop
# or if your flake has multiple devShell outputs, you can specify which one to use.
nix develop .#example

# build package `bat` from flake `nixpkgs`, and put a symlink `result` in the current directory.
mkdir build-nix-package && cd build-nix-package
nix build "nixpkgs#bat"
# build a local flake is the same as nix develop, skip it
```

[Zero to Nix - Determinate Systems][Zero to Nix - Determinate Systems] is a brand new guide to get started with Nix & Flake, recommended to read for beginners.
