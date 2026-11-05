const path = require('node:path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// shortcut: expo-notifications@57 lanza "Cannot find native module 'ExpoTopicSubscriptionModule'" al importarse en
// Expo Go (Android), donde Firebase no existe. Se corrigió solo en SDK 58 (expo/expo#52182). En Android se usa el stub
// vacío que la propia librería trae; la app no usa topics FCM. Quitar este archivo al subir a SDK 58.
config.resolver.resolveRequest = (context, moduleName, platform) => {
  const importer = context.originModulePath;
  if (
    platform === 'android' &&
    moduleName === './TopicSubscriptionModule' &&
    importer.includes(`${path.sep}expo-notifications${path.sep}`)
  ) {
    return { type: 'sourceFile', filePath: path.join(path.dirname(importer), 'TopicSubscriptionModule.js') };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
