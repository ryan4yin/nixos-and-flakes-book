---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

titleTemplate: "Home Page"

hero:
  name: "NixOS & Flakes Book"
  text: "An unofficial book for beginners"
  tagline: Want to know NixOS & Flakes in detail? Looking for a beginner-friendly tutorial? Then you've come to the right place!
  image:
    src: /logo.png
    alt: NixOS Flakes
  actions:
    - theme: brand
      text: Preface
      link: /preface.md
    - theme: brand
      text: Get Started
      link: /introduction/index.md
    - theme: alt
      text: View on GitHub
      link: https://github.com/ryan4yin/nixos-and-flakes-book
# features:
#   - title: Feature A
#     details: Lorem ipsum dolor sit amet, consectetur adipiscing elit
#   - title: Feature B
#     details: Lorem ipsum dolor sit amet, consectetur adipiscing elit
#   - title: Feature C
#     details: Lorem ipsum dolor sit amet, consectetur adipiscing elit
---
<style>
:root {
  --vp-home-hero-name-color: transparent;
  --vp-home-hero-name-background: -webkit-linear-gradient(120deg, #bd34fe 30%, #41d1ff);

  --vp-home-hero-image-background-image: linear-gradient(-60deg, #bd34fe 40%, #47caff 60%);
  --vp-home-hero-image-filter: blur(40px);
}

@media (min-width: 640px) {
  :root {
    --vp-home-hero-image-filter: blur(56px);
  }
}

@media (min-width: 960px) {
  :root {
    --vp-home-hero-image-filter: blur(72px);
  }
}
</style>
