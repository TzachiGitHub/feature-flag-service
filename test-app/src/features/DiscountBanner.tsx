import { useFlag } from '../flags/FlagProvider';

export function DiscountBanner() {
  const show = useFlag('discount-banner', false);
  if (!show) return null;

  return (
    <div className="bg-gradient-to-r from-pink-500 to-orange-400 text-white py-3 px-4 text-center font-semibold rounded-lg mb-6 animate-pulse">
      🎉 20% OFF — Limited Time! Use code <span className="font-mono bg-white/20 px-2 py-0.5 rounded">FLAG20</span>
    </div>
  );
}
