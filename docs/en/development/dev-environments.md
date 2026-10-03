# Dev Environments

On NixOS, we have a variety of methods to set up development environments, with the most
ideal approach being a complete definition of each project's development environment
through its own `flake.nix`. However, this can be somewhat cumbersome in practice, as it
requires crafting a `flake.nix` and then running `nix develop` for each instance. For
temporary projects or when one simply wants to glance at the code, this approach is
somewhat overkill.

A compromise is to divide the development environment into three tiers:

1. **Global Environment**: This typically refers to the user environment managed by
   home-manager.
   - Universal development tools: `git`, `vim`, `emacs`, `tmux`, and the like.
   - Common language SDKs and package managers: `rust`, `openjdk`, `python`, `go`, among
     others.
2. **IDE Environment**:
   - Taking neovim as an example, home-manager creates a wrapper for neovim that
     encapsulates its dependencies within its own environment, preventing contamination of
     the global environment.
   - Dependencies for neovim plugins can be added to the neovim environment via the
     `programs.neovim.extraPackages` parameter, ensuring the IDE operates smoothly.
   - However, if you use multiple IDEs (such as emacs and neovim), they often rely on many
     of the same programs (like lsp, tree-sitter, debugger, formatter, etc.). For ease of
     management, these shared dependencies can be placed in the global environment. Be
     cautious of potential dependency conflicts with other programs in the global
     environment, particularly with python packages, which are prone to conflicts.
3. **Project Environment**: Each project can define its own development environment
   (`devShells`) via `flake.nix`.
   - To simplify, you can create generic `flake.nix` templates for commonly used languages
     in advance, which can be copied and modified as needed.
   - The project environment takes the highest precedence (added to the front of the
     PATH), and its dependencies will override those with the same name in the global
     environment. Thus, you can control the version of project dependencies via the
     project's `flake.nix`, unaffected by the global environment.

## Templates for Development Environments

We have learned how to build development environments, but it's a bit tedious to write
`flake.nix` for each project.

Luckily, some people in the community have done this for us. The following repository
contains development environment templates for most programming languages. Just copy and
paste them:

- [the-nix-way/dev-templates](https://github.com/the-nix-way/dev-templates)

If you think the structure of `flake.nix` is still too complicated and want a simpler way,
you can consider using the following project, which encapsulates Nix more thoroughly and
provides users with a simpler definition:

- [cachix/devenv](https://github.com/cachix/devenv)

If you don't want to write a single line of nix code and just want to get a reproducible
development environment with minimal cost, here's a tool that might meet your needs:

- [jetify-com/devbox](https://github.com/jetify-com/devbox)

## Dev Environment for Python

The development environment for Python is much more cumbersome compared to languages like
Java or Go because it defaults to installing software in the global environment. To
install software for the current project, you must create a virtual environment first
(unlike in languages such as JavaScript or Go, where virtual environments are not
necessary). This behavior is very unfriendly for Nix.

By default, when using pip in Python, it installs software globally. On NixOS, running
`pip install` directly will result in an error:

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

Based on the error message, `pip install` is directly disabled by NixOS. Even when
attempting `pip install --user`, it is similarly disabled.

This block comes from [PEP 668](https://peps.python.org/pep-0668/): pip refuses to install
into any Python environment marked as _externally managed_, meaning its packages are
maintained by an external package manager such as an OS distribution. The rule comes from
painful lessons on traditional distros: mixing `pip install` with OS-managed Python files
used to break system tools. Many of these tools are Python programs themselves, Fedora's
`yum` and `dnf` among them, so a single careless `sudo pip install` could break the
package manager itself.

NixOS enables it too. Its Python ships with an `EXTERNALLY-MANAGED` marker file, and the
custom message about `/nix/store` in the error above is the content of that file.

For new projects, we recommend [uv](https://github.com/astral-sh/uv) directly: `uv venv`
creates a virtual environment, and `uv add` / `uv run` manage the dependencies and run
commands. uv is also pip-compatible: `uv pip install` works inside a virtual environment
just like pip. uv itself is packaged in nixpkgs.

If you want the virtual environment itself to be reproducible, Nix can build it into
`/nix/store` as an immutable artifact, installing the dependencies declared in
`pyproject.toml` and `uv.lock` at build time. The actively maintained tool for this today
is [uv2nix](https://github.com/pyproject-nix/uv2nix):

> Note that even in such an environment, running commands like `pip install` directly will
> still fail. Python dependencies must be installed through `flake.nix` because the data
> is located in the `/nix/store` directory, and these modification commands can only be
> executed during the Nix build phase.

Its advantage is that it utilizes the lock mechanism of Nix Flakes to improve
reproducibility. However, the downside is that it adds an extra layer of abstraction,
making the underlying system more complex.

`uvx` solves the problem mentioned earlier directly: Python CLI tools cannot be installed
into the global environment. It works like `npx` in the Node.js world: `uvx <tool>`
(equivalently `uv tool run <tool>`) downloads a tool into an isolated environment and runs
it directly, without touching the system Python; `uv tool install <tool>` makes such a
tool available persistently.

For legacy projects, whose install scripts and dependency management are built on top of
pip, there is little we can do except creating a virtual environment first:

```shell
python -m venv ./env
source ./env/bin/activate
```

For projects that even a virtual environment or an FHS environment cannot handle, the last
resort is containers such as Docker or Podman, running a regular Ubuntu/Debian/Alpine
inside. Containers have fewer restrictions compared to Nix and can provide the best
compatibility.
