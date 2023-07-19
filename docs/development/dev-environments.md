# Dev Environments

We have learned how to build development environments, but it's a bit tedious to write `flake.nix` for each project.

Luckily, some people in the community have done this for us. The following repository contains development environment templates for most programming languages. Just copy and paste them:

- [dev-templates](https://github.com/the-nix-way/dev-templates)

If you think the structure of `flake.nix` is still too complicated and want a simpler way, 
you can consider using the following project,
which encapsulates Nix more thoroughly and provides users with a simpler definition:

- [cachix/devenv](https://github.com/cachix/devenv)


If you don't want to write a single line of nix code and just want to get a reproducible development environment with minimal cost, 
here's a tool that might meet your needs:

- [jetpack-io/devbox](https://github.com/jetpack-io/devbox)

## Dev Environment for Python

The development environment for Python is much more cumbersome compared to languages like Java or Go because it defaults to installing software in the global environment. 
To install software for the current project, you must create a virtual environment first (unlike in languages such as JavaScript or Go,
where virtual environments are not necessary). This behavior is very unfriendly for Nix.

By default, when using pip in Python, it installs software globally. On NixOS, running `pip install` directly will result in an error:

```bash
› pip install -r requirements.txt
error: externally-managed-environment

× This environment is externally managed
╰─> This command has been disabled as it tries to modify the immutable
    `/nix/store` filesystem.

    To use Python with Nix and nixpkgs, have a look at the online documentation:
    <https://nixos.org/manual/nixpkgs/stable/#python>.

note: If you believe this is a mistake, please contact your Python installation or OS distribution provider. You can override this, at the risk of breaking your Python installation or OS, by passing --break-system-packages.
hint: See PEP 668 for the detailed specification.
```

Based on the error message, `pip install` is directly disabled by NixOS. Even when attempting `pip install --user`, it is similarly disabled. 
To improve the reproducibility of the environment, Nix eliminates these commands altogether. 
Even if we create a new environment using methods like `mkShell`, 
these commands still result in errors (presumably because the pip command in Nixpkgs itself has 
been modified to prevent any modification instructions like `install` from running).

However, many project installation scripts are based on pip, which means these scripts cannot be used directly.
Additionally, the content in nixpkgs is limited, and many packages from PyPI are missing.
This requires users to package them themselves, adding a lot of complexity and mental burden.

One solution is to use the `venv` virtual environment. Within a virtual environment, you can use commands like pip normally:

```shell
python -m venv ./env
source ./env/bin/activate
```

Alternatively, you can use a third-party tool called `virtualenv`, but this requires additional installation.

For those who still lack confidence in the venv created directly with Python, they may prefer to include the virtual environment in `/nix/store` to make it immutable.
This can be achieved by directly installing the dependencies from `requirements.txt` or `poetry.toml` using Nix.
There are existing Nix packaging tools available to assist with this:

> Note that even in these environments, running commands like `pip install` directly will still fail.
Python dependencies must be installed through `flake.nix` because the data is located in the `/nix/store` directory,
and these modification commands can only be executed during the Nix build phase.

- [DavHau/mach-nix](https://github.com/DavHau/mach-nix)
- [poetry2nix](https://github.com/nix-community/poetry2nix)

The advantage of these tools is that they utilize the lock mechanism of Nix Flakes to improve reproducibility.
However, the downside is that they add an extra layer of abstraction, making the underlying system more complex.


Finally, in some more complex projects, neither of the above solutions may be feasible.
In such cases, the best solution is to use containers such as Docker or Podman. Containers have fewer restrictions compared to Nix and can provide the best compatibility.


