# 新一代 Nix 命令行工具的使用 {#flake-commands-usage}

在启用了 `nix-command` & `flakes` 功能后，我们就可以使用 Nix 提供的新一代 Nix 命令行工具
[New Nix Commands][New Nix Commands] 了，这里主要介绍 `nix shell` 与 `nix run`
两个命令，其他重要的命令（如 `nix build`
）将在「在 NixOS 上进行开发工作」一章中再详细介绍。

## `nix shell`

`nix shell` 用于进入到一个含有指定 Nix 包的环境并为它打开一个交互式 shell：

```shell
# hello 不存在
› hello
hello: command not found

# 进入到一个含有 hello 与 cowsay 的 shell 环境
# 可以指定多个包，用空格分隔
› nix shell nixpkgs#hello nixpkgs#cowsay

# hello 可以用了
› hello
Hello, world!

# cowsay 也可以用了
› cowsay "Hello, world!"
 _______
< hello >
 -------
        \   ^__^
         \  (oo)\_______
            (__)\       )\/\
                ||----w |
                ||     ||
```

`nix shell` 非常适合用于临时试用一些软件包或者快速创建一个干净的环境。

## `nix run`

`nix run`
则是创建一个含有指定 Nix 包的环境，并在该环境中直接运行该 Nix 包（临时运行该程序，不将它安装到系统环境中）：

```shell
# hello 不存在
› hello
hello: command not found

# 创建一个含有 hello 的环境并运行它
› nix run nixpkgs#hello
Hello, world!
```

因为 `nix run` 会直接将 Nix 包运行起来，所以作为其参数的 Nix 包必须能生成一个可执行程序。

根据 `nix run --help` 的说明，`nix run` 会执行 `<out>/bin/<name>` 这个命令，其中 `<out>`
是一个 Derivation 的根目录，`<name>` 则按如下顺序进行选择尝试：

- Derivation 的 `meta.mainProgram` 属性
- Derivation 的 `pname` 属性
- Derivation 的 `name` 属性中去掉版本号后的内容

比如说我们上面测试的包 hello，`nix run` 实际会执行 `$out/bin/hello` 这个程序。

再给两个示例，并详细说明下相关参数：

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
```

## `nix run` 与 `nix shell` 的常见用途

那显然就是用来跑些临时命令，比如说我在新 NixOS 主机上恢复环境，但是还没有装 Git，我可以直接用如下命令临时使用 Git 克隆我的配置仓库：

```bash
nix run nixpkgs#git clone git@github.com:ryan4yin/nix-config.git
```

或者也可以这样：

```bash
nix shell nixpkgs#git
git clone git@github.com:ryan4yin/nix-config.git
```

[New Nix Commands]: https://nixos.org/manual/nix/stable/command-ref/new-cli/nix.html
