import { useFlag } from '../flags/FlagProvider';

export function CheckoutButton() {
  const variant = useFlag<string>('checkout-flow', 'v1');

  if (variant === 'v3') {
    return (
      <div className="space-y-2">
        <button className="w-full bg-black text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors">
           Pay
        </button>
        <span className="text-xs text-gray-400 block text-center">Checkout v3 — One-click</span>
      </div>
    );
  }

  if (variant === 'v2') {
    return (
      <div className="space-y-2">
        <button className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-medium hover:bg-indigo-700 transition-colors">
          🛒 Add to Cart
        </button>
        <button className="w-full border border-indigo-600 text-indigo-600 py-2 rounded-lg font-medium hover:bg-indigo-50 transition-colors dark:hover:bg-indigo-900/20">
          Checkout →
        </button>
        <span className="text-xs text-gray-400 block text-center">Checkout v2 — Two-step</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <button className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors">
        Buy Now
      </button>
      <span className="text-xs text-gray-400 block text-center">Checkout v1 — Simple</span>
    </div>
  );
}
