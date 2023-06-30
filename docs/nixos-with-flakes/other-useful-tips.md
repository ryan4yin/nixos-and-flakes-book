# Other useful Tips

## Manage the configuration with Git

NixOS configuration is just a set of text files, it is very suitable to be managed with Git, and thus we can easily rollback to a previous version when we encounter some problems.

However, NixOS places the configuration in `/etc/nixos` by default, which requires root permissions to modify, which is not convenient for daily use.
Luckily, Flakes can solve this problem, you can place your flake anywhere you like.

For example, my usage is to place my flake in `~/nixos-config`, and then create a soft link in `/etc/nixos`:

```shell
sudo mv /etc/nixos /etc/nixos.bak  # backup the original configuration
sudo ln -s ~/nixos-config/ /etc/nixos

# deploy the flake.nix located at the default location(/etc/nixos)
sudo nixos-rebuild switch
```

And then you can use Git to manage the configuration in `~/nixos-config`. The configuration can be used with ordinary user-level permissions, and it is not required to be owned by root.

Another method is jsut to delete `/etc/nixos` directly, and specify the configuration file path each time you deploy it:

```shell
sudo mv /etc/nixos /etc/nixos.bak
cd ~/nixos-config

# `--flake .#nixos-test` means deploy the flake.nix located in the current directory, and the nixosConfiguration's name is `nixos-test`
sudo nixos-rebuild switch --flake .#nixos-test
```

Choose whichever you like. After that, system rollback will become very simple, just switch to the previous commit and then deploy it:

```shell
cd ~/nixos-config
# switch to the previous commit
git checkout HEAD^1
# deploy the flake.nix located in the current directory, and the nixosConfiguration's name is `nixos-test`
sudo nixos-rebuild switch --flake .#nixos-test
```

More operations on Git are not described here. Generally speaking, rollback can be done directly through Git. Only when the system crashes completely, you will need to restart into bootloader and boot the system from the previous historical version.

## View and delete history data {#view-and-delete-history}

As we mentioned before, each deployment of NixOS will generate a new version, and all versions will be added to the system boot options. In addition to restarting the computer, we can also query all available historical versions through the following command:

```shell
nix profile history --profile /nix/var/nix/profiles/system
```

The command to clean up historical versions to release storage space:

```shell
# delete all historical versions older than 7 days
sudo nix profile wipe-history --profile /nix/var/nix/profiles/system  --older-than 7d

# we need to collect garbages after wipe-history
sudo nix store gc --debug
```

Another command returns all packages installed in the system:

```shell
nix-env -qa
```

## Reduce Disk Usage

The following configuration can be used to reduce disk usage, feel free to add it into your NixOS Configuration.

```nix
{ lib, pkgs, ... }:

{
  # ......

  # do not need to keep too much generations
  boot.loader.systemd-boot.configurationLimit = 10;
  # boot.loader.grub.configurationLimit = 10;

  # do garbage collection weekly to keep disk usage low
  nix.gc = {
    automatic = true;
    dates = "weekly";
    options = "--delete-older-than 1w";
  };

  # Optimise storage
  # you can alse optimise the store manually via:
  #    nix-store --optimise
  # https://nixos.org/manual/nix/stable/command-ref/conf-file.html#conf-auto-optimise-store
  nix.settings.auto-optimise-store = true;
}
```
