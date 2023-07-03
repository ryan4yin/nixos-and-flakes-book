# Updating the System

With Flakes, updating the system is simple. Just run the following commands in `/etc/nixos`(
or any other place where you keep the configuration.):

```shell
# Update flake.lock
nix flake update
# Apply the updates
sudo nixos-rebuild switch
```

Sometimes, you may encounter a sha256 mismatch error when running `nixos-rebuild switch`. This can be resolved by updating `flake.lock` through `nix flake update`.
