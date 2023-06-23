
## 七、Nix Flakes 的使用 {#nix-flakes-usage}

到这里我们已经写了不少 Nix Flakes 配置来管理 NixOS 系统了，这里再简单介绍下 Nix Flakes 更细节的内容，以及常用的 nix flake 命令。

### 1. Flake 的 inputs {#flake-inputs}

`flake.nix` 中的 `inputs` 是一个 attribute set，用来指定当前 Flake 的依赖，inputs 有很多种类型，举例如下：

```nix
{
  inputs = {
    # 以 GitHub 仓库为数据源，指定使用 master 分支，这是最常见的 input 格式
    nixpkgs.url = "github:Mic92/nixpkgs/master";
    # Git URL，可用于任何基于 https/ssh 协议的 Git 仓库
    git-example.url = "git+https://git.somehost.tld/user/path?ref=branch&rev=fdc8ef970de2b4634e1b3dca296e1ed918459a9e";
    # 上面的例子会复制 .git 到本地, 如果数据量较大，建议使用 shallow=1 参数避免复制 .git
    git-directory-example.url = "git+file:/path/to/repo?shallow=1";
    # 本地文件夹 (如果使用绝对路径，可省略掉前缀 'path:')
    directory-example.url = "path:/path/to/repo";
    # 如果数据源不是一个 flake，则需要设置 flake=false
    bar = {
      url = "github:foo/bar/branch";
      flake = false;
    };

    sops-nix = {
      url = "github:Mic92/sops-nix";
      # `follows` 是 inputs 中的继承语法
      # 这里使 sops-nix 的 `inputs.nixpkgs` 与当前 flake 的 inputs.nixpkgs 保持一致，
      # 避免依赖的 nixpkgs 版本不一致导致问题
      inputs.nixpkgs.follows = "nixpkgs";
    };

    # 将 flake 锁定在某个 commit 上
    nix-doom-emacs = {
      url = "github:vlaci/nix-doom-emacs?rev=238b18d7b2c8239f676358634bfb32693d3706f3";
      flake = false;
    };

    # 使用 `dir` 参数指定某个子目录
    nixpkgs.url = "github:foo/bar?dir=shu";
  }
}
```

### 2. Flake 的 outputs {#flake-outputs}

`flake.nix` 中的 `outputs` 是一个 attribute set，是整个 Flake 的构建结果，每个 Flake 都可以有许多不同的 outputs。

一些特定名称的 outputs 有特殊用途，会被某些 Nix 命令识别处理，比如：

- Nix packages: 名称为 `apps.<system>.<name>`, `packages.<system>.<name>` 或 `legacyPackages.<system>.<name>` 的 outputs，都是 Nix 包，通常都是一个个应用程序。
  - 可以通过 `nix build .#name` 来构建某个 nix 包
- Nix Helper Functions: 名称为 `lib` 的 outputs 是 Flake 函数库，可以被其他 Flake 作为 inputs 导入使用。
- Nix development environments: 名称为 `devShells` 的 outputs 是 Nix 开发环境
  - 可以通过 `nix develop` 命令来使用该 Output 创建开发环境
- NixOS configurations: 名称为 `nixosConfigurations.<hostname>` 的 outputs，是 NixOS 的系统配置。
  - `nixos-rebuild switch .#<hostname>` 可以使用该 Output 来部署 NixOS 系统
- Nix templates: 名称为 `templates` 的 outputs 是 flake 模板
  - 可以通过执行命令 `nix flake init --template <reference>` 使用模板初始化一个 Flake 包
- 其他用户自定义的 outputs，可能被其他 Nix 相关的工具使用

NixOS Wiki 中给出的使用案例：

