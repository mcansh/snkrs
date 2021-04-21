function getCloudinaryURL(
  publicId: string,
  transformOptions: Array<string> = []
) {
  const transforms = ['f_auto', 'q_auto', ...transformOptions];

  const transformString = transforms.join(',');

  return `https://images.mcan.sh/upload/${transformString}/${publicId}`;
}

export { getCloudinaryURL };
