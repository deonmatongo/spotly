// paho-mqtt was written for browsers — give it a `window`. Node 24 already
// provides global WebSocket and navigator; the MqttClient module installs its
// own localStorage shim on import.
if (typeof (globalThis as any).window === 'undefined') {
  ;(globalThis as any).window = globalThis
}
