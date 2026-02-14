export interface LearnTopic {
  id: string;
  title: string;
  icon: string;
  sections: Array<{
    heading: string;
    content: string;
    codeExample?: { language: string; code: string };
  }>;
}

export const learnContent: LearnTopic[] = [
  {
    id: 'what-are-feature-flags',
    title: 'What are Feature Flags?',
    icon: '🏁',
    sections: [
      {
        heading: 'The Problem',
        content: 'Imagine you\'re deploying a new checkout flow to your e-commerce site. You\'ve tested it locally, it passed code review, and CI is green. You deploy to production... and conversion rates drop 15%. You scramble to revert, but the rollback takes 20 minutes. In that time, you\'ve lost thousands of dollars in revenue.\n\n**Feature flags** solve this by decoupling **deployment** from **release**. You deploy your code to production, but the new checkout flow is behind a flag — turned off by default. When you\'re ready, you flip the flag to turn it on. If something goes wrong, you flip it back off instantly. No deployment, no rollback, no downtime.',
      },
      {
        heading: 'A Brief History',
        content: 'The concept was popularized by Martin Fowler in his 2010 article on **Feature Toggles**. But the practice predates the name — companies like Flickr were using "flippers" and "flags" as early as 2009 to manage their rapid deployment cycle.\n\nToday, feature flags are a cornerstone of modern software delivery. **Facebook** uses them to gate every feature behind a flag before launch. **Netflix** uses flags to manage its complex microservice architecture. **Google** runs thousands of experiments simultaneously using flag-like systems.',
      },
      {
        heading: 'The Simplest Example',
        content: 'At its core, a feature flag is an `if` statement controlled remotely:',
        codeExample: {
          language: 'typescript',
          code: `const showNewCheckout = featureFlags.evaluate('new-checkout', user);

if (showNewCheckout) {
  renderNewCheckout();
} else {
  renderOldCheckout();
}`,
        },
      },
      {
        heading: 'Why Not Just Use Config Files?',
        content: 'You might wonder: "Can\'t I just use environment variables or config files?" You could, but you\'d miss the key benefits:\n\n- **Instant changes**: No redeployment needed\n- **Targeting**: Show features to specific users, not everyone\n- **Gradual rollouts**: Release to 1% of users, then 5%, then 50%\n- **Kill switches**: Turn off a feature in seconds if it causes issues\n- **Audit trail**: Know who changed what and when\n\nFeature flags are config on steroids — with targeting, analytics, and safety built in.',
      },
    ],
  },
  {
    id: 'types-of-feature-flags',
    title: 'Types of Feature Flags',
    icon: '🏷️',
    sections: [
      {
        heading: 'Not All Flags Are Created Equal',
        content: 'Feature flags serve different purposes with different lifespans. Understanding the types helps you manage them effectively and avoid **flag debt**.',
      },
      {
        heading: 'Release Flags',
        content: 'The most common type. Release flags gate incomplete or untested features so you can deploy code to production before it\'s ready for users. They\'re **short-lived** — once the feature is stable and launched to 100%, the flag should be removed.\n\nExample: You\'re building a new dashboard. You deploy it behind `new-dashboard` flag, test with internal users, then gradually roll it out. Once it\'s fully launched, you remove the flag and the old dashboard code.',
        codeExample: {
          language: 'typescript',
          code: `// Release flag — remove after full launch
if (flags.get('new-dashboard')) {
  return <NewDashboard />;
}
return <OldDashboard />;`,
        },
      },
      {
        heading: 'Ops Flags (Kill Switches)',
        content: 'Operational flags are **long-lived** and act as safety valves. They let you disable features or degrade gracefully under load without deploying code.\n\n- **Kill switches**: Turn off a feature instantly if it causes issues\n- **Circuit breakers**: Disable calls to a failing downstream service\n- **Load shedding**: Disable non-critical features during peak traffic\n\nEvery critical feature in production should have a kill switch. It\'s your emergency brake.',
      },
      {
        heading: 'Experiment Flags',
        content: 'Used for **A/B testing** and experimentation. These flags have multiple variations (not just on/off) and are tied to metrics.\n\nExample: Test three different pricing page layouts. Flag `pricing-layout` has variations "control", "variant-a", "variant-b". Users are randomly assigned to a variation, and you measure conversion rates to determine the winner.',
      },
      {
        heading: 'Permission Flags',
        content: 'Gate features based on **entitlements** or **access levels**. These are often long-lived and tied to business logic.\n\n- Premium features only for paying customers\n- Beta features for early adopters\n- Admin tools for internal users\n\nUnlike release flags, permission flags may never be removed — they represent permanent business rules.',
      },
    ],
  },
  {
    id: 'feature-flag-lifecycle',
    title: 'Feature Flag Lifecycle',
    icon: '🔄',
    sections: [
      {
        heading: 'Birth to Retirement',
        content: 'Every feature flag should follow a lifecycle: **Create → Configure → Roll Out → Launch → Clean Up**. The most important (and most neglected) step is the last one.',
      },
      {
        heading: 'Stage 1: Create',
        content: 'A developer creates a flag when starting work on a new feature. The flag starts **off** in all environments. The code is deployed behind the flag — dark and invisible to users.\n\nBest practice: Name your flag descriptively (`enable-new-search`, not `flag-123`) and add a description explaining what it controls and when it should be removed.',
      },
      {
        heading: 'Stage 2: Roll Out Gradually',
        content: 'Once the feature is ready, start rolling it out:\n\n1. **Internal testing**: Target your team using individual targets or a "staff" segment\n2. **Beta**: Open to opt-in beta users (5-10%)\n3. **Canary**: Roll to 1% of general users, monitor metrics\n4. **Expand**: 5% → 25% → 50% → 100%, pausing at each step to check for issues\n\nThis process might take days or weeks depending on risk level.',
      },
      {
        heading: 'Stage 3: Full Launch',
        content: 'The flag is now serving the new experience to 100% of users. The feature is "launched." But the flag still exists in your code...',
      },
      {
        heading: 'Stage 4: Clean Up (The Hard Part)',
        content: 'This is where most teams fail. The flag is at 100%, everything works, so everyone moves on to the next feature. The flag stays in the code. **Forever.**\n\nThe average company has **50-100 active flags** at any time. Many of those are stale — they\'ve been at 100% for months but nobody removed them. Each stale flag is:\n\n- **Confusing**: New developers don\'t know if it\'s safe to remove\n- **Risky**: The "off" path hasn\'t been tested in months and might be broken\n- **Costly**: Every flag adds branching complexity to your codebase\n\n**Rule of thumb**: Set a removal date when you create the flag. Add it to your sprint backlog. Treat flag cleanup like any other tech debt.',
      },
    ],
  },
  {
    id: 'targeting-and-segmentation',
    title: 'Targeting & Segmentation',
    icon: '🎯',
    sections: [
      {
        heading: 'Beyond On/Off',
        content: 'The real power of feature flags isn\'t just turning features on or off — it\'s controlling **who** sees what. Targeting lets you serve different experiences to different users based on their attributes.',
      },
      {
        heading: 'Targeting by Attributes',
        content: 'Every user (or "context") has attributes you can target:\n\n- **Geography**: Country, region, city — roll out to Canada before the US\n- **Plan tier**: Show premium features only to paying customers\n- **Device**: Enable mobile-specific features on iOS but not Android yet\n- **Company**: Roll out B2B features company by company\n- **Custom attributes**: Anything you pass — `signup_date`, `total_orders`, `ab_cohort`',
        codeExample: {
          language: 'typescript',
          code: `// Context passed to the SDK
const context = {
  kind: 'user',
  key: 'user-456',
  name: 'Alice',
  attributes: {
    country: 'CA',
    plan: 'premium',
    device: 'ios',
    signup_date: '2024-01-15'
  }
};`,
        },
      },
      {
        heading: 'Segments: Reusable Audiences',
        content: 'A **segment** is a saved group of users defined by rules. Instead of repeating the same targeting rules across multiple flags, you define a segment once and reference it.\n\nExamples:\n- "Beta Users" — users who opted in to beta\n- "Enterprise Customers" — organizations with 100+ seats\n- "EU Users" — users in EU countries (for GDPR compliance)\n\nSegments update in real-time. Add a rule to the "Beta Users" segment, and every flag targeting that segment updates automatically.',
      },
      {
        heading: 'Individual Targeting',
        content: 'Sometimes you need to target specific users by their key. This is invaluable for:\n\n- **Debugging**: "Show the new checkout to user-789 so they can reproduce their bug"\n- **VIP access**: "Enable the feature for our CEO\'s demo account"\n- **Testing in production**: "Let QA test the feature with specific test accounts"\n\nIndividual targets are evaluated **before** any rules, so they always take priority.',
      },
      {
        heading: 'Rule Evaluation Order',
        content: 'When a flag is evaluated, the system checks in order:\n\n1. **Is the flag off?** → Serve the off variation\n2. **Prerequisites met?** → If not, serve off variation\n3. **Individual targets** → If user is explicitly targeted, serve that variation\n4. **Targeting rules** (in order) → First matching rule wins\n5. **Fallthrough** → Default rule for everyone else (often a percentage rollout)',
      },
    ],
  },
  {
    id: 'percentage-rollouts',
    title: 'Percentage Rollouts & Canary Releases',
    icon: '📊',
    sections: [
      {
        heading: 'The Gradual Release',
        content: 'Instead of flipping a feature on for everyone at once, percentage rollouts let you release gradually: 1% → 5% → 25% → 50% → 100%. At each step, you monitor error rates, performance, and user feedback. If something looks wrong, you roll back to 0% instantly.',
      },
      {
        heading: 'How It Works: Consistent Hashing',
        content: 'The key challenge is: how do you ensure the **same user** always gets the **same experience**? You don\'t want a user to see the new checkout on one page load and the old checkout on the next.\n\nThe answer is **consistent hashing**. We hash the user\'s key (e.g., their user ID) to get a number between 0 and 99. If the rollout is at 25%, users with hashes 0-24 get the new experience. User "alice" always hashes to 42, so she\'s always in or out of the rollout consistently.',
        codeExample: {
          language: 'typescript',
          code: `// Simplified consistent hashing
function getBucket(userKey: string, flagKey: string): number {
  const hash = murmurHash3(userKey + '.' + flagKey);
  return hash % 100; // 0-99
}

// 25% rollout: users with bucket 0-24 get the new experience
const bucket = getBucket('alice', 'new-checkout');
const showNew = bucket < 25; // Always consistent for 'alice'`,
        },
      },
      {
        heading: 'Canary Releases',
        content: 'A **canary release** is a specific rollout strategy: release to a very small percentage (1-5%) first and carefully monitor. The name comes from the "canary in a coal mine" — the small group acts as an early warning system.\n\nCanary release checklist:\n1. Roll to 1%\n2. Monitor for 1-4 hours: error rates, latency, crash rates\n3. If metrics are good, increase to 5%\n4. Monitor for 24 hours\n5. Increase to 25%, 50%, 100% with monitoring at each step',
      },
      {
        heading: 'Sticky Bucketing',
        content: 'What happens when you increase the rollout from 25% to 50%? With consistent hashing, users who were in the 25% group stay in. Only new users (buckets 25-49) are added. This is called **sticky bucketing** — users never switch between variations during a rollout.\n\nThis is crucial for user experience. Imagine using a new checkout flow, getting comfortable with it, and then suddenly being switched back to the old one. Sticky bucketing prevents this.',
      },
    ],
  },
  {
    id: 'ab-testing',
    title: 'A/B Testing with Flags',
    icon: '🧪',
    sections: [
      {
        heading: 'Experiments, Not Guesses',
        content: 'A/B testing turns product decisions from opinions into data. Instead of debating whether the blue or green button converts better, you test both and let the numbers decide.\n\nFeature flags are the perfect mechanism for A/B tests because they already handle variation assignment, consistent bucketing, and targeting.',
      },
      {
        heading: 'Setting Up an Experiment',
        content: 'Every experiment needs:\n\n1. **Hypothesis**: "Changing the CTA button from blue to green will increase signup conversion by 5%"\n2. **Metric**: Signup conversion rate (signups / visitors)\n3. **Variations**: Control (blue button) and Treatment (green button)\n4. **Sample size**: How many users you need for statistical confidence\n5. **Duration**: How long to run (based on your traffic and desired sample size)',
        codeExample: {
          language: 'typescript',
          code: `// Flag: 'cta-button-color'
// Variations: 'blue' (control), 'green' (treatment)
const ctaColor = flags.evaluate('cta-button-color', user);

// Track the metric
function onSignup() {
  analytics.track('signup-conversion', {
    flagKey: 'cta-button-color',
    variation: ctaColor
  });
}`,
        },
      },
      {
        heading: 'Statistical Significance',
        content: 'You need enough data to be confident the result isn\'t due to random chance. **Statistical significance** (typically p < 0.05) means there\'s less than a 5% chance the observed difference is random.\n\nA simplified **Chi-squared test** for conversion rates:\n1. Count conversions and non-conversions for each variation\n2. Calculate expected values (what you\'d expect if there were no difference)\n3. Compute χ² = Σ (observed - expected)² / expected\n4. If χ² > 3.84 (for 1 degree of freedom), the result is significant at 95% confidence\n\n**Common mistake**: Stopping the test as soon as you see a "winner." This leads to false positives. Always run to your pre-determined sample size.',
      },
      {
        heading: 'Sample Size Matters',
        content: 'How many users do you need? It depends on:\n\n- **Baseline conversion rate**: A 50% rate needs fewer samples than a 2% rate\n- **Minimum detectable effect**: Detecting a 0.1% improvement needs far more samples than detecting a 5% improvement\n- **Confidence level**: 95% confidence (standard) vs 99% (more conservative)\n\nRule of thumb: For a 2% baseline conversion rate and a 10% relative improvement (2% → 2.2%), you need about **80,000 users per variation**. For many products, that means running the test for weeks.',
      },
    ],
  },
  {
    id: 'trunk-based-development',
    title: 'Trunk-Based Development',
    icon: '🌳',
    sections: [
      {
        heading: 'One Branch to Rule Them All',
        content: 'In trunk-based development, all developers commit to a single main branch (the "trunk"). There are no long-lived feature branches. Code is integrated continuously — multiple times per day.\n\nThis sounds scary. How do you work on features that take weeks? How do you prevent half-finished code from reaching users? The answer: **feature flags**.',
      },
      {
        heading: 'Feature Flags Replace Feature Branches',
        content: 'Instead of:\n1. Create `feature/new-search` branch\n2. Work on it for 3 weeks\n3. Try to merge back to main (merge conflicts everywhere)\n4. Spend 2 days resolving conflicts\n5. Hope nothing breaks\n\nYou do:\n1. Create a `new-search` feature flag (off by default)\n2. Commit directly to main, behind the flag\n3. Deploy daily — the code is in production but invisible\n4. When ready, turn on the flag\n5. No merge conflicts. Ever.',
        codeExample: {
          language: 'typescript',
          code: `// Work in progress — deployed to production but behind a flag
function SearchPage() {
  const useNewSearch = flags.get('new-search');
  
  if (useNewSearch) {
    // New search — still under development
    return <NewSearchExperience />;
  }
  
  // Current search — what users see
  return <CurrentSearch />;
}`,
        },
      },
      {
        heading: 'CI/CD Friendly',
        content: 'Trunk-based development is the foundation of true CI/CD:\n\n- **Continuous Integration**: Everyone integrates to trunk multiple times daily. Conflicts are tiny and caught immediately.\n- **Continuous Delivery**: Trunk is always deployable. Deploy multiple times per day.\n- **Continuous Deployment**: Every commit that passes CI is automatically deployed to production.\n\nFeature flags make this safe. Unfinished features are deployed but hidden. There\'s no "feature freeze" before a release — you just turn off flags for features that aren\'t ready.',
      },
      {
        heading: 'The Merge Hell Alternative',
        content: 'Long-lived branches are a productivity killer. Studies show that branches living longer than 2 days have **exponentially** more merge conflicts. A branch that lives for 2 weeks might take a full day to merge.\n\nWith trunk-based development + feature flags:\n- PRs are small (< 200 lines) and easy to review\n- Integration happens daily, not monthly\n- There\'s no "integration sprint" or "merge week"\n- New developers can understand the codebase because there\'s one version of truth',
      },
    ],
  },
  {
    id: 'dark-launches',
    title: 'Dark Launches',
    icon: '🌑',
    sections: [
      {
        heading: 'Hidden in Plain Sight',
        content: 'A dark launch deploys a feature to production and exercises it with real traffic — but hides the results from users. The feature is "dark": running in the background, processing real data, but its output is discarded or hidden.',
      },
      {
        heading: 'Why Dark Launch?',
        content: 'Testing in staging is limited. Staging environments have:\n- Fake data (or stale copies of production data)\n- 1/100th of production traffic\n- Different infrastructure (smaller databases, fewer servers)\n- No real user behavior patterns\n\nA dark launch lets you test with **real traffic, real data, at real scale** without any user impact. You can catch performance issues, data edge cases, and scaling problems that would never surface in staging.',
      },
      {
        heading: 'How Netflix Does It',
        content: 'Netflix dark-launches nearly every major feature. When building a new recommendation algorithm:\n\n1. Deploy the new algorithm behind a flag\n2. For every user request, run **both** old and new algorithms\n3. Serve results from the old algorithm (user sees nothing different)\n4. Log results from the new algorithm for comparison\n5. Compare: Is the new algorithm faster? Do its recommendations make sense? Does it handle edge cases?\n6. Once confident, flip the flag to serve new algorithm results',
        codeExample: {
          language: 'typescript',
          code: `async function getRecommendations(user: User) {
  const recs = await oldAlgorithm.recommend(user);
  
  if (flags.get('dark-launch-new-recs')) {
    // Run new algorithm in background — don't show to user
    newAlgorithm.recommend(user).then(newRecs => {
      metrics.compare('recommendations', recs, newRecs);
    });
  }
  
  return recs; // Always serve old results
}`,
        },
      },
      {
        heading: 'Shadow Traffic',
        content: 'A related technique is **shadow traffic**: duplicating real production requests and sending them to a new service. This is especially useful for microservice migrations.\n\nFor example, migrating from a monolith to microservices: shadow 100% of traffic to the new service, compare responses, fix discrepancies, then cut over. The dark launch flag controls whether shadow traffic is active.',
      },
    ],
  },
  {
    id: 'kill-switches',
    title: 'Kill Switches',
    icon: '🔴',
    sections: [
      {
        heading: 'The Emergency Brake',
        content: 'A kill switch is a feature flag designed for one purpose: turning a feature **off** instantly in an emergency. No deployment, no code review, no CI pipeline. Just flip a switch in the dashboard.',
      },
      {
        heading: 'Response Time: Seconds vs Minutes',
        content: 'Without kill switches, disabling a broken feature requires:\n1. Identify the problem (5-10 min)\n2. Write a fix or revert commit (5-30 min)\n3. Code review (5-15 min)\n4. CI/CD pipeline (10-30 min)\n5. Deploy (5-15 min)\n\n**Total: 30-100 minutes**\n\nWith a kill switch:\n1. Identify the problem (5-10 min)\n2. Flip the switch in the dashboard (5 seconds)\n3. SDK picks up change via streaming (< 1 second)\n\n**Total: 5-10 minutes**\n\nThat difference can mean millions of dollars for high-traffic services.',
      },
      {
        heading: 'What Needs a Kill Switch?',
        content: 'Not every feature needs one, but critical ones absolutely do:\n\n- **Payment flows**: If checkout is broken, you\'re losing revenue every second\n- **Third-party integrations**: External services go down; degrade gracefully\n- **New features**: Anything recently launched should have a kill switch for at least 2 weeks\n- **Expensive operations**: Features that hit the database hard or call slow APIs\n- **User-facing algorithms**: Recommendation engines, search ranking, feed algorithms',
      },
      {
        heading: 'Implementation Pattern',
        content: 'Kill switches should default to **on** (feature enabled) and only be flipped to **off** in emergencies:',
        codeExample: {
          language: 'typescript',
          code: `// Kill switch pattern — default is ON (feature works normally)
const paymentEnabled = flags.get('enable-payments', true);

if (!paymentEnabled) {
  return <MaintenancePage message="Payments temporarily unavailable" />;
}

return <PaymentFlow />;`,
        },
      },
    ],
  },
  {
    id: 'flag-debt',
    title: 'Flag Debt',
    icon: '💸',
    sections: [
      {
        heading: 'The Silent Killer',
        content: 'Feature flags are meant to be **temporary**. But in practice, they accumulate. Teams create flags faster than they remove them. Over time, this creates **flag debt** — a form of tech debt that makes your codebase harder to understand, test, and maintain.',
      },
      {
        heading: 'The Rot Sets In',
        content: 'A stale feature flag causes real problems:\n\n- **Code confusion**: New developers find a flag and wonder, "Is this still used? Is it safe to remove?" Nobody knows, so nobody touches it.\n- **Dead code paths**: The "off" branch of a fully-launched flag hasn\'t been tested in months. It might not even compile anymore.\n- **Test complexity**: Every flag doubles the number of code paths. 10 flags = 1,024 possible combinations. Most are never tested.\n- **Performance**: Flag evaluation has a cost. Thousands of stale flags slow down every request.\n- **Security**: Old flags might have unintended side effects or bypass new security checks.',
      },
      {
        heading: 'The Cleanup Process',
        content: 'Fighting flag debt requires process:\n\n1. **Set expiration dates**: When creating a flag, set a "remove by" date\n2. **Stale flag alerts**: Automatically detect flags that have been 100% for 7+ days\n3. **Flag ownership**: Every flag has an owner responsible for cleanup\n4. **Sprint allocation**: Dedicate 10-20% of sprint capacity to flag cleanup\n5. **Automated detection**: Tools that scan code for flag references and flag them for removal',
        codeExample: {
          language: 'typescript',
          code: `// BAD: This flag has been at 100% for 6 months
if (flags.get('new-search')) {  // TODO: remove this flag
  return <NewSearch />;         // (added 6 months ago)
}
return <OldSearch />;  // Is this code even valid anymore?

// GOOD: Clean up after launch
// The flag is removed, the old code is deleted
return <NewSearch />;`,
        },
      },
      {
        heading: 'The Numbers',
        content: 'Industry data:\n- Average company has **50-100 active flags** at any time\n- **30-40%** of those are stale (fully launched but not cleaned up)\n- Each stale flag costs an estimated **2-4 hours** of developer time when someone needs to understand or modify that code\n- Companies with good flag hygiene remove flags within **2 weeks** of full launch\n- Companies with poor hygiene have flags living **6+ months** past their expiration',
      },
    ],
  },
  {
    id: 'client-vs-server-evaluation',
    title: 'Architecture: Client vs Server Evaluation',
    icon: '🏗️',
    sections: [
      {
        heading: 'Two Approaches',
        content: 'There are two fundamentally different ways to evaluate feature flags: **client-side** (local evaluation) and **server-side** (remote evaluation). Each has trade-offs.',
      },
      {
        heading: 'Client-Side (Local) Evaluation',
        content: 'The SDK downloads all flag rules on initialization and evaluates flags locally, in-process.\n\n**Pros:**\n- ⚡ **Fast**: No network call per evaluation — just an in-memory lookup (microseconds)\n- 📴 **Works offline**: Once rules are cached, evaluation works without a connection\n- 📉 **Low server load**: The flag service only sends rule updates, not per-request evaluations\n\n**Cons:**\n- 📦 **Larger SDK**: Must include the evaluation engine\n- 🔄 **Stale data**: Rules might be slightly out of date between updates\n- 🔒 **Security concern**: All flag rules are sent to the client (important for client-side/browser SDKs)',
        codeExample: {
          language: 'typescript',
          code: `// Client-side SDK: rules downloaded once, evaluated locally
const client = new FeatureFlagClient({ sdkKey: 'sdk-xxx' });
await client.initialize(); // Downloads all flag rules

// Evaluation is instant — no network call
const value = client.evaluate('my-flag', context); // ~0.1ms`,
        },
      },
      {
        heading: 'Server-Side (Remote) Evaluation',
        content: 'The SDK sends the context to the flag service and receives the evaluated result.\n\n**Pros:**\n- 🎯 **Always fresh**: Every evaluation uses the latest rules\n- 🔒 **Secure**: Flag rules never leave the server\n- 📦 **Simple SDK**: Just an HTTP client, no evaluation engine\n\n**Cons:**\n- 🌐 **Network dependency**: Every evaluation requires a network call (adds latency)\n- 💥 **Single point of failure**: If the flag service is down, evaluations fail\n- 📈 **Higher server load**: Every flag evaluation is a request to the service',
      },
      {
        heading: 'Streaming vs Polling',
        content: 'For client-side SDKs, how do they stay up to date?\n\n**Polling**: The SDK asks "any changes?" at a fixed interval (e.g., every 30 seconds). Simple but introduces up to 30 seconds of lag.\n\n**Streaming (SSE)**: The SDK opens a persistent connection. The server pushes changes instantly when they happen. Near-zero lag.\n\n**Server-Sent Events (SSE)** is the standard for streaming. It\'s a simple HTTP connection that stays open. The server sends events as they occur:',
        codeExample: {
          language: 'typescript',
          code: `// SSE connection for real-time flag updates
const eventSource = new EventSource('/api/stream?sdkKey=sdk-xxx');

eventSource.addEventListener('flag-update', (event) => {
  const update = JSON.parse(event.data);
  flagStore.update(update.key, update.rules);
  console.log(\`Flag "\${update.key}" updated in real-time\`);
});

eventSource.addEventListener('heartbeat', () => {
  // Connection is alive — server sends these every 30s
});`,
        },
      },
      {
        heading: 'Which Should You Use?',
        content: 'Most modern feature flag systems use **client-side evaluation with streaming updates**. This gives you the best of both worlds: instant evaluation (no network call) with near-real-time updates (SSE streaming).\n\n- **Server-side apps** (Node.js, Python, Go): Client-side SDK with streaming. Rules cached in memory.\n- **Browser/mobile apps**: Client-side SDK, but be careful about rule size and sensitive data. Some systems send only evaluated results for client-side SDKs.\n- **Serverless/edge**: Remote evaluation or pre-computed edge config, since there\'s no persistent process to cache rules.',
      },
    ],
  },
];
