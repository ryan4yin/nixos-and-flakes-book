# Development Environments on NixOS

NixOS's reproducibility makes it ideal for building development environments. However, if you're used to other distros, you may encounter problems because NixOS has its own logic. We'll briefly explain this below.

On NixOS, it's recommended to only install common tools in the global environment, such as `git`, `vim`, `emacs`, `tmux`, `zsh`, etc. The development environment of each language should be an independent environment for each project.

You should NOT install the development environment of each language in the global environment. The project environment should be completely isolated from each other and will not affect each other.

In the following sections, we'll introduce how the development environment works in NixOS.

## Creating a Development Environment

We can create a development environment using `pkgs.mkShell { ... }` and open an interactive Bash shell of this development environment using `nix develop`.

To see how `pkgs.mkShell` works, let's take a look at [its source code](https://github.com/NixOS/nixpkgs/blob/master/pkgs/build-support/mkshell/default.nix).

```nix
{ lib, stdenv, buildEnv }:

# A special kind of derivation that is only meant to be consumed by the
# nix-shell.
{ name ? "nix-shell"
, # a list of packages to add to the shell environment
  packages ? [ ]
, # propagate all the inputs from the given derivations
  inputsFrom ? [ ]
, buildInputs ? [ ]
, nativeBuildInputs ? [ ]
, propagatedBuildInputs ? [ ]
, propagatedNativeBuildInputs ? [ ]
, ...
}@attrs:
let
  mergeInputs = name:
    (attrs.${name} or [ ]) ++
    (lib.subtractLists inputsFrom (lib.flatten (lib.catAttrs name inputsFrom)));

  rest = builtins.removeAttrs attrs [
    "name"
    "packages"
    "inputsFrom"
    "buildInputs"
    "nativeBuildInputs"
    "propagatedBuildInputs"
    "propagatedNativeBuildInputs"
    "shellHook"
  ];
in

stdenv.mkDerivation ({
  inherit name;

  buildInputs = mergeInputs "buildInputs";
  nativeBuildInputs = packages ++ (mergeInputs "nativeBuildInputs");
  propagatedBuildInputs = mergeInputs "propagatedBuildInputs";
  propagatedNativeBuildInputs = mergeInputs "propagatedNativeBuildInputs";

  shellHook = lib.concatStringsSep "\n" (lib.catAttrs "shellHook"
    (lib.reverseList inputsFrom ++ [ attrs ]));

  phases = [ "buildPhase" ];

  # ......

  # when distributed building is enabled, prefer to build locally
  preferLocalBuild = true;
} // rest)
```

`pkgs.mkShell { ... }` is a special derivation (Nix package). Its `name`, `buildInputs`, and other parameters are customizable, and `shellHook` is a special parameter that will be executed when `nix develop` enters the environment.

Here is a `flake.nix` that defines a development environment with Node.js 18 installed:

```nix
{
  description = "A Nix-flake-based Node.js development environment";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-23.05";
  };

  outputs = { self , nixpkgs ,... }: let
    # system should match the system you are running on
    # system = "x86_64-linux";
    system = "x86_64-darwin";
  in {
    devShells."${system}".default = let
      pkgs = import nixpkgs {
        inherit system;
        overlays = [
          (self: super: rec {
            nodejs = super.nodejs-18_x;
            pnpm = super.nodePackages.pnpm;
            yarn = (super.yarn.override { inherit nodejs; });
          })
        ];
      };
    in pkgs.mkShell {
      # create an environment with nodejs-18_x, pnpm, and yarn
      packages = with pkgs; [
        node2nix
        nodejs
        pnpm
        yarn
      ];

      shellHook = ''
        echo "node `${pkgs.nodejs}/bin/node --version`"
      '';
    };
  };
}
```

Create an empty folder, save the above configuration as `flake.nix`, and then execute `nix develop` (or more precisely, you can use `nix develop .#default`), you will find that you have entered a nodejs 18 development environment, you can use `node` `npm` `pnpm` `yarn` and other commands. And when you just entered, `shellHook` was also executed, outputting the current version of nodejs.

