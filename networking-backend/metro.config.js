const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// @libsql/client and libsql use native Node.js binaries incompatible with React Native.
// Stub them out for native platforms (ios/android). The web platform handles
// API routes server-side and uses @libsql/client/web (HTTP only, no native deps).
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if ((platform === 'ios' || platform === 'android') &&
      (moduleName.startsWith('@libsql/') || moduleName === 'libsql')) {
    return { type: 'empty' };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
