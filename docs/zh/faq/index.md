# 常见问题 FAQ

## NixOS 的回滚能力与 btrfs / zfs 系统快照回滚有何不同？

很多使用 Arch Linux / Ubuntu 等常规 Linux 发行版的用户，习惯于使用 btrfs /
zfs 等文件系统提供的快照作为「后悔药」，这样系统出了问题能回滚修复。而本书介绍的 NixOS 也提供了系统状态回滚能力，因此很容易会有这样的疑问：这两种系统回滚功能有何不同？

这里简单解释下，主要区别在于，快照内容不包含如何从零构建这个快照的「知识」，是**不可解释的**，而且其内容与当前硬件环境强相关，很难在其他机器上复现。

而 NixOS 的配置是一份从零构建出一个一模一样的 OS 的「知识」，是**可解释的**，而且可以通过简单几行命令就自动完成这个构建。NixOS 配置本身既是一份记录你的 NixOS 系统都做过哪些变更的文档，也可直接用于自动构建出你当前的 NixOS 系统。

NixOS 的配置文件就像是程序的**源代码**，只要源代码没丢，修改程序、审查程序，或者重新构建出一个一模一样的程序都很简单。而系统快照就像是源代码编译出来的二进制程序，要对它做修改、审查，都要难得多。而且这个快照很大，分享或者迁移它的成本都要比源代码高得多。

但这并不是说有了 NixOS 就不需要系统快照了，本书第一章就介绍了 NixOS 只能保证在声明式配置中声明的所有内容都是可复现的，而其他未声明式配置覆盖到的系统状态是不受它管辖的。比如 MySQL/PostgreSQL 的动态数据、用户上传的文件、系统日志等等，用户 Home 目录下的视频、音乐、图片等等，这些内容都还是需要文件系统快照或者其他手段来备份。

## Nix 与 Ansible 等传统的系统运维工具相比有何优劣？