## Enter the build environment of any Nix package

Now let's take a look at `nix develop`, first read the help document output by `nix develop --help`:

```
Name
    nix develop - run a bash shell that provides the build environment of a derivation

Synopsis
    nix develop [option...] installable
# ......
```

It tells us that `nix develop` accepts a parameter `installable`, which means that we can enter the development environment of any installable Nix package through it, not just the environment created by `pkgs.mkShell`.

By default, `nix develop` will try to use the following attributes in the flake outputs:

- `devShells.<system>.default`
- `packages.<system>.default`

If we use `nix develop /path/to/flake#<name>` to specify the flake package address and flake output name, then `nix develop` will try the following attributes in the flake outputs:

- `devShells.<system>.<name>`
- `packages.<system>.<name>`
- `legacyPackages.<system>.<name>`

Now let's try it out. First, test it to confirm that We don't have `c++` `g++` and other compilation-related commands in the current environment:

```shell
ryan in 🌐 aquamarine in ~
› c++
c++: command not found

ryan in 🌐 aquamarine in ~
› g++
g++: command not found
```

Then use `nix develop` to enter the build environment of the `hello` package in `nixpkgs`:

```shell
# login to the build environment of the package `hello`
ryan in 🌐 aquamarine in ~
› nix develop nixpkgs#hello

ryan in 🌐 aquamarine in ~ via ❄️  impure (hello-2.12.1-env)
› env | grep CXX
CXX=g++

ryan in 🌐 aquamarine in ~ via ❄️  impure (hello-2.12.1-env)
› c++ --version
g++ (GCC) 12.3.0
Copyright (C) 2022 Free Software Foundation, Inc.
This is free software; see the source for copying conditions.  There is NO
warranty; not even for MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.

ryan in 🌐 aquamarine in ~ via ❄️  impure (hello-2.12.1-env)
› g++ --version
g++ (GCC) 12.3.0
Copyright (C) 2022 Free Software Foundation, Inc.
This is free software; see the source for copying conditions.  There is NO
warranty; not even for MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
```

We can see that the `CXX` environment variable have been set, and the `c++` `g++` and other commands can be used normally now.

In addition, we can also call every build phase of the `hello` package normally:

> The default execution order of all build phases of a Nix package is: `$prePhases unpackPhase patchPhase $preConfigurePhases configurePhase $preBuildPhases buildPhase checkPhase $preInstallPhases installPhase fixupPhase installCheckPhase $preDistPhases distPhase $postPhases`

```shell
# unpack source code
ryan in 🌐 aquamarine in /tmp/xxx via ❄️  impure (hello-2.12.1-env)
› unpackPhase
unpacking source archive /nix/store/pa10z4ngm0g83kx9mssrqzz30s84vq7k-hello-2.12.1.tar.gz
source root is hello-2.12.1
setting SOURCE_DATE_EPOCH to timestamp 1653865426 of file hello-2.12.1/ChangeLog

ryan in 🌐 aquamarine in /tmp/xxx via ❄️  impure (hello-2.12.1-env)
› ls
hello-2.12.1

ryan in 🌐 aquamarine in /tmp/xxx via ❄️  impure (hello-2.12.1-env)
› cd hello-2.12.1/

# generate Makefile
ryan in 🌐 aquamarine in /tmp/xxx/hello-2.12.1 via ❄️  impure (hello-2.12.1-env)
› configurePhase
configure flags: --prefix=/tmp/xxx/outputs/out --prefix=/tmp/xxx/outputs/out
checking for a BSD-compatible install... /nix/store/02dr9ymdqpkb75vf0v1z2l91z2q3izy9-coreutils-9.3/bin/install -c
checking whether build environment is sane... yes
checking for a thread-safe mkdir -p... /nix/store/02dr9ymdqpkb75vf0v1z2l91z2q3izy9-coreutils-9.3/bin/mkdir -p
checking for gawk... gawk
checking whether make sets $(MAKE)... yes
checking whether make supports nested variables... yes
checking for gcc... gcc
# ......
checking that generated files are newer than configure... done
configure: creating ./config.status
config.status: creating Makefile
config.status: creating po/Makefile.in
config.status: creating config.h
config.status: config.h is unchanged
config.status: executing depfiles commands
config.status: executing po-directories commands
config.status: creating po/POTFILES
config.status: creating po/Makefile

# build the package
ryan in 🌐 aquamarine in /tmp/xxx/hello-2.12.1 via C v12.3.0-gcc via ❄️  impure (hello-2.12.1-env) took 2s
› buildPhase
build flags: SHELL=/run/current-system/sw/bin/bash
make  all-recursive
make[1]: Entering directory '/tmp/xxx/hello-2.12.1'
# ......
ranlib lib/libhello.a
gcc  -g -O2   -o hello src/hello.o  ./lib/libhello.a
make[2]: Leaving directory '/tmp/xxx/hello-2.12.1'
make[1]: Leaving directory '/tmp/xxx/hello-2.12.1'

# run the built program
ryan in 🌐 aquamarine in /tmp/xxx/hello-2.12.1 via C v12.3.0-gcc via ❄️  impure (hello-2.12.1-env)
› ./hello
Hello, world!
```

