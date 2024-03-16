# Frequently Asked Questions

## What is the difference between NixOS rollback capability and btrfs/zfs system snapshot rollback?

The difference lies in the nature of the snapshots. System snapshots created with
btrfs/zfs does not contain the 'knowledge' of how to build this snapshot from scratch, it
is **uninterpretable**, and its content is strongly correlated with the current hardware
environment, making it difficult to reproduce on other machines.

On the other hand, NixOS configuration is a piece of "knowledge" that can build an
identical OS from scratch. It is **explainable** and can be automatically built with just
a few simple commands. The NixOS configuration serves as documentation of all the changes
made to your OS and is also used to automatically build the OS itself.

The NixOS configuration file is like the **source code** of a program. As long as the
source code is intact, it is easy to modify, review, or rebuild an identical program. In
contrast, system snapshots are like compiled binary programs derived from source code,
making it much more difficult to modify or review them. Moreover, snapshots are large in
size, making sharing or migrating them more costly compared to source code.

However, this doesn't mean that NixOS eliminates the need for system snapshots. As
mentioned in Chapter 1 of this book, NixOS can only guarantee reproducibility for
everything declared in the declarative configuration. Other aspects of the system that are
not covered by the declarative configuration, such as dynamic data in MySQL/PostgreSQL,
user-uploaded files, system logs, videos, music, and images in user home directories,
still require system snapshots or other means of backup.

## How does Nix compare to traditional system management tools like Ansible?

Nix is not only used for managing desktop environments but is also widely employed for
batch management of cloud servers. The official [NixOps](https://github.com/NixOS/nixops)
from the NixOS community and [colmena](https://github.com/zhaofengli/colmena) developed by
the community are tools specifically designed for this use case.

When compared to widely used traditional tools like Ansible, Nix has the following main
advantages:

1. One of the biggest problems with this Ansible is that each deployment is based on
   incremental changes to the current state of the system. The current state of the
   system, like the snapshots mentioned above, is not interpretable and is difficult to
   reproduce. NixOS declares the target state of the system through its configuration
   files, so that the deployment result is independent of the current state of the system,
   and repeated deployments will not cause any problems.
2. Nix Flakes uses a version lock file `flake.lock` to lock the hash value, version
   number, data source and other information of all dependencies, which greatly improves
   the reproducibility of the system. Traditional tools like Ansible don't have this
   feature, so they're not very reproducible.
   1. This is why Docker is so popular - it provides, at a fraction of the cost, a
      **reproducible system environment on a wide range of machines** that traditional Ops
      tools like Ansible don't.
3. Nix provides a high degree of ease of system customization by shielding the underlying
   implementation details with a layer of declarative abstraction so that users only need
   to care about their core requirements. Tools like Ansible have much weaker
   abstractions.
   1. If you've ever used a declarative configuration tool like terraform/kubernetes, this
      should be easy to understand. The more complex the requirements, the greater the
      benefit of declarative configuration.

## What are the advantages of Nix compared to Docker container technology?

Nix and container technologies like Docker do have overlapping use cases, such as:

1. Many people use Nix to manage development and build environments, as discussed in this
   book. On the other hand, technologies like
   [Dev Containers](https://github.com/devcontainers/spec), which build development
   environments based on containers, are also popular.
2. The DevOps/SRE field is currently dominated by container technologies based on
   Dockerfiles. Commonly used distributions like Ubuntu/Debian are frequently used within
   containers, and there are also mature options available for the host machine. In this
   context, what significant advantages do switching to NixOS offer?

Regarding the first point of "managing the development and build environments," Nix
provides a development environment experience that closely resembles working directly on
the host machine. This offers several advantages over Dev Containers, as outlined below:

1. Nix does not use namespaces for filesystem and network isolation, allowing easy
   interaction with the host machine's filesystem (including /dev for external devices)
   and network environment within the Nix-created development environment. In contrast,
   containers require various mappings to enable communication between the container and
   the host machine's filesystem, which can sometimes lead to file permission issues.
2. Due to the absence of strong isolation, Nix development environments have no issues
   supporting GUI applications. Running GUI programs within this environment is as
   seamless as running them in the system environment.

In other words, Nix provides a development experience that is closest to the host machine,
with no strong isolation. Developers can use familiar development and debugging tools in
this environment, and their past development experience can be seamlessly migrated. On the
other hand, if Dev Containers are used, developers may encounter various issues related to
filesystem communication, network environment, user permissions, and the inability to use
GUI debugging tools due to strong isolation.

If we decide to use Nix to manage all development environments, then building Docker
containers based on Nix would provide the highest level of consistency. Additionally,
adopting a unified technological architecture for all environments significantly reduces
infrastructure maintenance costs. This answers the second point mentioned earlier: when
managing development environments with Nix as a prerequisite, using NixOS for container
base images and cloud servers offers distinct advantages.

## error: collision between `...` and `...`

This error occurs when you installed two packages that depend on the same library but with
different versions in the same profile(home module or nixos module).

For example, if you have the following configuration:

```nix
{
   # as a nixos module
   # environment.systemPackages = with pkgs; [
   #
   # or as a home manager module
   home.packages = with pkgs; [
     lldb

     (python311.withPackages (ps:
       with ps; [
         ipython
         pandas
         requests
         pyquery
         pyyaml
       ]
     ))
   ];
}
```

this will cause the following error:

```bash
error: builder for '/nix/store/n3scj3s7v9jsb6y3v0fhndw35a9hdbs6-home-manager-path.drv' failed with exit code 25;
       last 1 log lines:
       > error: collision between `/nix/store/kvq0gvz6jwggarrcn9a8ramsfhyh1h9d-lldb-14.0.6/lib/python3.11/site-packages/six.py'
and `/nix/store/370s8inz4fc9k9lqk4qzj5vyr60q166w-python3-3.11.6-env/lib/python3.11/site-packages/six.py'
       For full logs, run 'nix log /nix/store/n3scj3s7v9jsb6y3v0fhndw35a9hdbs6-home-manager-path.drv'.
```

Here are some solutions:

1. Split the two packages into two different **profiles**. For example, you can install
   `lldb` via `environment.systemPackages` and `python311` via `home.packages`.
2. Different versions of Python3 are treated as different packages, so you can change your
   custom Python3 version to `python310` to avoid the conflict.
3. Use `override` to override the version of the library used by the package to be
   consistent with the version used by the other package.

```nix
{
  # as a nixos module
  # environment.systemPackages = with pkgs; [
  #
  # or as a home manager module
  home.packages = let
    custom-python3 = (pkgs.python311.withPackages (ps:
      with ps; [
        ipython
        pandas
        requests
        pyquery
        pyyaml
      ]
    ));
  in
    with pkgs; [
      # override the version of python3
      # NOTE: This will trigger a rebuild of lldb, it takes time
      (lldb.override {
        python3 = custom-python3;
      })

      custom-python3
  ];
}
```
