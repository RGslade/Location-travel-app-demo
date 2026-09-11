module.exports = ({ config }) => {
  const androidMapsKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_API_KEY?.trim();
  const iosMapsKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_IOS_API_KEY?.trim();
  const mapsPlugin = androidMapsKey || iosMapsKey
    ? ['react-native-maps', {
      ...(androidMapsKey ? { androidGoogleMapsApiKey: androidMapsKey } : {}),
      ...(iosMapsKey ? { iosGoogleMapsApiKey: iosMapsKey } : {}),
    }]
    : null;

  return {
    ...config,
    plugins: [
      ...(config.plugins ?? []),
      ...(mapsPlugin ? [mapsPlugin] : []),
    ],
  };
};
