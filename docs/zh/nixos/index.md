
## VI. Managing the system declaratively

> https://nixos.wiki/wiki/Overview_of_the_NixOS_Linux_distribution

After learning the basics of the Nix language, we can start using it to configure our NixOS. The default configuration for NixOS is located at `/etc/nixos/configuration.nix`, which contains all the declarative configuration for the system, such as time zone, language, keyboard layout, network, users, file system, boot options, etc.

If we want to modify the system state in a reproducible way (**which is also the most recommended way**), we need to manually edit `/etc/nixos/configuration.nix`, and then execute `sudo nixos-rebuild switch` to apply the modified configuration, it will generate a new system environment based on the configuration file we modified, sets the new environment as the default one, and also preserves & added the previous environment into the boot options of grub/sytemd-boot. This ensures we can always roll back to the old environment(even if the new environment fails to start).

`/etc/nixos/configuration.nix` is the classic method to configure NixOS, which relies on data sources configured by `nix-channel` and has no version-locking mechanism, making it difficult to ensure the reproducibility of the system. **A better approach is to use Flakes**, which can ensure the reproducibility of the system and make it easy to manage the configuration.

Now first, let's learn how to manage NixOS through the classic method, `/etc/nixos/configuration.nix`, and then migrate to the more advanced Flakes.

### 1. Configuring the system using `/etc/nixos/configuration.nix`

As I mentioned earlier, this is the classic method to configured NixOS, and also the default method currently used by NixOS. It relies on data sources configured by `nix-channel` and has no version-locking mechanism, making it difficult to ensure the reproducibility of the system.

For example, to enable ssh and add a user "ryan", simply add the following content into `/etc/nixos/configuration.nix`:

```nix
# Edit this configuration file to define what should be installed on
# your system.  Help is available in the configuration.nix(5) man page
# and in the NixOS manual (accessible by running 'nixos-help').
{ config, pkgs, ... }:

{
  imports =
    [ # Include the results of the hardware scan.
      ./hardware-configuration.nix
    ];

  # Omit the previous configuration.......

  # add user ryan
  users.users.ryan = {
    isNormalUser = true;
    description = "ryan";
    extraGroups = [ "networkmanager" "wheel" ];
    openssh.authorizedKeys.keys = [
        # replace with your own public key
        "ssh-ed25519 <some-public-key> ryan@ryan-pc"
    ];
    packages = with pkgs; [
      firefox
    #  thunderbird
    ];
  };

  # enable openssh-server
  services.openssh = {
    enable = true;
    permitRootLogin = "no";         # disable root login
    passwordAuthentication = false; # disable password login
    openFirewall = true;
    forwardX11 = true;              # enable X11 forwarding
  };

  # omit the rest of the configuration.......
}
```

In this configuration, we declared that we want to enable the openssh service, add an ssh public key for the user ryan, and disable password login.

Now, let's run `sudo nixos-rebuild switch` to deploy the modified configuration, and then we can login to the system using ssh with the ssh keys we configured.

Any reproducible changes to the system can be made by modifying `/etc/nixos/configuration.nix` and deploying the changes by running `sudo nixos-rebuild switch`.

All configuration options in `/etc/nixos/configuration.nix` can be found in the following places:

