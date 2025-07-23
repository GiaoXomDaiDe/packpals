const { getDefaultConfig } = require('expo/metro-config')
const { withNativeWind } = require('nativewind/metro')

const config = getDefaultConfig(__dirname)
config.resolver = {
    ...config.resolver,
    unstable_enablePackageExports: false,
    // Fix axios imports for React Native
    alias: {
        'axios/lib/adapters/http': 'axios/lib/adapters/xhr',
    },
}

module.exports = withNativeWind(config, { input: './app/global.css' })
