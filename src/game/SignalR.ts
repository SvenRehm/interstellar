import * as signalR from '@microsoft/signalr'

export default class SignalR {
  static connection: signalR.HubConnection
  static connectionID: string | null
  static roomId: string

  static async connect(url: string) {
    this.connection = new signalR.HubConnectionBuilder()
      .withUrl(url, {
        withCredentials: false // Required if AllowCredentials is used
      })
      .configureLogging(signalR.LogLevel.Information)
      .build()

    this.start()
    // this.connection.onclose(async () => {
    //   this.connect()
    // })
  }

  static async start() {
    try {
      // await this.connection
      //   .start()
      //   .then(() => {
      //     console.log('Connection established!')
      //     // Retrieve the connection ID after the connection is successfully established
      //     this.connectionID = this.connection.connectionId
      //     console.log('Connection ID:', this.connectionID)
      //     return this.connection
      //   })
      //   .catch((err) => {
      //     console.error('Connection failed: ', err)
      //   })
      await this.connection.start()
      // .then(() => {
      //   console.log('Connection established!')
      //   console.log('Connection ID:', this.connection.connectionId)
      // })
      // .catch((err) => {
      //   console.error('Connection failed:', err)
      // })
      // Now that it's established, you can log the connection ID
      //   console.log('Connection established!')
      //   // Retrieve the connection ID after the connection is successfully established
      //   this.connectionID = this.connection.connectionId
      //   console.log('Connection ID:', this.connectionID)
      //   return this.connection
      // })
      // .catch((err) => {
      //   console.error('Connection failed: ', err)
      // })
      this.connectionID = this.connection.connectionId
      console.log('SignalR Connected.')
    } catch (err) {
      console.log(err)
      // TODO:
      // setTimeout(.start, 5000)
    }
  }

  static async invoke(messageType: string, data: any) {
    try {
      // console.log(messageType, data)
      const test = await this.connection.invoke(messageType, data)
      return test
    } catch (err) {
      console.error(err)
    }
  }

  static getConnectionID(): any {
    return this.connectionID
  }

  static getConnection(): any {
    return this.connection
  }

  static setRoomId(id: string) {
    this.roomId = id
  }

  static getRoomId(): string {
    return this.roomId
  }
}