This usage is mainly used to debug the build process of a Nix package, or to execute some commands in the build environment of a Nix package.

## `nix build`

The `nix build` command is used to build a software package and creates a symbolic link named `result` in the current directory, which points to the build result.

Here's an example:

```bash
# Build the package 'ponysay' from the 'nixpkgs' flake
nix build "nixpkgs#ponysay"
# Use the built 'ponysay' command
› ./result/bin/ponysay 'hey buddy!'
 ____________ 
< hey buddy! >
 ------------ 
     \                                  
      \                                 
       \                                
       ▄▄  ▄▄ ▄ ▄                       
    ▀▄▄▄█▄▄▄▄▄█▄▄▄                      
   ▀▄███▄▄██▄██▄▄██                     
  ▄██▄███▄▄██▄▄▄█▄██                    
 █▄█▄██▄█████████▄██                    
  ▄▄█▄█▄▄▄▄▄████████                    
 ▀▀▀▄█▄█▄█▄▄▄▄▄█████         ▄   ▄      
    ▀▄████▄▄▄█▄█▄▄██       ▄▄▄▄▄█▄▄▄    
    █▄██▄▄▄▄███▄▄▄██    ▄▄▄▄▄▄▄▄▄█▄▄    
    ▀▄▄██████▄▄▄████    █████████████   
       ▀▀▀▀▀█████▄▄ ▄▄▄▄▄▄▄▄▄▄██▄█▄▄▀   
            ██▄███▄▄▄▄█▄▄▀  ███▄█▄▄▄█▀  
            █▄██▄▄▄▄▄████   ███████▄██  
            █▄███▄▄█████    ▀███▄█████▄ 
            ██████▀▄▄▄█▄█    █▄██▄▄█▄█▄ 
           ███████ ███████   ▀████▄████ 
           ▀▀█▄▄▄▀ ▀▀█▄▄▄▀     ▀██▄▄██▀█
                                ▀  ▀▀█  
```

## Other Commands

There are other commands like `nix flake init`, which you can explore in [New Nix Commands][New Nix Commands]. For more detailed information, please refer to the documentation.

## References

- [pkgs.mkShell - nixpkgs manual](https://nixos.org/manual/nixpkgs/stable/#sec-pkgs-mkShell)
- [A minimal nix-shell](https://fzakaria.com/2021/08/02/a-minimal-nix-shell.html)
- [One too many shell, Clearing up with nix' shells nix shell and nix-shell - Yannik Sander](https://blog.ysndr.de/posts/guides/2021-12-01-nix-shells/)

[New Nix Commands]: https://nixos.org/manual/nix/stable/command-ref/new-cli/nix.html