- By searching on Google, such as `Chrome NixOS`, which will provide NixOS informations related to Chrome. Generally, the NixOS Wiki and the source code of Nixpkgs will be among the top results.
- By searching for keywords in [NixOS Options Search](https://search.nixos.org/options).
- For system-level configuration, relevant documentation can be found in [Configuration - NixOS Manual](https://nixos.org/manual/nixos/unstable/index.html#ch-configuration).
- By searching for keywords directly in the source code of [nixpkgs](https://github.com/NixOS/nixpkgs) on GitHub.

### 2. Enabling NixOS Flakes Support

Compared to the default configuration approach of NixOS, Flakes provide better reproducibility and a clearer package structure that is easier to maintain. Therefore, it is recommended to manage NixOS with Flakes.

However, as Flakes is still an experimental feature currently, it's not enabled by default yet, we need to enable it manually by modifying `/etc/nixos/configuration.nix`, example as follows:

```nix
# Edit this configuration file to define what should be installed on
# your system.  Help is available in the configuration.nix(5) man page
# and in the NixOS manual (accessible by running 'nixos-help').
{ config, pkgs, ... }:

{
  imports =
    [ # Include the results of the hardware scan.
      ./hardware-configuration.nix
    ];

  # omit the previous configuration.......

  # enable Flakes and the new command line tool
  nix.settings.experimental-features = [ "nix-command" "flakes" ];

  environment.systemPackages = with pkgs; [
    # Flakes uses git to pull dependencies from data sources, so git must be installed first
    git
    vim
    wget
    curl

  ];

  # omit the rest of the configuration.......
}
```

Now run `sudo nixos-rebuild switch` to apply the changes, and then you can write the configuration for NixOS with Flakes.

### 3. Switching System Configuration to `flake.nix`

After enabling `flakes`, `sudo nixos-rebuild switch` will try to read`/etc/nixos/flake.nix` first every time you run it, if not found, it will fallback to `/etc/nixos/configuration.nix`.

Now to learn how to write a flake, let's take a look at the official flake templates provided by Nix. First, check which templates are available:

```bash
nix flake show templates
```

The templates `templates#full` contains all possible usecases, let's take a look at it:

```bash
nix flake init -t templates#full
cat flake.nix
```

After reading this example, let's create a file `/etc/nixos/flake.nix` and copy the content of the example into it.
With `/etc/nixos/flake.nix`, all system modifications will be taken over by Flakes from now on.

The template we copied CAN NOT be used directly, we need to modify it to make it work, an example of `/etc/nixos/flake.nix` is as follows:

```nix
{
  description = "Ryan's NixOS Flake";

  # This is the standard format for flake.nix. `inputs` are the dependencies of the flake,
  # and `outputs` function will return all the build results of the flake.
  # Each item in `inputs` will be passed as a parameter to the `outputs` function after being pulled and built.
  inputs = {
    # There are many ways to reference flake inputs. The most widely used is github:owner/name/reference,
    # which represents the GitHub repository URL + branch/commit-id/tag.

    # Official NixOS package source, using nixos-unstable branch here
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    # home-manager, used for managing user configuration
    home-manager = {
      url = "github:nix-community/home-manager/release-22.11";
      # The `follows` keyword in inputs is used for inheritance.
      # Here, `inputs.nixpkgs` of home-manager is kept consistent with the `inputs.nixpkgs` of the current flake,
      # to avoid problems caused by different versions of nixpkgs.
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };

  # `outputs` are all the build result of the flake.
  # A flake can have many use cases and different types of outputs.
  # parameters in `outputs` are defined in `inputs` and can be referenced by their names.
  # However, `self` is an exception, This special parameter points to the `outputs` itself (self-reference)
  # The `@` syntax here is used to alias the attribute set of the inputs's parameter, making it convenient to use inside the function.
  outputs = { self, nixpkgs, ... }@inputs: {
    nixosConfigurations = {
      # By default, NixOS will try to refer the nixosConfiguration with its hostname.
      # so the system named `nixos-test` will use this configuration.
      # However, the configuration name can also be specified using `sudo nixos-rebuild switch --flake /path/to/flakes/directory#<name>`.
      # The `nixpkgs.lib.nixosSystem` function is used to build this configuration, the following attribute set is its parameter.
      # Run `sudo nixos-rebuild switch --flake .#nixos-test` in the flake's directory to deploy this configuration on any NixOS system
      "nixos-test" = nixpkgs.lib.nixosSystem {
        system = "x86_64-linux";

        # The Nix module system can modularize configuration, improving the maintainability of configuration.
        #
        # Each parameter in the `modules` is a Nix Module, and there is a partial introduction to it in the nixpkgs manual:
        #    <https://nixos.org/manual/nixpkgs/unstable/#module-system-introduction>
        # It is said to be partial because the documentation is not complete, only some simple introductions
        #    (such is the current state of Nix documentation...)
        # A Nix Module can be an attribute set, or a function that returns an attribute set.
        # If a Module is a function, this function can only have the following parameters:
        #
        #  lib:     the nixpkgs function library, which provides many useful functions for operating Nix expressions
        #            https://nixos.org/manual/nixpkgs/stable/#id-1.4
        #  config:  all config options of the current flake
        #  options: all options defined in all NixOS Modules in the current flake
        #  pkgs:   a collection of all packages defined in nixpkgs.
        #           you can assume its default value is `nixpkgs.legacyPackages."${system}"` for now.
        #           can be customed by `nixpkgs.pkgs` option
        #  modulesPath: the default path of nixpkgs's builtin modules folder,
        #               used to import some extra modules from nixpkgs.
        #               this parameter is rarely used, you can ignore it for now.
        #
        # Only these parameters can be passed by default.
        # If you need to pass other parameters, you must use `specialArgs` by uncomment the following line
        # specialArgs = {...}  # pass custom arguments into sub module.
        modules = [
          # Import the configuration.nix we used before, so that the old configuration file can still take effect.
          # Note: /etc/nixos/configuration.nix itself is also a Nix Module, so you can import it directly here
          ./configuration.nix
        ];
      };
    };
  };
}
```

Here we defined a NixOS system called `nixos-test`, whose configuration file is `./configuration.nix`, which is the classic configuration we modified before, so we can still make use of it.

Now run `sudo nixos-rebuild switch` to apply the configuration, and no changes will be made to the system, because we imported the old configuration file in `/etc/nixos/flake.nix`, so the actual state we declared remains unchanged.

### 4. Manage system software through Flakes

After the switch, we can now manage the system through Flakes. The most common requirement for managing a system is to install softwares. We have seen how to install packages through `environment.systemPackages` before, and these packages are all from the official nixpkgs repository.

Now let's learn how to install packages from other sources through Flakes. This is much more flexible than installing from nixpkgs directly. The most obvious benefit is that you can easily set the version of the software.

Use [helix](https://github.com/helix-editor/helix) editor as an example, first we need to add the helix as an input into `flake.nix`:

```nix
{
  description = "NixOS configuration of Ryan Yin";

  # ......

  inputs = {
    # ......

    # helix editor, use the tag 23.05
    helix.url = "github:helix-editor/helix/23.05";
  };

  outputs = inputs@{ self, nixpkgs, ... }: {
    nixosConfigurations = {
      nixos-test = nixpkgs.lib.nixosSystem {
        system = "x86_64-linux";

        # set all inputs parameters as specialArgs of all sub module
        # so that we can use `helix` input in sub modules
        specialArgs = inputs;
        modules = [
          ./configuration.nix
        ];
      };
    };
  };
}
```

Then udpate `configuration.nix` to install `helix` from the input `helix`:

```nix
# Nix will automatically inject `helix` from specialArgs
# into the third parameter of this function through name matching
{ config, pkgs, helix, ... }:

