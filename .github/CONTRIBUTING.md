# Contributing

> _A real community, however, exists only when its members interact in a meaningful way that deepens their understanding of each other and leads to learning._

If you would like to support this project, have an interesting idea how to improve this project, or if you found some errors - fork this, add your fixes, and add a pull request of your branch to the **main branch**.

## Report bugs using Github's issues

The [GitHub issues](https://github.com/ryan4yin/nixos-and-flakes-book/issues) is
the preferred channel for bug reports, features requests and submitting pull requests, it's that easy!

But please respect the following restrictions:

- Please **do not** use the issue tracker for personal support requests (use
  [Stack Overflow](https://stackoverflow.com) or IRC)

- Please **do not** derail or troll issues. Keep the discussion on topic and
  respect the opinions of others

## License

By contributing, you agree that your contributions will be licensed under [CC BY-SA 4.0](../LICENSE.md).

## Pull requests

When creating a pull request, please heed the following:

- Base your code on the latest main branch to avoid manual merges
- Code review may ensue in order to help shape your proposal
- Explain the problem and your proposed solution

## Development Setup

You will need [nix](https://github.com/NixOS/nix) & with flakes enabled.

After cloning the repo, run enter an environment with pnpm, vitepress, spell checker and markdown linter installed first:

```sh
$ nix develop
$ pnpm install
```

Boot up the documentation site locally, with live reloading of the source code:

```sh
$ pnpm run docs:dev
```

If you made a lot of changes, run the following command to check for typos & format the docs before submitting a pull request:

> Generally, `nix develop` will add a pre-commit hook to run the following command before you commit.

```sh
$ typos -w
$ prettier --write .
```

After executing the above command, visit <http://localhost:5173> and try modifying the source code. You'll get live update.
