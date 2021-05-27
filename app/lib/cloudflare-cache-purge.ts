const cloudflarePurgeUrl = `https://api.cloudflare.com/client/v4/zones/${process.env.CLOUDFLARE_ZONE_ID}/purge_cache`;

async function purgeCloudflareCache(urlOrUrls: Array<string> | string) {
  const urls = Array.isArray(urlOrUrls) ? urlOrUrls : [urlOrUrls];

  const promise = await fetch(cloudflarePurgeUrl, {
    method: 'DELETE',
    headers: {
      'X-Auth-Email': process.env.CLOUDFLARE_EMAIL,
      'X-Auth-Key': process.env.CLOUDFLARE_PURGE_KEY,
      'Content-type': 'application/json',
    },
    body: JSON.stringify({ files: urls }),
  });

  const response = await promise.json();
  if (promise.ok) {
    // eslint-disable-next-line no-console
    console.log(`Cached purged for urls ${urls.join(', ')}!`, response);
  } else {
    console.error(
      `Failed to purge cache for url(s) ${urls.join(', ')}!!`,
      response
    );
  }
}

export { purgeCloudflareCache };
