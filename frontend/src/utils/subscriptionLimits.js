/**
 * Subscription Limits Frontend Utilities
 * Helper functions for handling subscription limit errors and displaying messages
 */

// Extract limit error information from API response
export const parseLimitError = (error) => {
  if (!error?.response?.data) {
    return null;
  }

  const errorData = error.response.data;
  
  // Check if this is a limit-related error
  if (errorData.limit || errorData.error?.includes('limit')) {
    return {
      type: 'limit_exceeded',
      message: errorData.error || errorData.message,
      limit: errorData.limit,
      planName: errorData.limit?.planName || 'basic',
      current: errorData.limit?.current || 0,
      maximum: errorData.limit?.maximum || 0,
      resetDate: errorData.limit?.resetDate
    };
  }
  
  return null;
};

// Format limit error message for display
export const formatLimitMessage = (limitError) => {
  if (!limitError) return '';
  
  const { planName, current, maximum, resetDate } = limitError;
  
  if (limitError.message.includes('Form creation')) {
    return {
      title: 'Form Limit Reached',
      message: `You've reached your form limit (${maximum} forms) for the ${planName} plan.`,
      suggestion: 'Upgrade your plan to create more forms.',
      actionType: 'upgrade'
    };
  }
  
  if (limitError.message.includes('submission limit')) {
    const resetDateFormatted = resetDate ? new Date(resetDate).toLocaleDateString() : 'next month';
    return {
      title: 'Monthly Submission Limit Reached',
      message: `You've used all ${maximum} submissions for this month (${current}/${maximum}).`,
      suggestion: `Your limit will reset on ${resetDateFormatted}, or you can upgrade for more submissions.`,
      actionType: 'wait_or_upgrade',
      resetDate: resetDateFormatted
    };
  }
  
  return {
    title: 'Limit Exceeded',
    message: limitError.message,
    suggestion: 'Please check your subscription plan.',
    actionType: 'check_plan'
  };
};

// Get usage progress percentage
export const getUsageProgress = (current, maximum) => {
  if (!maximum || maximum === 0) return 0;
  return Math.min((current / maximum) * 100, 100);
};

// Get usage status color
export const getUsageStatusColor = (current, maximum) => {
  const percentage = getUsageProgress(current, maximum);
  
  if (percentage >= 100) return 'red';
  if (percentage >= 80) return 'orange';
  if (percentage >= 60) return 'yellow';
  return 'green';
};

// Check if user is approaching limit
export const isApproachingLimit = (current, maximum, threshold = 0.8) => {
  if (!maximum || maximum === 0) return false;
  return (current / maximum) >= threshold;
};

// Format usage display text
export const formatUsageText = (current, maximum, type = 'items') => {
  return `${current}/${maximum} ${type} used`;
};

// API call wrapper with limit error handling
export const apiCallWithLimitHandling = async (apiCall, onLimitExceeded) => {
  try {
    const result = await apiCall();
    return { success: true, data: result };
  } catch (error) {
    const limitError = parseLimitError(error);
    
    if (limitError && onLimitExceeded) {
      onLimitExceeded(limitError);
      return { success: false, limitError };
    }
    
    // Re-throw if not a limit error
    throw error;
  }
};

// Usage statistics formatter
export const formatUsageStats = (stats) => {
  if (!stats) return null;
  
  return {
    plan: {
      name: stats.planName,
      displayName: stats.limits?.name || `${stats.planName} Plan`
    },
    forms: {
      current: stats.usage?.forms?.current || 0,
      maximum: stats.usage?.forms?.maximum || 0,
      remaining: stats.usage?.forms?.remaining || 0,
      progress: getUsageProgress(stats.usage?.forms?.current, stats.usage?.forms?.maximum),
      status: getUsageStatusColor(stats.usage?.forms?.current, stats.usage?.forms?.maximum)
    },
    submissions: {
      current: stats.usage?.submissions?.current || 0,
      maximum: stats.usage?.submissions?.maximum || 0,
      remaining: stats.usage?.submissions?.remaining || 0,
      progress: getUsageProgress(stats.usage?.submissions?.current, stats.usage?.submissions?.maximum),
      status: getUsageStatusColor(stats.usage?.submissions?.current, stats.usage?.submissions?.maximum),
      resetDate: stats.usage?.submissions?.resetDate
    }
  };
};