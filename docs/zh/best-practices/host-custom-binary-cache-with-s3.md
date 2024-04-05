# 使用 S3 自定义二进制缓存托管 {#host-custom-binary-cache-with-s3}

## 简介

一个关于如何使用 MinIO S3 服务器设置自己的 S3 Nix 二进制缓存的指南。

## Nix 中的软件如何存储？

可以在系统上安装同一软件包的多个版本，从而能够同时满足各种依赖链。这使得可以安装多个依赖于
同一个第三方软件包的软件包，但使用不同版本的它。为了实现这一点，所有软件包都安装在全局的
Nix 存储中，路径为 "/nix/store/"，然后通过符号链接到相应的位置。为了验证软件包的唯一性，其
整个目录被哈希，并将哈希放入软件包的主文件夹的名称中。从使用相同依赖软件版本构建的相同 Nix
表达式构建的每个软件包都会产生相同的哈希，无论它是在什么系统上构建的。如果任何依赖软件的版
本发生更改，这将导致最终软件包的新哈希。

使用符号链接来“安装”软件包并将所有正确的依赖项链接到它还使得原子更新成为可能。为了使这一点
更清楚，让我们来考虑一个例子，其中软件 X 安装在旧版本中并且应该进行更新。软件 X 安装在全局
Nix 存储中的自己的目录中，并符号链接到正确的目录，比如 "/usr/local/bin/"。当触发更新时，X
的新版本会安装到全局 Nix 存储中，而不会干扰其旧版本。一旦安装完成，包括其所有依赖项在内的
最终软件包在 Nix 存储中，最后一步是将符号链接更改为 "/usr/local/bin/"。由于在 Unix 中创建
新的符号链接来覆盖旧的符号链接是一个原子操作，因此这个操作不可能失败并使软件包处于损坏状
态。唯一可能的问题是在符号链接创建之前或之后失败。无论哪种方式，结果都是我们要么有旧版本的
X，要么有新安装的版本，但中间没有任何东西。