{
  # omit other configuration......

  environment.systemPackages = with pkgs; [
    git
    vim
    wget
    curl

    # install helix from the input `helix`
    helix.packages."${pkgs.system}".helix
  ];

  # omit other configuration......
}
```

Now deploy the changes by `sudo nixos-rebuild switch`, and then we can start the helix editor by `helix` command.

### 5. Add Custom Cache Mirror

> You can skip this section if you don't need to customize the cache mirror.

To speed up package building, Nix provides <https://cache.nixos.org> to cache build results to avoid build every packages locally.

With the NixOS's classic configuration method, other cache sources can be added by using `nix-channel`, but Flakes avoids using any system-level configuration and environment variables to ensure that its build results are not affected by the environment(so the build results are reproducible).

Therefore, to customize the cache source, we must add the related configuration in `flake.nix` by using the parameter `nixConfig`. An example is as follows:

```nix
{
  description = "NixOS configuration of Ryan Yin";

  # 1. To ensure purity, Flakes does not rely on the system's `/etc/nix/nix.conf`, so we have to set related configuration here.
  # 2. To ensure security, flake allows only a few nixConfig parameters to be set directly by default.
  #    you need to add `--accept-flake-config` when executing the nix command,
  #    otherwise all other parameters will be ignored, and an warning will printed by nix.
  nixConfig = {
    experimental-features = [ "nix-command" "flakes" ];
    substituters = [
      # replace official cache with a mirror located in China
      "https://mirrors.bfsu.edu.cn/nix-channels/store"
      "https://cache.nixos.org/"
    ];

    extra-substituters = [
      # nix community's cache server
      "https://nix-community.cachix.org"
    ];
    extra-trusted-public-keys = [
      "nix-community.cachix.org-1:mB9FSh9qf2dCimDSUo8Zy7bkq5CX+/rkCWyvRCYg3Fs="
    ];
  };

  inputs = {
    # omit some configuration...
  };

  outputs = {
    # omit some configuration...
  };
}

```

After the modification, run `sudo nixos-rebuild switch` to apply the updates.

### 6. Install home-manager

As I mentioned earlier, NixOS can only manage system-level configuration, to manage the Home directory(user-level configuration), we need to install home-manager.

According to the official document [Home Manager Manual](https://nix-community.github.io/home-manager/index.htm), in order to install home-manager as a module of NixOS, we need to create `/etc/nixos/home.nix` first, an example content shown below:

```nix
{ config, pkgs, ... }:

