
## 新一代 Nix 命令行工具的使用 {#flake-commands-usage}

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


[New Nix Commands]: https://nixos.org/manual/nix/stable/command-ref/new-cli/nix.html