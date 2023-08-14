---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

titleTemplate: "主页"

hero:
  name: "NixOS 与 Flakes"
  text: "一份非官方的新手指南"
  tagline: "想要学习使用 NixOS 与 Flakes 吗？在寻找一份新手友好的教程？那你可来对地方了！"
  image:
    src: /logo.png
    alt: NixOS Flakes
  actions:
    - theme: brand
      text: 前言
      link: /zh/preface.md
    - theme: brand
      text: 开始学习
      link: /zh/introduction/index.md
    - theme: alt
      text: "前往 GitHub 仓库"
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
