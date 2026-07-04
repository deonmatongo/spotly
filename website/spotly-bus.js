/* ══════════════════════════════════════════════════════════════════
   SPOTLY ORDER BUS — browser client
   A plain-JS port of the @spotly/shared SDK (types, topic contract, and
   SpotlyClient) so the website dashboards join the exact same MQTT event
   bus as the customer, merchant, and driver mobile apps. One ecosystem.

   Transport: paho-mqtt over WebSocket (vendor/paho-mqtt-min.js), same lib
   the apps use. Requires the dev broker (backend/bridge) on ws://host:9001.
   ══════════════════════════════════════════════════════════════════ */
(function (global) {
  'use strict'

  // ── config (mirrors shared/config.ts) ────────────────────────────
  var brokerHost = 'localhost'
  var brokerPort = 9001

  var config = {
    setBroker: function (host, port) {
      if (host) brokerHost = host
      if (port) brokerPort = port
    },
    getHost: function () { return brokerHost },
    getPort: function () { return brokerPort },
    DEMO_MERCHANT_ID: 'amanzi-restaurant',
    DEMO_MERCHANT_NAME: 'Amanzi Restaurant',
    DEMO_DRIVER_ID: 'tatenda-moyo',
    DEMO_DRIVER_NAME: 'Tatenda Moyo',
    MERCHANT_COORD: { lat: -17.7900, lng: 31.1000 },
    FALLBACK_DROPOFF: { lat: -17.7626, lng: 31.1076 },
    newOrderRef: function () { return 'SPT-' + Math.floor(1000 + Math.random() * 9000) },
  }

  // ── topic contract (mirrors shared/topics.ts) ────────────────────
  var topics = {
    merchantOrder: function (m, r) { return 'merchants/' + m + '/orders/' + r },
    merchantInbox: function (m) { return 'merchants/' + m + '/orders/+' },
    orderStatus: function (r) { return 'orders/' + r + '/status' },
    job: function (r) { return 'jobs/' + r },
    jobsWild: function () { return 'jobs/+' },
  }

  function topicMatches(filter, topic) {
    if (filter === topic) return true
    var f = filter.split('/'), t = topic.split('/')
    for (var i = 0; i < f.length; i++) {
      if (f[i] === '#') return true
      if (f[i] === '+') { if (t[i] === undefined) return false; continue }
      if (f[i] !== t[i]) return false
    }
    return f.length === t.length
  }

  function safeParse(payload) {
    if (!payload) return null // empty retained payload = cleared topic
    try { return JSON.parse(payload) } catch (e) { return null }
  }

  var BACKOFF_START = 1000, BACKOFF_CAP = 30000, QUEUE_CAP = 500

  // ── Bus: bidirectional MQTT client + high-level role helpers ──────
  function Bus(role) {
    this.role = role
    this.clientId = role + '-web-' + Math.random().toString(16).slice(2, 10)
    this.client = null
    this.status = 'offline'
    this.statusCbs = []
    this.subs = {}           // topic -> [callbacks]
    this.queue = []
    this.shouldRun = false
    this.disposed = false
    this.backoff = BACKOFF_START
    this.reconnectTimer = null
  }

  Bus.prototype.connect = function () {
    if (this.disposed) return
    this.shouldRun = true
    if (this.client && this.client.isConnected()) return
    this._open()
  }

  Bus.prototype.disconnect = function () {
    this.shouldRun = false
    this.disposed = true
    if (this.reconnectTimer) { clearTimeout(this.reconnectTimer); this.reconnectTimer = null }
    try { if (this.client) this.client.disconnect() } catch (e) {}
    this.client = null
    this._setStatus('offline')
  }

  Bus.prototype.getStatus = function () { return this.status }

  Bus.prototype.onStatus = function (cb) {
    this.statusCbs.push(cb)
    cb(this.status)
    var self = this
    return function () { self.statusCbs = self.statusCbs.filter(function (c) { return c !== cb }) }
  }

  Bus.prototype.subscribe = function (topic, cb) {
    if (!this.subs[topic]) {
      this.subs[topic] = []
      if (this.client && this.client.isConnected()) {
        try { this.client.subscribe(topic, { qos: 1 }) } catch (e) {}
      }
    }
    this.subs[topic].push(cb)
    var self = this
    return function () {
      var arr = self.subs[topic]
      if (!arr) return
      self.subs[topic] = arr.filter(function (c) { return c !== cb })
      if (self.subs[topic].length === 0) {
        delete self.subs[topic]
        if (self.client && self.client.isConnected()) { try { self.client.unsubscribe(topic) } catch (e) {} }
      }
    }
  }

  Bus.prototype.publish = function (topic, payload, opts) {
    opts = opts || {}
    var body = typeof payload === 'string' ? payload : JSON.stringify(payload)
    var msg = { topic: topic, payload: body, qos: opts.qos == null ? 1 : opts.qos, retained: !!opts.retained }
    if (this.client && this.client.isConnected()) {
      this._send(msg)
    } else {
      if (this.queue.length >= QUEUE_CAP) this.queue.shift()
      this.queue.push(msg)
      this.connect()
    }
  }

  Bus.prototype.clearRetained = function (topic) {
    this.publish(topic, '', { qos: 1, retained: true })
  }

  Bus.prototype._send = function (m) {
    try {
      var message = new global.Paho.Message(m.payload)
      message.destinationName = m.topic
      message.qos = m.qos
      message.retained = m.retained
      this.client.send(message)
    } catch (e) {
      if (this.queue.length < QUEUE_CAP) this.queue.push(m)
    }
  }

  Bus.prototype._open = function () {
    this._setStatus(this.backoff === BACKOFF_START ? 'connecting' : 'reconnecting')
    var self = this
    var client = new global.Paho.Client(brokerHost, brokerPort, '/', this.clientId)

    client.onConnectionLost = function () {
      if (!self.shouldRun) return
      self._setStatus('reconnecting')
      self._scheduleReconnect()
    }
    client.onMessageArrived = function (message) {
      var topic = message.destinationName
      var payload = message.payloadString
      for (var sub in self.subs) {
        if (self.subs.hasOwnProperty(sub) && topicMatches(sub, topic)) {
          self.subs[sub].forEach(function (cb) { cb(payload, topic) })
        }
      }
    }

    try {
      client.connect({
        useSSL: false,
        timeout: 8,
        cleanSession: true,
        keepAliveInterval: 30,
        onSuccess: function () {
          self.client = client
          self.backoff = BACKOFF_START
          self._setStatus('connected')
          for (var topic in self.subs) {
            if (self.subs.hasOwnProperty(topic)) { try { client.subscribe(topic, { qos: 1 }) } catch (e) {} }
          }
          self._flush()
        },
        onFailure: function () {
          if (!self.shouldRun) return
          self._setStatus('reconnecting')
          self._scheduleReconnect()
        },
      })
    } catch (e) { this._scheduleReconnect() }
  }

  Bus.prototype._flush = function () {
    if (!this.client || !this.client.isConnected()) return
    var pending = this.queue
    this.queue = []
    for (var i = 0; i < pending.length; i++) this._send(pending[i])
  }

  Bus.prototype._scheduleReconnect = function () {
    if (!this.shouldRun || this.disposed || this.reconnectTimer) return
    var self = this
    var delay = Math.min(this.backoff, BACKOFF_CAP) + Math.floor(Math.random() * 400)
    this.reconnectTimer = setTimeout(function () {
      self.reconnectTimer = null
      self.backoff = Math.min(self.backoff * 2, BACKOFF_CAP)
      self._open()
    }, delay)
  }

  Bus.prototype._setStatus = function (s) {
    if (this.status === s) return
    this.status = s
    this.statusCbs.forEach(function (cb) { cb(s) })
  }

  // ── role helpers (mirror shared/SpotlyClient.ts) ──────────────────

  // customer
  Bus.prototype.placeOrder = function (order) {
    this.publish(topics.merchantOrder(order.merchantId, order.ref), order, { retained: true })
    this.setOrderStatus({ ref: order.ref, status: 'placed', ts: order.placedAt || Date.now() })
  }
  Bus.prototype.trackOrder = function (ref, cb) {
    return this.subscribe(topics.orderStatus(ref), function (payload) {
      var evt = safeParse(payload)
      if (evt) cb(evt)
    })
  }

  // merchant
  Bus.prototype.watchInbox = function (merchantId, onOrder, onClear) {
    return this.subscribe(topics.merchantInbox(merchantId), function (payload, topic) {
      var order = safeParse(payload)
      if (order) onOrder(order)
      else if (onClear) {
        var ref = topic.split('/').pop()
        if (ref) onClear(ref)
      }
    })
  }
  Bus.prototype.setOrderStatus = function (evt) {
    this.publish(topics.orderStatus(evt.ref), evt, { retained: true })
  }
  Bus.prototype.updateInboxOrder = function (order) {
    this.publish(topics.merchantOrder(order.merchantId, order.ref), order, { retained: true })
  }
  Bus.prototype.clearInboxOrder = function (merchantId, ref) {
    this.clearRetained(topics.merchantOrder(merchantId, ref))
  }
  Bus.prototype.dispatchJob = function (job) {
    this.publish(topics.job(job.ref), job, { retained: true })
  }

  // driver
  Bus.prototype.watchJobs = function (onJob, onClaimed) {
    return this.subscribe(topics.jobsWild(), function (payload, topic) {
      var job = safeParse(payload)
      if (job) onJob(job)
      else if (onClaimed) {
        var ref = topic.split('/').pop()
        if (ref) onClaimed(ref)
      }
    })
  }
  Bus.prototype.claimJob = function (ref, driverId, driverName) {
    this.clearRetained(topics.job(ref))
    this.setOrderStatus({ ref: ref, status: 'ready', ts: Date.now(), driverId: driverId, driverName: driverName })
  }
  Bus.prototype.advanceOrder = function (ref, status, driverId, driverName) {
    this.setOrderStatus({ ref: ref, status: status, ts: Date.now(), driverId: driverId, driverName: driverName })
  }

  global.SpotlyBus = { Bus: Bus, config: config, topics: topics }
})(window)
