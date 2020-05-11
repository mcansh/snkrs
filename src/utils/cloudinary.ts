function getCloudinaryURL(publicId: string, ...transformations: string[]) {
  const transforms = [
    ...new Set([...transformations, 'f_auto', 'q_auto']),
  ].join(',');

  return `https://res.cloudinary.com/dof0zryca/image/upload/${transforms}/v1589065654/${publicId}`;
}

export { getCloudinaryURL };
