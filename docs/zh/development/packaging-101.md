# Nix 软件打包入门

WIP 未完成，目前请移步如下参考文档学习 Nix 打包。

## 参考文档

- [NixOS 系列（三）：软件打包，从入门到放弃 - LanTian](https://lantian.pub/article/modify-computer/nixos-packaging.lantian/)
- [How to Learn Nix, Part 28: The standard environment](https://ianthehenry.com/posts/how-to-learn-nix/the-standard-environment/)
- [stdenv - Nixpkgs Manual](https://github.com/NixOS/nixpkgs/tree/nixos-unstable/doc/stdenv)
- [languages-frameworks - Nixpkgs Manual](https://github.com/NixOS/nixpkgs/tree/nixos-unstable/doc/languages-frameworks)
- [Wrapping packages - NixOS Cookbook](https://wiki.nixos.org/wiki/Nix_Cookbook#Wrapping_packages)
- Useful tools:
  - [nurl](https://github.com/nix-community/nurl): Generate Nix fetcher calls from
    repository URLs
  - [nix-init](https://github.com/nix-community/nix-init): Generate Nix packages from URLs
    with hash prefetching, dependency inference, license detection, and more
- Source Code:
  - [pkgs/build-support/trivial-builders/default.nix - runCommand](https://github.com/NixOS/nixpkgs/blob/nixos-25.05/pkgs/build-support/trivial-builders/default.nix#L21-L49)
  - [pkgs/build-support/setup-hooks/make-wrapper.sh](https://github.com/NixOS/nixpkgs/blob/nixos-25.05/pkgs/build-support/setup-hooks/make-wrapper.sh)
  - FHS related
    - [pkgs/build-support/build-fhsenv-bubblewrap/buildFHSEnv.nix](https://github.com/NixOS/nixpkgs/blob/nixos-25.05/pkgs/build-support/build-fhsenv-bubblewrap/buildFHSEnv.nix):
      `pkgs.buildFHSEnvBubblewrap`
    - [pkgs/build-support/build-fhsenv-chroot/default.nix](https://github.com/NixOS/nixpkgs/blob/nixos-25.05/pkgs/build-support/build-fhsenv-bubblewrap/buildFHSEnv.nix):
      `pkgs.buildFHSEnvChroot`

---

> 一些草稿

## 1. stdenv 构建介绍

TODO

## 2. language specific frameworks

TODO

## Fetchers {#fetchers}

构建输入除了直接来自文件系统路径之外，还可以通过 Fetchers 来获取，Fetcher 是一种特殊的函数，它的输入是一个 attribute
set，输出是 Nix Store 中的一个系统路径。

Nix 提供了四个内置的 Fetcher，分别是：

- `builtins.fetchurl`：从 url 中下载文件
- `builtins.fetchTarball`：从 url 中下载 tarball 文件
- `builtins.fetchGit`：从 git 仓库中下载文件
- `builtins.fetchClosure`：从 Nix Store 中获取 Derivation

举例：

```nix
builtins.fetchurl "https://github.com/NixOS/nix/archive/7c3ab5751568a0bc63430b33a5169c5e4784a0ff.tar.gz"
# result example => "/nix/store/7dhgs330clj36384akg86140fqkgh8zf-7c3ab5751568a0bc63430b33a5169c5e4784a0ff.tar.gz"

builtins.fetchTarball "https://github.com/NixOS/nix/archive/7c3ab5751568a0bc63430b33a5169c5e4784a0ff.tar.gz"
# result example(auto unzip the tarball) => "/nix/store/d59llm96vgis5fy231x6m7nrijs0ww36-source"
```

## Derivations {#derivations}

> 官方 Nixpkgs 包仓库中的软件包已经能满足绝大部分用户的使用，在学习 NixOS 的前期不太需要深入了解 Derivation 的使用细节，有个印象就行。本书会在后面
> [Nix 软件打包入门](../development/packaging-101.md)
> 中详细介绍相关内容，这里仅做简要介绍。

Derivation 描述了如何构建一个软件包，是一个软件包构建流程的 Nix 语言描述，它声明了构建时需要有哪些依赖项、需要什么构建工具链、要设置哪些环境变量、哪些构建参数、先干啥后干啥等等。

Derivation 的构建结果是一个 Store
Object，其中包含了软件包的所有二进制程序、配置文件等等内容。Store Object 的存放路径格式为
`/nix/store/<hash>-<name>`，其中 `<hash>` 是构建结果的 hash 值，`<name>`
是它的名字。路径 hash 值确保了每个构建结果都是唯一的，因此可以多版本共存，而且不会出现依赖冲突的问题。

`/nix/store` 是一个特殊的文件路径，它被称为 Store，存放所有的 Store
Objects，这个路径被设置为只读，只有 Nix 本身才能修改这个路径下的内容，以保证系统的可复现性。

Derivation 实质上只是一个 attribute set，Nix 底层会使用内置函数 `builtins.derivation`
将这个 attribute set 构建为一个 Store Object。我们实际编写 Derivation 时，通常使用的是
`stdenv.mkDerivation`，它是前述内置函数 `builtins.derivation`
的 Nix 语言 wrapper，屏蔽了底层的细节，简化了用法。

一个简单的 Derivation 如下，它声明了一个名为 hello 的应用程序（摘抄自
[nixpkgs/pkgs/hello](https://github.com/NixOS/nixpkgs/blob/nixos-23.05/pkgs/applications/misc/hello/default.nix)）：

```nix
{ callPackage
, lib
, stdenv
, fetchurl
, nixos
, testers
, hello
}:

stdenv.mkDerivation (finalAttrs: {
  pname = "hello";
  version = "2.12.1";

  src = fetchurl {
    url = "mirror://gnu/hello/hello-${finalAttrs.version}.tar.gz";
    sha256 = "sha256-jZkUKv2SV28wsM18tCqNxoCZmLxdYH2Idh9RLibH2yA=";
  };

  doCheck = true;

  passthru.tests = {
    version = testers.testVersion { package = hello; };

    invariant-under-noXlibs =
      testers.testEqualDerivation
        "hello must not be rebuilt when environment.noXlibs is set."
        hello
        (nixos { environment.noXlibs = true; }).pkgs.hello;
  };

  passthru.tests.run = callPackage ./test.nix { hello = finalAttrs.finalPackage; };

  meta = with lib; {
    description = "A program that produces a familiar, friendly greeting";
    longDescription = ''
      GNU Hello is a program that prints "Hello, world!" when you run it.
      It is fully customizable.
    '';
    homepage = "https://www.gnu.org/software/hello/manual/";
    changelog = "https://git.savannah.gnu.org/cgit/hello.git/plain/NEWS?h=v${finalAttrs.version}";
    license = licenses.gpl3Plus;
    maintainers = [ maintainers.eelco ];
    platforms = platforms.all;
  };
})
```
