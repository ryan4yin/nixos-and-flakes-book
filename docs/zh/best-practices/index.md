
Nix is powerful and flexible, it provides a lot of ways to do things, making it difficult to find the most suitable way to do your job.
Here are some best practices that I've learned from the community, hope it can help you.

## 1. Run downloaded binaries on NixOS

NixOS does not follow the FHS standard, so the binaries you download from the Internet will not likely work on NixOS. But there are some ways to make it work.

Here is a detailed guide which provides 10 ways to run downloaded binaries on NixOS: [Different methods to run a non-nixos executable on Nixos](https://unix.stackexchange.com/questions/522822/different-methods-to-run-a-non-nixos-executable-on-nixos), I recommend you to read it.

Among these methods, I prefer creating a FHS environment to run the binary, which is very convenient and easy to use.

To create such an environment, add the following code to one of your nix modules:

```nix
{ config, pkgs, lib, ... }:

{
  # ......omit many configurations

  environment.systemPackages = with pkgs; [
    # ......omit many packages

    # create a fhs environment by command `fhs`, so we can run non-nixos packages in nixos!
    (pkgs.buildFHSUserEnv (base // {
      name = "fhs";
      targetPkgs = pkgs: (
        # pkgs.buildFHSUserEnv provides only a minimal fhs environment,
        # it lacks many basic packages needed by most softwares.
        # so we need to add them manually.
        #
        # pkgs.appimageTools provides basic packages needed by most softwares.
        (pkgs.appimageTools.defaultFhsEnvArgs.targetPkgs pkgs) ++ with pkgs; [
          pkg-config
          ncurses
          # feel free to add more packages here, if you need
        ]
      );
      profile = "export FHS=1";
      runScript = "bash";
      extraOutputsToInstall = ["dev"];
    }))
  ];

  # ......omit many configurations
}
```

after applying the updated configuration, you can run `fhs` to enter the FHS environment, and then run the binary you downloaded, e.g.

```shell
# Activating FHS drops me in a shell which looks like a "normal" Linux
$ fhs
# check what we have in /usr/bin
(fhs) $ ls /usr/bin
# try to run a non-nixos binary downloaded from the Internet
(fhs) $ ./bin/code
```

## 2. check the source code and debug with `nix repl`

We've used `nix repl '<nixpkgs>'` many times to check the source code in this guide, it's really a powerful tool to help us understand how things work in Nix.

Better take a look at the help message of `nix repl`:

```
› nix repl -f '<nixpkgs>'
Welcome to Nix 2.13.3. Type :? for help.

Loading installable ''...
Added 17755 variables.
nix-repl> :?
The following commands are available:

  <expr>        Evaluate and print expression
  <x> = <expr>  Bind expression to variable
  :a <expr>     Add attributes from resulting set to scope
  :b <expr>     Build a derivation
  :bl <expr>    Build a derivation, creating GC roots in the working directory
  :e <expr>     Open package or function in $EDITOR
  :i <expr>     Build derivation, then install result into current profile
  :l <path>     Load Nix expression and add it to scope
  :lf <ref>     Load Nix flake and add it to scope
  :p <expr>     Evaluate and print expression recursively
  :q            Exit nix-repl
  :r            Reload all files
  :sh <expr>    Build dependencies of derivation, then start nix-shell
  :t <expr>     Describe result of evaluation
  :u <expr>     Build derivation, then start nix-shell
  :doc <expr>   Show documentation of a builtin function
  :log <expr>   Show logs for a derivation
  :te [bool]    Enable, disable or toggle showing traces for errors
```

Some expressions that I use frequently: `:lf <ref>`, `:e <expr>`.

`:e <expr>` is very intuitive, so I won't repeat it. let's take a look at `:lf <ref>`:

```nix
# cd into my nix-config repo(you should replace it with your own nix-config repo)
› cd ~/nix-config/

# enter nix repl
› nix repl
Welcome to Nix 2.13.3. Type :? for help.

# load my nix flake and add it to scope
nix-repl> :lf .
Added 16 variables.

# press <TAB> to see what we have in scope
nix-repl><TAB>
# ......omit some outputs
__isInt                          nixosConfigurations
__isList                         null
__isPath                         outPath
__isString                       outputs
__langVersion                    packages
# ......omit some outputs


# check what's in inputs
nix-repl> inputs.<TAB>
inputs.agenix            inputs.nixpkgs
inputs.darwin            inputs.nixpkgs-darwin
inputs.home-manager      inputs.nixpkgs-unstable
inputs.hyprland          inputs.nixpkgs-wayland
inputs.nil
inputs.nixos-generators

# check what's in inputs.nil
nix-repl> inputs.nil.packages.
inputs.nil.packages.aarch64-darwin
inputs.nil.packages.aarch64-linux
inputs.nil.packages.x86_64-darwin
inputs.nil.packages.x86_64-linux

# check the outputs of my nix flake
nix-repl> outputs.nixosConfigurations.<TAB>
outputs.nixosConfigurations.ai
outputs.nixosConfigurations.aquamarine
outputs.nixosConfigurations.kana
outputs.nixosConfigurations.ruby

nix-repl> outputs.nixosConfigurations.ai.<TAB>
outputs.nixosConfigurations.ai._module
outputs.nixosConfigurations.ai._type
outputs.nixosConfigurations.ai.class
outputs.nixosConfigurations.ai.config
outputs.nixosConfigurations.ai.extendModules
outputs.nixosConfigurations.ai.extraArgs
outputs.nixosConfigurations.ai.options
outputs.nixosConfigurations.ai.pkgs
outputs.nixosConfigurations.ai.type

nix-repl> outputs.nixosConfigurations.ai.config.
outputs.nixosConfigurations.ai.config.age
outputs.nixosConfigurations.ai.config.appstream
outputs.nixosConfigurations.ai.config.assertions
outputs.nixosConfigurations.ai.config.boot
outputs.nixosConfigurations.ai.config.console
outputs.nixosConfigurations.ai.config.containers
# ......omit other outputs

nix-repl> outputs.nixosConfigurations.ai.config.home-manager.users.ryan.home.<TAB>
outputs.nixosConfigurations.ai.config.home-manager.users.ryan.home.activation
outputs.nixosConfigurations.ai.config.home-manager.users.ryan.home.activationPackage
outputs.nixosConfigurations.ai.config.home-manager.users.ryan.home.emptyActivationPath
outputs.nixosConfigurations.ai.config.home-manager.users.ryan.home.enableDebugInfo
outputs.nixosConfigurations.ai.config.home-manager.users.ryan.home.enableNixpkgsReleaseCheck
outputs.nixosConfigurations.ai.config.home-manager.users.ryan.home.extraActivationPath
outputs.nixosConfigurations.ai.config.home-manager.users.ryan.home.extraBuilderCommands
outputs.nixosConfigurations.ai.config.home-manager.users.ryan.home.extraOutputsToInstall
outputs.nixosConfigurations.ai.config.home-manager.users.ryan.home.extraProfileCommands
outputs.nixosConfigurations.ai.config.home-manager.users.ryan.home.file
# ......omit other outputs


nix-repl> outputs.nixosConfigurations.ai.config.home-manager.users.ryan.home.sessionVariables.<TAB>
outputs.nixosConfigurations.ai.config.home-manager.users.ryan.home.sessionVariables.BROWSER
outputs.nixosConfigurations.ai.config.home-manager.users.ryan.home.sessionVariables.DELTA_PAGER
outputs.nixosConfigurations.ai.config.home-manager.users.ryan.home.sessionVariables.EDITOR
outputs.nixosConfigurations.ai.config.home-manager.users.ryan.home.sessionVariables.GLFW_IM_MODULE
outputs.nixosConfigurations.ai.config.home-manager.users.ryan.home.sessionVariables.MANPAGER
outputs.nixosConfigurations.ai.config.home-manager.users.ryan.home.sessionVariables.QT_IM_MODULE
outputs.nixosConfigurations.ai.config.home-manager.users.ryan.home.sessionVariables.TERM
# ......omit other outputs

# check the value of `TERM`
nix-repl> outputs.nixosConfigurations.ai.config.home-manager.users.ryan.home.sessionVariables.TERM
"xterm-256color"


# check all files defined by `home.file`
nix-repl> outputs.nixosConfigurations.ai.config.home-manager.users.ryan.home.file.<TAB>
outputs.nixosConfigurations.ai.config.home-manager.users.ryan.home.file..bash_profile
outputs.nixosConfigurations.ai.config.home-manager.users.ryan.home.file..bashrc
outputs.nixosConfigurations.ai.config.home-manager.users.ryan.home.file..config/fcitx5/profile
outputs.nixosConfigurations.ai.config.home-manager.users.ryan.home.file..config/fcitx5/profile-bak
outputs.nixosConfigurations.ai.config.home-manager.users.ryan.home.file..config/i3/config
outputs.nixosConfigurations.ai.config.home-manager.users.ryan.home.file..config/i3/i3blocks.conf
outputs.nixosConfigurations.ai.config.home-manager.users.ryan.home.file..config/i3/keybindings
outputs.nixosConfigurations.ai.config.home-manager.users.ryan.home.file..config/i3/layouts
outputs.nixosConfigurations.ai.config.home-manager.users.ryan.home.file..config/i3/scripts
outputs.nixosConfigurations.ai.config.home-manager.users.ryan.home.file..config/i3/wallpaper.png
outputs.nixosConfigurations.ai.config.home-manager.users.ryan.home.file..config/rofi
#......
```

As you can see, we can check every attribute of my flake in the REPL after loading it, which is very convenient for debugging.

## 3. Remote deployment

Some tools like [NixOps](https://github.com/NixOS/nixops), [deploy-rs](https://github.com/serokell/deploy-rs), and [colmena](https://github.com/zhaofengli/colmena) can all be used to deploy NixOS configuration to remote hosts, but they are all too complicated for me, so skip them all.

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

The commands above will build & deploy the configuration to aquamarine, the build process will be executed on aquamarine too,
and the `--use-remote-sudo` option indicates that we need to use sudo permission on the remote server to deploy the configuration.

If you want to build the configuration locally and deploy it to the remote server, just replace `--build-host aquamarinr` with `--build-host localhost`.

Instead of use ip address directly, we can also define some host aliases in `~/.ssh/config` or `/etc/ssh/ssh_config`, for example:

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

## 4. Work with Makefile

> NOTE: Makefile's target name should not be the same as one of the file or directory in the current directory, otherwise the target will not be executed!

I use Makefile to manage the commands of my flake, which is very convenient.

For example, my Makefile looks like this:

```makefile
#
#  NOTE: Makefile's target name should not be the same as one of the file or directory in the current directory,
#    otherwise the target will not be executed!
#


############################################################################
#
#  Nix commands related to the local machine
#
############################################################################

deploy:
	nixos-rebuild switch --flake . --use-remote-sudo

debug:
	nixos-rebuild switch --flake . --use-remote-sudo --show-trace --verbose

update:
	nix flake update

history:
	nix profile history --profile /nix/var/nix/profiles/system

gc:
	# remove all generations older than 7 days
	sudo nix profile wipe-history --profile /nix/var/nix/profiles/system  --older-than 7d

	# garbage collect all unused nix store entries
	sudo nix store gc --debug

############################################################################
#
#  Idols, Commands related to my remote distributed building cluster
#
############################################################################

add-idols-ssh-key:
	ssh-add ~/.ssh/ai-idols

aqua: add-idols-ssh-key
	nixos-rebuild --flake .#aquamarine --target-host aquamarine --build-host aquamarine switch --use-remote-sudo

aqua-debug: add-idols-ssh-key
	nixos-rebuild --flake .#aquamarine --target-host aquamarine --build-host aquamarine switch --use-remote-sudo --show-trace --verbose

ruby: add-idols-ssh-key
	nixos-rebuild --flake .#ruby --target-host ruby --build-host ruby switch --use-remote-sudo

ruby-debug: add-idols-ssh-key
	nixos-rebuild --flake .#ruby --target-host ruby --build-host ruby switch --use-remote-sudo --show-trace --verbose

kana: add-idols-ssh-key
	nixos-rebuild --flake .#kana --target-host kana --build-host kana switch --use-remote-sudo

kana-debug: add-idols-ssh-key
	nixos-rebuild --flake .#kana --target-host kana --build-host kana switch --use-remote-sudo --show-trace --verbose

idols: aqua ruby kana

idols-debug: aqua-debug ruby-debug kana-debug
```

Save the above Makefile to the root directory of the flake, and then we can use `make deploy` to deploy the configuration to the local machine, and use `make idols` to deploy the configuration to all my remote servers.


## References

- [Tips&Tricks for NixOS Desktop - NixOS Discourse][Tips&Tricks for NixOS Desktop - NixOS Discourse]

[Tips&Tricks for NixOS Desktop - NixOS Discourse]: https://discourse.nixos.org/t/tips-tricks-for-nixos-desktop/28488
