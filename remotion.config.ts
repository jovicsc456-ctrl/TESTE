import { Config } from '@remotion/cli/config';

Config.setVideoImageFormat('jpeg');
Config.setOverwriteOutput(true);
// Habilita import de JSON (world-atlas) e assets estáticos.
Config.overrideWebpackConfig((currentConfiguration) => {
  return {
    ...currentConfiguration,
    resolve: {
      ...currentConfiguration.resolve,
      extensions: [
        ...(currentConfiguration.resolve?.extensions ?? []),
        '.json',
      ],
    },
  };
});