{
  # TODO please change the username & home direcotry to your own
  home.username = "ryan";
  home.homeDirectory = "/home/ryan";

  # link the configuration file in current directory to the specified location in home directory
  # home.file.".config/i3/wallpaper.jpg".source = ./wallpaper.jpg;

  # link all files in `./scripts` to `~/.config/i3/scripts`
  # home.file.".config/i3/scripts" = {
  #   source = ./scripts;
  #   recursive = true;   # link recursively
  #   executable = true;  # make all files executable
  # };

  # encode the file content in nix configuration file directly
  # home.file.".xxx".text = ''
  #     xxx
  # '';

  # set cursor size and dpi for 4k monitor
  xresources.properties = {
    "Xcursor.size" = 16;
    "Xft.dpi" = 172;
  };

  # basic configuration of git, please change to your own
  programs.git = {
    enable = true;
    userName = "Ryan Yin";
    userEmail = "xiaoyin_c@qq.com";
  };

  # Packages that should be installed to the user profile.
  home.packages = [
    # here is some command line tools I use frequently
    # feel free to add your own or remove some of them

    neofetch
    nnn # terminal file manager

    # archives
    zip
    xz
    unzip
    p7zip

    # utils
    ripgrep # recursively searches directories for a regex pattern
    jq # A lightweight and flexible command-line JSON processor
    yq-go # yaml processer https://github.com/mikefarah/yq
    exa # A modern replacement for ‘ls’
    fzf # A command-line fuzzy finder

    # networking tools
    mtr # A network diagnostic tool
    iperf3
    dnsutils  # `dig` + `nslookup`
    ldns # replacement of `dig`, it provide the command `drill`
    aria2 # A lightweight multi-protocol & multi-source command-line download utility
    socat # replacement of openbsd-netcat
    nmap # A utility for network discovery and security auditing
    ipcalc  # it is a calculator for the IPv4/v6 addresses

    # misc
    cowsay
    file
    which
    tree
    gnused
    gnutar
    gawk
    zstd
    gnupg

    # nix related
    #
    # it provides the command `nom` works just like `nix
    # with more details log output
    nix-output-monitor

    # productivity
    hugo # static site generator
    glow # markdown previewer in terminal

    btop  # replacement of htop/nmon
    iotop # io monitoring
    iftop # network monitoring

    # system call monitoring
    strace # system call monitoring
    ltrace # library call monitoring
    lsof # list open files

    # system tools
    sysstat
    lm_sensors # for `sensors` command
    ethtool
    pciutils # lspci
    usbutils # lsusb
  ];

  # starship - an customizable prompt for any shell
  programs.starship = {
    enable = true;
    settings = {
      add_newline = false;
      aws.disabled = true;
      gcloud.disabled = true;
      line_break.disabled = true;
    };
  };

  # alacritty - a cross-platform, GPU-accelerated terminal emulator
  programs.alacritty = {
    enable = true;
      env.TERM = "xterm-256color";
      font = {
        size = 12;
        draw_bold_text_with_bright_colors = true;
      };
      scrolling.multiplier = 5;
      selection.save_to_clipboard = true;
  };

  programs.bash = {
    enable = true;
    enableCompletion = true;
    bashrcExtra = ''
      export PATH="$PATH:$HOME/bin:$HOME/.local/bin:$HOME/go/bin"
    '';

    # set some aliases, feel free to add more or remove some
    shellAliases = {
      urldecode = "python3 -c 'import sys, urllib.parse as ul; print(ul.unquote_plus(sys.stdin.read()))'";
      urlencode = "python3 -c 'import sys, urllib.parse as ul; print(ul.quote_plus(sys.stdin.read()))'";
      httpproxy = "export https_proxy=http://127.0.0.1:7890; export http_proxy=http://127.0.0.1:7890;";
    };
  };

  # This value determines the home Manager release that your
  # configuration is compatible with. This helps avoid breakage
  # when a new home Manager release introduces backwards
  # incompatible changes.
  #
  # You can update home Manager without changing this value. See
  # the home Manager release notes for a list of state version
  # changes in each release.
  home.stateVersion = "22.11";

  # Let home Manager install and manage itself.
  programs.home-manager.enable = true;
}
```

After adding `/etc/nixos/home.nix`, you need to import this new configuration file in `/etc/nixos/flake.nix` to make use of it, use the following command to generate an example in the current folder for reference:

```shell
nix flake new example -t github:nix-community/home-manager#nixos
```

After adjusting the parameters, the content of `/etc/nixos/flake.nix` is as follows:

```nix
{
  description = "NixOS configuration";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-unstable";
    home-manager.url = "github:nix-community/home-manager";
    home-manager.inputs.nixpkgs.follows = "nixpkgs";
  };

  outputs = inputs@{ nixpkgs, home-manager, ... }: {
    nixosConfigurations = {
      # TODO please change the hostname to your own
      nixos-test = nixpkgs.lib.nixosSystem {
        system = "x86_64-linux";
        modules = [
          ./configuration.nix

          # make home-manager as a module of nixos
          # so that home-manager configuration will be deployed automatically when executing `nixos-rebuild switch`
          home-manager.nixosModules.home-manager
          {
            home-manager.useGlobalPkgs = true;
            home-manager.useUserPackages = true;

            # TODO replace ryan with your own username
            home-manager.users.ryan = import ./home.nix;

            # Optionally, use home-manager.extraSpecialArgs to pass arguments to home.nix
          }
        ];
      };
    };
  };
}
```

Then run `sudo nixos-rebuild switch` to apply the configuration, and home-manager will be installed automatically.

After the installation, all user-level packages and configuration can be managed through `/etc/nixos/home.nix`. When running `sudo nixos-rebuild switch`, the configuration of home-manager will be applied automatically. (**It's not necessary to run `home-manager switch` manually**!)

To find the options we can use in `home.nix`, referring to the following documents:

- [Home Manager - Appendix A. Configuration Options](https://nix-community.github.io/home-manager/options.html): A list of all options, it is recommended to search for keywords in it.
- [home-manager](https://github.com/nix-community/home-manager): Some options are not listed in the official documentation, or the documentation is not clear enough, you can directly search and read the corresponding source code in this home-manager repo.

### 7. Modular NixOS configuration

At this point, the skeleton of the entire system is basically configured. The current configuration structure in `/etc/nixos` should be as follows:

```
$ tree
.
├── flake.lock
├── flake.nix
├── home.nix
└── configuration.nix
```

The functions of these four files are explained below:

- `flake.lock`: An automatically generated version-lock file, which records all input sources, hash values, and version numbers of the entire flake to ensure that the system is reproducible.
- `flake.nix`: The entry file, which will be recognized and deployed when executing `sudo nixos-rebuild switch`.
  - See [Flakes - NixOS Wiki](https://nixos.wiki/wiki/Flakes) for all options of flake.nix.
- `configuration.nix`: Imported as a nix module in flake.nix, all system-level configuration are currently written here.
  - See [Configuration - NixOS Manual](https://nixos.org/manual/nixos/unstable/index.html#ch-configuration) for all options of configuration.nix.
- `home.nix`: Imported by home-manager as the configuration of the user `ryan` in flake.nix, that is, it contains all the configuration of `ryan`, and is responsible for managing `ryan`'s home folder.
  - See [Appendix A. Configuration Options - home Manager](https://nix-community.github.io/home-manager/options.html) for all options of home.nix.

By modifying these files, you can change the status of the system and the home directory declaratively.

As the configuration increases, it will be difficult to maintain the configuration by relying solely on `configuration.nix` and `home.nix`. Therefore, a better solution is to use the nix module system to split the configuration into multiple modules and write them in a classified manner.

nix module system provide a paramter, `imports`, which accept a list of `.nix` files, and merge all the configuration defined in these files into the current nix module. Note that the word used here is "**merge**", which means that `imports` will **NOT** simply overwrite the duplicate configuration, but handle them more reasonably. For example, if I define `program.packages = [...]` in multiple modules, then `imports` will merge all `program.packages` defined in all nix modules into one list. Not only lists can be merged correctly, but attribute sets can also be merged correctly. The specific behavior can be explored by yourself.

> I only found a description of `imports` in [nixpkgs-unstable official manual - evalModules parameters](https://nixos.org/manual/nixpkgs/unstable/#module-system-lib-evalModules-parameters): `A list of modules. These are merged together to form the final configuration.`, it's a bit ambiguous...

With the help of `imports`, we can split `home.nix` and `configuration.nix` into multiple nix modules defined in diffrent `.nix` files.

Use [ryan4yin/nix-config/v0.0.2](https://github.com/ryan4yin/nix-config/tree/v0.0.2) as an example, which is the configuration of my previous NixOS system with i3 window manager. The structure of it is as follows:

```shell
├── flake.lock
├── flake.nix
├── home
│   ├── default.nix         # here we import all submodules by imports = [...]
│   ├── fcitx5              # fcitx5 input method's configuration
│   │   ├── default.nix
│   │   └── rime-data-flypy
│   ├── i3                  # i3 window manager's configuration
│   │   ├── config
│   │   ├── default.nix
│   │   ├── i3blocks.conf
│   │   ├── keybindings
│   │   └── scripts
│   ├── programs
│   │   ├── browsers.nix
│   │   ├── common.nix
│   │   ├── default.nix   # here we import all modules in programs folder by imports = [...]
│   │   ├── git.nix
│   │   ├── media.nix
│   │   ├── vscode.nix
│   │   └── xdg.nix
│   ├── rofi              #  rofi launcher's configuration
│   │   ├── configs
│   │   │   ├── arc_dark_colors.rasi
│   │   │   ├── arc_dark_transparent_colors.rasi
│   │   │   ├── power-profiles.rasi
│   │   │   ├── powermenu.rasi
│   │   │   ├── rofidmenu.rasi
│   │   │   └── rofikeyhint.rasi
│   │   └── default.nix
│   └── shell             # shell/terminal related configuration
│       ├── common.nix
│       ├── default.nix
│       ├── nushell
│       │   ├── config.nu
│       │   ├── default.nix
│       │   └── env.nu
│       ├── starship.nix
│       └── terminals.nix
├── hosts
│   ├── msi-rtx4090      # My main machine's configuration
│   │   ├── default.nix  # This is the old configuration.nix, but most of the content has been split out to modules.
│   │   └── hardware-configuration.nix  # hardware & disk related configuration, autogenerated by nixos
│   └── nixos-test       # my test machine's configuration
│       ├── default.nix
│       └── hardware-configuration.nix
├── modules          # some common NixOS modules that can be reused
│   ├── i3.nix
│   └── system.nix
└── wallpaper.jpg    # wallpaper
```

For more details, see [ryan4yin/nix-config/v0.0.2](https://github.com/ryan4yin/nix-config/tree/v0.0.2).

#### 7.1. `mkOverride`, `lib.mkDefault` and `lib.mkForce`

You may found some people use `lib.mkDefault` `lib.mkForce` to define values in Nix files, as their names suggest, `lib.mkDefault` and `lib.mkForce` are used to set default values or force values of options.

You can read the source code of `lib.mkDefault` and `lib.mkForce` to understand them by running `nix repl -f '<nixpkgs>'` and then enter `:e lib.mkDefault`(To learn the basic usage of `nix repl`, just type `:?` to see the help information).

its source code is as follows:

```nix
  # ......

  mkOverride = priority: content:
    { _type = "override";
      inherit priority content;
    };

  mkOptionDefault = mkOverride 1500; # priority of option defaults
  mkDefault = mkOverride 1000; # used in config sections of non-user modules to set a default
  mkImageMediaOverride = mkOverride 60; # image media profiles can be derived by inclusion into host config, hence needing to override host config, but do allow user to mkForce
  mkForce = mkOverride 50;
  mkVMOverride = mkOverride 10; # used by ‘nixos-rebuild build-vm’

  # ......
