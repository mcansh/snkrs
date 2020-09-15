import superjson from 'superjson';

async function fetcher<T extends any>(
  input: RequestInfo,
  init?: RequestInit | undefined
) {
  try {
    const response = await fetch(input, init);

    const data = await response.text();

    if (response.ok) {
      return superjson.parse<T>(data);
    }

    const error = new Error(response.statusText) as any;
    error.response = response;
    error.data = data;
    throw error;
  } catch (error) {
    if (!error.data) {
      error.data = { message: error.message };
    }
    throw error;
  }
}

export { fetcher };
