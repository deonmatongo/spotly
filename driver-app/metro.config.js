// Lets Metro bundle code from the sibling ../shared workspace (the @spotly/shared
// SDK) even though it lives outside this app's project root. paho-mqtt and other
// bare imports inside shared resolve from THIS app's node_modules.
const { getDefaultConfig } = require('expo/metro-config')
const path = require('path')

const projectRoot = __dirname
const workspaceRoot = path.resolve(projectRoot, '..')

const config = getDefaultConfig(projectRoot)

config.watchFolders = [path.resolve(workspaceRoot, 'shared')]
config.resolver.nodeModulesPaths = [path.resolve(projectRoot, 'node_modules')]
config.resolver.extraNodeModules = {
  '@spotly/shared': path.resolve(workspaceRoot, 'shared'),
}

module.exports = config
