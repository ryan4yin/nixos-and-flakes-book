
## Update the system

With Flakes, it is also very simple to update the system. Just run the following commands in `/etc/nixos`:

```shell
# update flake.lock
nix flake update
# apply the updates
sudo nixos-rebuild switch
```

Sometimes you may encounter some error of sha256 mismatch when running `nixos-rebuild switch`, which may be solved by updating `flake.lock` through `nix flake update`.
