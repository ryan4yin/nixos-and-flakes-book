# Introduction to Nix & NixOS

Nix is a declarative package manager, that allows users to declare the expected system state in some configuration files, and Nix is responsible for achieving that goal.

> In simple terms, "declarative configuration" means that users only need to declare the result they want. For example, you declare that you want to replace the i3 window manager with sway, then Nix will help you achieve the goal. You don't need to worry about the underlying details (such as which packages sway needs to install, which i3-related packages need to be uninstalled, which system configuration or environment variables need to be adjusted for sway, what adjustments need to be made to the Sway parameters if an Nvidia graphics card is used, etc.), Nix will automatically handle these details for the user(prerequisite: if the nix packages related to sway & i3 are designed properly.).

NixOS, the Linux distribution built on top of the Nix package manager, can be simply described as "OS as Code", which describes the entire operating system's state using declarative Nix configuration files.

An operating system has a variety of software packages, configuration files, text/binary data, which are all the current state of the system, and declarative configuration can manage only the static part of it.
Those dynamic data (such as PostgreSQL/MySQL/MongoDB data) are obviously not manageable through a declarative configuration (you can't just delete all new postgresql data that is not declared in the configuration at every deployment).
Therefore, **NixOS actually only supports to manage part of the state of the system in a declarative way**, and all the dynamic data mentioned above, as well as all the contents in the user's home directory, are not controlled by it (so when you rollback your NixOS to the last generation, NixOS will do nothing on these content).

Although we cannot make the entire system reproducible, the `/home` directory, as an important user directory, does have many necessary configuration files.
Another important community project, [home-manager](https://github.com/nix-community/home-manager), filled this gap.
home-manager is designed to manage user-level packages & configuration files in user's home directory.

Due to Nix's features such as declarative and reproducible, Nix is not only used to manage desktop environments but also widely used to manage development environments, compilation environments, cloud virtual machines, container image construction, etc. [NixOps](https://github.com/NixOS/nixops) from the Nix official and [deploy-rs](https://github.com/serokell/deploy-rs) from the community are both operations tools based on Nix.

## Why NixOS?

I heard about the Nix package manager several years ago. It uses the Nix language to describe system configuration, and the Linux distribution built on top of it can roll back the system to any historical state at any time(In fact, only the state declared by nix configuration files can be rollback). Although it sounds impressive, it requires learning a new language and writing code to install packages, I thought it was too troublesome and didn't study it at the time.

But I recently encountered a lot of environmental problems in the process of using EndeavourOS, and I spent a lot of energy solving them, which made me exhausted. After thinking about it carefully, I realized that the root cause was that EndeavourOS do not have any version control and rollback mechanism, which caused the system to be unable to be restored when problems occurred.

So I switched to NixOS.

I am quite satisfied with NixOS, even more than expected.
The most amazing thing is, now I can restore the entire i3 environment and my commonly used packages on a fresh NixOS host with just one command, that's really fantastic!

The rollback capability of NixOS gave me a lot of confidence - I no longer fear breaking the system anymore. I even tried a lot of new things on NixOS, such as hyprland compositor. (I wouldn't have dared to play with such new compositors on EndeavourOS - it would have been a big hassle if something went wrong with the system and I need to fix it manually through various tricks.)

That's why I chose NixOS.
