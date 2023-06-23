
After becoming familiar with the NixOS, you can further explore Nix's three manuals and other docs to discover more ways to use it:

- [Nix Reference Manual](https://nixos.org/manual/nix/stable/package-management/profiles.html): A guide to the Nix package manager, which mainly covers the design of the package manager and instructions for using it from the command line.
- [nixpkgs Manual](https://nixos.org/manual/nixpkgs/unstable/): A manual that introduces parameters of Nixpkgs, how to use, modify, and package Nix packages.
- [NixOS Manual](https://nixos.org/manual/nixos/unstable/): A user manual for NixOS, mainly including configuration instructions for system-level components such as Wayland/X11 and GPU.
- [nix-pills](https://nixos.org/guides/nix-pills): Nix Pills provides an in-depth explanation of how to use Nix to build software packages. It is written in a clear and understandable way and is worth reading, as it is also sufficiently in-depth.

After becoming familiar with Flakes, you may want to try some advanced techniques. Here are some popular community projects to try:

- [flake-parts](https://github.com/hercules-ci/flake-parts): Simplify the writing and maintenance of configuration through the Module module system.
- [flake-utils-plus](https://github.com/gytis-ivaskevicius/flake-utils-plus): A third-party package for simplifying Flake configuration, which is apparently more powerful.
- [digga][digga]: A large and comprehensive Flake template that combines the functionality of various useful Nix toolkits, but has a complex structure and requires some experience to navigate.
- etc.

And many other useful community projects to explore, here are some of them:

- [dev-templates](https://github.com/the-nix-way/dev-templates): Dev environments for numerous languages based on Nix flakes.
- [devenv](https://github.com/cachix/devenv): development environment management
- [agenix](https://github.com/ryantm/agenix): secrets management
- [colmena](https://github.com/zhaofengli/colmena): NixOS deployment tools
- [nixos-generator](https://github.com/nix-community/nixos-generators): generate iso/qcow2/... from nixos configuration
- [lanzaboote](https://github.com/nix-community/lanzaboote): enable secure boot for NixOS
- [impermanence](https://github.com/nix-community/impermanence): used to make NixOS stateless, to imporve the reproduciability of NixOS system.
