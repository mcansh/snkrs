function getImageUrl(imageId: string, variant = 'public') {
  let accountIdHash =
    typeof document === 'undefined'
      ? process.env.CLOUDFLARE_ACCOUNT_ID_HASH
      : window.ENV.CLOUDFLARE_ACCOUNT_ID_HASH;

  return `https://snkrs.mcan.sh/cdn-cgi/imagedelivery/${accountIdHash}/${imageId}/${variant}`;
}

export { getImageUrl };
