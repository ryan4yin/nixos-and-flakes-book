## Flake inputs {#flake-inputs}

The `inputs` in `flake.nix` is an attribute set, used to specify the dependencies of the current flake, there are many types of `inputs`, for example:

```nix
{
  inputs = {
    # use master branch of the GitHub repository as input, this is the most common input format
    nixpkgs.url = "github:Mic92/nixpkgs/master";
    # Git URL, can be used for any Git repository based on https/ssh protocol
    git-example.url = "git+https://git.somehost.tld/user/path?ref=branch&rev=fdc8ef970de2b4634e1b3dca296e1ed918459a9e";
    # The above example will also copy .git, use this for (shallow) local Git repos
    git-directory-example.url = "git+file:/path/to/repo?shallow=1";
    # Local directories (for absolute paths you can omit 'path:')
    directory-example.url = "path:/path/to/repo";

    bar = {
      url = "github:foo/bar/branch";
      # if the input is not a flake, you need to set flake=false
      flake = false;
    };

    sops-nix = {
      url = "github:Mic92/sops-nix";
      # The `follows` keyword in inputs is used for inheritance.
      # Here, `inputs.nixpkgs` of sops-nix is kept consistent with the `inputs.nixpkgs` in
      # the current flake, to avoid problems caused by different versions of nixpkgs.
      inputs.nixpkgs.follows = "nixpkgs";
    };

    # Pin flakes to a specific revision
    nix-doom-emacs = {
      url = "github:vlaci/nix-doom-emacs?rev=238b18d7b2c8239f676358634bfb32693d3706f3";
      flake = false;
    };

    # To use a subdirectory of a repo, pass `dir=xxx`
    nixpkgs.url = "github:foo/bar?dir=shu";
  }
}
```
