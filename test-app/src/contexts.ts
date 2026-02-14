import type { FFContext } from './flags/FlagProvider';

export const testContexts: Record<string, FFContext> = {
  freeUser: {
    kind: 'user', key: 'user-free-001', name: 'Alex Free',
    attributes: { email: 'alex@free.com', country: 'US', plan: 'free', age: 25 },
  },
  premiumUser: {
    kind: 'user', key: 'user-premium-001', name: 'Jane Premium',
    attributes: { email: 'jane@premium.com', country: 'US', plan: 'premium', age: 32 },
  },
  adminUser: {
    kind: 'user', key: 'user-admin-001', name: 'Admin Bob',
    attributes: { email: 'bob@admin.com', country: 'US', plan: 'enterprise', role: 'admin', age: 40 },
  },
  israeliUser: {
    kind: 'user', key: 'user-il-001', name: 'Yael Cohen',
    attributes: { email: 'yael@example.co.il', country: 'IL', plan: 'premium', age: 28 },
  },
  euUser: {
    kind: 'user', key: 'user-eu-001', name: 'Hans Mueller',
    attributes: { email: 'hans@example.de', country: 'DE', plan: 'free', age: 35 },
  },
  mobileUser: {
    kind: 'device', key: 'device-ios-001', name: 'iPhone 15',
    attributes: { platform: 'ios', version: '17.2', model: 'iPhone15,2' },
  },
  betaTester: {
    kind: 'user', key: 'user-beta-001', name: 'Beta Tina',
    attributes: { email: 'tina@beta.com', country: 'US', plan: 'free', beta: true, age: 22 },
  },
  newUser: {
    kind: 'user', key: 'user-new-001', name: 'New Noah',
    attributes: { email: 'noah@new.com', country: 'US', plan: 'free', signupDate: '2024-01-15', age: 19 },
  },
};

export const contextLabels: Record<string, string> = {
  freeUser: '👤 Alex Free (Free)',
  premiumUser: '⭐ Jane Premium',
  adminUser: '🛡️ Admin Bob',
  israeliUser: '🇮🇱 Yael Cohen (IL)',
  euUser: '🇩🇪 Hans Mueller (EU)',
  mobileUser: '📱 iPhone 15',
  betaTester: '🧪 Beta Tina',
  newUser: '🆕 New Noah',
};
