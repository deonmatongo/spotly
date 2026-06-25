import { useState } from 'react'
import { ChevronLeft, Truck, Store, CreditCard, MapPin, ChevronDown, Check, Zap, Package } from 'lucide-react'

export default function CheckoutScreen({ navigate, goBack, params = {} }) {
  const { items = [], subtotal = 0, deliveryFee = 0, total = 0 } = params
  const [deliveryMode, setDeliveryMode] = useState('delivery')
  const [payMethod, setPayMethod] = useState('card')
  const [placed, setPlaced] = useState(false)
  const [address] = useState('42 Bleecker St, New York, NY 10012')
  const orderId = `#SPT-${Math.floor(10000 + Math.random() * 90000)}`

  if (placed) {
    return (
      <div className="absolute inset-0 bg-white flex flex-col items-center justify-center px-6 text-center">
        <div className="w-24 h-24 bg-primary rounded-full flex items-center justify-center mb-6 shadow-xl" style={{ boxShadow: '0 0 0 16px #E8F5EE' }}>
          <Package size={40} className="text-white" />
        </div>
        <h1 className="text-text-dark text-2xl font-bold mb-2">Order Placed!</h1>
        <p className="text-text-muted text-sm mb-1">Your order {orderId} is confirmed.</p>
        <p className="text-text-muted text-sm mb-6">
          {deliveryMode === 'delivery'
            ? 'Estimated delivery: 25–35 minutes'
            : 'Your order will be ready for pickup in 15–20 minutes'}
        </p>

        <div className="w-full bg-app-bg rounded-2xl p-5 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
              <Truck size={18} className="text-white" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-text-dark text-sm">Rider assigned</p>
              <p className="text-text-muted text-xs">Marcus • ETA ~28 min</p>
            </div>
            <div className="ml-auto">
              <div className="flex gap-1">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className={`w-2 h-2 rounded-full ${i <= 2 ? 'bg-primary' : 'bg-gray-200'}`} />
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="w-full bg-pale-mint rounded-2xl p-4 flex items-center gap-3 mb-6">
          <Zap size={18} fill="#16A34A" className="text-primary" />
          <p className="text-primary text-sm font-semibold">+50 Spotly Points earned on this order</p>
        </div>

        <button onClick={() => navigate('home')} className="w-full bg-primary text-white py-4 rounded-2xl font-semibold text-sm">
          Back to Home
        </button>
        <button onClick={() => navigate('bookings')} className="mt-3 text-primary text-sm font-semibold">
          Track My Order
        </button>
      </div>
    )
  }

  return (
    <div className="absolute inset-0 bg-white flex flex-col">
      {/* Header */}
      <div className="px-5 pt-14 pb-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <button onClick={goBack} className="w-9 h-9 bg-app-bg rounded-full flex items-center justify-center">
            <ChevronLeft size={20} className="text-text-dark" />
          </button>
          <h1 className="font-bold text-text-dark text-lg">Checkout</h1>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide px-5 pt-4 pb-28">
        {/* Delivery / Pickup toggle */}
        <div className="bg-app-bg rounded-2xl p-1 flex mb-5">
          <button
            onClick={() => setDeliveryMode('delivery')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all ${
              deliveryMode === 'delivery' ? 'bg-white text-primary shadow-sm' : 'text-text-muted'
            }`}
          >
            <Truck size={16} /> Delivery
          </button>
          <button
            onClick={() => setDeliveryMode('pickup')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all ${
              deliveryMode === 'pickup' ? 'bg-white text-primary shadow-sm' : 'text-text-muted'
            }`}
          >
            <Store size={16} /> Pickup
          </button>
        </div>

        {/* Address */}
        {deliveryMode === 'delivery' && (
          <div className="mb-5">
            <h3 className="font-semibold text-text-dark text-sm mb-3">Delivery Address</h3>
            <div className="bg-app-bg border border-gray-200 rounded-2xl px-4 py-4 flex items-center gap-3">
              <div className="w-9 h-9 bg-pale-mint rounded-xl flex items-center justify-center shrink-0">
                <MapPin size={16} className="text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-text-dark text-sm">{address}</p>
                <p className="text-text-muted text-xs">Apt 4B · Buzz code: 4212</p>
              </div>
              <button className="text-primary text-xs font-semibold">Edit</button>
            </div>
          </div>
        )}

        {/* Delivery instructions */}
        {deliveryMode === 'delivery' && (
          <div className="mb-5">
            <h3 className="font-semibold text-text-dark text-sm mb-2">Delivery instructions</h3>
            <textarea
              placeholder="Leave at door, ring bell, call on arrival…"
              rows={2}
              className="w-full bg-app-bg border border-gray-200 rounded-2xl px-4 py-3 text-sm text-text-dark placeholder:text-text-muted outline-none resize-none focus:border-primary"
            />
          </div>
        )}

        {/* Payment method */}
        <div className="mb-5">
          <h3 className="font-semibold text-text-dark text-sm mb-3">Payment method</h3>
          <div className="flex flex-col gap-2">
            {[
              { id: 'card', label: 'Visa ending in 4242', sub: 'Expires 08/27', emoji: '💳' },
              { id: 'apple', label: 'Apple Pay', sub: 'Touch ID required', emoji: '🍎' },
              { id: 'spotly', label: 'Spotly Points', sub: '1,240 pts available ($12.40)', emoji: '⚡' },
            ].map(method => (
              <button
                key={method.id}
                onClick={() => setPayMethod(method.id)}
                className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all ${
                  payMethod === method.id ? 'border-primary bg-pale-mint' : 'border-gray-100 bg-app-bg'
                }`}
              >
                <span className="text-xl shrink-0">{method.emoji}</span>
                <div className="flex-1 text-left">
                  <p className="font-medium text-text-dark text-sm">{method.label}</p>
                  <p className="text-text-muted text-xs">{method.sub}</p>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  payMethod === method.id ? 'border-primary bg-primary' : 'border-gray-300'
                }`}>
                  {payMethod === method.id && <Check size={11} className="text-white" strokeWidth={3} />}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Order summary */}
        <div className="bg-app-bg rounded-2xl p-4 mb-4">
          <h3 className="font-semibold text-text-dark text-sm mb-3">Order Summary</h3>
          {items.slice(0, 4).map(item => (
            <div key={item.id} className="flex justify-between text-sm py-1">
              <span className="text-text-muted">{item.name} {item.qty > 1 ? `×${item.qty}` : ''}</span>
              <span className="text-text-dark font-medium">${(item.price * item.qty).toFixed(2)}</span>
            </div>
          ))}
          <div className="h-px bg-gray-200 my-2" />
          <div className="flex justify-between text-sm py-0.5">
            <span className="text-text-muted">Subtotal</span>
            <span className="text-text-dark font-medium">${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm py-0.5">
            <span className="text-text-muted">Delivery fee</span>
            <span className={deliveryFee === 0 ? 'text-primary font-semibold' : 'text-text-dark font-medium'}>
              {deliveryFee === 0 ? 'FREE' : `$${deliveryFee.toFixed(2)}`}
            </span>
          </div>
          <div className="h-px bg-gray-200 my-2" />
          <div className="flex justify-between font-bold text-text-dark">
            <span>Total</span>
            <span className="text-base">${total.toFixed(2)}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-pale-mint rounded-2xl p-3">
          <Zap size={15} fill="#16A34A" className="text-primary" />
          <p className="text-primary text-xs font-semibold">You'll earn 50 Spotly Points on this order</p>
        </div>
      </div>

      {/* Place order CTA */}
      <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-5 py-4">
        <button
          onClick={() => setPlaced(true)}
          className="w-full bg-primary text-white py-4 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2"
        >
          Place Order · ${total.toFixed(2)}
        </button>
      </div>
    </div>
  )
}
