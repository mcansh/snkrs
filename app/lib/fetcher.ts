class HTTPError extends Error {
  public response: Response;
  public status: number;

  public constructor(response: Response) {
    // Set the message to the status text, such as Unauthorized,
    // with some fallbacks. This message should never be undefined.
    super(
      response.statusText ||
        String(
          response.status === 0 || response.status
            ? response.status
            : 'Unknown response error'
        )
    );
    this.name = 'HTTPError';
    this.response = response;
    this.status = response.status;
  }
}

function checkStatus(response: Response) {
  if (!response.ok) {
    const error = new HTTPError(response);
    return Promise.reject(error);
  }

  return response;
}

async function fetcher<T = unknown>(
  input: RequestInfo,
  init: RequestInit | undefined = {}
): Promise<T> {
  const response = await fetch(input, init);
  const verified = await checkStatus(response);
  const result = await verified.json();
  return result;
}

export { fetcher, checkStatus, HTTPError };
