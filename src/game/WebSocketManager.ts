import * as signalR from '@microsoft/signalr'

export default class WebSocketManager {
  static socket: WebSocket | null = null

  static connect(url: string) {
    if (!this.socket || this.socket.readyState === WebSocket.CLOSED) {
      this.socket = new WebSocket(url)

      this.socket.addEventListener('open', () => {
        console.log('WebSocket connection established')
      })

      this.socket.addEventListener('message', (event) => {
        console.log('Message from server:', event.data)
      })

      this.socket.addEventListener('close', () => {
        console.log('WebSocket connection closed')
      })

      this.socket.addEventListener('error', (error) => {
        console.error('WebSocket error:', error)
      })
    }
  }

  static send(data: any) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(data))
    } else {
      console.warn('WebSocket is not open')
    }
  }

  static getConnection() {
    return this.socket
  }
}
