# 远程部署

Nix 本身的设计就很适合远程部署，Nix 社区也有许多专门用于远程部署的工具，比如说
[NixOps](https://github.com/NixOS/nixops) 与
[colmena](https://github.com/zhaofengli/colmena)。另外我们前面已经用了很多次的官方工具
`nixos-rebuild`，它拥有一定的远程部署能力。

此外在多架构场景下，远程部署还可以充分利用 Nix 的多架构支持，比如说在 x86_64 主机上交叉编译 aarch64/aarch64 的 NixOS 系统配置，然后通过 SSH 远程部署到对应的主机上。我最近遇到的一个场景是，我本地交叉编译了一块 RISCV64 开发板的 NixOS 系统镜像，那么我本地已经拥有了交叉编译该系统的所有编译缓存。但是由于 NixOS 官方几乎没有 RISCV64 的二进制缓存，我直接在开发板上执行任何未预装的程序（比如
`nix run nixpkgs#cowsay hello`）都会导致大量的编译，这会耗费我数小时的时间，是难以接受的。而改用远程部署的话，我就能充分利用上本机的高性能 CPU 与大量编译缓存，体验就很好了。

这里我简单介绍下如何使用 colmena 与 `nixos-rebuild` 进行远程部署。

## 准备工作

在进行远程部署之前，需要做一些准备工作：

1. 为了防止远程主机的 sudo 密码验证失败，有两种方法，二选一：
   1. 以远程主机的 `root` 用户身份部署，这是推荐使用的方法。
   2. 在远程主机的配置中添加 `security.sudo.wheelNeedsPassword = false;`
      并提前手动部署一次，从而为用户授予免密码验证的 sudo 权限。
      1. **这会导致用户级别的程序能静默获取 sudo 权限，存在安全风险**！因此如果选用这种方法，建议远程部署创建一个专门的用户，不应该使用自己的常用用户！
2. 为远程主机配置 SSH 公钥身份验证
   1. 可使用 `users.users.<name>.openssh.authorizedKeys.keys` 配置项完成配置。
3. 在本机主机上添加好远程主机的 Known
   Hosts 记录，否则 colmena/nixos-rebuild 会因为无法验证远程主机的身份而部署失败。
   1. 可使用 `programs.ssh.knownHosts` 配置项将远程主机的公钥添加到 Known Hosts 记录中。
4. 手动使用 `ssh root@<you-host>` 命令，验证能正常登录到远程主机。
   1. 如果遇到任何问题，请先解决它们，再继续后续操作。

建议使用 `root`
用户进行部署，因为这更方便且不需要额外的配置，没有令人头疼的 sudo 权限问题。

假设我们现在要通过 root 用户进行远程部署，首先需要在远程主机上为该用户配置 SSH 公钥身份验证。直接在远程主机的 Nix 配置的任一 NixOS
Module 中（比如 `configuration.nix`）添加如下内容，然后重新构建系统即可：

```nix{6-9}
# configuration.nix
{

  # ...

  users.users.root.openssh.authorizedKeys.keys = [
    # TODO 替换为您自己的 SSH 公钥。
    "ssh-ed25519 AAAAC3Nxxxxx ryan@xxx"
  ];

  # ...
}
```

然后还需要提前在本机上将用于登录的 SSH 私钥添加到 SSH
agent，以便在部署配置时进行身份验证：

```bash
ssh-add ~/.ssh/your-private-key
```

## 通过 `colmena` 进行部署

`colmena` 不能直接使用我们已经熟悉的 `nixosConfigurations.xxx`
进行远程部署，它自定义了一个名为 `colmena` 的 flake outputs 来进行远程部署，其内容结构与
`nixosConfigurations.xxx` 类似但不完全相同。

在你系统的 `flake.nix` 中添加一个新的名为 `colmena` 的 outputs，一个简单的例子如下：

```nix{11-34}
{
  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-25.05";

    # ...
  };
  outputs = { self, nixpkgs }: {
    # ...

    # 新增这个 outputs，colmena 会读取这个 outputs 中的内容进行远程部署
    colmena = {
      meta = {
        nixpkgs = import nixpkgs { system = "x86_64-linux"; };

        # 这个参数的功能与 `nixosConfigurations.xxx` 中的 `specialArgs` 一致，
        # 都是用于传递自定义参数到所有子模块。
        specialArgs = {
          inherit nixpkgs;
        };
      };

      # 主机名 = "my-nixos"
      "my-nixos" = { name, nodes, ... }: {
        # 与远程部署相关的参数
        deployment.targetHost = "192.168.5.42"; # 远程主机的 IP 地址
        deployment.targetUser = "root";  # 远程主机的用户名

        # 此参数的功能与 `nixosConfigurations.xxx` 中的 `modules` 一致
        # 都是用于导入所有子模块。
        imports = [
          ./configuration.nix
        ];
      };
    };
  };
}
```

现在，您可以将配置部署到设备上：

```bash
nix run nixpkgs#colmena apply
```

更复杂的用法，请参阅 colmena 的官方文档
<https://colmena.cli.rs/unstable/introduction.html>

## 通过 `nixos-rebuild` 进行部署

用 `nixos-rebuild`
进行远程部署的好处在于，它的工作方式与部署到本地主机完全相同，只需要多传几个参数，指定下远程主机的 IP 地址、用户名等信息即可。

例如，使用以下命令将 flake 中的 `nixosConfigurations.my-nixos` 这份配置部署到远程主机：

```bash
nixos-rebuild switch --flake .#my-nixos \
  --target-host root@192.168.4.1 --build-host localhost --verbose
```

上述命令将会构建并部署 my-nixos 的配置到 IP 为 `192.168.4.1`
的服务器，系统构建过程将在本机执行。

如果你希望在远程主机上构建系统，只需要将 `--build-host localhost` 替换为
`--build-host root@192.168.4.1`。

如果你觉得到处写 IP 地址不太合适，也可以在本地主机的 `~/.ssh/config` 或
`/etc/ssh/ssh_config` 中定义主机别名。例如：

> SSH 配置可以完全通过 Nix 配置生成，这个任务就留给读者自己完成了。

```bash
› cat ~/.ssh/config

# ......

Host aquamarine
  HostName 192.168.4.1
  Port 22

# ......
```

然后就可以直接使用主机别名进行部署了：

```bash
nixos-rebuild switch --flake .#my-nixos --target-host root@aquamarine --build-host root@aquamarine --verbose
```
