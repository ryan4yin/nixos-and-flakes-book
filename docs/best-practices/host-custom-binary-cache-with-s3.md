# Host Custom Binary Cache with S3 {#host-custom-binary-cache-with-s3}

In [Adding Custom Cache Servers](../nixos-with-flakes/add-custom-cache-servers.md), we
learned how to add custom binary cache servers to speed up the build process.

In this post, let's explore how we can self-host an S3-compatible server,
[MinIO](https://min.io/), as a binary cache store.

## How To Use S3 as a Binary Cache Server {#how-to-use-s3-as-a-binary-cache-server}

Set up MinIO somewhere in your environment. This post will NOT cover the installation of
MinIO as there are many ways to do that, but you'll need to ensure that MinIO is
accessible via HTTPS using a trusted certificate. Let's Encrypt will be helpful here.

### Generate Password {#generate-password}

```bash
nix run nixpkgs#pwgen -- -c -n -y -s -B 32 1
# oenu1Yuch3rohz2ahveid0koo4giecho
```

### Setup MinIO Client {#setup-minio-client}

Install the MinIO command-line client `mc`.

```nix
{ pkgs, ... }:

{
  environment.systemPackages = with pkgs; [
    minio-client # A replacement for ls, cp, mkdir, diff, and rsync commands for filesystems and object storage
  ];
}
```

Create or edit `~/.mc/config.json`.

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

### Setup S3 Bucket as Binary Cache {#setup-s3-bucket-as-binary-cache}

Create a file called `nix-cache-info`. This file tells Nix that the bucket is indeed a
binary cache.

```
StoreDir: /nix/store
WantMassQuery: 1
Priority: 40
```

Create the `nix-cache` bucket.

```bash
mc mb s3/nix-cache
```

Create the `nixbuilder` MinIO user and assign a password.

```bash
mc admin user add s3 nixbuilder <PASSWORD>
```

Create a file called `nix-cache-write.json` with the following contents:

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

Create a policy that will allow `nixbuilder` to upload files to the cache.

```bash
mc admin policy add s3 nix-cache-write nix-cache-write.json
```

Associate the policy that we created above with the `nixbuilder` user.

```bash
mc admin policy set s3 nix-cache-write user=nixbuilder
```

Allow anonymous users to download files without authenticating.

```bash
mc anonymous set download s3/nix-cache
```

Copy `nix-cache-info` to the cache.

```bash
mc cp ./nix-cache-info s3/nix-cache/nix-cache-info
```

### Generate Key Pairs {#generate-key-pairs}

Generate a secret and public key for signing store paths. The key name is arbitrary, but
the NixOS developers highly recommend using the domain name of the cache followed by an
integer. If the key ever needs to be revoked or regenerated, the trailing integer can be
incremented.

```bash
nix key generate-secret --key-name s3.homelab.local-1 > ~/.config/nix/secret.key
nix key convert-secret-to-public < ~/.config/nix/secret.key > ~/.config/nix/public.key
cat ~/.config/nix/public.key
s3.homelab.local-1:m0J/oDlLEuG6ezc6MzmpLCN2MYjssO3NMIlr9JdxkTs=
```

### Activate Binary Cache with Flake {#activate-binary-cache-with-flake}

```nix
{
  nix = {
    settings = {
      # Substituters will be appended to the default substituters when fetching packages.
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

Rebuild the system.

```bash
sudo nixos-rebuild switch --upgrade --flake .#<HOST>
```

### Push Paths to the Store {#push-paths-to-the-store}

Sign some paths in the local store.

```bash
nix store sign --recursive --key-file ~/.config/nix/secret.key /run/current-system
```

Copy those paths to the cache.

```bash
nix copy --to 's3://nix-cache?profile=nixbuilder&endpoint=s3.homelab.local' /run/current-system
```

### Add Automatic Object Expiration Policy {#add-automatic-object-expiration-policy}

```bash
mc ilm rule add s3/nix-cache --expire-days "DAYS"
# Example: mc ilm rule add s3/nix-cache --expire-days "7"
```

### References {#references}

Here are some of the sources that I used in making this document:

- [Blog post by Jeff on Nix binary caches](https://jcollie.github.io/nixos/2022/04/27/nixos-binary-cache-2022.html)
- [Binary cache in the NixOS wiki](https://nixos.wiki/wiki/Binary_Cache)
- [Serving a Nox store via S3 in the NixOS manual](https://nixos.org/manual/nix/stable/package-management/s3-substituter.html)
- [Serving a Nix store via HTTP in the NixOS manual](https://nixos.org/manual/nix/stable/package-management/binary-cache-substituter.html)
