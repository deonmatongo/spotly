declare module 'paho-mqtt' {
  export interface ConnectionLostResponse {
    errorCode: number
    errorMessage: string
  }

  export interface ConnectOptions {
    timeout?: number
    userName?: string
    password?: string
    keepAliveInterval?: number
    cleanSession?: boolean
    useSSL?: boolean
    reconnect?: boolean
    mqttVersion?: number
    onSuccess?: (ctx?: any) => void
    onFailure?: (err: { errorCode: number; errorMessage: string }) => void
    [key: string]: any
  }

  export class Message {
    constructor(payload: string | ArrayBuffer)
    payloadString: string
    payloadBytes: any
    destinationName: string
    qos: number
    retained: boolean
    duplicate: boolean
  }

  export class Client {
    constructor(host: string, port: number, path: string, clientId: string)
    constructor(hostOrUri: string, portOrClientId: number | string, pathOrUndefined?: string, clientId?: string)
    connect(options?: ConnectOptions): void
    disconnect(): void
    send(message: Message): void
    send(destination: string, payload: string | ArrayBuffer, qos?: number, retained?: boolean): void
    subscribe(filter: string, options?: any): void
    unsubscribe(filter: string, options?: any): void
    isConnected(): boolean
    onConnectionLost: (response: ConnectionLostResponse) => void
    onMessageArrived: (message: Message) => void
    onMessageDelivered: (message: Message) => void
    clientId: string
    host: string
    port: number
    path: string
  }
}
