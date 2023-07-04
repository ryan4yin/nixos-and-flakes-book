# Usage of the New CLI

Once you have enabled `nix-command` and `flake`, you can use the `nix help` command to obtain information about the [New Nix Commands][New Nix Commands]. Here are some useful examples:

```bash
# The following command installs and runs the `ponysay` package from the `nixpkgs` flake.
# The `nixpkgs` flake refers to the `nixpkgs` repository on GitHub, which contains a `flake.nix` file.
# `nixpkgs` is a flake registry ID for `github:NixOS/nixpkgs/nixos-unstable`.
# You can find all the flake registry IDs at <https://github.com/NixOS/flake-registry/blob/master/flake-registry.json>.
echo "Hello Nix" | nix run "nixpkgs#ponysay"

# this command is the same as above, but use a full flake URI instead of falkeregistry id.
echo "Hello Nix" | nix run "github:NixOS/nixpkgs/nixos-unstable#ponysay"

# instead of treat flake package as an application,
# this command use `devShells.example` in flake `zero-to-nix`'s outputs, to setup the development environment,
# and then open a bash shell in that environment.
nix develop "github:DeterminateSystems/zero-to-nix#example"

# instead of using a remote flake, you can open a bash shell using the flake located in the current directory.
mkdir my-flake && cd my-flake
# init a flake with template
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

[New Nix Commands]: https://nixos.org/manual/nix/stable/command-ref/new-cli/nix.html
[Zero to Nix - Determinate Systems]: https://github.com/DeterminateSystems/zero-to-nix
