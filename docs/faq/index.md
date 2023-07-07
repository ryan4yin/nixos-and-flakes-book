# Frequently Asked Questions

## What is the difference between NixOS rollback capability and btrfs/zfs system snapshot rollback?

The difference lies in the nature of the snapshots. System snapshots created with btrfs/zfs are non-reproducible, meaning they do not include the "knowledge" of how to build the snapshot from scratch and are therefore **unexplainable**.

On the other hand, NixOS configuration is a piece of "knowledge" that can build an identical OS from scratch. It is **explainable** and can be automatically built with just a few simple commands. The NixOS configuration serves as documentation of all the changes made to your OS and is also used to automatically build the OS itself.

The NixOS configuration file is like the **source code** of a program. As long as the source code is intact, it is easy to modify, review, or rebuild an identical program. In contrast, system snapshots are like compiled binary programs derived from source code, making it much more difficult to modify or review them. Moreover, snapshots are large in size, making sharing or migrating them more costly compared to source code.

However, this doesn't mean that NixOS eliminates the need for system snapshots. As mentioned in Chapter 1 of this book, NixOS can only guarantee reproducibility for everything declared in the declarative configuration. Other aspects of the system that are not covered by the declarative configuration, such as dynamic data in MySQL/PostgreSQL, user-uploaded files, system logs, videos, music, and images in user home directories, still require system snapshots or other means of backup.

## How does Nix compare to traditional system management tools like Ansible?

Nix is not only used for managing desktop environments but is also widely employed for batch management of cloud servers. The official NixOps from the NixOS community and deploy-rs developed by the community are tools specifically designed for this use case.

When compared to widely used traditional tools like Ansible, Nix has the following main advantages:

1. Nix's declarative configuration shields users from underlying details, allowing them to focus on their core requirements and providing a highly convenient system customization capability. Traditional tools like Ansible require users to handle all implementation details themselves.
   1. If you have experience with declarative configuration tools such as Terraform or Kubernetes, you should easily understand this point. The benefits of declarative configuration become more significant as the complexity of requirements increases.
2. Nix declares its target state through declarative configuration, and Nix Flakes locks all dependency hashes, version numbers, data sources, and other information in a version lock file called `flake.lock`. This greatly enhances the reproducibility of the system. In contrast, traditional tools like Ansible have poor reproducibility, which is why Docker is so popular—it provides a **completely consistent runtime environment** at a lower cost than traditional operational tools like Ansible.

## What are the advantages of Nix compared to Docker container technology?

Nix and container technologies like Docker do have overlapping use cases, such as:

1. Many people use Nix to manage development and build environments, as discussed in this book. On the other hand, technologies like [Dev Containers](https://github.com/devcontainers/spec), which build development environments based on containers, are also popular.
2. The DevOps/SRE field is currently dominated by container technologies based on Dockerfiles. Commonly used distributions like Ubuntu/Debian are frequently used within containers, and there are also mature options available for the host machine. In this context, what significant advantages do switching to NixOS offer?

Regarding the first point of "managing the development and build environments," Nix provides a development environment experience that closely resembles working directly on the host machine. This offers several advantages over Dev Containers, as outlined below:

1. Nix does not use namespaces for filesystem and network isolation, allowing easy interaction with the host machine's filesystem (including /dev for external devices) and network environment within the Nix-created development environment. In contrast, containers require various mappings to enable communication between the container and the host machine's filesystem, which can sometimes lead to file permission issues.
2. Due to the absence of strong isolation, Nix development environments have no issues supporting GUI applications. Running GUI programs within this environment is as seamless as running them in the system environment.

In other words, Nix provides a development experience that is closest to the host machine, with no strong isolation. Developers can use familiar development and debugging tools in this environment, and their past development experience can be seamlessly migrated. On the other hand, if Dev Containers are used, developers may encounter various issues related to filesystem communication, network environment, user permissions, and the inability to use GUI debugging tools due to strong isolation.

If we decide to use Nix to manage all development environments, then building Docker containers based on Nix would provide the highest level of consistency. Additionally, adopting a unified technological architecture for all environments significantly reduces infrastructure maintenance costs. This answers the second point mentioned earlier: when managing development environments with Nix as a prerequisite, using NixOS for container base images and cloud servers offers distinct advantages.
