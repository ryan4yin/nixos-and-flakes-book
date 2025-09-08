# Flake 的 inputs {#flake-inputs}

`flake.nix` 中的 `inputs` 是一个 attribute
set，用来指定当前 Flake 的依赖，inputs 有很多种类型，举例如下：

> 详细的例子参见官方文档 [Flakes Check - Nix Manual]

```nix
{
  inputs = {
    # 以 GitHub 仓库为数据源，指定使用 master 分支，这是最常见的 input 格式
    nixpkgs.url = "github:Mic92/nixpkgs/master";
    # Git URL，可用于任何基于 https/ssh 协议的 Git 仓库
    git-example.url = "git+https://git.somehost.tld/user/path?ref=branch";
    # Git URL by tag, applicable to any Git repository using the https/ssh protocol.
    git-example-tag.url = "git+https://git.somehost.tld/user/path?tag=x.y.x";
    # Github URL by pull request.
    git-pr.url = "github:NixOS/nixpkgs?ref=pull/349351/head";
    # Git URL with submodules, applicable to any Git repository using the https/ssh protocol.
    git-example-submodule.url = "git+https://git.somehost.tld/user/path?submodules=1";
    # Archive File URL, needed in case your input use LFS.
    # Regular git input doesn't support LFS before nix 2.27
    git-example-lfs.url = "https://codeberg.org/solver-orgz/treedome/archive/master.tar.gz";
    # Starting from nix 2.27, you can use the url like below to enable git lfs on flake input
    treedome.url = "git+https://codeberg.org/solver-orgz/treedome?ref=master&lfs=1";
    # 同样是拉取 Git 仓库，但使用 ssh 协议 + 密钥认证，同时使用了 shallow=1 参数避免复制 .git
    ssh-git-example.url = "git+ssh://git@github.com/ryan4yin/nix-secrets.git?shallow=1";
    # 当然也可以直接依赖本地的 git 仓库
    git-directory-example.url = "git+file:/path/to/repo?shallow=1";
    # 使用 `dir` 参数指定某个子目录
    nixpkgs.url = "github:foo/bar?dir=shu";
    # 本地文件夹 (如果使用绝对路径，可省略掉前缀 'path:')
    directory-example.url = "path:/path/to/repo";

    # 如果数据源不是一个 flake，则需要设置 flake=false
    # `flake=false` 通常被用于引入一些额外的源代码、配置文件等
    # 在 nix 代码中可以直接通过 "${inputs.bar}/xxx/xxx" 的方式来引用其中的文件
    # 比如说通过 `import "${inputs.bar}/xxx/xxx.nix"` 来导入其中的 nix 文件
    # 或者直接将 "${inputs.bar}/xx/xx" 当作某些 option 的路径参数使用
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
  };

  outputs = { self, ... }@inputs: { ... };
}
```

## 参考

- [Flakes Check - Nix Manual]

[Flakes Check - Nix Manual]:
  https://nix.dev/manual/nix/stable/command-ref/new-cli/nix3-flake-check
