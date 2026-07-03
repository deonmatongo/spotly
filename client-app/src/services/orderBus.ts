// The customer app's single connection to the Spotly order bus. Checkout
// publishes new orders through it; OrderTracking subscribes to live status.
// Kept as a module singleton so both screens share one MQTT session.
import { SpotlyClient } from '@spotly/shared'

export const orderBus = new SpotlyClient('customer')
orderBus.connect()
