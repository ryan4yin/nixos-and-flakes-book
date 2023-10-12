# Frequently Asked Questions

## What is the difference between NixOS rollback capability and btrfs/zfs system snapshot rollback?

The difference lies in the nature of the snapshots. System snapshots created with btrfs/zfs does not contain the 'knowledge' of how to build this snapshot from scratch, it is **uninterpretable**, and its content is strongly correlated with the current hardware environment, making it difficult to reproduce on other machines.

On the other hand, NixOS configuration is a piece of "knowledge" that can build an identical OS from scratch. It is **explainable** and can be automatically built with just a few simple commands. The NixOS configuration serves as documentation of all the changes made to your OS and is also used to automatically build the OS itself.

The NixOS configuration file is like the **source code** of a program. As long as the source code is intact, it is easy to modify, review, or rebuild an identical program. In contrast, system snapshots are like compiled binary programs derived from source code, making it much more difficult to modify or review them. Moreover, snapshots are large in size, making sharing or migrating them more costly compared to source code.

However, this doesn't mean that NixOS eliminates the need for system snapshots. As mentioned in Chapter 1 of this book, NixOS can only guarantee reproducibility for everything declared in the declarative configuration. Other aspects of the system that are not covered by the declarative configuration, such as dynamic data in MySQL/PostgreSQL, user-uploaded files, system logs, videos, music, and images in user home directories, still require system snapshots or other means of backup.

## How does Nix compare to traditional system management tools like Ansible?

Nix is not only used for managing desktop environments but is also widely employed for batch management of cloud servers. The official [NixOps](https://github.com/NixOS/nixops) from the NixOS community and [colmena](https://github.com/zhaofengli/colmena) developed by the community are tools specifically designed for this use case.

When compared to widely used traditional tools like Ansible, Nix has the following main advantages:

1. One of the biggest problems with this Anisble is that each deployment is based on incremental changes to the current state of the system. The current state of the system, like the snapshots mentioned above, is not interpretable and is difficult to reproduce. NixOS declares the target state of the system through its configuration files, so that the deployment result is independent of the current state of the system, and repeated deployments will not cause any problems.
2. Nix Flakes uses a version lock file `flake.lock` to lock the hash value, version number, data source and other information of all dependencies, which greatly improves the reproducibility of the system. Traditional tools like Ansible don't have this feature, so they're not very reproducible.
   1. This is why Docker is so popular - it provides, at a fraction of the cost, a **reproducible system environment on a wide range of machines** that traditional Ops tools like Ansible don't. 1.
1. Nix provides a high degree of ease of system customization by shielding the underlying implementation details with a layer of declarative abstraction so that users only need to care about their core requirements. Tools like Ansible have much weaker abstractions.
   1. If you've ever used a declarative configuration tool like terraform/kubernetes, this should be easy to understand. The more complex the requirements, the greater the benefit of declarative configuration.

## What are the advantages of Nix compared to Docker container technology?

Nix and container technologies like Docker do have overlapping use cases, such as:

1. Many people use Nix to manage development and build environments, as discussed in this book. On the other hand, technologies like [Dev Containers](https://github.com/devcontainers/spec), which build development environments based on containers, are also popular.
2. The DevOps/SRE field is currently dominated by container technologies based on Dockerfiles. Commonly used distributions like Ubuntu/Debian are frequently used within containers, and there are also mature options available for the host machine. In this context, what significant advantages do switching to NixOS offer?

Regarding the first point of "managing the development and build environments," Nix provides a development environment experience that closely resembles working directly on the host machine. This offers several advantages over Dev Containers, as outlined below:

1. Nix does not use namespaces for filesystem and network isolation, allowing easy interaction with the host machine's filesystem (including /dev for external devices) and network environment within the Nix-created development environment. In contrast, containers require various mappings to enable communication between the container and the host machine's filesystem, which can sometimes lead to file permission issues.
2. Due to the absence of strong isolation, Nix development environments have no issues supporting GUI applications. Running GUI programs within this environment is as seamless as running them in the system environment.

In other words, Nix provides a development experience that is closest to the host machine, with no strong isolation. Developers can use familiar development and debugging tools in this environment, and their past development experience can be seamlessly migrated. On the other hand, if Dev Containers are used, developers may encounter various issues related to filesystem communication, network environment, user permissions, and the inability to use GUI debugging tools due to strong isolation.

If we decide to use Nix to manage all development environments, then building Docker containers based on Nix would provide the highest level of consistency. Additionally, adopting a unified technological architecture for all environments significantly reduces infrastructure maintenance costs. This answers the second point mentioned earlier: when managing development environments with Nix as a prerequisite, using NixOS for container base images and cloud servers offers distinct advantages.
