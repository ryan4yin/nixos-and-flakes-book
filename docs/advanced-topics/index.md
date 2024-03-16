# Advanced Topics

Once you have become familiar with NixOS, you can explore advanced topics and dive deeper
into the Nix ecosystem. Here are some resources and community projects that can help you
expand your knowledge:

## Community

- [Nix Official - Community](https://nixos.org/community/): Contains information about the
  Nix community, forums, realtime chat, meetups, RFCs, the official team architecture,
  etc.
- [Nix Channel Status](https://status.nixos.org/): The build status of each Nix channel.
- [nix-community/NUR](https://github.com/nix-community/NUR): Although Nixpkgs contains a
  large number of packages, some packages are not included in Nixpkgs due to reasons such
  as review speed and licensing agreements. NUR is a decentralized Nix package repository
  where anyone can create their own Nix repository and add it to NUR for others to use. If
  you want to use a package that is not in Nixpkgs, you can try to find it here. If you
  want to share your own Nix package with others, you can create and share your own Nix
  repository according to the README of NUR.

## Documentation and Videos

- [Eelco Dolstra - The Purely Functional Software Deployment Model - 2006](https://edolstra.github.io/pubs/phd-thesis.pdf):
  Eelco Dolstra's seminal PhD thesis about the Nix package manager,
- [Nix Reference Manual](https://nixos.org/manual/nix/stable/package-management/profiles.html):
  A comprehensive guide to the Nix package manager, covering its design and usage from the
  command line.
- [nixpkgs Manual](https://nixos.org/manual/nixpkgs/unstable/): The manual for nixpkgs,
  which introduces its parameters, explains how to use, modify, and package Nix packages.
- [NixOS Manual](https://nixos.org/manual/nixos/unstable/): A user manual for NixOS,
  providing configuration instructions for system-level components such as Wayland/X11 and
  GPU.
- [nix-pills](https://nixos.org/guides/nix-pills): "Nix Pills" is a series of guides that
  provide an in-depth explanation of building software packages with Nix. It offers clear
  and understandable explanations.
- [nixos-in-production](https://github.com/Gabriella439/nixos-in-production): This is a
  work-in-progress book hosted on LeanPub about introducing and maintaining NixOS in a
  production environment.

And there are many official videos on the
[NixOS Foundation](https://www.youtube.com/@NixOS-Foundation) and
[NixCon](https://www.youtube.com/@NixCon) channels on YouTube. Here are a few videos that
are highly recommended:

- [Summer of Nix 2022 — Public Lecture Series](https://www.youtube.com/playlist?list=PLt4-_lkyRrOMWyp5G-m_d1wtTcbBaOxZk):
  A series of public lectures hosted by the NixOS Foundation, presented by core members of
  the Nix community such as Eelco Dolstra and Armijn Hemel. The content covers the
  development history of Nix, the history of NixOS, and the future of Nix, among other
  topics.
- [Summer of Nix 2023 — Nix Developer Dialogues](https://www.youtube.com/playlist?list=PLt4-_lkyRrOPcBuz_tjm6ZQb-6rJjU3cf):
  A series of dialogues between core members of the Nix community in 2023. The content
  includes the evolution and architectural challenges of Nixpkgs, exploration of Nix's
  module system, discussion of the Nix ecosystem, AI applications in Nixpkgs, and the
  application of Nix in the commercial field and open source economics.

## Advanced Techniques and Community Projects

Once you are comfortable with Flakes, you can explore more advanced techniques and
community projects. Here are some popular ones to try out:

- [flake-parts](https://github.com/hercules-ci/flake-parts): Simplifies the writing and
  maintenance of configurations using the Module module system.
- [flake-utils-plus](https://github.com/gytis-ivaskevicius/flake-utils-plus): A
  third-party package that enhances Flake configuration and provides additional powerful
  features.

There are many other valuable community projects worth exploring. Here are a few examples:

- [nix-output-monitor](https://github.com/maralorn/nix-output-monitor): Beautifully
  displays the build progress of Nix packages, with additional information such as build
  time and build log.
- [agenix](https://github.com/ryantm/agenix): A tool for secrets management.
- [colmena](https://github.com/zhaofengli/colmena): Tools for NixOS deployment.
- [nixos-generators](https://github.com/nix-community/nixos-generators): A tool to
  generate ISO/qcow2/... from NixOS configurations.
- [lanzaboote](https://github.com/nix-community/lanzaboote): Enables secure boot for
  NixOS.
- [impermanence](https://github.com/nix-community/impermanence): Helps make NixOS
  stateless and improves system reproducibility.
- [devbox](https://github.com/jetpack-io/devbox): Lightweight, repeatable dev environments
  without container woes, internally powered by nix, similar to earthly.
- [nixpak](https://github.com/nixpak/nixpak): A tool to sandbox all sorts of Nix-packaged
  applications, including graphical ones.
- [nixpacks](https://github.com/railwayapp/nixpacks): Nixpacks takes a source directory
  and produces an OCI compliant image that can be deployed anywhere, similar to
  buildpacks.
- ...

These projects offer additional functionality and tools that can enhance your NixOS
experience.

For more information, see the [awesome-nix](https://github.com/nix-community/awesome-nix).
