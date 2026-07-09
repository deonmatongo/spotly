// @spotly/shared — canonical domain model + MQTT event-bus SDK shared by the
// customer, merchant, and driver apps. Import everything from here.
export * from './types'
export * from './config'
export * from './topics'
export * from './adapters'
export { MqttClient } from './MqttClient'
export type { MqttStatus, MessageCallback } from './MqttClient'
export { SpotlyClient } from './SpotlyClient'
export * from './AuthClient'
export * from './PaymentClient'
export * from './PushClient'
// Tier-4 polish: resilience & reach
export * from './i18n'
export * from './offline'
export * from './a11y'
