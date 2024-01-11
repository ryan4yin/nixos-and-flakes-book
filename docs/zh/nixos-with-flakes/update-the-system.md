# 更新系统 {#update-nixos-system}

在使用了 Nix Flakes 后，要更新系统也很简单，先更新 flake.lock 文件，然后部署即可。在配置文件夹中执行如下命令：

```shell
# 更新 flake.lock（更新所有依赖项）
nix flake update

# 或者也可以只更新特定的依赖项，比如只更新 home-manager:
nix flake lock --update-input home-manager

# 部署系统
sudo nixos-rebuild switch --flake .
```

另外有时候安装新的包，跑 `sudo nixos-rebuild switch` 时可能会遇到 sha256 不匹配的报错，也可以尝试通过 `nix flake update` 更新 flake.lock 来解决（原理暂时不太清楚）。
