const TIMEOUT = 12000

export interface RequestResult<T> {
  data: T
  headers: Record<string, string>
}

interface RequestOptions {
  method?: 'GET' | 'POST'
  data?: string | Record<string, unknown> | ArrayBuffer
  header?: Record<string, string>
}

function friendlyError(message: string) {
  if (/timeout|超时/i.test(message)) return '网络请求超时，请检查网络后重试'
  if (/fail|network|网络/i.test(message)) return '网络连接失败，请检查网络后重试'
  return message
}

export function request<T>(url: string, options: RequestOptions = {}): Promise<RequestResult<T>> {
  return new Promise((resolve, reject) => {
    uni.request({
      url,
      method: options.method || 'GET',
      data: options.data,
      header: options.header,
      timeout: TIMEOUT,
      success: (response) => {
        const status = response.statusCode
        if (status < 200 || status >= 300) {
          reject(new Error(`接口返回状态 ${status}`))
          return
        }
        const headers: Record<string, string> = {}
        Object.entries(response.header || {}).forEach(([key, value]) => {
          headers[key.toLowerCase()] = String(value)
        })
        resolve({ data: response.data as T, headers })
      },
      fail: (error) => {
        reject(new Error(friendlyError(error.errMsg || '网络请求失败')))
      }
    })
  })
}

export function sessionCookie(headers: Record<string, string>) {
  const raw = headers['set-cookie'] || headers['Set-Cookie'] || ''
  const hit = raw
    .split(/,(?=\s*[^;,]+=)/)
    .map((item) => item.split(';')[0].trim())
    .find((item) => item.toUpperCase().startsWith('SESSION='))
  return hit || ''
}
