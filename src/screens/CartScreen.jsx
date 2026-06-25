import { ChevronLeft, Truck, Plus, Minus, Trash2, ShoppingBag, Tag } from 'lucide-react'

export default function CartScreen({ navigate, goBack, cart, onUpdateCart, onClearCart }) {
  const grouped = cart.reduce((acc, item) => {
    const key = item.id
    if (acc[key]) { acc[key] = { ...acc[key], qty: acc[key].qty + 1 } }
    else acc[key] = { ...item, qty: 1 }
    return acc
  }, {})
  const items = Object.values(grouped)
  const subtotal = items.reduce((sum, i) => sum + i.price * i.qty, 0)
  const deliveryFee = subtotal >= 20 ? 0 : 3.99
  const total = subtotal + deliveryFee

  const addOne = (item) => onUpdateCart('add', item)
  const removeOne = (item) => onUpdateCart('remove', item)

  if (items.length === 0) {
    return (
      <div className="absolute inset-0 bg-white flex flex-col">
        <div className="px-5 pt-14 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <button onClick={goBack} className="w-9 h-9 bg-app-bg rounded-full flex items-center justify-center">
              <ChevronLeft size={20} className="text-text-dark" />
            </button>
            <h1 className="font-bold text-text-dark text-lg">Your Cart</h1>
          </div>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <div className="w-20 h-20 bg-app-bg rounded-full flex items-center justify-center">
            <ShoppingBag size={32} className="text-text-muted" />
          </div>
          <p className="font-semibold text-text-dark">Your cart is empty</p>
          <p className="text-text-muted text-sm text-center px-8">Add items from restaurants and grocers to start an order</p>
          <button onClick={() => navigate('search')} className="bg-primary text-white px-8 py-3 rounded-2xl font-semibold text-sm mt-2">
            Browse Now
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="absolute inset-0 bg-white flex flex-col">
      {/* Header */}
      <div className="px-5 pt-14 pb-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={goBack} className="w-9 h-9 bg-app-bg rounded-full flex items-center justify-center">
              <ChevronLeft size={20} className="text-text-dark" />
            </button>
            <h1 className="font-bold text-text-dark text-lg">Your Cart</h1>
          </div>
          <button onClick={onClearCart} className="text-red-400 text-xs font-medium flex items-center gap-1">
            <Trash2 size={13} /> Clear
          </button>
        </div>
      </div>

      {/* Delivery banner */}
      <div className="mx-5 mt-4 bg-pale-mint rounded-2xl px-4 py-3 flex items-center gap-2">
        <Truck size={16} className="text-primary shrink-0" />
        {subtotal >= 20
          ? <span className="text-primary text-xs font-semibold">🎉 Free delivery on your order!</span>
          : <span className="text-primary text-xs font-semibold">Add ${(20 - subtotal).toFixed(2)} more for free delivery!</span>
        }
      </div>

      {/* Items */}
      <div className="flex-1 overflow-y-auto scrollbar-hide px-5 pt-4 pb-2">
        {/* Group by listing */}
        {Object.entries(
          items.reduce((acc, item) => {
            const key = item.listingName || 'Other'
            if (!acc[key]) acc[key] = []
            acc[key].push(item)
            return acc
          }, {})
        ).map(([listingName, listingItems]) => (
          <div key={listingName} className="mb-5">
            <p className="font-semibold text-text-dark text-sm mb-3 flex items-center gap-2">
              <ShoppingBag size={14} className="text-primary" />
              {listingName}
            </p>
            <div className="flex flex-col gap-3">
              {listingItems.map(item => (
                <div key={item.id} className="flex items-center gap-3 bg-app-bg rounded-2xl p-3">
                  {item.image && (
                    <img src={item.image} alt={item.name} className="w-14 h-14 rounded-xl object-cover shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-text-dark text-sm leading-tight">{item.name}</p>
                    <p className="text-primary font-bold text-sm mt-0.5">${(item.price * item.qty).toFixed(2)}</p>
                    {item.qty > 1 && (
                      <p className="text-text-muted text-[11px]">${item.price.toFixed(2)} each</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => removeOne(item)} className="w-7 h-7 border-2 border-gray-200 rounded-full flex items-center justify-center bg-white">
                      {item.qty === 1 ? <Trash2 size={12} className="text-red-400" /> : <Minus size={12} className="text-text-dark" />}
                    </button>
                    <span className="font-bold text-sm w-4 text-center">{item.qty}</span>
                    <button onClick={() => addOne(item)} className="w-7 h-7 bg-primary rounded-full flex items-center justify-center">
                      <Plus size={14} className="text-white" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Promo code */}
        <div className="flex items-center gap-2 bg-app-bg border border-dashed border-gray-300 rounded-2xl px-4 py-3 mb-4">
          <Tag size={15} className="text-text-muted" />
          <input placeholder="Add promo code" className="flex-1 bg-transparent text-sm text-text-dark outline-none placeholder:text-text-muted" />
          <button className="text-primary text-xs font-semibold">Apply</button>
        </div>

        {/* Order summary */}
        <div className="bg-app-bg rounded-2xl p-4 mb-4">
          <h3 className="font-semibold text-text-dark text-sm mb-3">Order Summary</h3>
          <div className="flex flex-col gap-2">
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">Subtotal</span>
              <span className="text-text-dark font-medium">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">Delivery fee</span>
              <span className={deliveryFee === 0 ? 'text-primary font-semibold' : 'text-text-dark font-medium'}>
                {deliveryFee === 0 ? 'FREE' : `$${deliveryFee.toFixed(2)}`}
              </span>
            </div>
            <div className="h-px bg-gray-200 my-1" />
            <div className="flex justify-between">
              <span className="font-bold text-text-dark">Total</span>
              <span className="font-bold text-text-dark text-base">${total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="px-5 py-4 border-t border-gray-100">
        <button
          onClick={() => navigate('checkout', { items, subtotal, deliveryFee, total })}
          className="w-full bg-primary text-white py-4 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2"
        >
          <Truck size={18} />
          Proceed to Checkout · ${total.toFixed(2)}
        </button>
      </div>
    </div>
  )
}
