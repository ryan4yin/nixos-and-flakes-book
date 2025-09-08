# 更新系统 {#update-nixos-system}

使用 Flakes 后，更新系统变得非常简单。只需在 `/etc/nixos`
或你存放配置的其他目录中执行以下命令：

> **注意**：`/etc/nixos` 目录由 `root` 拥有，并且仅对 `root`
> 可写。因此，如果你的 flake 位于此目录中，你需要使用 `sudo` 来更新任何配置文件。

```shell
# 更新 flake.lock
nix flake update

# 或者只更新特定的 input，例如 home-manager：
nix flake update home-manager

# 部署新配置（如果你的配置就在默认的 /etc/nixos，可以省略后面的 --flake .）
sudo nixos-rebuild switch --flake .

# 或者在一条命令中同时更新 flake.lock 并部署新配置（即等同于先运行 "nix flake update"）
sudo nixos-rebuild switch --recreate-lock-file --flake .
```

有时在运行 `nixos-rebuild switch` 时可能会遇到 `sha256 mismatch`
类似的错误，一般可以通过运行 `nix flake update` 来更新 `flake.lock` 解决。
