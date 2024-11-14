import { defineConfig } from 'vitepress'
import { shared } from './shared'
import { en } from './en'
import { zh } from './zh'


export default defineConfig({
  ...shared,
  title: "NixOS & Flakes Book",

  rewrites: {
    "en/:rest*": ":rest*",
  },
  locales: {
    root: { 
      label: 'English',
      ...en 
    },
    zh: {
      label: '简体中文', 
      ...zh
    },
  },

  // For forks in other languages, here is an example of how to add a new locale:
  // rewrites: {
  //   "ja/:rest*": ":rest*",
  // },
  // // Exclude the original language's markdown files when build dist
  // // NOTE: You can still preview the original language's pages in dev mode
  // srcExclude: ['zh/**/*.md', 'en/**/*.md'],
  // locales: {
  //   // Your language's root configuration
  //   root: {
  //     label: 'Japanese',
  //     ...ja,
  //   },
  //
  //   // Languages maintained by the original author
  //   en: { 
  //     label: 'English',
  //   link: "https://nixos-and-flakes.thiscute.world/",
  //   },
  //   zh: {
  //     label: '简体中文', 
  //     link: "https://nixos-and-flakes.thiscute.world/zh/",
  //   },
  // },
})

