# Advantages & Disadvantages of NixOS

## Advantages

- **Declarative configuration, Environment as Code, can be managed with Git**
  - Nix Flakes lock dependencies' version through a lock file named `flake.lock`, to ensure that the system is reproducible. This idea actually borrows from some package managers such as npm, cargo, etc.
  - Compared with Docker, Nix Flakes provides a much stronger guarantee for the reproducibility of build results, because Dockerfile is actually an imperative configuration and there is no such thing as `flake.lock` in Docker, Docker's reproducibility relies on sharing the build result(which is MUCH MORE LARGER than Dockerfile itself) through image registry(e.g. Docker Hub).
- **Highly convenient system customization capability**
  - By changing a few lines of configuration, various components of NixOS can be easily customized. This is because Nix encapsulates all the underlying complex operations in Nix packages and only exports concise and necessary declarative parameters.
  - Moreover, this modification is very safe. For example, switching between different desktop environments on NixOS is very simple and clean, you just need to change several lines of the configuration.
- **Rollback**: The system can be restored to any historical state at any time(except the state that is NOT managed by NixOS, such as docker containers, postgresql data, etc...), and NixOS even adds all old versions to the boot options by default to ensure that the system can be rolled back at any time even though it crashes. Therefore, NixOS is also considered one of the most stable Linux Systems.
- **No dependency conflicts**: Each software package in Nix has a unique hash, its installation path also includes this hash value, so multiple versions can coexist.
- **Active community and third-party projects**. The official package repository, nixpkgs, has many contributors, and many people share their Nix configuration on Github/Gitlab. After browsing through it, the entire ecosystem gives me a sense of excitement in discovering a new continent.

## Disadvantages

- **High learning curve:**: To use NixOS effectively and avoid pitfalls caused by improper use, you need to learn about the entire design of Nix and manage the system in a declarative manner. You should not blindly use `nix-env -i` (which is similar to `apt-get install`).
- **Chaotic documentation**: Flakes is still an experimental feature, and there are currently few documents introducing it, Most of the Nix community's documentation only introduces the old cli such as `nix-env`/`nix-channel`. If you want to start learning Nix directly from Flakes, you need to refer to a large number of old documents and extract what you need from them. In addition, some of Nix's current core functions are not well-documented (such as `imports` and Nix Module System), to figure out what it does, it is best to look at the source code...
- **Relatively high disk space usage**: To ensure that the system can be rolled back at any time, Nix preserves all historical environments by default, which can take up a lot of disk space. This can be a problem, especially on some resource-constrained Virtual Machines.
- **Obscure error messages**: Sometimes you may come across some strange error messages and not understand what's going on.
  `--show-trace` may throw you a stack of errors that are of little help.

## Summary

Generally speaking, I think NixOS is suitable for developers who have some experience in using Linux and programming and want to have more control over their systems.

I don't recommend you get started with NixOS if you are new to Linux, it can be a very painful journey.
