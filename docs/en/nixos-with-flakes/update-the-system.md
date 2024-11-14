# Updating the System

With Flakes, updating the system is straightforward. Simply execute the following commands
in `/etc/nixos` or any other location where you keep the configuration:

```shell
# Update flake.lock
nix flake update

# Or replace only the specific input, such as home-manager:
nix flake update home-manager

# Apply the updates
sudo nixos-rebuild switch --flake .

# Or to update flake.lock & apply with one command (i.e. same as running "nix flake update" before)
sudo nixos-rebuild switch --recreate-lock-file --flake .
```

Occasionally, you may encounter a "sha256 mismatch" error when running
`nixos-rebuild switch`. This error can be resolved by updating `flake.lock` using
`nix flake update`.
