export interface ApiClient {
  get<T>(path: string, params?: Record<string, string | number | boolean | undefined>): Promise<T>
  post<T>(path: string, body?: unknown): Promise<T>
  patch<T>(path: string, body?: unknown): Promise<T>
  delete<T>(path: string): Promise<T>
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly fields?: Record<string, string>,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

/**
 * Default HTTP client using the native fetch API.
 * Unwraps the `{ data: T }` envelope on success.
 * Throws ApiError on non-2xx responses.
 */
export class FetchApiClient implements ApiClient {
  constructor(
    private readonly baseUrl: string,
    private readonly defaultHeaders: Record<string, string> = {},
  ) {}

  async get<T>(
    path: string,
    params?: Record<string, string | number | boolean | undefined>,
  ): Promise<T> {
    const url = new URL(path, this.baseUrl)
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined) url.searchParams.set(key, String(value))
      }
    }
    const res = await fetch(url.toString(), {
      method: 'GET',
      headers: { ...this.defaultHeaders },
    })
    return this.handleResponse<T>(res)
  }

  async post<T>(path: string, body?: unknown): Promise<T> {
    const url = new URL(path, this.baseUrl)
    const res = await fetch(url.toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...this.defaultHeaders },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
    return this.handleResponse<T>(res)
  }

  async patch<T>(path: string, body?: unknown): Promise<T> {
    const url = new URL(path, this.baseUrl)
    const res = await fetch(url.toString(), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...this.defaultHeaders },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
    return this.handleResponse<T>(res)
  }

  async delete<T>(path: string): Promise<T> {
    const url = new URL(path, this.baseUrl)
    const res = await fetch(url.toString(), {
      method: 'DELETE',
      headers: { ...this.defaultHeaders },
    })
    if (res.status === 204) return undefined as T
    return this.handleResponse<T>(res)
  }

  private async handleResponse<T>(res: Response): Promise<T> {
    if (res.ok) {
      if (res.status === 204) return undefined as T
      const json = await res.json()
      // Unwrap the { data: T } envelope
      return 'data' in json ? json.data : json
    }
    let code = 'UNKNOWN_ERROR'
    let message = `HTTP ${res.status}`
    let fields: Record<string, string> | undefined
    try {
      const json = await res.json()
      if (json.error) {
        code = json.error.code ?? code
        message = json.error.message ?? message
        fields = json.error.fields
      }
    } catch {
      // Response body was not JSON — use defaults above
    }
    throw new ApiError(res.status, code, message, fields)
  }
}
