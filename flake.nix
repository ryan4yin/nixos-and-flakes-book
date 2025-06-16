{
  description = "A Nix-flake-based Node.js development environment";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-25.05";
    flake-utils.url = "github:numtide/flake-utils";
    pre-commit-hooks.url = "github:cachix/pre-commit-hooks.nix";
  };

  outputs = {
    self,
    nixpkgs,
    flake-utils,
    pre-commit-hooks,
  }:
    flake-utils.lib.eachDefaultSystem (system: let
      overlays = [
        (self: super: rec {
          nodejs = super.nodejs_22;
          pnpm = super.pnpm.override {inherit nodejs;};
          yarn = super.yarn.override {inherit nodejs;};
          prettier = super.nodePackages.prettier;
        })
      ];
      pkgs = import nixpkgs {inherit overlays system;};
      pkgs_chromium = import nixpkgs {inherit system;};
      packages = with pkgs; [
        nodejs
        pnpm
        yarn
        prettier

        git
        typos
        alejandra
      ];
    in {
      checks = {
        pre-commit-check = pre-commit-hooks.lib.${system}.run {
          src = ./.;
          hooks = {
            alejandra.enable = true; # formatter
            # Source code spell checker
            typos = {
              enable = true;
              settings = {
                write = true; # Automatically fix typos
                ignored-words = [];
                # configPath = "./.typos.toml"; # relative to the flake root
              };
            };
            prettier = {
              enable = true;
              settings = {
                write = true; # Automatically format files
                configPath = "./.prettierrc.yaml"; # relative to the flake root
              };
            };
          };
        };
      };

      devShells.default = pkgs.mkShell {
        inherit packages;

        shellHook = ''
          echo "node `node --version`"
          ${self.checks.${system}.pre-commit-check.shellHook}
        '';
      };

      devShells.export-pdf = pkgs.mkShell {
        inherit packages;

        shellHook = ''
          echo "node `node --version`"

          # Set Puppeteer to not download Chrome, cause it doesn't work on NixOS
          export PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=1
          # Set Puppeteer to use Chromium from Nixpkgs
          export PUPPETEER_EXECUTABLE_PATH=${pkgs_chromium.chromium.outPath}/bin/chromium
        '';
      };
    });
}
