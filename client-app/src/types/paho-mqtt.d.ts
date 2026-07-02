// Minimal declarations for paho-mqtt — just the surface the rider app uses.
declare module 'paho-mqtt' {
  export interface ConnectOptions {
    onSuccess?: () => void
    onFailure?: (err: { errorCode: number; errorMessage: string }) => void
    useSSL?: boolean
    userName?: string
    password?: string
    keepAliveInterval?: number
    reconnect?: boolean
    timeout?: number
    cleanSession?: boolean
    mqttVersion?: number
  }

  export class Message {
    constructor(payload: string)
    payloadString: string
    destinationName: string
    qos: number
    retained: boolean
  }

  export class Client {
    constructor(host: string, port: number, path: string, clientId: string)
    connect(options?: ConnectOptions): void
    disconnect(): void
    send(message: Message): void
    subscribe(topic: string, options?: { qos?: number; onSuccess?: () => void; onFailure?: (err: unknown) => void }): void
    unsubscribe(topic: string, options?: { onSuccess?: () => void; onFailure?: (err: unknown) => void }): void
    isConnected(): boolean
    onConnectionLost: (err: { errorCode: number; errorMessage: string }) => void
    onMessageArrived: (message: Message) => void
  }
}
