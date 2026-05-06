module.exports = {
  reactStrictMode: true,
  // Docker 部署需要 standalone 输出
  output: "standalone",
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  serverExternalPackages: ["@sparticuz/chromium-min", "@napi-rs/canvas", "pdfjs-dist", "pdf-parse"],
  turbopack: {
    resolveAlias: {
      "react-native": "react-native-web",
    },
    resolveExtensions: [".web.js", ".web.jsx", ".web.ts", ".web.tsx", ".js", ".jsx", ".ts", ".tsx"],
  },
}
