# Nix Store 与二进制缓存

这里我们先简单介绍下 Nix
Store、Nix 二进制缓存以及其他相关概念，但不涉及具体的配置与使用方法，这些内容会在后续章节中详细介绍。

## Nix Store

Nix
Store 是 Nix 包管理器的核心概念之一，它是一个只读文件系统，用于存储所有需要不可变这一特性的文件，包括软件包的构建结果、软件包的元数据、软件包的所有构建输入等等。

Nix 包管理器使用 Nix 函数式语言来描述软件包及其依赖关系，每个软件包都被视为一个纯函数的输出，软件包的构建结果被保存在 Nix
Store 中。

Nix Store 中的数据具有固定的路径格式：

```
/nix/store/b6gvzjyb2pg0kjfwrjmg1vfhh54ad73z-firefox-33.1
|--------| |------------------------------| |----------|
store directory         digest                  name
```

可以看到，Nix
Store 中的路径以一个哈希值（digest）为前缀，后面跟着软件包的名称和版本号。这个哈希值是基于软件包的所有输入信息（构建参数、依赖关系、依赖版本等等）计算出来的，任何构建参数或依赖关系的变化都会导致哈希值的变化，从而保证了每个软件包路径的唯一性。再加上 Nix
Store 是一个只读文件系统，这就保证了软件包的不可变性，即软件包一旦构建完成，就不会再发生变化。

因为构建结果的存储路径是基于构建流程的所有输入信息计算出来的，**同样的输入信息会得到同样的存储路径**
这种设计也被称为输入寻址模型（_Input-addressed Model_）。

### NixOS 如何使用 Nix Store

NixOS 的声明式配置将会计算出哪些软件包需要被安装，然后将这些软件包在 Nix
Store 中的存储路径软链接到 `/run/current-system` 中，再通过修改 `PATH` 等环境变量指向
`/run/current-system`
中对应的文件夹，从而实现软件包的安装。每次部署时，NixOS 会计算出新的系统配置，清理掉旧的软链接，再重新创建新的软链接，从而确保系统环境与声明式配置一致。

home-manager 也是类似的，它会将用户配置的软件包软链接到
`/etc/profiles/per-user/your-username` 这个路径下，再通过修改 `PATH`
等环境变量指向这个路径，从而实现用户软件包的安装。

```bash
# 查看环境中的 bash 来自哪个路径（使用 NixOS 安装）
› which bash
╭───┬─────────┬─────────────────────────────────┬──────────╮
│ # │ command │              path               │   type   │
├───┼─────────┼─────────────────────────────────┼──────────┤
│ 0 │ bash    │ /run/current-system/sw/bin/bash │ external │
╰───┴─────────┴─────────────────────────────────┴──────────╯

› ls -al /run/current-system/sw/bin/bash
lrwxrwxrwx 15 root root 76 1970年 1月 1日 /run/current-system/sw/bin/bash -> /nix/store/1zslabm02hi75anb2w8zjrqwzgs0vrs3-bash-interactive-5.2p26/bin/bash

# 查看环境中的 cowsay 来自哪个路径（使用 home-manager 安装）
› which cowsay
╭───┬─────────┬────────────────────────────────────────┬──────────╮
│ # │ command │                  path                  │   type   │
├───┼─────────┼────────────────────────────────────────┼──────────┤
│ 0 │ cowsay  │ /etc/profiles/per-user/ryan/bin/cowsay │ external │
╰───┴─────────┴────────────────────────────────────────┴──────────╯

› ls -al /etc/profiles/per-user/ryan/bin/cowsay
lrwxrwxrwx 2 root root 72 1970年 1月 1日 /etc/profiles/per-user/ryan/bin/cowsay -> /nix/store/w2czyf82gxz4vy9kzsdhr88112bmc0c1-home-manager-path/bin/cowsay
```

而 `nix develop` 命令则是直接将软件包的存储路径添加到 `PATH` `LD_LIBRARY_PATH`
等环境变量中，使新创建的 shell 环境中可以直接使用这些软件包或库。