```nix
{ self, ... }@inputs:
{
  # Executed by `nix flake check`
  checks."<system>"."<name>" = derivation;
  # Executed by `nix build .#<name>`
  packages."<system>"."<name>" = derivation;
  # Executed by `nix build .`
  packages."<system>".default = derivation;
  # Executed by `nix run .#<name>`
  apps."<system>"."<name>" = {
    type = "app";
    program = "<store-path>";
  };
  # Executed by `nix run . -- <args?>`
  apps."<system>".default = { type = "app"; program = "..."; };

  # Formatter (alejandra, nixfmt or nixpkgs-fmt)
  formatter."<system>" = derivation;
  # Used for nixpkgs packages, also accessible via `nix build .#<name>`
  legacyPackages."<system>"."<name>" = derivation;
  # Overlay, consumed by other flakes
  overlays."<name>" = final: prev: { };
  # Default overlay
  overlays.default = {};
  # Nixos module, consumed by other flakes
  nixosModules."<name>" = { config }: { options = {}; config = {}; };
  # Default module
  nixosModules.default = {};
  # Used with `nixos-rebuild --flake .#<hostname>`
  # nixosConfigurations."<hostname>".config.system.build.toplevel must be a derivation
  nixosConfigurations."<hostname>" = {};
  # Used by `nix develop .#<name>`
  devShells."<system>"."<name>" = derivation;
  # Used by `nix develop`
  devShells."<system>".default = derivation;
  # Hydra build jobs
  hydraJobs."<attr>"."<system>" = derivation;
  # Used by `nix flake init -t <flake>#<name>`
  templates."<name>" = {
    path = "<store-path>";
    description = "template description goes here?";
  };
  # Used by `nix flake init -t <flake>`
  templates.default = { path = "<store-path>"; description = ""; };
}
```

### 3. Flake 命令行的使用 {#flake-commands-usage}

在启用了 `nix-command` & `flakes` 功能后，我们就可以使用 Nix 提供的新一代 Nix 命令行工具 [New Nix Commands][New Nix Commands] 了，下面列举下其中常用命令的用法：

```bash
# 解释下这条指令涉及的参数：
#   `nixpkgs#ponysay` 意思是 `nixpkgs` 这个 flake 中的 `ponysay` 包。
#   `nixpkgs` 是一个 flakeregistry ida,
#    nix 会从 <https://github.com/NixOS/flake-registry/blob/master/flake-registry.json> 中
#    找到这个 id 对应的 github 仓库地址
# 所以这个命令的意思是创建一个新环境，安装并运行 `nixpkgs` 这个 flake 提供的 `ponysay` 包。
#   注：前面已经介绍过了，nix 包 是 flake outputs 中的一种。
echo "Hello Nix" | nix run "nixpkgs#ponysay"

# 这条命令和上面的命令作用是一样的，只是使用了完整的 flake URI，而不是 flakeregistry id。
echo "Hello Nix" | nix run "github:NixOS/nixpkgs/nixos-unstable#ponysay"

# 这条命令的作用是使用 zero-to-nix 这个 flake 中名 `devShells.example` 的 outptus 来创建一个开发环境，
# 然后在这个环境中打开一个 bash shell。
nix develop "github:DeterminateSystems/zero-to-nix#example"

# 除了使用远程 flake uri 之外，你也可以使用当前目录下的 flake 来创建一个开发环境。
mkdir my-flake && cd my-flake
## 通过模板初始化一个 flake
nix flake init --template "github:DeterminateSystems/zero-to-nix#javascript-dev"
## 使用当前目录下的 flake 创建一个开发环境，并打开一个 bash shell
nix develop
# 或者如果你的 flake 有多个 devShell 输出，你可以指定使用名为 example 的那个
nix develop .#example

# 构建 `nixpkgs` flake 中的 `bat` 这个包
# 并在当前目录下创建一个名为 `result` 的符号链接，链接到该构建结果文件夹。
mkdir build-nix-package && cd build-nix-package
nix build "nixpkgs#bat"
# 构建一个本地 flake 和 nix develop 是一样的，不再赘述
```

此外 [Zero to Nix - Determinate Systems][Zero to Nix - Determinate Systems] 是一份全新的 Nix & Flake 新手入门文档，写得比较浅显易懂，适合新手用来入门。
