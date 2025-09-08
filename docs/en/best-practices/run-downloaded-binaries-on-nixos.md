# Running Downloaded Binaries on NixOS

Since NixOS does not strictly adhere to the Filesystem Hierarchy Standard (FHS), binaries
downloaded from the internet may not work directly on NixOS. However, there are various
methods available to make them function properly.

For a comprehensive guide that presents ten different approaches to run downloaded
binaries on NixOS, I recommend reading the article
[Different methods to run a non-nixos executable on Nixos](https://unix.stackexchange.com/questions/522822/different-methods-to-run-a-non-nixos-executable-on-nixos)
and take a look at [nix-alien](https://github.com/thiagokokada/nix-alien). Or if you are
familiar with Docker, running the binary in a Docker container is also a good choice.

Among these methods, I personally prefer creating an FHS environment to run the binary, as
it proves to be both convenient and easy to use. To set up such an environment, you can
add the following code to one of your Nix modules:

```nix
{ config, pkgs, lib, ... }:

{
  # ......omit many configurations

  environment.systemPackages = with pkgs; [
    # ......omit many packages

    # Create an FHS environment using the command `fhs`, enabling the execution of non-NixOS packages in NixOS!
    (let base = pkgs.appimageTools.defaultFhsEnvArgs; in
      pkgs.buildFHSUserEnv (base // {
      name = "fhs";
      targetPkgs = pkgs:
        # pkgs.buildFHSUserEnv provides only a minimal FHS environment,
        # lacking many basic packages needed by most software.
        # Therefore, we need to add them manually.
        #
        # pkgs.appimageTools provides basic packages required by most software.
        (base.targetPkgs pkgs) ++ (with pkgs; [
          pkg-config
          ncurses
          # Feel free to add more packages here if needed.
        ]
      );
      profile = "export FHS=1";
      runScript = "bash";
      extraOutputsToInstall = ["dev"];
    }))
  ];

  # ......omit many configurations
}
```

After applying the updated configuration, you can use the `fhs` command to enter the FHS
environment, and then execute the binary you downloaded, for example:

```shell
# Activating FHS drops me into a shell that resembles a "normal" Linux environment.
$ fhs
# Check what we have in /usr/bin.
(fhs) $ ls /usr/bin
# Try running a non-NixOS binary downloaded from the Internet.
(fhs) $ ./bin/code
```

## References

- [Tips&Tricks for NixOS Desktop - NixOS
  Discourse][Tips&Tricks for NixOS Desktop - NixOS Discourse]: This resource provides a
  collection of useful tips and tricks for NixOS desktop users.
- [nix-alien](https://github.com/thiagokokada/nix-alien): Run unpatched binaries on
  Nix/NixOS
- [nix-ld](https://github.com/Mic92/nix-ld): Run unpatched dynamic binaries on NixOS.
- [NixOS: Packaging Closed Source Software (& Binary Distributed Ones) - Lan Tian @ Blog](https://lantian.pub/en/article/modify-computer/nixos-packaging.lantian/#examples-closed-source-software--binary-distributed-ones)

[Tips&Tricks for NixOS Desktop - NixOS Discourse]:
  https://discourse.nixos.org/t/tips-tricks-for-nixos-desktop/28488
