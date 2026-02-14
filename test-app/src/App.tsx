import { FlagProvider } from './flags/FlagProvider';
import { testContexts } from './contexts';
import { products } from './data/products';
import { useDarkMode, DarkModeIndicator } from './features/DarkMode';
import { CheckoutButton } from './features/CheckoutFlow';
import { DiscountBanner } from './features/DiscountBanner';
import { ProductPrice } from './features/PricingTier';
import { SearchBar } from './features/SearchAlgorithm';
import { NewBadge } from './features/NewFeature';
import { ContextSwitcher } from './components/ContextSwitcher';
import { FlagDebugPanel } from './components/FlagDebugPanel';
import { ConnectionStatus } from './components/ConnectionStatus';

function ShopContent() {
  const dark = useDarkMode();

  return (
    <div className={`${dark ? 'dark' : ''}`}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-theme">
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 transition-theme">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold">🏪 FlagShop</h1>
              <DarkModeIndicator />
            </div>
            <div className="flex items-center gap-4">
              <ConnectionStatus />
              <ContextSwitcher />
            </div>
          </div>
        </header>

        {/* Main */}
        <main className="max-w-6xl mx-auto px-4 py-8">
          <DiscountBanner />
          <SearchBar />

          {/* Product Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {products.map((product) => (
              <div
                key={product.id}
                className="relative bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md transition-all"
              >
                <NewBadge />
                <div className="text-5xl mb-4 text-center">{product.image}</div>
                <h3 className="font-semibold text-sm mb-1">{product.name}</h3>
                <span className="text-xs text-gray-400 uppercase">{product.category}</span>
                <div className="mt-3">
                  <ProductPrice price={product.price} />
                </div>
                <div className="mt-4">
                  <CheckoutButton />
                </div>
              </div>
            ))}
          </div>

          <FlagDebugPanel />
        </main>

        {/* Footer */}
        <footer className="text-center py-6 text-xs text-gray-400 border-t border-gray-200 dark:border-gray-700">
          FlagShop — Feature Flag Test App • Built for feature-flag-service
        </footer>
      </div>
    </div>
  );
}

const SDK_KEY = 'fef9570c-a134-44b8-9402-e88ac1a7ba4f';

export default function App() {
  return (
    <FlagProvider sdkKey={SDK_KEY} context={testContexts.premiumUser}>
      <ShopContent />
    </FlagProvider>
  );
}
