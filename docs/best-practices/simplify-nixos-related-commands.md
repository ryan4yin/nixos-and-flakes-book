# Simplifying NixOS-Related Commands

To simplify NixOS-related commands, I utilize a Makefile, which proves to be very convenient.

Alternatively, you can also use similar tools like [just](https://github.com/casey/just) and [cargo-make](https://github.com/sagiegurari/cargo-make) for this purpose. Here, I will provide my approach as a reference.

Below is an example of how my Makefile looks:

> **NOTE**: The target names in the Makefile should not conflict with any file or directory names in the current directory. Otherwise, the targets will not execute.

```makefile
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
#  Idols: Commands related to my remote distributed building cluster
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

idols: aqua ruby

idols-debug: aqua-debug ruby-debug
```

By Save the above Makefile to the root directory of your Nix flake. Then, I can use `make deploy` to deploy the configuration to my local machine, and `make idols` to deploy the configuration to all my remote servers.

This approach simplifies the execution of NixOS commands by abstracting them behind target names in the Makefile, providing a more user-friendly and convenient experience.
