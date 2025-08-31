export const subscriptionPlans = {
  basic: {
    name: 'Basic Plan',
    formLimit: 1,
    submissionLimit: 1000, // per month
    description: 'Perfect for individuals and small businesses',
    features: ['1 Form', '1,000 Monthly Submissions', 'Basic Support']
  },
  standard: {
    name: 'Standard Plan', 
    formLimit: 5,
    submissionLimit: 10000, // per month
    description: 'Ideal for growing businesses',
    features: ['5 Forms', '10,000 Monthly Submissions', 'Priority Support', 'Advanced Analytics']
  },
  premium: {
    name: 'Premium Plan',
    formLimit: 10, 
    submissionLimit: 30000, // per month
    description: 'Best for large organizations',
    features: ['10 Forms', '30,000 Monthly Submissions', '24/7 Support', 'Advanced Analytics', 'Custom Branding']
  }
};

// Helper function to get plan by name
export const getPlanByName = (planName) => {
  return subscriptionPlans[planName] || subscriptionPlans.basic;
};

// Helper function to get all plan names
export const getAllPlanNames = () => {
  return Object.keys(subscriptionPlans);
};

// Helper function to get plan limits by form count (for plan comparison)
export const getPlanByFormLimit = (formLimit) => {
  const plans = Object.values(subscriptionPlans);
  return plans.find(plan => plan.formLimit === formLimit) || subscriptionPlans.basic;
};

// Helper function to determine if a plan change is an upgrade or downgrade
export const comparePlans = (fromPlanName, toPlanName) => {
  // Normalize plan names to lowercase and remove 'plan' suffix
  const normalizePlanName = (name) => {
    if (!name) return 'basic';
    return name.toLowerCase().replace(/\s*plan\s*$/i, '').trim();
  };

  const normalizedFrom = normalizePlanName(fromPlanName);
  const normalizedTo = normalizePlanName(toPlanName);

  const fromPlan = subscriptionPlans[normalizedFrom] || subscriptionPlans.basic;
  const toPlan = subscriptionPlans[normalizedTo] || subscriptionPlans.basic;

  const fromLimit = fromPlan.formLimit;
  const toLimit = toPlan.formLimit;

  return {
    isUpgrade: toLimit > fromLimit,
    isDowngrade: toLimit < fromLimit,
    isSamePlan: toLimit === fromLimit,
    fromPlan: fromPlan,
    toPlan: toPlan,
    fromLimit,
    toLimit
  };
};
