export class HttpClient {
  public constructor(private readonly baseUrl = "") {
  }

  public async get<TResponse>(path: string, init: RequestInit = {}): Promise<TResponse> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        ...init.headers
      },
      signal: init.signal
    });

    if (!response.ok) {
      throw new Error(`GET ${path} failed with status ${response.status}.`);
    }

    return response.json() as Promise<TResponse>;
  }
}
