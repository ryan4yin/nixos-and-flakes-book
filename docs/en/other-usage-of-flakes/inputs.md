# Flake Inputs

The `inputs` section in `flake.nix` is an attribute set used to specify the dependencies
of the current flake. There are various types of inputs, as shown in the examples below:

> See Official docs for details - [Flakes Inputs - Nix Manual].

```nix
{
  inputs = {
    # GitHub repository as the data source, specifying the master branch.
    # This is the most common input format.
    nixpkgs.url = "github:Mic92/nixpkgs/master";
    # Git URL, applicable to any Git repository using the https/ssh protocol.
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
    # Similar to fetching a Git repository, but using the ssh protocol
    # with key authentication. Also uses the shallow=1 parameter
    # to avoid copying the .git directory.
    ssh-git-example.url = "git+ssh://git@github.com/ryan4yin/nix-secrets.git?shallow=1";
    # It's also possible to directly depend on a local Git repository.
    git-directory-example.url = "git+file:/path/to/repo?shallow=1";
    # Using the `dir` parameter to specify a subdirectory.
    nixpkgs.url = "github:foo/bar?dir=shu";
    # Local folder (if using an absolute path, the 'path:' prefix can be omitted).
    directory-example.url = "path:/path/to/repo";

    # If the data source is not a flake, set flake=false.
    # `flake=false` is usually used to include additional source code,
    #   configuration files, etc.
    # In Nix code, you can directly reference files within
    #   it using "${inputs.bar}/xxx/xxx" notation.
    # For example, import "${inputs.bar}/xxx/xxx.nix" to import a specific nix file,
    # or use "${inputs.bar}/xx/xx" as a path parameter for certain options.
    bar = {
      url = "github:foo/bar/branch";
      flake = false;
    };

    sops-nix = {
      url = "github:Mic92/sops-nix";
      # `follows` is the inheritance syntax within inputs.
      # Here, it ensures that sops-nix's `inputs.nixpkgs` aligns with
      # the current flake's inputs.nixpkgs,
      # avoiding inconsistencies in the dependency's nixpkgs version.
      inputs.nixpkgs.follows = "nixpkgs";
    };

    # Lock the flake to a specific commit.
    nix-doom-emacs = {
      url = "github:vlaci/nix-doom-emacs?rev=238b18d7b2c8239f676358634bfb32693d3706f3";
      flake = false;
    };
  };

  outputs = { self, ... }@inputs: { ... };
}
```

## References

- [Flakes Inputs - Nix Manual]

[Flakes Inputs - Nix Manual]:
  https://nixos.org/manual/nix/stable/command-ref/new-cli/nix3-flake.html#flake-inputs
