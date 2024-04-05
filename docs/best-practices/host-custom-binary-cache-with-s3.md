# Host Custom Binary Cache with S3 {#host-custom-binary-cache-with-s3}

TL;DR

A guide on how to set up your own S3 nix binary cache using MinIO S3 server.

## How Software Stored in Nix?

Multiple versions of the same software package can be installed on a system, making it
possible to satisfy various dependency chains at a time. This enables the installation of
multiple packages that depend on the same third package, but on different versions of it.
To achieve this, all packages are installed in the global nix store under “/nix/store/”
and are then symlinked to the respective locations. To verify a package’s uniqueness, its
whole directory is hashed, and the hash put into the name of the package’s main folder.
Every software built from the same Nix expression that uses the same dependency software
versions results in the same hash, no matter what system it was built on. If any of the
dependency software versions were changed, this will result in a new hash for the final
package.

Using symlinks to “install” a package and link all the right dependencies to it also
enables atomic updating. To make this clearer, let’s think of an example where software X
is installed in an older version and should be updated. Software X is installed in its
very own directory in the global nix store and symlinked to the right directory, let’s say
“/usr/local/bin/”. When the update is triggered, the new version of X is installed into
the global nix store without interfering with its older version. Once the installation
with all its dependencies in the nix store is completed, the final step is to change the
symlink to “/usr/local/bin/”. Since creating a new symlink that overwrites the old one is
an atomic operation in Unix, it is impossible for this operation to fail and leave the
package in a corrupted state. The only possible problem would be that it fails before or
after the symlink creation. Either way, the result would be that we either have the old
version of X or the newly installed version, but nothing in between.

Quoted from the original work from
https://medium.com/earlybyte/the-s3-nix-cache-manual-e320da6b1a9b

## Nix Binary Caches

No matter how great every aspect of Nix sounds, its design has also a major drawback,
which is that every package build triggers the build process for the whole dependency
chain from scratch. This can take quite a while, since even compilers such as gcc or ghc
must be built in advance. Such build processes can eat up a remarkable amount of memory,
introducing an additional hurdle if one wants to use it on restricted platforms such as
the Raspberry Pi.

To overcome the drawback of always building everything from scratch and the chance of
losing access to prebuilt versions of packages, it is also possible to build your Nix
binary cache using an S3 server such as MinIO (https://min.io/).

The process of setting up your cache, populating it with binaries and use the binaries
from your newly built cache will be described step by step. For this manual, I assume that
you already have nix in place, and that you already have a running MinIO server somewhere
in your environment. If not, you may check out the
[official deployment guide](https://min.io/docs/minio/linux/operations/installation.html)
from MinIO. You'll need to ensure that MinIO is accessible via `HTTPS` using a trusted
certificate. Let's Encrypt will be helpful here.

In this post, let's explore how we can self-host an S3-compatible server, MinIO, as a
binary cache store.

Quoted from the original work from
https://medium.com/earlybyte/the-s3-nix-cache-manual-e320da6b1a9b

## How To Use S3 as a Binary Cache Server {#how-to-use-s3-as-a-binary-cache-server}

Set up MinIO somewhere in your environment.

### Generate Password {#generate-password}

```bash
nix run nixpkgs#pwgen -- -c -n -y -s -B 32 1
# oenu1Yuch3rohz2ahveid0koo4giecho
```

### Set Up MinIO Client {#set-up-minio-client}

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

Create a file called `nix-cache-info` in your working directory. This file tells Nix that
the bucket is indeed a binary cache.

```bash
cat > nix-cache-info <<EOF
StoreDir: /nix/store
WantMassQuery: 1
Priority: 40
EOF
```

Copy `nix-cache-info` to the cache bucket.

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
