import { useFlag } from '../flags/FlagProvider';

interface PricingConfig {
  currency: string;
  discount: number;
  showOriginal: boolean;
}

const defaultConfig: PricingConfig = { currency: 'USD', discount: 0, showOriginal: false };

const currencySymbols: Record<string, string> = { USD: '$', ILS: '₪', EUR: '€', GBP: '£' };

export function usePrice(basePrice: number) {
  const config = useFlag<PricingConfig>('pricing-config', defaultConfig);
  const symbol = currencySymbols[config.currency] || config.currency + ' ';
  const discounted = basePrice * (1 - config.discount / 100);

  return {
    original: `${symbol}${basePrice.toFixed(2)}`,
    final: `${symbol}${discounted.toFixed(2)}`,
    hasDiscount: config.discount > 0,
    showOriginal: config.showOriginal,
  };
}

export function ProductPrice({ price }: { price: number }) {
  const p = usePrice(price);

  return (
    <div className="flex items-center gap-2">
      <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{p.final}</span>
      {p.hasDiscount && p.showOriginal && (
        <span className="text-sm text-gray-400 line-through">{p.original}</span>
      )}
    </div>
  );
}