```

So `lib.mkDefault` is used to set default values of options, it has a priority of 1000 internally,
and `lib.mkForce` is used to force values of options, it has a priority of 50 internally.
If you just set a value of an option directly, it will be set with a default priority of 1000(the same as `lib.mkDefault`).

the lower the `priority`'s value is, the higher the actual priority is, so `lib.mkForce` has a higher priority than `lib.mkDefault`.
If you defined multiple values with the same priority, Nix will throw an error.

They are useful to modularize the configuration, as you can set default values in a low-level module(base module), and force values in a high-level module.

For example, I defined some default values in <https://github.com/ryan4yin/nix-config/blob/main/modules/nixos/core-server.nix#L30>:

```nix
{ lib, pkgs, ... }:

{
  # ......

  nixpkgs.config.allowUnfree = lib.mkDefault false;

  # ......
}
```

And for my dekstop machine, I force the values to another value in <https://github.com/ryan4yin/nix-config/blob/main/modules/nixos/core-desktop.nix#L15>:

```nix
{ lib, pkgs, ... }:

{
  # import the base module
  imports = [
    ./core-server.nix
  ];

  # override the default value defined in the base module
  nixpkgs.config.allowUnfree = lib.mkForce true;

  # ......
}
```

#### 7.2 `lib.mkOrder`, `lib.mkBefore` and `lib.mkAfter`

`lib.mkBefore` and `lib.mkAfter` are used to set the merge order of **list-type options**, just like `lib.mkDefault` and `lib.mkForce`, they're also useful to modularize the configuration.

I said before that if you defined multiple values with the same **override priority**, Nix will throw an error.
But with `lib.mkOrder`, `lib.mkBefore` or `lib.mkAfter`, you can define multiple values with the same override priority, they will be merged in the order you defined.

Let's running `nix repl -f '<nixpkgs>'` and then enter `:e lib.mkBefore` to take a look at its source code(To learn the basic usage of `nix repl`, just type `:?` to see the help information):

```nix
  # ......

  mkOrder = priority: content:
    { _type = "order";
      inherit priority content;
    };

  mkBefore = mkOrder 500;
  mkAfter = mkOrder 1500;

  # The default priority for things that don't have a priority specified.
  defaultPriority = 100;

  # ......
