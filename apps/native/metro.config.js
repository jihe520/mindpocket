// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require("expo/metro-config")
const { withNativeWind } = require("nativewind/metro")
const { wrapWithReanimatedMetroConfig } = require("react-native-reanimated/metro-config")
const path = require("node:path")

// Find the workspace root, this can be replaced with `find-yarn-workspace-root`
const projectRoot = __dirname
const workspaceRoot = path.resolve(projectRoot, "../..")

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(projectRoot)

// 1. Watch all files within the monorepo
config.watchFolders = [workspaceRoot]
// 2. Let Metro know where to resolve packages, and in what order
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
]
// 2.1 Ensure a single React instance for Expo web/native bundles.
config.resolver.extraNodeModules = {
  react: path.resolve(projectRoot, "node_modules/react"),
  "react-dom": path.resolve(projectRoot, "node_modules/react-dom"),
}
// 3. Force Metro to resolve (sub)dependencies only from the `nodeModulesPaths`
config.resolver.disableHierarchicalLookup = true
// Avoid symlink-based module identity issues with nativewind v5/react-native-css.
config.resolver.unstable_enableSymlinks = false

module.exports = wrapWithReanimatedMetroConfig(
  withNativeWind(config, {
    input: "./global.css",
  })
)
