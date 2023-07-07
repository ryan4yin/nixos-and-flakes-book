# Introduction to Nix & NixOS

Nix is a declarative package manager that enables users to specify the desired system state in configuration files, and it takes responsibility for achieving that state.

> In simple terms, "declarative configuration" means that users only need to declare the desired outcome. For instance, if you declare that you want to replace the i3 window manager with sway, Nix will assist you in achieving that goal. You don't have to worry about the underlying details, such as which packages sway requires for installation, which i3-related packages need to be uninstalled, or the necessary adjustments to system configuration and environment variables for sway. Nix automatically handles these details for the user (provided that the Nix packages related to sway and i3 are properly designed).

NixOS, a Linux distribution built on top of the Nix package manager, can be described as "OS as Code." It employs declarative Nix configuration files to describe the entire state of the operating system.

An operating system consists of various software packages, configuration files, and text/binary data, all of which represent the current state of the system. Declarative configuration can manage only the static portion of this state. Dynamic data, such as PostgreSQL, MySQL, or MongoDB data, cannot be effectively managed through declarative configuration. It is not feasible to delete all new PostgreSQL data that is not declared in the configuration during each deployment. Therefore, **NixOS primarily focuses on managing a portion of the system state in a declarative manner**. Dynamic data mentioned above, along with the contents in the user's home directory, remain unaffected by NixOS when rolling back to a previous generation.

Although we cannot achieve complete system reproducibility, the `/home` directory, being an important user directory, contains many necessary configuration files. To bridge this gap, a significant community project called [home-manager](https://github.com/nix-community/home-manager) was initiated. home-manager is designed to manage user-level packages and configuration files within the user's home directory.

Due to Nix's features, such as being declarative and reproducible, Nix is not limited to managing desktop environments but is also extensively used for managing development environments, compilation environments, cloud virtual machines, and container image construction. [NixOps](https://github.com/NixOS/nixops) from the official Nix project and [deploy-rs](https://github.com/serokell/deploy-rs) from the community are both operational tools based on Nix.

## Why NixOS?

I first learned about the Nix package manager several years ago. It utilizes the Nix language to describe system configuration, and the Linux distribution built on top of it allows for rolling back the system to any previous state (though only the state declared in Nix configuration files can be rolled back). While it sounded impressive, I found it troublesome to learn a new language and write code to install packages, so I didn't pursue it at the time.

However, I recently encountered numerous environmental issues while using EndeavourOS, and resolving them consumed a significant amount of my energy, leaving me exhausted. Upon careful consideration, I realized that the lack of version control and rollback mechanisms in EndeavourOS prevented me from restoring the system when problems arose.

That's when I decided to switch to NixOS.

To my delight, NixOS has exceeded my expectations. The most astonishing aspect is that I can now restore my entire i3 environment and all my commonly used packages on a fresh NixOS host with just one command `sudo nixos-rebuild switch --flake .`. It's truly fantastic!

The rollback capability of NixOS has instilled a great deal of confidence in me—I no longer fear breaking the system. I've even ventured into experimenting with new things on NixOS, such as the hyprland compositor. Previously, on EndeavourOS, I wouldn't have dared to tinker with such novel compositors, as any system mishaps would have entailed significant manual troubleshooting using various workarounds.

This is why I chose NixOS.