Nix 不仅可用于管理桌面电脑的环境，也有很多人用它批量管理云服务器，Nix 官方的
[NixOps](https://github.com/NixOS/nixops) 与社区的
[colmena](https://github.com/zhaofengli/colmena) 都是专为这个场景开发的工具。

Nix 与 Ansible 这类被广泛应用的传统工具比，主要优势就在：

1. Ansible 这类工具一个最大的问题就是，它每次部署都是基于系统当前状态的增量修改。而系统的当前状态就如同前面提到的系统快照，是不可解释的，也很难复现。而 NixOS 是通过配置文件声明系统的目标状态，可以做到部署结果与系统当前状态无关，重复部署也不会导致任何问题。
2. Nix Flakes 通过一个版本锁文件 `flake.lock`
   锁定了所有依赖的 hash 值、版本号、数据源等信息，这极大地提升了系统的可复现能力。而传统的 Ansible 等工具没有此功能，所以它们的可复现能力很差。
   1. 这也是为什么 Docker 这么受欢迎的原因——它以较低的代价提供了 Ansible 等传统运维工具提供不了的**可在各种机器上复现的系统环境**。
3. Nix 通过一层声明式的抽象屏蔽了其底层的实现细节，使用户只需要关心自己最核心的需求，从而带来了高度便捷的系统自定义能力。而 Ansible 这类工具的抽象能力要弱得多。
   1. 如果你有使用过 terraform/kubernetes 等声明式配置工具，应该很容易理解这一点。需求越是复杂的情况下，声明式配置带来的好处就越大。

## Nix 与 Docker 容器技术相比有何优势？

Nix 与以 Docker 为代表的容器技术的应用场景也存在一定重合，比如说：

1. 有很多人用 Nix 来管理开发编译环境，本书就对此做过介绍。但另一方面也有像
   [Dev Containers](https://github.com/devcontainers/spec)
   这种基于容器搭建开发环境的技术，而且非常流行。
2. 目前整个 DevOps/SRE 领域基本已经是基于 Dockerfile 的容器技术的天下，容器中常用 Ubuntu/Debian 等发行版，宿主机也同样有很多成熟的发行版可选，改用 NixOS 有什么明显的优势呢？

其中第一点「管理开发编译环境」，Nix 创建的开发环境体验非常接近直接在宿主机进行开发，这要比 Dev
Containers 好很多，举例如下：

1. Nix 不使用名字空间进行文件系统、网络环境等各方面的隔离，在 Nix 创建的开发环境中也可以很方便地与宿主机文件系统（包括 /dev 宿主机外接设备）、网络环境等等进行交互。而容器要通过各种映射才能宿主机文件系统互通，即使这样也可能会遇到一些文件权限问题。
2. 因为没做啥强隔离，Nix 开发环境对 GUI 程序的支持也没任何问题，在这个环境中跑个 GUI 程序的体验就跟在系统环境中跑个 GUI 程序没任何区别。

也就是说，Nix 能提供最接近宿主机的开发体验，不存在什么强隔离，开发人员能在这个环境中使用各种熟悉的开发调试工具，过往的开发经验基本都能无痛迁移过来。而如果使用 Dev
Containers，那开发人员很可能会遭遇强隔离导致的各种文件系统不互通、网络环境问题、用户权限问题、无法使用 GUI 调试工具等等各种毛病。

而如果我们决定了使用 Nix 来管理所有的开发环境，那么在构建 Docker 容器时也基于 Nix 去构建，显然能提供最强的一致性，同时所有环境都统一了技术架构，这也能明显降低整个基础设施的维护成本。这就回答了前面提到的第二点，在使用 Nix 管理开发环境的前提下，容器基础镜像与云服务器都使用 NixOS 会存在明显的优势。

## error: collision between `...` and `...`

当你尝试在同一个 profile 中安装两个依赖于同一个库但版本不同的包时，就会出现这个错误。

比如说，如果你有如下配置：

```nix
{
   # as a nixos module
   # environment.systemPackages = with pkgs; [
   #
   # or as a home manager module
   home.packages = with pkgs; [
     lldb

     (python311.withPackages (ps:
       with ps; [
         ipython
         pandas
         requests
         pyquery
         pyyaml
       ]
     ))
   ];
}
```

部署这份配置时，就会出现如下错误：

```bash
error: builder for '/nix/store/n3scj3s7v9jsb6y3v0fhndw35a9hdbs6-home-manager-path.drv' failed with exit code 25;
       last 1 log lines:
       > error: collision between `/nix/store/kvq0gvz6jwggarrcn9a8ramsfhyh1h9d-lldb-14.0.6/lib/python3.11/site-packages/six.py'
and `/nix/store/370s8inz4fc9k9lqk4qzj5vyr60q166w-python3-3.11.6-env/lib/python3.11/site-packages/six.py'
       For full logs, run 'nix log /nix/store/n3scj3s7v9jsb6y3v0fhndw35a9hdbs6-home-manager-path.drv'.
```

解决方法如下：

1. 将两个包拆分到两个不同的 **profiles** 中。比如说，你可以通过
   `environment.systemPackages` 安装 `lldb`，通过 `home.packages` 安装 `python311`。
2. 不同版本的 Python3 被视为不同的包，所以你可以将你的自定义 Python3 版本改为 `python310`
   以避免冲突。
3. 使用 `override` 来覆盖包使用的库的版本，使其与另一个包使用的版本一致。

```nix
{
  # as a nixos module
  # environment.systemPackages = with pkgs; [
  #
  # or as a home manager module
  home.packages = let
    custom-python3 = (pkgs.python311.withPackages (ps:
      with ps; [
        ipython
        pandas
        requests
        pyquery
        pyyaml
      ]
    ));
  in
    with pkgs; [
      # override the version of python3
      # NOTE: This will trigger a rebuild of lldb, it takes time
      (lldb.override {
        python3 = custom-python3;
      })

      custom-python3
  ];
}
```
