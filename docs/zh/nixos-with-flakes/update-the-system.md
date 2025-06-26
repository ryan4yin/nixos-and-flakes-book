# 更新系统 {#update-nixos-system}

在使用了 Nix Flakes 后，要更新系统也很简单，先更新 flake.lock 文件，然后部署即可。在配置文
件夹中执行如下命令：

```shell
# 更新 flake.lock（更新所有依赖项）
nix flake update

# 或者也可以只更新特定的依赖项，比如只更新 home-manager:
nix flake update home-manager

# 部署系统
sudo nixos-rebuild switch
# 如果你的 flake 不在 /etc/nixos 中，则需要额外使用 --flake 参数指定
sudo nixos-rebuild switch --flake /path/to/flake


# 也可以一行命令同时实现 nix flake update 与系统部署
sudo nixos-rebuild switch --recreate-lock-file
```

另外有时候安装新的包，跑 `sudo nixos-rebuild switch` 时可能会遇到 sha256 不匹配的报错，也
可以尝试通过 `nix flake update` 更新 flake.lock 来解决（原理暂时不太清楚）。
