import base from "./playwright.config.js";
export default {
  ...base,
  testMatch: "kitty-payment-flag.spec.js",
  use: { ...base.use, baseURL: "http://127.0.0.1:5198" },
  reporter: [["list"]],
};
