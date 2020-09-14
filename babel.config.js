module.exports = api => {
  api.cache(true);

  const presets = ['next/babel'];
  const plugins = ['superjson-next'];

  return { presets, plugins };
};
