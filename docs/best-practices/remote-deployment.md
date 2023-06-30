# Remote deployment

Some tools like [NixOps](https://github.com/NixOS/nixops), [deploy-rs](https://github.com/serokell/deploy-rs), and [colmena](https://github.com/zhaofengli/colmena) can all be used to deploy NixOS configuration to remote hosts, but they are all too complicated for me.

`nixos-rebuild`, the tool we use to deploy NixOS configuration, also supports remote deployment through ssh protocol, which is very convenient and simple.

But `nixos-rebuild` does not support deploying with password authentication, so to use it for remote deployment, we need to:

1. Configure ssh public key authentication for the remote hosts.
2. To avoid sudo password verification failures, we need to use the `root` user to deploy, or grant the user sudo permission without password verification.
   1. related issue: <https://github.com/NixOS/nixpkgs/issues/118655>

After the above configuration is completed, we can deploy the configuration to the server through the following command:

```bash
# 1. add the ssh key to ssh-agent first
ssh-add ~/.ssh/ai-idols

# 2. deploy the configuration to the remote host, using the ssh key we added in step 1
#    and the username defaults to `$USER`, it's `ryan` in my case.
nixos-rebuild --flake .#aquamarine --target-host 192.168.4.1 --build-host 192.168.4.1 switch --use-remote-sudo --verbose
```

The commands above will build & deploy the configuration to `aquamarine`, the build process will be executed on `aquamarine` too,
and the `--use-remote-sudo` option indicates that we need to use sudo permission on the remote server to deploy the configuration.

If you want to build the configuration locally and deploy it to the remote server, just replace `--build-host aquamarinr` with `--build-host localhost`.
Instead of using IP address directly, we can also define some host aliases in `~/.ssh/config` or `/etc/ssh/ssh_config`, for example:

> ssh's config can be generated completely through Nix configuration, and this task is left to you.

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

Then we can use the host alias to deploy the configuration:

```bash
nixos-rebuild --flake .#aquamarine --target-host aquamarine --build-host aquamarine switch --use-remote-sudo --verbose
```
