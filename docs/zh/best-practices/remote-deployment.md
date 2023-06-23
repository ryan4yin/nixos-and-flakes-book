
## 远程部署

社区的一些工具，比如 [NixOps](https://github.com/NixOS/nixops), [deploy-rs](https://github.com/serokell/deploy-rs), 跟 [colmena](https://github.com/zhaofengli/colmena)，都可以用来部署 NixOS 配置到远程主机，但是都太复杂了，所以先全部跳过。

实际上我们前面使用了多次的 NixOS 本机部署命令 `nixos-rebuild`，这个工具也支持通过 ssh 协议进行远程部署，非常方便。

美中不足的是，`nixos-rebuild` 不支持使用密码认证进行部署，所以要想使用它进行远程部署，我们需要：

1. 为远程主机配置 ssh 公钥认证。
2. 为了避免 sudo 密码认证失败，需要使用 `root` 用户进行部署，或者给用户授予 sudo 权限不需要密码认证。
   1. 相关 issue: <https://github.com/NixOS/nixpkgs/issues/118655>

在搞定上面两点后，我们就可以使用 `nixos-rebuild` 进行远程部署了：

```bash
# 1. 首先将本地的 ssh 私钥加载到 ssh-agent 中，以便后续使用
ssh-add ~/.ssh/ai-idols

# 2. 将 NixOS 配置部署到远程主机，使用第一步添加的 ssh key 进行认证，用户名默认为 `$USER`
nixos-rebuild --flake .#aquamarine --target-host 192.168.4.1 --build-host 192.168.4.1 switch --use-remote-sudo --verbose
```

上面的命令会将 NixOS 配置部署到 `aquamarine` 这台主机上，参数解释如下：

1. `--target-host`: 设置远程主机的 ip 地址
2. `--build-host` 指定了构建 NixOS 配置的主机，这里设置为跟 `--target-host` 相同，表示在远程主机上构建配置。
3. `--use-remote-sudo` 表示部署需要用到远程主机的 sudo 权限，如果不设置这个参数，部署会失败。

如果你希望在本地构建配置，然后再部署到远程主机，可以命令中的 `--build-host aquamarinr` 替换为 `--build-host localhost`。

另外如果你不想直接使用 ip 地址，可以在 `~/.ssh/config` 或者 `/etc/ssh/ssh_config` 中定义一些主机别名，比如：

> 当然如下这份配置也完全可以通过 Nix 来管理，这个就留给读者自己去实现了。

```bash
› cat ~/.ssh/config

# ......

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
```

这样我们就可以使用主机别名进行部署了：

```bash
nixos-rebuild --flake .#aquamarine --target-host aquamarine --build-host aquamarine switch --use-remote-sudo --verbose
```