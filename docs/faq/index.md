# Frequently Asked Questions

## What is the difference between NixOS rollback capability and btrfs/zfs system snapshot rollback?

The difference lies in the nature of the snapshots. System snapshots created with btrfs/zfs are non-reproducible, meaning they do not include the "knowledge" of how to build the snapshot from scratch and are therefore **unexplainable**.

On the other hand, NixOS configuration is a piece of "knowledge" that can build an identical OS from scratch. It is **explainable** and can be automatically built with just a few simple commands. The NixOS configuration serves as a documentation of all the changes made to your OS and is also used to automatically build the OS itself.

The NixOS configuration file is like the **source code** of a program. As long as the source code is intact, it is easy to modify, review, or rebuild an identical program. In contrast, system snapshots are like compiled binary programs derived from source code, making it much more difficult to modify or review them. Moreover, snapshots are large in size, making sharing or migrating them more costly compared to source code.

However, this doesn't mean that NixOS eliminates the need for system snapshots. As mentioned in Chapter 1 of this book, NixOS can only guarantee reproducibility for everything declared in the declarative configuration. Other aspects of the system that are not covered by the declarative configuration, such as dynamic data in MySQL/PostgreSQL, user-uploaded files, system logs, videos, music, and images in user home directories, still require system snapshots or other means of backup.