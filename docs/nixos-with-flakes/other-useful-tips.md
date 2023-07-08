# Other Useful Tips

## Managing the Configuration with Git

NixOS configuration, being a set of text files, is well-suited for version control with Git. This allows easy rollback to a previous version in case of issues.

However, by default, NixOS places the configuration in `/etc/nixos`, which requires root permissions for modification, making it inconvenient for daily use. Thankfully, Flakes can help solve this problem by allowing you to place your flake anywhere you prefer.

For example, you can place your flake in `~/nixos-config` and create a symbolic link in `/etc/nixos` as follows:

```shell
sudo mv /etc/nixos /etc/nixos.bak  # Backup the original configuration
sudo ln -s ~/nixos-config/ /etc/nixos

# Deploy the flake.nix located at the default location (/etc/nixos)
sudo nixos-rebuild switch
```

This way, you can use Git to manage the configuration in `~/nixos-config`. The configuration can be modified with regular user-level permissions and does not require root ownership.

Another approach is to delete `/etc/nixos` directly and specify the configuration file path each time you deploy it:

```shell
sudo mv /etc/nixos /etc/nixos.bak
cd ~/nixos-config

# `--flake .#nixos-test` deploys the flake.nix located in
# the current directory, and the nixosConfiguration's name is `nixos-test`
sudo nixos-rebuild switch --flake .#nixos-test
```

Choose the method that suits you best. Afterward, system rollback becomes simple. Just switch to the previous commit and deploy it:

```shell
cd ~/nixos-config
# Switch to the previous commit
git checkout HEAD^1
# Deploy the flake.nix located in the current directory,
# with the nixosConfiguration's name `nixos-test`
sudo nixos-rebuild switch --flake .#nixos-test
```

More advanced Git operations are not covered here, but in general, rollback can be performed directly using Git. Only in cases of complete system crashes would you need to restart into the bootloader and boot the system from a previous historical version.

## Viewing and Deleting Historical Data

As mentioned earlier, each NixOS deployment creates a new version, and all versions are added to the system's boot options. In addition to restarting the computer, you can query all available historical versions using the following command:

```shell
nix profile history --profile /nix/var/nix/profiles/system
```

To clean up historical versions and free up storage space, use the following command:

```shell
# Delete all historical versions older than 7 days
sudo nix profile wipe-history --older-than 7d --profile /nix/var/nix/profiles/system

# Run garbage collection after wiping history
sudo nix store gc --debug
```

Another command that returns all packages installed in the system is:

```shell
nix-env -qa
```

## Reducing Disk Usage

The following configuration can be added to your NixOS configuration to help reduce disk usage:

```nix
{ lib, pkgs, ... }:

{
  # ...

  # Limit the number of generations to keep
  boot.loader.systemd-boot.configurationLimit = 10;
  # boot.loader.grub.configurationLimit = 10;

  # Perform garbage collection weekly to maintain low disk usage
  nix.gc = {
    automatic = true;
    dates = "weekly";
    options = "--delete-older-than 1w";
 };

  # Optimize storage
  # You can also manually optimize the store via:
  #    nix-store --optimise
  # Refer to the following link for more details:
  # https://nixos.org/manual/nix/stable/command-ref/conf-file.html#conf-auto-optimise-store
  nix.settings.auto-optimise-store = true;
}
```

By incorporating this configuration, you can better manage and optimize the disk usage of your NixOS system.
