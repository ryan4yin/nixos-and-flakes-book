
### Advantages of Nix Flakes

- **Declarative configuration, Environment as Code, can be managed with Git**
  - As long as the configuration files are not lost, the system can be restored to any historical state at any time(except the state that are NOT managed by NixOS, such as docker containers, postgresql data, etc...)
  - Nix Flakes lock dependences's version through a lock file named `flake.lock`, to ensure that the system is reproducible, this idea actually borrows from some package managers such as npm, cargo, etc.
  - Compared with Docker, Nix Flakes provides a much stronger guarantee for the reproducibility of build results, because Dockerfile is actually an imperative configuration and there is no such thing as `flake.lock` in Docker, Docker's reproducibility relies on sharing the build result(which is MUCH MORE LARGER than Dockerfile itself) through image registry(e.g. DockerHub).
- **Highly convenient system customization capability**
  - By changing a few lines of configuration, various components of NixOS can be easily customized. This is because Nix encapsulates all the underlying complex operations in nix packages and only exports concise and necessary declarative parameters.
  - Moreover, this modification is very safe. An example is that one NixOS user on the V2EX forum stated that "[**on NixOS, switching between different desktop environments is very simple and clean, and it is very safe. I often switch between gnome/kde/sway.**](https://www.v2ex.com/t/938569#r_13053251)"
- **Rollback**: The system can be rolled back to any historical environment at any time, and NixOS even adds all old versions to the boot options by default to ensure that the system can be rolled back at any time even though it crashes. Therefore, NixOS is also considered one of the most stable Linux Systems.
- **No dependency conflicts**: Because each software package in Nix has a unique hash, its installation path also includes this hash value, so multiple versions can coexist.
- **The community is very active, and there are quite a few third-party projects**. The official package repository, nixpkgs, has many contributors, and many people share their Nix configuration on Github/Gitlab. After browsing through it, the entire ecosystem gives me a sense of excitement in discovering a new continent.

{{< figure src="nixos-bootloader.avif" caption="All historical versions are listed in the boot options of NixOS. Image from [NixOS Discourse - 10074](https://discourse.nixos.org/t/how-to-make-uefis-grub2-menu-the-same-as-bioss-one/10074)" >}}

### Disadvantages of Nix Flakes

- **Relatively high learning curve:**: If you want the system to be completely reproducible and avoid pitfalls caused by improper use, you need to learn about the entire design of Nix and manage the system in a declarative manner. You cannot blindly use `nix-env -i` (which is similar to `apt-get install`).
- **Chaotic documentation**: Flakes is still an experimental feature, and there are currently few documents introducing it, Most of the Nix community's documentation only introduces the old cli such as `nix-env`/`nix-channel`. If you want to start learning Nix directly from Flakes, you need to refer to a large number of old documents and extract what you need from them. In addition, some of Nix's current core functions are not well-documented (such as `imports` and Nix Module System), to figure out what it does, it is best to look at the source code...
- ~~Relatively few packages~~: Retract this one. The official claim is that nixpkgs has [80000+](https://search.nixos.org/packages) packages, and indeed, most packages can be found in nixpkgs.
- **Relatively high disk space usage**: To ensure that the system can be rolled back at any time, Nix preserves all historical environments by default, which can take up a lot of disk space. Although you can manually clean up old historical environments periodically with `nix-collect-garbage`, it is still recommended to buy a larger hard drive.

### Summary

Generally speaking, I think NixOS is suitable for developers who have some experience in using Linux and programming and want to have more control over their systems.

I don't recommend you getting started with NixOS if you are new to Linux, it can be a very painful journey.
