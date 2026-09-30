import { API_URL } from './http'

export function subscribeToOrderUpdates(onUpdate: () => void) {
  let socket: WebSocket | undefined
  let reconnectTimeout: number | undefined
  let reconnectDelay = 1000
  let closed = false

  const connect = () => {
    if (closed) return

    const url = new URL(API_URL, window.location.href)
    url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
    url.pathname = `${url.pathname.replace(/\/api\/?$/, '')}/ws/orders`
    url.search = ''
    url.hash = ''

    socket = new WebSocket(url)
    socket.addEventListener('open', () => {
      reconnectDelay = 1000
    })
    socket.addEventListener('message', (event) => {
      if (event.data === 'orders-updated') onUpdate()
    })
    socket.addEventListener('close', () => {
      if (closed) return
      reconnectTimeout = window.setTimeout(connect, reconnectDelay)
      reconnectDelay = Math.min(reconnectDelay * 2, 30000)
    })
    socket.addEventListener('error', () => socket?.close())
  }

  connect()

  return () => {
    closed = true
    if (reconnectTimeout !== undefined) window.clearTimeout(reconnectTimeout)
    socket?.close()
  }
}