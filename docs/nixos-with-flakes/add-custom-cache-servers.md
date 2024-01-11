# Adding Custom Cache Servers {#add-custom-cache-servers}

## What is Nix Cache Server {#what-is-nix-cache-server}

Nix provides an official cache server, [https://cache.nixos.org](https://cache.nixos.org), which caches build results for all packages in nixpkgs under commonly used CPU architectures. When you execute Nix build commands locally, if Nix finds a corresponding cache on the server, it directly downloads the cached file, skipping the time-consuming local build process and significantly improving build speed.

## Why Add Custom Cache Servers {#why-add-custom-cache-servers}

> Note: The methods introduced here can only accelerate the download of packages; many `inputs` data sources will still be fetched from GitHub. Also, if the cache is not found, local builds will be executed, which typically requires downloading source code and building dependencies from GitHub or somewhere else, may making it slow. To completely address the speed issue, it is still recommended to use solutions such as a local global proxy like a bypass route.

Two reasons:

2. Add cache servers for some third-party projects, such as the nix-community cache server [https://nix-community.cachix.org](https://nix-community.cachix.org), which can significantly improve the build speed of these third-party projects.
1. Adding a mirrored cache server to accelerate downloads.
   1. The access speed of the official cache server in China is slow. Without a local global proxy, it is almost unusable. Adding Chinese Nix cache mirrors like ustc/sjtu/tuna can alleviate this issue.
 
How to Add Custom Cache Servers {#how-to-add-custom-cache-servers}

In Nix, you can configure cache servers using the following options:

1. [substituters](https://nixos.org/manual/nix/stable/command-ref/conf-file#conf-substituters): It is a string list, and each string is the address of a cache server. Nix will attempt to find caches from these servers in the order specified in the list.
2. [trusted-public-keys](https://nixos.org/manual/nix/stable/command-ref/conf-file#conf-trusted-public-keys): To prevent malicious attacks, The [require-sigs](https://nixos.org/manual/nix/stable/command-ref/conf-file#conf-require-sigs) option is enabled by default. Only caches with signatures that can be verified by any public key in `trusted-public-keys` will be used by Nix. Therefore, you need to add the public key corresponding to the `substituters` in `trusted-public-keys`.
   1. cache mirror's data are directly synchronized from the official cache server. Therefore, their public keys are the same as those of the official cache server, and you can use the public key of the official cache server without additional configuration.
   2. This entirely trust-based public key verification mechanism transfers the security responsibility to users. If users want to use a third-party cache server to speed up the build process of a certain library, they must take on the corresponding security risks and decide whether to add the public key of that cache server to `trusted-public-keys`. To completely solve this trust issue, Nix has introduced the experimental feature [ca-derivations](https://nixos.wiki/wiki/Ca-derivations), which does not depend on `trusted-public-keys` for signature verification. Interested users can explore it further.

You can configure the `substituers` and `trusted-public-keys` parameters in the following ways:

1. Configure in `/etc/nix/nix.conf`, a global configuration that affects all users.
   1. You can use `nix.settings.substituers` and `nix.settings.trusted-public-keys` in any NixOS Module to declaratively generate `/etc/nix/nix.conf`.
2. Configure in the `flake.nix` of a flake project using `nixConfig.substituers`. This configuration only affects the current flake.
3. Temporarily set through the `--option` parameter of the `nix` command, and this configuration only applies to the current command.

Among these three methods, except for the first global configuration, the other two are temporary configurations. If multiple methods are used simultaneously, later configurations will directly override earlier ones.

However, there are security risks in temporarily setting `substituers`, as explained earlier regarding the deficiencies of the security verification mechanism based on `trusted-public-keys`. To set `substituers` through the second and third methods, you need to meet one of the following conditions:

1. The current user is included in the [`trusted-users`](https://nixos.org/manual/nix/stable/command-ref/conf-file#conf-trusted-users) parameter list in `/etc/nix/nix.conf`.
2. The `substituers` specified temporarily via `--option substituers "http://xxx"` are included in the [`trusted-substituters`](https://nixos.org/manual/nix/stable/command-ref/conf-file#conf-trusted-substituters) parameter list in `/etc/nix/nix.conf`.

Based on the above information, the following are examples of the three configuration methods mentioned earlier.

Firstly, declaratively configure system-level `substituers` and `trusted-public-keys` using `nix.settings` in `/etc/nixos/configuration.nix` or any NixOS Module:

```nix{7-27}
{
  lib,
  ...
}: {

  # ...
  nix.settings = {
    # given the users in this list the right to specify additional substituters via:
    #    1. `nixConfig.substituers` in `flake.nix`
    #    2. command line args `--options substituers http://xxx`
    trusted-users = ["ryan"];

    substituters = [
      # cache mirror located in China
      # status: https://mirror.sjtu.edu.cn/
      "https://mirror.sjtu.edu.cn/nix-channels/store"
      # status: https://mirrors.ustc.edu.cn/status/
      # "https://mirrors.ustc.edu.cn/nix-channels/store"

      "https://cache.nixos.org"
    ];

    trusted-public-keys = [
      # the default public key of cache.nixos.org, it's built-in, no need to add it here
      "cache.nixos.org-1:6NCHdD59X431o0gWypbMrAURkbJ16ZPMQFGspcDShjY="
    ];
  };

}
```

The second method is to configure `substituers` and `trusted-public-keys` using `nixConfig` in `flake.nix`:

> As mentioned earlier, it is essential to configure `nix.settings.trusted-users` in this configuration. Otherwise, the `substituers` we set here will not take effect.

```nix{5-23,43-47}
{
  description = "NixOS configuration of Ryan Yin";

  # the nixConfig here only affects the flake itself, not the system configuration!
  nixConfig = {
    # override the default substituters
    substituters = [
      # cache mirror located in China
      # status: https://mirror.sjtu.edu.cn/
      "https://mirror.sjtu.edu.cn/nix-channels/store"
      # status: https://mirrors.ustc.edu.cn/status/
      # "https://mirrors.ustc.edu.cn/nix-channels/store"

      "https://cache.nixos.org"

      # nix community's cache server
      "https://nix-community.cachix.org"
    ];
    trusted-public-keys = [
      # nix community's cache server public key
      "nix-community.cachix.org-1:mB9FSh9qf2dCimDSUo8Zy7bkq5CX+/rkCWyvRCYg3Fs="
    ];
  };

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-23.11";

    # omitting several configurations...
  };

  outputs = inputs@{
      self,
      nixpkgs,
      ...
  }: {
    nixosConfigurations = {
      ai = nixpkgs.lib.nixosSystem {
        system = "x86_64-linux";
        modules = [
          ./hardware-configuration.nix
          ./configuration.nix

          {
            # given the users in this list the right to specify additional substituters via:
            #    1. `nixConfig.substituers` in `flake.nix`
            nix.settings.trusted-users = [ "ryan" ];
          }
          # omitting several configurations...
       ];
      };
    };
  };
}
```

Finally, the third method involves using the following command to temporarily specify `substituers` and `trusted-public-keys` during deployment:

```bash
sudo nixos-rebuild switch --option substituers "https://nix-community.cachix.org" --option trusted-public-keys "nix-community.cachix.org-1:mB9FSh9qf2dCimDSUo8Zy7bkq5CX+/rkCWyvRCYg3Fs="
```

Choose one of the above three methods for configuration and deployment. After a successful deployment, all subsequent packages will preferentially search for caches from domestic mirror sources.

> If your system hostname is not `nixos-test`, you need to modify the name of `nixosConfigurations` in `flake.nix` or use `--flake /etc/nixos#nixos-test` to specify the configuration name.

### The `extra-` Prefix for Nix Options Parameters

As mentioned earlier, the `substituers` configured by the three methods will override each other, but the ideal situation should be:

1. At the system level in `/etc/nix/nix.conf`, configure only the most generic `substituers` and `trusted-public-keys`, such as official cache servers and domestic mirror sources.
2. In each flake project's `flake.nix`, configure the `substituers` and `trusted-public-keys` specific to that project, such as non-official cache servers like nix-community.
3. When building a flake project, nix should **merge** the `substituers` and `trusted-public-keys` configured in `flake.nix` and `/etc/nix/nix.conf`.

Nix provides the [`extra-` prefix](https://nixos.org/manual/nix/stable/command-ref/conf-file.html?highlight=extra#file-format) to achieve this **merging** functionality.

According to the official documentation, if the value of the `xxx` parameter is a list, the value of `extra-xxx` will be appended to the end of the `xxx` parameter:

In other words, you can use it like this:

```nix{7,13,37-58}
{
  description = "NixOS configuration of Ryan Yin";

  # the nixConfig here only affects the flake itself, not the system configuration!
  nixConfig = {
    # will be appended to the system-level substituters
    extra-substituters = [
      # nix community's cache server
      "https://nix-community.cachix.org"
    ];

    # will be appended to the system-level trusted-public-keys
    extra-trusted-public-keys = [
      # nix community's cache server public key
      "nix-community.cachix.org-1:mB9FSh9qf2dCimDSUo8Zy7bkq5CX+/rkCWyvRCYg3Fs="
    ];
  };

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-23.11";

    # omitting several configurations...
  };

  outputs = inputs@{
      self,
      nixpkgs,
      ...
  }: {
    nixosConfigurations = {
      ai = nixpkgs.lib.nixosSystem {
        system = "x86_64-linux";
        modules = [
          ./hardware-configuration.nix
          ./configuration.nix

          {
            # given the users in this list the right to specify additional substituters via:
            #    1. `nixConfig.substituers` in `flake.nix`
            nix.settings.trusted-users = [ "ryan" ];

            # the system-level substituers & trusted-public-keys
            nix.settings = {
              substituters = [
                # cache mirror located in China
                # status: https://mirror.sjtu.edu.cn/
                "https://mirror.sjtu.edu.cn/nix-channels/store"
                # status: https://mirrors.ustc.edu.cn/status/
                # "https://mirrors.ustc.edu.cn/nix-channels/store"
          
                "https://cache.nixos.org"
              ];
          
              trusted-public-keys = [
                # the default public key of cache.nixos.org, it's built-in, no need to add it here
                "cache.nixos.org-1:6NCHdD59X431o0gWypbMrAURkbJ16ZPMQFGspcDShjY="
              ];
            };

          }
          # omitting several configurations...
       ];
      };
    };
  };
}
```
## Using Local HTTP Proxy to Accelerate Package Downloads {#use-local-http-proxy-to-speed-up-nix-package-download}

While it has been mentioned earlier that a bypass route can completely solve the NixOS package download speed issue, configuring a bypass route is relatively cumbersome and often requires additional support from a software routing device.

Many users may prefer to directly accelerate package downloads through a locally running HTTP proxy. Here's how to set it up.

Directly using methods like `export HTTPS_PROXY=http://127.0.0.1:7890` in the terminal won't be effective because Nix does its work in a background process called `nix-daemon`, not directly in the terminal.

To enable `nix-daemon` to use a proxy, you need to modify its systemd configuration. Here's how:

```bash
sudo mkdir /run/systemd/system/nix-daemon.service.d/
cat << EOF >/run/systemd/system/nix-daemon.service.d/override.conf
[Service]
Environment="http_proxy=socks5h://localhost:7891"
Environment="https_proxy=socks5h://localhost:7891"
Environment="all_proxy=socks5h://localhost:7891"
EOF
sudo systemctl daemon-reload
sudo systemctl restart nix-daemon
```

Using this approach, you might need to execute the above commands every time the system is restarted because the `/run` directory is a temporary file system that gets cleared upon a restart.

## Reference

- [Roaming Laptop: Network Proxy Configuration - NixOS/nixpkgs](https://github.com/NixOS/nixpkgs/issues/27535#issuecomment-1178444327)
