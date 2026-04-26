const apiBaseUrl = (
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000"
).trim()

type ApiRequestOptions = RequestInit & {
  auth?: boolean
}

export async function apiRequest(path: string, options: ApiRequestOptions = {}) {
  const { auth = true, headers, ...requestOptions } = options
  const requestHeaders = new Headers(headers)

  if (!requestHeaders.has("Content-Type") && requestOptions.body) {
    requestHeaders.set("Content-Type", "application/json")
  }

  if (auth) {
    const accessToken = localStorage.getItem("access_token")
    if (!accessToken) {
      throw new Error("Please login before using this API.")
    }
    requestHeaders.set("Authorization", `Bearer ${accessToken}`)
  }

  return fetch(`${apiBaseUrl}${path}`, {
    ...requestOptions,
    headers: requestHeaders,
  })
}

export function getWebSocketUrl(path: string) {
  return `${apiBaseUrl.replace(/^http/, "ws")}${path}`
}
