export default defineAppConfig({
  ui: {
    colors: {
      primary: "clay",
      secondary: "custom-secondary",
      success: "custom-success",
      info: "custom-info",
      warning: "custom-warning",
      error: "custom-error",
      neutral: "parchment",
    },
    modal: {
      slots: {
        footer: "justify-end",
      },
    },
  },
});
