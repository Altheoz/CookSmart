const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// Add support for .cjs files
config.resolver.sourceExts.push("cjs");

// Apply NativeWind config
module.exports = withNativeWind(config, { input: './app/global.css' }) 
