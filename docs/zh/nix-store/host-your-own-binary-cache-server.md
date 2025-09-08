# 搭建你自己的 Nix 二进制缓存服务器

## 简介

Nix 二进制缓存是 Nix
Store 的一个实现，它不把数据存储在本地，而是存储在远程服务器上，方便二进制缓存的多机共享。

Nix 官方的二进制缓存服务器只提供了使用标准参数构建的二进制缓存。如果你自定义了构建参数，或者你使用了 Nixpkgs 之外的软件包，那就会导致 Nix 找不到对应的二进制缓存，从而执行本地构建流程。

单纯依赖你本地的 Nix Store `/nix/store`
有时候会变得很痛苦，因为你需要在每台机器上重新构建所有你自定义的这些软件包，这可能需要相当长的时间，而且构建过程可能会消耗大量内存。如果是在 Raspberry
Pi 等性能较低的平台上使用 Nix，这种情况会变得更加糟糕。

本文档将介绍如何使用 S3 服务（如 MinIO）搭建你自己的 Nix 二进制缓存服务器，以便在多台机器之间共享构建结果，从而解决上述问题。

## 准备工作

1. 一台 NixOS 主机
1. 部署好 MinIO 服务器
   1. 如果没有，您可以参考 MinIO 的[官方部署指南](https://min.io/docs/minio/linux/operations/installation.html)
      进行部署。
1. MinIO 服务器需要具备有效的 TLS 数字证书，可以是公共证书也可以是私有证书。本文将使用
   `https://minio.homelab.local` 加上私有证书作为示例。
1. 安装好 `minio-client`

## 生成密码

```bash
nix run nixpkgs#pwgen -- -c -n -y -s -B 32 1
# => oenu1Yuch3rohz2ahveid0koo4giecho
```

## 设置 MinIO 客户端

安装 MinIO 命令行客户端 `mc`。

```nix
{ pkgs, ... }:

{
  environment.systemPackages = with pkgs; [
    minio-client # 用于文件系统和对象存储的 ls、cp、mkdir、diff 和 rsync 命令的替代品
  ];
}
```

创建 `~/.mc/config.json`，内容格式如下（注意将其中的关键参数替换为你自己的）：

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

Nix 将直接与 S3 存储桶交互，因此我们都需要给所有需要访问 Nix 二进制缓存的机器配置好对应的 S3 凭据。创建
`~/.aws/credentials`，内容如下（请注意用前面 `pwgen` 命令生成的密码替换
`<nixbuildersecret>`）。

```conf
[nixbuilder]
aws_access_key_id=nixbuilder
aws_secret_access_key=<nixbuildersecret>
```

## 设置使用 S3 存储桶作为二进制缓存

先通过 minio 客户端创建 `nix-cache` 存储桶：

```bash
mc mb s3/nix-cache
```

创建 `nixbuilder` 这个 MinIO 用户并为其分配密码：

```bash
mc admin user add s3 nixbuilder <PASSWORD>
```

在当前工作目录中创建名为 `nix-cache-write.json` 的文件，内容如下：

```json
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
```

现在再使用刚刚创建好的 `nix-cache-write.json` 文件创建一个上载文件到 S3 的策略：

```bash
mc admin policy add s3 nix-cache-write nix-cache-write.json
```

将我们上面创建的 S3 策略与 `nixbuilder` 用户关联：

```bash
mc admin policy set s3 nix-cache-write user=nixbuilder
```

再允许匿名用户在不进行身份验证的情况下下载文件，这样所有 Nix 服务器就都能直接从这个 S3 缓存拉数据了：

```bash
mc anonymous set download s3/nix-cache
```

最后，添加 `nix-cache-info`
文件到 S3 桶根目录中，Nix 需要这个文件记录一些二进制缓存相关的信息：

```bash
cat > nix-cache-info <<EOF
StoreDir: /nix/store
WantMassQuery: 1
Priority: 40
EOF

# 将 `nix-cache-info` 复制到 S3 桶中
mc cp ./nix-cache-info s3/nix-cache/nix-cache-info
```

## 生成签名密钥对

前面介绍了，Nix 二进制缓存使用公钥签名机制校验数据的数据来源与完整性，因此我们还需要为我们的 Nix 构建机生成一个密钥对用于二进制缓存的签名验证。

密钥名称是任意的，但 NixOS 开发人员强烈建议使用缓存的域名后跟一个整数，这样如果密钥需要撤销或重新生成，就可以递增末尾的整数。

```bash
nix key generate-secret --key-name s3.homelab.local-1 > ~/.config/nix/secret.key
nix key convert-secret-to-public < ~/.config/nix/secret.key > ~/.config/nix/public.key
cat ~/.config/nix/public.key
# => s3.homelab.local-1:m0J/oDlLEuG6ezc6MzmpLCN2MYjssO3NMIlr9JdxkTs=
```

## 在 `flake.nix` 中使用 S3 二进制缓存

将以下内容放入 `configuration.nix` 或您的任何自定义 NixOS 模块中：

```nix
{
  nix = {
    settings = {
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

重新构建系统，就可以使用上我们创建好的 S3 二进制缓存了：

```bash
sudo nixos-rebuild switch --upgrade --flake .#<HOST>
```

## 推送存储路径到二进制缓存

对本地存储中的一些路径进行签名。

```bash
nix store sign --recursive --key-file ~/.config/nix/secret.key /run/current-system
```

将这些路径复制到缓存：

```bash
nix copy --to 's3://nix-cache?profile=nixbuilder&endpoint=s3.homelab.local' /run/current-system
```

## 添加自动对象过期策略

```bash
mc ilm rule add s3/nix-cache --expire-days "DAYS"
# 例如：mc ilm rule add s3/nix-cache --expire-days "7"
```

## 参考

- [Blog post by Jeff on Nix binary caches](https://jcollie.github.io/nixos/2022/04/27/nixos-binary-cache-2022.html)
- [Binary cache in the NixOS wiki](https://wiki.nixos.org/wiki/Binary_Cache)
- [Serving a Nox store via S3 in the NixOS manual](https://nixos.org/manual/nix/stable/package-management/s3-substituter.html)
- [Serving a Nix store via HTTP in the NixOS manual](https://nixos.org/manual/nix/stable/package-management/binary-cache-substituter.html)
