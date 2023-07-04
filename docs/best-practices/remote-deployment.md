# Remote Deployment

Deploying NixOS configuration to remote hosts can be accomplished using tools like [NixOps](https://github.com/NixOS/nixops), [deploy-rs](https://github.com/serokell/deploy-rs), and [colmena](https://github.com/zhaofengli/colmena). However, if you prefer a simpler approach, you can use the built-in remote deployment capability of `nixos-rebuild` with SSH protocol.

Before using `nixos-rebuild` for remote deployment, there are a few prerequisites:

1. Configure SSH public key authentication for the remote hosts.
2. To prevent sudo password verification failures, either deploy as the `root` user or grant the user sudo permission without password verification.
   - Related issue: <https://github.com/NixOS/nixpkgs/issues/118655>

Once the above configurations are in place, you can deploy the configuration to the server using the following command:

```bash
# 1. Add the SSH key to ssh-agent first
ssh-add ~/.ssh/ai-idols

# 2. Deploy the configuration to the remote host, using the SSH key added in step 1.
#    The username defaults to `$USER`, in my case, it's `ryan`.
nixos-rebuild --flake .#aquamarine --target-host 192.168.4.1 --build-host 192.168.4.1 switch --use-remote-sudo --verbose
```

The command above will build and deploy the configuration to the `aquamarine` server, and the build process will also execute on `aquamarine`. The `--use-remote-sudo` option indicates that sudo permission is required on the remote server for deploying the configuration.

If you prefer to build the configuration locally and deploy it to the remote server, replace `--build-host aquamarine` with `--build-host localhost`. Additionally, instead of using the IP address directly, you can define host aliases in `~/.ssh/config` or `/etc/ssh/ssh_config`. For example:

> The SSH config can be generated entirely through Nix configuration, and this task is left to you.

```bash
› cat ~/.ssh/config

# ......

Host ai
  HostName 192.168.5.100
  Port 22

Host aquamarine
  HostName 192.168.5.101
  Port 22

Host ruby
  HostName 192.168.5.102
  Port 22

Host kana
  HostName 192.168.5.103
  Port 22
```

You can then use the host aliases to deploy the configuration:

```bash
nixos-rebuild --flake .#aquamarine --target-host aquamarine --build-host aquamarine switch --use-remote-sudo --verbose
```

This allows for more convenient deployment using the defined host aliases.