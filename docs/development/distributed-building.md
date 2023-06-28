## Distributed Building

Distributed building can speed up the build process by utilizing multiple machines.

For ordinary NixOS users, distributed building is generally not very useful because NixOS's official `cache.nixos.org` provides the vast majority of caches for the `x86_64` architecture.

Distributed building is of great value in scenarios where there is no cache available, such as:

1. Users of `RISC-V` or `ARM64` architectures (especially `RISC-V`), because there are very few caches for these two architectures in the official cache repository, which often requires a lot of local compilation.
2. Users who customize the system a lot, because the packages in the official cache repository are all default configurations. If you change the build parameters, then the official cache is not applicable, and you need to compile locally. For instance, in the embedded scenario, there is often a need for customization of the underlying kernel, drivers, etc., which leads to the need for local compilation.

### Configure Distributed Building

Currently, there is no official documentation for distributed building. However, I have listed some recommended reference documents at the end of this chapter, along with my distributed build configuration (a NixOS Module).

```nix
{ ... }: {

  ####################################################################
  #
  #  NixOS's Configuration for Remote Building / Distributed Building
  #
  ####################################################################

  # set local's max-job to 0 to force remote building(disable local building)
  # nix.settings.max-jobs = 0;
  nix.distributedBuilds = true;
  nix.buildMachines =
    let
      sshUser = "ryan";
      # ssh key's path on local machine
      sshKey = "/home/ryan/.ssh/ai-idols";
      systems = [
        # native arch
        "x86_64-linux"

        # emulated arch using binfmt_misc and qemu-user
        "aarch64-linux"
        "riscv64-linux"
      ];
      # all available system features are poorly documentd here:
      #  https://github.com/NixOS/nix/blob/e503ead/src/libstore/globals.hh#L673-L687
      supportedFeatures = [
        "benchmark"
        "big-parallel"
        "kvm"
      ];
    in
      [
        # Nix seems always give priority to trying to build remotely
        # to make use of the local machine's high-performance CPU, do not set remote builder's maxJobs too high.
        {
          # some of my remote builders are running NixOS
          # and has the same sshUser, sshKey, systems, etc.
          inherit sshUser sshKey systems supportedFeatures;

          # the hostName should be:
          #   1. a hostname that can be resolved by DNS
          #   2. the ip address of the remote builder
          #   3. a host alias defined globally in /etc/ssh/ssh_config
          hostName = "aquamarine";
          # remote builder's max-job
          maxJobs = 3;
          # speedFactor's a signed integer
          # but it seems that it's not used by Nix, takes no effect
          speedFactor = 1;
        }
        {
          inherit sshUser sshKey systems supportedFeatures;
          hostName = "ruby";
          maxJobs = 2;
          speedFactor = 1;
        }
        {
          inherit sshUser sshKey systems supportedFeatures;
          hostName = "kana";
          maxJobs = 2;
          speedFactor = 1;
        }
      ];
  # optional, useful when the builder has a faster internet connection than yours
	nix.extraOptions = ''
		builders-use-substitutes = true
	'';

  # define the host alias for remote builders
  # this config will be written to /etc/ssh/ssh_config
  programs.ssh.extraConfig = ''
    Host ai
      HostName 192.168.5.100
      Port 22

    Host aquamarine
      HostName 192.168.5.101
      Port 22

    Host ruby
      HostName 192.168.5.102
      Port 22

    Host kana
      HostName 192.168.5.103
      Port 22
  '';

  # define the host key for remote builders so that nix can verify all the remote builders
  # this config will be written to /etc/ssh/ssh_known_hosts
  programs.ssh.knownHosts = {
    # 星野 愛久愛海, Hoshino Aquamarine
    aquamarine = {
      hostNames = [ "aquamarine" "192.168.5.101" ];
      publicKey = "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIDnCQXlllHoLX5EvU+t6yP/npsmuxKt0skHVeJashizE";
    };

    # 星野 瑠美衣, Hoshino Rubii
    ruby = {
      hostNames = [ "ruby" "192.168.5.102" ];
      publicKey = "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIE7n11XxB8B3HjdyAsL3PuLVDZxWCzEOUTJAY8+goQmW";
    };

    # 有馬 かな, Arima Kana
    kana = {
      hostNames = [ "kana" "192.168.5.103" ];
      publicKey = "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIJ3dDLOZERP1nZfRz3zIeVDm1q2Trer+fWFVvVXrgXM1";
    };
  };
}
```

## Defects

The problems I have observed so far are:

1. You cannot specify which hosts to use at build time, you can only specify a list of hosts in the configuration file, and nix automatically selects available hosts.
   two。
2. When choosing a host, I found that Nix always preferred the remote host, while my local host had the best performance, which caused the local host's CPU to be underutilized.
3. The smallest unit of distributed building is Derivation, so when building some big packages, other machines may be idle for a long time, waiting for the big package to be built, which leads to a waste of resources.

## References

- [Distributed build - NixOS Wiki](https://nixos.wiki/wiki/Distributed_build)
- [Document available system features - nix#7380](https://github.com/NixOS/nix/issues/7380)
- [Distributed builds seem to disable local builds nix#2589](https://github.com/NixOS/nix/issues/2589)
- [Offloading NixOS builds to a faster machine](https://sgt.hootr.club/molten-matter/nix-distributed-builds/)
- [tests/nixos/remote-builds.nix - Nix Source Code](https://github.com/NixOS/nix/blob/713836112/tests/nixos/remote-builds.nix#L46)
