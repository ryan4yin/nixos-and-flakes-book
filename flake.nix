{
  description = "A Nix-flake-based Node.js development environment";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-26.05";
    flake-utils.url = "github:numtide/flake-utils";
    pre-commit-hooks.url = "github:cachix/pre-commit-hooks.nix";
  };

  outputs =
    {
      self,
      nixpkgs,
      flake-utils,
      pre-commit-hooks,
    }:
    flake-utils.lib.eachDefaultSystem (
      system:
      let
        overlays = [
          (self: super: rec {
            nodejs = super.nodejs_22;
            pnpm = super.pnpm.override { inherit nodejs; };
            yarn = super.yarn.override { inherit nodejs; };
          })
        ];
        pkgs = import nixpkgs { inherit overlays system; };
        packages = with pkgs; [
          nodejs
          pnpm
          yarn
          prettier

          git
          typos
          nixfmt
          pandoc

          # PDF export (pandoc --pdf-engine=typst): Latin font + CJK fallback
          typst
          inter
          source-han-sans
          source-han-mono
        ];
      in
      {
        checks = {
          pre-commit-check = pre-commit-hooks.lib.${system}.run {
            src = ./.;
            hooks = {
              nixfmt = {
                enable = true;
                settings.width = 100;
              };
              # Source code spell checker
              typos = {
                enable = true;
                settings = {
                  write = true; # Automatically fix typos
                  # configPath = ".typos.toml"; # relative to the flake root
                  # exclude = "";
                };
              };
              prettier = {
                enable = true;
                settings = {
                  write = true; # Automatically format files
                  configPath = ".prettierrc.yaml"; # relative to the flake root
                };
              };
            };
          };
        };

        devShells.default = pkgs.mkShell {
          inherit packages;

          shellHook = ''
            echo "node `node --version`"

            # Fonts for the Typst PDF export (colon-separated). Inter is the
            # Latin main font; the Source Han fonts provide CJK fallback.
            export BOOK_PDF_FONT_PATHS="${pkgs.inter}/share/fonts:${pkgs.source-han-sans}/share/fonts:${pkgs.source-han-mono}/share/fonts"
            export TYPST_FONT_PATHS="$BOOK_PDF_FONT_PATHS"

            ${self.checks.${system}.pre-commit-check.shellHook}
          '';
        };
      }
    );
}
