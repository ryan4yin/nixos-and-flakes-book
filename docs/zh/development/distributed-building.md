# 分布式构建

分布式构建可以通过多台机器来分担本地的编译压力，加快构建速度。

NixOS 官方的 cache.nixos.org 中提供了绝大多数 X86_64 架构的缓存，因此对于普通 X86_64 的用户，一般不需要分布式构建。

分布式构建只在没有缓存可用的场景下才有较大应用价值，主要有这几种应用场景：

1. RISC-V 或 ARM64 架构的用户（尤其是 RISC-V），因为官方缓存仓库中这两个架构的缓存很少，导致经常需要大量本地编译。
2. 对系统进行大量定制的用户，因为官方缓存仓库中的 packages 都是默认配置，如果你改了构建参数，那么官方缓存就不适用了，这时候就需要本地编译。
   1. 比如嵌入式场景下往往对底层内核、驱动等有定制需求，导致需要本地编译。

## 配置分布式构建

官方没有详细文档讲这个，我在文末列出了一些建议阅读的参考文档，同时如下是我的分布式构建配置（一个NixOS
Module）：

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

## 缺陷

目前我观察到的问题有：

1. 无法在构建时指定使用哪些主机，只能在配置文件中指定一个主机列表，然后 nix 会自动选择可用的主机。
2. 在选择主机时，我发现 Nix 总是优先选择远程主机，而我本地主机的性能最强，这导致本地主机的 CPU 无法充分利用。
3. 多机远程构建是以 Derivation 为单位的，因此在构建一些比较大的包时，其他机器可能会空闲很久，一直等这个大包构建完毕，这导致了资源的浪费。
   1. 在构建的 packages 较多并且可以并行执行时，可以轻松将所有主机的 CPU 都用上，这确实非常爽。

## References

- [Distributed build - NixOS Wiki](https://wiki.nixos.org/wiki/Distributed_build)
- [Document available system features - nix#7380](https://github.com/NixOS/nix/issues/7380)
- [Distributed builds seem to disable local builds nix#2589](https://github.com/NixOS/nix/issues/2589)
- [Offloading NixOS builds to a faster machine](https://sgt.hootr.club/molten-matter/nix-distributed-builds/)
- [tests/nixos/remote-builds.nix - Nix Source Code](https://github.com/NixOS/nix/blob/713836112/tests/nixos/remote-builds.nix#L46)
