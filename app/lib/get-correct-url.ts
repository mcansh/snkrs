import type { Request } from 'remix';

function getCorrectUrl(request: Request) {
  const url = new URL(request.url);

  if (process.env.NODE_ENV === 'development') {
    url.port = process.env.PORT ?? '3000';
  }

  return url;
}

export { getCorrectUrl };