引用自原
作：[The S3 Nix Cache Manual](https://medium.com/earlybyte/the-s3-nix-cache-manual-e320da6b1a9b)

## Nix 二进制缓存

无论 Nix 的每个方面听起来多么棒，它的设计也有一个主要缺点，那就是每次构建软件包都会触发整
个依赖链的构建过程。这可能需要相当长的时间，因为甚至像 gcc 或 ghc 这样的编译器都必须提前构
建。这样的构建过程可能会消耗大量内存，在受限平台（如树莓派）上使用它时会引入额外的障碍。

为了克服总是从头开始构建一切以及丢失对软件包预构建版本的访问权限的缺点，还可以使用 S3 服务
器（如 MinIO）构建自己的 Nix 二进制缓存。

设置您的缓存，填充它的二进制文件并使用您新构建的缓存中的二进制文件的过程将被逐步描述。对于
本手册，我假设您已经有了 Nix，并且在您的环境中已经运行了 MinIO 服务器。如果没有，您可以查
看 MinIO 的[官方部署指南](https://min.io/docs/minio/linux/operations/installation.html)。
您需要确保通过信任的证书以 `HTTPS` 方式访问 MinIO。在这里，Let's Encrypt 将非常有用。

在本文中，让我们探讨如何自托管一个 S3 兼容服务器 MinIO 作为二进制缓存存储。

引用自原
作：[The S3 Nix Cache Manual](https://medium.com/earlybyte/the-s3-nix-cache-manual-e320da6b1a9b)

## 如何将 S3 用作二进制缓存服务器

### 先决条件

- 在您的环境中设置 MinIO。
- 拥有有效的 SSL 证书，可以是公共证书也可以是私有证书。在本教程中，我们将使用
  `minio.homelab.local`（私有证书）的示例步骤。如果您计划使用私有证书，您必须自己解决 DNS
  挑战。因此，建议使用公共证书。
- 在您的环境中安装 `minio-client`。

### 生成密码

```bash
nix run nixpkgs#pwgen -- -c -n -y -s -B 32 1
# oenu1Yuch3rohz2ahveid0koo4giecho
```

### 设置 MinIO 客户端

安装 MinIO 命令行客户端 `mc`。

```nix
{ pkgs, ... }:

{
  environment.systemPackages = with pkgs; [
    minio-client # 用于文件系统和对象存储的 ls、cp、mkdir、diff 和 rsync 命令的替代品
  ];
}
```

创建或编辑 `~/.mc/config.json`。

```json
{
  "version": "10",
  "aliases": {
    "s3": {
      "url": "https://s3.homelab.local",
      "accessKey": "minio",
      "secretKey": "oenu1Yuch3rohz2ahveid0koo4giecho",
      "api": "s3v4",
      "path": "auto"
    }
  }
}
```

###

设置 S3 存储桶作为二进制缓存

创建 `nix-cache` 存储桶。

```bash
mc mb s3/nix-cache
```

创建 `nixbuilder` MinIO 用户并分配密码。

```bash
mc admin user add s3 nixbuilder <PASSWORD>
```

在当前工作目录中创建名为 `nix-cache-write.json` 的文件，并具有以下内容：

```json
cat > nix-cache-write.json << EOF
{
  "Id": "AuthenticatedWrite",
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AuthenticatedWrite",
      "Action": [
        "s3:AbortMultipartUpload",
        "s3:GetBucketLocation",
        "s3:GetObject",
        "s3:ListBucket",
        "s3:ListBucketMultipartUploads",
        "s3:ListMultipartUploadParts",
        "s3:PutObject"
      ],
      "Effect": "Allow",
      "Resource": ["arn:aws:s3:::nix-cache", "arn:aws:s3:::nix-cache/*"],
      "Principal": "nixbuilder"
    }
  ]
}
EOF
```

使用 `nix-cache-write.json` 创建允许 `nixbuilder` 上载文件到缓存的策略。

```bash
mc admin policy add s3 nix-cache-write nix-cache-write.json
```

将我们上面创建的策略与 `nixbuilder` 用户关联。

```bash
mc admin policy set s3 nix-cache-write user=nixbuilder
```

允许匿名用户在不进行身份验证的情况下下载文件。

```bash
mc anonymous set download s3/nix-cache
```

在工作目录中创建名为 `nix-cache-info` 的文件。此文件告诉 Nix 桶确实是一个二进制缓存。

```bash
cat > nix-cache-info <<EOF
StoreDir: /nix/store
WantMassQuery: 1
Priority: 40
EOF
```

将 `nix-cache-info` 复制到缓存桶。

```bash
mc cp ./nix-cache-info s3/nix-cache/nix-cache-info
```

### 生成密钥对

为签署存储路径生成一个密钥对。密钥名称是任意的，但 NixOS 开发人员强烈建议使用缓存的域名后
跟一个整数。如果密钥需要撤销或重新生成，可以递增尾部整数。

```bash
nix key generate-secret --key-name s3.homelab.local-1 > ~/.config/nix/secret.key
nix key convert-secret-to-public < ~/.config/nix/secret.key > ~/.config/nix/public.key
cat ~/.config/nix/public.key
# s3.homelab.local-1:m0J/oDlLEuG6ezc6MzmpLCN2MYjssO3NMIlr9JdxkTs=
```

### 使用 Flake 激活二进制缓存

将以下内容放入 `configuration.nix` 或您的任何自定义 NixOS 模块中：

```nix
{
  nix = {
    settings = {
      # 在获取软件包时，替代器将被附加到默认的替代器。
      extra-substituters = [
        "https://s3.homelab.local/nix-cache/"
      ];
      extra-trusted-public-keys = [
        "s3.homelab.local-1:m0J/oDlLEuG6ezc6MzmpLCN2MYjssO3NMIlr9JdxkTs="
      ];
    };
  };
}
```

重新构建系统。

```bash
sudo nixos-rebuild switch --upgrade --flake .#<HOST>
```

### 推送路径到存储

对本地存储中的一些路径进行签名。

```bash
nix store sign --recursive --key-file ~/.config/nix/secret.key /run/current-system
```

将这些路径复制到缓存。

```bash
nix copy --to 's3://nix-cache?profile=nixbuilder&endpoint=s3.homelab.local' /run/current-system
```

### 添加自动对象到期策略

```bash
mc ilm rule add s3/nix-cache --expire-days "DAYS"
# 例如：mc ilm rule add s3/nix-cache --expire-days "7"
```

### 参考资料

以下是我在编写本文档时使用的一些来源：

- [Jeff 的博客文章：Nix 二进制缓存](https://jcollie.github.io/nixos/2022/04/27/nixos-binary-cache-2022.html)
- [NixOS wiki 上的二进制缓存](https://nixos.wiki/wiki/Binary_Cache)
- [NixOS 手册中关于通过 S3 提供 Nix 存储](https://nixos.org/manual/nix/stable/package-management/s3-substituter.html)
- [NixOS 手册中关于通过 HTTP 提供 Nix 存储](https://nixos.org/manual/nix/stable/package-management/binary-cache-substituter.html)