```

So `lib.mkBefore` is a shortcut for `lib.mkOrder 500`, and `lib.mkAfter` is a shortcut for `lib.mkOrder 1500`.

To test the usage of `lib.mkBefore` and `lib.mkAfter`, let's create a simple Flake project:

```shell
# create flake.nix with the following content
› cat <<EOF | sudo tee flake.nix
{
  description = "Ryan's NixOS Flake";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-23.05";
  };

  outputs = { self, nixpkgs, ... }@inputs: {
    nixosConfigurations = {
      "nixos-test" = nixpkgs.lib.nixosSystem {
        system = "x86_64-linux";

        modules = [
          # demo module 1, insert git at the head of list
          ({lib, pkgs, ...}: {
            environment.systemPackages = lib.mkBefore [pkgs.git];
          })

          # demo module 2, insert vim at the tail of list
          ({lib, pkgs, ...}: {
            environment.systemPackages = lib.mkAfter [pkgs.vim];
          })

          # demo module 3, just add curl to the list normally
          ({lib, pkgs, ...}: {
            environment.systemPackages = with pkgs; [curl];
          })
        ];
      };
    };
  };
}
EOF

# create flake.lock
› nix flake update

# enter nix repl environment
› nix repl
Welcome to Nix 2.13.3. Type :? for help.

