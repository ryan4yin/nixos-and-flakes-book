// .vitepress/theme/index.ts
import DefaultTheme from "vitepress/theme";

// custom CSS
import "../style/print.css";

export default {
	// Extending the Default Theme
	...DefaultTheme,
};
