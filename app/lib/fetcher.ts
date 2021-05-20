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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fetcher = <T = any>(
  input: RequestInfo,
  init: RequestInit | undefined = {}
): Promise<T> =>
  fetch(input, {
    ...init,
    credentials: 'omit',
  })
    .then(checkStatus)
    .then(r => r.json());

export { fetcher, checkStatus, HTTPError };
