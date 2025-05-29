# Packaging 101

WIP work in progress, please refer to the following reference documents to learn Nix
packaging.

## References

- [NixOS Series 3: Software Packaging 101](https://lantian.pub/en/article/modify-computer/nixos-packaging.lantian/)
- [How to Learn Nix, Part 28: The standard environment](https://ianthehenry.com/posts/how-to-learn-nix/the-standard-environment/)
- [stdenv - Nixpkgs Manual](https://github.com/NixOS/nixpkgs/tree/nixos-unstable/doc/stdenv)
- [languages-frameworks - Nixpkgs Manual](https://github.com/NixOS/nixpkgs/tree/nixos-unstable/doc/languages-frameworks)
- [Wrapping packages - NixOS Cookbook](https://wiki.nixos.org/wiki/Nix_Cookbook#Wrapping_packages)
- Useful tools:
  - [nurl](https://github.com/nix-community/nurl): Generate Nix fetcher calls from
    repository URLs
  - [nix-init](https://github.com/nix-community/nix-init): Generate Nix packages from URLs
    with hash prefetching, dependency inference, license detection, and more
- Source Code:
  - [pkgs/build-support/trivial-builders/default.nix - runCommand](https://github.com/NixOS/nixpkgs/blob/nixos-25.05/pkgs/build-support/trivial-builders/default.nix#L21-L49)
  - [pkgs/build-support/setup-hooks/make-wrapper.sh](https://github.com/NixOS/nixpkgs/blob/nixos-25.05/pkgs/build-support/setup-hooks/make-wrapper.sh)
  - FHS related
    - [pkgs/build-support/build-fhsenv-bubblewrap/buildFHSEnv.nix](https://github.com/NixOS/nixpkgs/blob/nixos-25.05/pkgs/build-support/build-fhsenv-bubblewrap/buildFHSEnv.nix):
      `pkgs.buildFHSEnvBubblewrap`
    - [pkgs/build-support/build-fhsenv-chroot/default.nix](https://github.com/NixOS/nixpkgs/blob/nixos-25.05/pkgs/build-support/build-fhsenv-bubblewrap/buildFHSEnv.nix):
      `pkgs.buildFHSEnvChroot`
