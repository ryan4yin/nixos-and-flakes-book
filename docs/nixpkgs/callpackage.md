
In the previous content, We have used `import xxx.nix` to import Nix files many times, this syntax simply returns the execution result of the file, without any further processing of the it.

`pkgs.callPackage` is also used to import Nix files, its syntax is `pkgs.callPackage xxx.nix { ... }`, but unlike `import`, the Nix file imported by it must be a Derivation or a function that returns a Derivation. Its result is a Derivation(a software package) too.

So what does the Nix file that can be used as a parameter of `pkgs.callPackge` look like? You can take a look at the `hello.nix` `fcitx5-rime.nix` `vscode/with-extensions.nix` `firefox/common.nix` we mentioned earlier, they can all be imported by `pkgs.callPackage`.

When the `xxx.nix` used in `pkgs.callPackge xxx.nix {...}` is a function (most Nix packages are like this), the execution flow is as follows:

1. `pkgs.callPackge xxx.nix {...}` will first `import xxx.nix` to get the function defined in it. The parameters of this function usually have `lib`, `stdenv`, `fetchurl` and other parameters, as well as some custom parameters, which usually have default values.
2. Then `pkgs.callPackge` will first look up the value matching the name from the current environment as the parameter to be passed to the function. parameters like `lib` `stdenv` `fetchurl` are defined in nixpkgs, and they will be found in this step.
3. Then `pkgs.callPackge` will merge its second parameter `{...}` with the attribute set obtained in the previous step, and then pass it to the function imported from `xxx.nix` and execute it.
4. Finally we get a Derivation as the result of the function execution.

So the common usage of `pkgs.callPackage` is to import custom Nix packages and used it in Nix Module.
For example, we wrote a `hello.nix` ourselves, and then we can use `pkgs.callPackage ./hello.nix {}` in any Nix Module to import and use it.
