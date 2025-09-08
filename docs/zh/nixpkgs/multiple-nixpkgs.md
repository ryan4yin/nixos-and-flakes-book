# 多 nixpkgs 实例的妙用

我们在前面 [降级与升级软件包](../nixos-with-flakes/downgrade-or-upgrade-packages.md)
一节中见过，怎么通过 `import nixpkgs {...}`
这样的方法实例化多个不同的 nixpkgs 实例，再通过 `specialArgs`
在所有子模块中使用这些 nixpkgs 实例。这种方法有很多的用途，常见的有：

1. 通过实例化 commit id 不同的 nixpkgs 实例，用于安装不同版本的软件包。前面的
   [降级与升级软件包](../nixos-with-flakes/downgrade-or-upgrade-packages.md)
   一节中就是这样使用的。
2. 如果希望使用 overlays，但是又不想影响到默认的 nixpkgs 实例，可以通过实例化一个新的 nixpkgs 实例，然后在这个实例上使用 overlays。
   - 上一节 Overlays 中提到的 `nixpkgs.overlays = [...];`
     是直接修改全局的 nixpkgs 实例，如果你的 overlays 改了比较底层的包，可能会影响到其他模块。坏处之一是会导致大量的本地编译（因为二进制缓存失效了），二是被影响的包功能可能也会出问题。
3. 在跨系统架构的编译中，你可以通过实例化多个 nixpkgs 实例来在不同的地方分别选用 QEMU 模拟编译与交叉编译，或者添加不同的 gcc 编译参数。

总之，实例化多个 nixpkgs 实例是非常有用的。

## `nixpkgs` 的实例化

先看看如何实例化一个非全局的 nixpkgs 实例，最常见的语法是：

```nix
{
  # a simple example
  pkgs-xxx = import nixpkgs {
    system = "x86_64-linux";
  };

  # nixpkgs with custom overlays
  pkgs-yyy = import nixpkgs {
    system = "x86_64-linux";

    overlays = [
      (self: super: {
        google-chrome = super.google-chrome.override {
          commandLineArgs =
            "--proxy-server='https=127.0.0.1:3128;http=127.0.0.1:3128'";
        };
        # ... other overlays
      })
    ];
  };

  # a more complex example (cross-compiling)
  pkgs-zzz = import nixpkgs {
    localSystem = "x86_64-linux";
    crossSystem = {
      config = "riscv64-unknown-linux-gnu";

      # https://wiki.nixos.org/wiki/Build_flags
      # this option equals to add `-march=rv64gc` into CFLAGS.
      # CFLAGS will be used as the command line arguments for the gcc/clang.
      gcc.arch = "rv64gc";
      # the same as `-mabi=lp64d` in CFLAGS.
      gcc.abi = "lp64d";
    };

    overlays = [
      (self: super: {
        google-chrome = super.google-chrome.override {
          commandLineArgs =
            "--proxy-server='https=127.0.0.1:3128;http=127.0.0.1:3128'";
        };
        # ... other overlays
      })
    ];
  };
}
```

我们学习 Nix 语法时就学过：

> `import` 表达式以其他 Nix 文件的路径作为参数，返回该 Nix 文件的执行结果。 `import`
> 的参数如果为文件夹路径，那么会返回该文件夹下的 `default.nix` 文件的执行结果。

`nixpkgs` 是一个 Git 仓库，它的根目录下刚好有一个 `default.nix`
文件，那么答案就呼之欲出了：`import nixpkgs` 就是返回
[nixpkgs/default.nix](https://github.com/NixOS/nixpkgs/blob/nixos-23.05/default.nix)
文件的执行结果。从这个文件开始探索，就能找到 `import nixpkgs` 的实现代码是
[pkgs/top-level/impure.nix](https://github.com/NixOS/nixpkgs/blob/nixos-23.05/pkgs/top-level/impure.nix)，这里截取部分内容：

```nix
# ... skip some lines

{ # We put legacy `system` into `localSystem`, if `localSystem` was not passed.
  # If neither is passed, assume we are building packages on the current
  # (build, in GNU Autotools parlance) platform.
  localSystem ? { system = args.system or builtins.currentSystem; }

# These are needed only because nix's `--arg` command-line logic doesn't work
# with unnamed parameters allowed by ...
, system ? localSystem.system
, crossSystem ? localSystem

, # Fallback: The contents of the configuration file found at $NIXPKGS_CONFIG or
  # $HOME/.config/nixpkgs/config.nix.
  config ? let
  # ... skip some lines

, # Overlays are used to extend Nixpkgs collection with additional
  # collections of packages.  These collection of packages are part of the
  # fix-point made by Nixpkgs.
  overlays ? let
  # ... skip some lines

, crossOverlays ? []

, ...
} @ args:

# If `localSystem` was explicitly passed, legacy `system` should
# not be passed, and vice-versa.
assert args ? localSystem -> !(args ? system);
assert args ? system -> !(args ? localSystem);

import ./. (builtins.removeAttrs args [ "system" ] // {
  inherit config overlays localSystem;
})
```

因此 `import nixpkgs {...}` 实际就是调用了上面这个函数，后面的 attribute
set 就是这个参数的参数。

## 注意事项

在创建多 nixpkgs 实例的时候需要注意一些细节，这里列举一些常见的问题：

1. 根据 @fbewivpjsbsby 补充的文章
   [1000 instances of nixpkgs](https://discourse.nixos.org/t/1000-instances-of-nixpkgs/17347)，在子模块或者子 flakes 中用
   `import` 来定制 `nixpkgs` 不是一个好的习惯，因为每次 `import`
   都会重新求值并产生一个新的 nixpkgs 实例，在配置越来越多时会导致构建时间变长、内存占用变大。所以这里改为了在
   `flake.nix` 中创建所有 nixpkgs 实例。
2. 在混合使用 QEMU 模拟编译与交叉编译时，搞得不好可能会导致许多包被重复编译多次，要注意避免这种情况。
