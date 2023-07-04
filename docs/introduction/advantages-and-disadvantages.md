# Advantages & Disadvantages of NixOS

## Advantages

- **Declarative Configuration and Git Integration**:
  - Nix Flakes uses a lock file named `flake.lock` to lock dependencies' versions, ensuring system reproducibility. This concept is borrowed from package managers like npm and cargo.
  - Compared to Docker, Nix Flakes provides stronger guarantees for reproducibility of build results. Dockerfile is an imperative configuration without an equivalent of `flake.lock`. Docker's reproducibility relies on sharing the large build result through an image registry like Docker Hub.
- **Highly Convenient System Customization**:
  - NixOS allows easy customization of various components by modifying a few lines of configuration. Nix encapsulates complex operations in Nix packages and exposes concise and necessary declarative parameters.
  - Customization is also safe. For instance, switching between different desktop environments on NixOS is simple and clean, requiring only a few configuration changes.
- **Rollback Capability**: The system can be restored to any previous state at any time (excluding content not managed by NixOS, such as Docker containers and PostgreSQL data). NixOS even adds all old versions to the boot options by default, ensuring the ability to roll back even in case of system crashes. NixOS is considered one of the most stable Linux systems.
- **No Dependency Conflicts**: Each software package in Nix has a unique hash, and its installation path includes this hash value, enabling coexistence of multiple versions.
- **Active Community and Third-Party Projects**: The official package repository, nixpkgs, has numerous contributors, and many individuals share their Nix configurations on GitHub/GitLab. Exploring this ecosystem is like discovering a new continent, filled with excitement.

## Disadvantages

- **Steep Learning Curve**: To effectively use NixOS and avoid pitfalls, understanding the entire design of Nix and managing the system declaratively is necessary. Blindly using `nix-env -i` (similar to `apt-get install`) should be avoided.
- **Chaotic Documentation**: Flakes is still an experimental feature, and there is limited documentation available. Most of the Nix community's documentation focuses on the old CLI tools like `nix-env` and `nix-channel`. If starting directly with Flakes, you'll need to refer to a large number of old documents and extract the relevant information. Additionally, some core functions of Nix are poorly documented (e.g., `imports` and Nix Module System), requiring reading the source code for clarity.
- **Relatively High Disk Space Usage**: By default, Nix preserves all historical environments to facilitate rollback, resulting in significant disk space usage. This can be a concern, particularly on resource-constrained virtual machines.
- **Obscure Error Messages**: At times, encountering cryptic error messages can be confusing, leaving you unsure of what went wrong. Using `--show-trace` may provide a stack of errors that offer limited help.

## Summary

In general, I believe NixOS is suitable for developers with experience in using Linux and programming, who desire greater control over their systems.

If you are new to Linux, I do not recommend starting with NixOS, as it can be a challenging journey.