以本书的源码仓库
[ryan4yin/nixos-and-flakes-book](https://github.com/ryan4yin/nixos-and-flakes-book)
为例，在该仓库中执行 `nix develop` 命令，再查看下 `PATH` 环境变量的内容：

```bash
› nix develop
node v20.9.0

› env | egrep '^PATH'
PATH=/nix/store/h13fnmpm8m28qypsba2xysi8a90crphj-pre-commit-3.6.0/bin:/nix/store/2mqyvwp96d4jynsnzgacdk5rg1kx2a9a-node2nix-1.11.0/bin:/nix/store/a1hckfqzyys4rfgbdy5kmb5w0zdr55i5-nodejs-20.9.0/bin:/nix/store/gjrfcl2bhv7kbj883k7b18n2aprgv4rf-pnpm-8.10.2/bin:/nix/store/z6jfxqyj1wq62iv1gn5b5d9ms6qigkg0-yarn-1.22.19/bin:/nix/store/2k5irl2cfw5m37r3ibmpq4f7jndb41a8-prettier-3.0.3/bin:/nix/store/zrs710jpfn7ngy5z4c6rrwwjq33b2a0y-git-2.42.0/bin:/nix/store/dkmyyrkyl0racnhsaiyf7rxf43yxhx92-typos-1.16.23/bin:/nix/store/imli2in1nr1h8qh7zh62knygpl2zj66l-alejandra-3.0.0/bin:/nix/store/85jldj870vzcl72yz03labc93bwvqayx-patchelf-0.15.0/bin:/nix/store/90h6k8ylkgn81k10190v5c9ldyjpzgl9-gcc-wrapper-12.3.0/bin:/nix/store/hf2gy3km07d5m0p1lwmja0rg9wlnmyr7-gcc-12.3.0/bin:/nix/store/cx01qk0qyylvkgisbwc7d3pk8sliccgh-glibc-2.38-27-bin/bin:/nix/store/bblyj5b3ii8n6v4ra0nb37cmi3lf8rz9-coreutils-9.3/bin:/nix/store/1alqjnr40dsk7cl15l5sn5y2zdxidc1v-binutils-wrapper-2.40/bin:/nix/store/1fn92b0783crypjcxvdv6ycmvi27by0j-binutils-2.40/bin:/nix/store/bblyj5b3ii8n6v4ra0nb37cmi3lf8rz9-coreutils-9.3/bin:/nix/store/l974pi8a5yqjrjlzmg6apk0jwjv81yqw-findutils-4.9.0/bin:/nix/store/8q25nyfirzsng6p57yp8hsaldqqbc7dg-diffutils-3.10/bin:/nix/store/9c5qm297qnvwcf7j0gm01qrslbiqz8rs-gnused-4.9/bin:/nix/store/rx2wig5yhpbwhnqxdy4z7qivj9ln7fab-gnugrep-3.11/bin:/nix/store/7wfya2k95zib8jl0jk5hnbn856sqcgfk-gawk-5.2.2/bin:/nix/store/xpidksbd07in3nd4sjx79ybwwy81b338-gnutar-1.35/bin:/nix/store/202iqv4bd7lh6f7fpy48p7q4d96lqdp7-gzip-1.13/bin:/nix/store/ik7jardq92dxw3fnz3vmlcgi9c8dwwdq-bzip2-1.0.8-bin/bin:/nix/store/v4iswb5kwj33l46dyh2zqh0nkxxlr3mz-gnumake-4.4.1/bin:/nix/store/q1c2flcykgr4wwg5a6h450hxbk4ch589-bash-5.2-p15/bin:/nix/store/cbj1ph7zi009m53hxs90idl1f5i9i941-patch-2.7.6/bin:/nix/store/76z4cjs7jj45ixk12yy6k5z2q2djk2jb-xz-5.4.4-bin/bin:/nix/store/qmfxld7qhk8qxlkx1cm4bkplg1gh6jgj-file-5.45/bin:/home/ryan/.local/bin:/home/ryan/go/bin:/home/ryan/.config/emacs/bin:/home/ryan/.local/bin:/home/ryan/go/bin:/home/ryan/.config/emacs/bin:/nix/store/jsc6jydv5zjpb3dvh0lxw2dzxmv3im9l-kitty-0.32.1/bin:/nix/store/ihpdcszhj8bdmyr0ygvalqw9zagn0jjz-imagemagick-7.1.1-28/bin:/nix/store/2bm2yd5jqlwf6nghlyp7z88g28j9n8r0-ncurses-6.4-dev/bin:/run/wrappers/bin:/guix/current/bin:/home/ryan/.guix-home/profile/bin:/home/ryan/.guix-profile/bin:/home/ryan/.nix-profile/bin:/nix/profile/bin:/home/ryan/.local/state/nix/profile/bin:/etc/profiles/per-user/ryan/bin:/nix/var/nix/profiles/default/bin:/run/current-system/sw/bin:/nix/store/c53f8hagyblvx52zylsnqcc0b3nxbrcl-binutils-wrapper-2.40/bin:/nix/store/fpagbmzdplgky01grwhxcsazvhynv1nz-pciutils-3.10.0/bin:/nix/store/4cjqvbp1jbkps185wl8qnbjpf8bdy8j9-gcc-wrapper-13.2.0/bin
```

显然 `nix develop` 将很多软件包的存储路径直接添加到了 `PATH` 环境变量中。

## Nix Store 的垃圾回收

Nix
Store 是一个中心化的存储系统，所有的软件包构建输入跟输出都会被存储在这里。随着系统的使用，Nix
Store 中的软件包会越来越多，占用的磁盘空间也会越来越大。

为了避免 Nix Store 无限制地增长，Nix 包管理器为本地 Nix Store 提供了垃圾回收机制，用于清理
`/nix/store` 中的旧数据、回收存储空间。

根据
[Chapter 11. The Garbage Collector - nix pills](https://nixos.org/guides/nix-pills/garbage-collector)
的说法， `nix-store --gc` 命令会执行垃圾回收操作，它会递归遍历 `/nix/var/nix/gcroots/`
目录下的所有软链接，找出所有被引用的软件包，然后将不再被引用的软件包删除。而
`nix-collect-garbage --delete-old` 则更进一步，它会先删除掉所有旧的
[profiles](https://nixos.org/manual/nix/stable/command-ref/files/profiles)，再执行
`nix-store --gc` 命令清理掉不再被引用的软件包。

需要注意的是，`nix build`, `nix develop` 等命令的构建结果并不会被自动添加到
`/nix/var/nix/gcroots/` 目录中，所以这些构建结果会被垃圾回收机制清理掉。你可以通过
`nix-instantiate` 跟 `keep-outputs = true`
等手段来避免这种情况，但我目前觉得搭建一个自己的二进制缓存服务器，然后在你在缓存服务器上配置一个较长的缓存时间（比如一年），将数据推送到缓存服务器上，这样既可以在所有机器上共享构建结果，又可以避免本地构建结果被本地的垃圾回收机制清理掉，一举两得。

## 二进制缓存

Nix 包管理器与 Nix Store 的设计保证了软件包的不可变性，使得 Nix
Store 中的构建结果可以直接被在多台机器之间共享。只要这些机器使用了同样的输入信息构建软件包，它们就会得到相同的输出路径，Nix 则可以据此直接复用其他机器上的构建结果，而不需要重新构建软件包，从而提升软件包的安装速度。

Nix 二进制缓存就是基于这个特性而设计的，它实质也是 Nix
Store 的一个实现，只不过它不把数据存储在本地，而是存储在远程服务器上。需要使用的时候，Nix 包管理器会从远程服务器上下载对应的构建结果到本地的
`/nix/store` 中，避免耗时的本地构建。

Nix 提供了官方二进制缓存服务器
<https://cache.nixos.org>，它缓存了 nixpkgs 中绝大部分 packages 在常用 CPU 指令集下的构建结果。当你在本地执行 Nix 构建指令时，Nix 首先会尝试从缓存服务器中查找对应的二进制缓存，如果查找到了，就会直接下载该缓存文件，跳过耗时的本地编译构建从而大大提升构建速度。

## Nix 二进制缓存的信任模型

**Input-addressed Model**
**只保证同样的输入得到同样的输出路径，并不保证输出内容的唯一性**。也就是说即使输入信息相同，多次构建同一个软件包得到的输出内容也可能不同。

虽然 Nix 已经通过在构建环境中默认禁用网络、使用固定的时间戳等方式尽量减少不确定性，但软件包构建过程中仍然可能受到一些不可控因素的影响而产生不同的输出内容。这些不可控因素导致的输出内容不同通常不会对软件包的功能产生影响，但却给二进制缓存的安全共享带来了挑战——输出内容的不确定性使我们无法判断从缓存服务器中下载的二进制缓存是否真的是使用我们声明的输入信息构建的，是否包含恶意内容。

Nix 包管理器目前给出的解决方案是——使用公私钥签名机制来验证二进制缓存的数据来源与完整性。这种验证方式实际是将安全责任转嫁给了用户。用户如果希望使用某个非官方缓存服务器来加快某些软件包的构建速度，那就必须将该缓存服务器的公钥添加进
`trusted-public-keys`
中，并自己承担对应的安全风险——该缓存服务器提供的缓存数据可能夹带了私货（恶意内容）。

### Content-addressed model

[RFC062 - content-addressed store paths](https://github.com/NixOS/rfcs/blob/master/rfcs/0062-content-addressed-paths.md)
是社区在提升构建结果的一致性上的一次尝试。它提出了一种新的存储路径计算方式，即基于构建结果（outputs）而不是输入信息（inputs）来计算最终的存储路径。这种设计可以保证构建结果的一致性——如果构建结果不同，那么存储路径也会不同，从而避免了 input-addressed
model 中存在的输出内容不确定性问题。

不过它目前还在实验性阶段，尚未被广泛应用。

## 参考

- [Nix Store - Nix Manual](https://nixos.org/manual/nix/stable/store/)