# load the flake we just created
nix-repl> :lf .
Added 9 variables.

# check the order of systemPackages
nix-repl> outputs.nixosConfigurations.nixos-test.config.environment.systemPackages
[ «derivation /nix/store/0xvn7ssrwa0ax646gl4hwn8cpi05zl9j-git-2.40.1.drv»
  «derivation /nix/store/7x8qmbvfai68sf73zq9szs5q78mc0kny-curl-8.1.1.drv»
  «derivation /nix/store/bly81l03kh0dfly9ix2ysps6kyn1hrjl-nixos-container.drv»
  ......
  ......
  «derivation /nix/store/qpmpvq5azka70lvamsca4g4sf55j8994-vim-9.0.1441.drv» ]
```

So we can see that the order of `systemPackages` is `git -> curl -> default packages -> vim`, which is the same as the order we defined in `flake.nix`.

> Though it's useless to adjust the order of `systemPackages`, it may be helpful at some other places...

### 8. Update the system

With Flakes, it is also very simple to update the system. Just run the following commands in `/etc/nixos`:

```shell
# update flake.lock
nix flake update
# apply the updates
sudo nixos-rebuild switch
```

Sometimes you may encounter some error of sha256 mismatch when running `nixos-rebuild switch`, which may be solved by updating `flake.lock` through `nix flake update`.

### 9. Downgrade or upgrade some packages

After using Flakes, most people are currently using the `nixos-unstable` branch of nixpkgs. Sometimes you will encounter some bugs, such as the [chrome/vscode crash problem](https://github.com/swaywm/sway/issues/7562)

To resolve problems, we may need to downgrade or upgrade some packages. In Flakes, all package versions and hash values are one-to-one corresponding to the git commit of their flake input.
Therefore, to downgrade or upgrade a package, we need to lock the git commit of its flake input.

For exmaple, let's add multiple nixpkgs, each using a different git commit or branch:

```nix
{
  description = "NixOS configuration of Ryan Yin"

  inputs = {
    # default to nixos-unstable branch
    nixpkgs.url = "github:nixos/nixpkgs/nixos-unstable";

    # the latest stable branch of nixpkgs, used to rollback the version of some packages
    # the current latest version is 22.11
    nixpkgs-stable.url = "github:nixos/nixpkgs/nixos-22.11";

    # we can also use git commit hash to lock the version
    nixpkgs-fd40cef8d.url = "github:nixos/nixpkgs/fd40cef8d797670e203a27a91e4b8e6decf0b90c";
  outputs = inputs@{
    self,
    nixpkgs,
    nixpkgs-stable,
    nixpkgs-fd40cef8d,
    ...
  }: {
    nixosConfigurations = {
      nixos-test = nixpkgs.lib.nixosSystem rec {
        system = "x86_64-linux";

        # The core parameter, which passes the non-default nixpkgs instances to other nix modules
        specialArgs = {
          # To use packages from nixpkgs-stable, we need to configure some parameters for it first
          pkgs-stable = import nixpkgs-stable {
            system = system;  # refer the `system` parameter form outer scope recursively
            # To use chrome, we need to allow the installation of non-free software
            config.allowUnfree = true;
          };
          pkgs-fd40cef8d = import nixpkgs-fd40cef8d {
            system = system;
            config.allowUnfree = true;
          };
        };
        modules = [
          ./hosts/nixos-test

          # omit other configuration...
        ];
      };
    };
  };
}
```

And then refer the packages from `pkgs-stable` or `pkgs-fd40cef8d` in your sub module, a home manager's sub module as an example:

```nix
{
  pkgs,
  config,
  # nix will search and jnject this parameter from specialArgs in flake.nix
  pkgs-stable,
  # pkgs-fd40cef8d,
  ...
}:

{
  # refer packages from pkgs-stable instead of pkgs
  home.packages = with pkgs-stable; [
    firefox-wayland

    # chrome wayland support was broken on nixos-unstable branch, so fallback to stable branch for now
    # https://github.com/swaywm/sway/issues/7562
    google-chrome
  ];

  programs.vscode = {
    enable = true;
    package = pkgs-stable.vscode;  # refer vscode from pkgs-stable instead of pkgs
  };
}
```

After adjusted the configuration, deploy it with `sudo nixos-rebuild switch`, then your firefox/chrome/vscode will be downgraded to the version corresponding to `nixpkgs-stable` or `nixpkgs-fd40cef8d`.

> according to [1000 instances of nixpkgs](https://discourse.nixos.org/t/1000-instances-of-nixpkgs/17347), it's not a good practice to use `import` in sub modules to customize `nixpkgs`, because each `import` will create a new instance of nixpkgs, which will increase the build time and memory usage as the configuration grows. So here we create all nixpkgs instances in `flake.nix` to avoid this problem.

### 10. Manage the configuration with Git

NixOS configuration is just a set of text files, it is very suitable to be managed with Git, and thus we can easily rollback to a previous version when we encounter some problems.

However, NixOS places the configuration in `/etc/nixos` by default, which requires root permissions to modify, which is not convenient for daily use.
Luckily, Flakes can solve this problem, you can place your flake anywhere you like.

For example, my usage is to place my flake in `~/nixos-config`, and then create a soft link in `/etc/nixos`:

```shell
sudo mv /etc/nixos /etc/nixos.bak  # backup the original configuration
sudo ln -s ~/nixos-config/ /etc/nixos

# deploy the flake.nix located at the default location(/etc/nixos)
sudo nixos-rebuild switch
```

And then you can use Git to manage the configuration in `~/nixos-config`. The configuration can be used with ordinary user-level permissions, and it is not required to be owned by root.

Another method is jsut to delete `/etc/nixos` directly, and specify the configuration file path each time you deploy it:

```shell
sudo mv /etc/nixos /etc/nixos.bak
cd ~/nixos-config

# `--flake .#nixos-test` means deploy the flake.nix located in the current directory, and the nixosConfiguration's name is `nixos-test`
sudo nixos-rebuild switch --flake .#nixos-test
```

Choose whichever you like. After that, system rollback will become very simple, just switch to the previous commit and then deploy it:

```shell
cd ~/nixos-config
# switch to the previous commit
git checkout HEAD^1
# deploy the flake.nix located in the current directory, and the nixosConfiguration's name is `nixos-test`
sudo nixos-rebuild switch --flake .#nixos-test
```

More operations on Git are not described here. Generally speaking, rollback can be done directly through Git. Only when the system crashes completely, you will need to restart into bootloader and boot the system from the previous historical version.

### 11. View and delete history data {#view-and-delete-history}

As we mentioned before, each deployment of NixOS will generate a new version, and all versions will be added to the system boot options. In addition to restarting the computer, we can also query all available historical versions through the following command:

```shell
nix profile history --profile /nix/var/nix/profiles/system
```

The command to clean up historical versions to release storage space:

```shell
# delete all historical versions older than 7 days
sudo nix profile wipe-history --profile /nix/var/nix/profiles/system  --older-than 7d

# we need to collect garbages after wipe-history
sudo nix store gc --debug
```

Another command returns all packages installed in the system:

```shell
nix-env -qa
```
