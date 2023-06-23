## Run downloaded binaries on NixOS

NixOS does not follow the FHS standard, so the binaries you download from the Internet will not likely work on NixOS. But there are some ways to make it work.

Here is a detailed guide which provides 10 ways to run downloaded binaries on NixOS: [Different methods to run a non-nixos executable on Nixos](https://unix.stackexchange.com/questions/522822/different-methods-to-run-a-non-nixos-executable-on-nixos), I recommend you to read it.

Among these methods, I prefer creating a FHS environment to run the binary, which is very convenient and easy to use.

To create such an environment, add the following code to one of your nix modules:

```nix
{ config, pkgs, lib, ... }:

{
  # ......omit many configurations

  environment.systemPackages = with pkgs; [
    # ......omit many packages

    # create a fhs environment by command `fhs`, so we can run non-nixos packages in nixos!
    (pkgs.buildFHSUserEnv (base // {
      name = "fhs";
      targetPkgs = pkgs: (
        # pkgs.buildFHSUserEnv provides only a minimal fhs environment,
        # it lacks many basic packages needed by most softwares.
        # so we need to add them manually.
        #
        # pkgs.appimageTools provides basic packages needed by most softwares.
        (pkgs.appimageTools.defaultFhsEnvArgs.targetPkgs pkgs) ++ with pkgs; [
          pkg-config
          ncurses
          # feel free to add more packages here, if you need
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

after applying the updated configuration, you can run `fhs` to enter the FHS environment, and then run the binary you downloaded, e.g.

```shell
# Activating FHS drops me in a shell which looks like a "normal" Linux
$ fhs
# check what we have in /usr/bin
(fhs) $ ls /usr/bin
# try to run a non-nixos binary downloaded from the Internet
(fhs) $ ./bin/code
```

## References

- [Tips&Tricks for NixOS Desktop - NixOS Discourse][Tips&Tricks for NixOS Desktop - NixOS Discourse]: Just as the title says, it is a collection of tips and tricks for NixOS desktop.


[Tips&Tricks for NixOS Desktop - NixOS Discourse]: https://discourse.nixos.org/t/tips-tricks-for-nixos-desktop/28488