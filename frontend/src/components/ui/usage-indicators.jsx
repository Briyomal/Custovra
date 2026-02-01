import { useState, useEffect } from 'react';
import { FileText, Send, AlertCircle, BarChart3, TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import axios from 'axios';

const UsageIndicators = () => {
  const [usageStats, setUsageStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUsageStats = async () => {
      try {
        const usageResponse = await axios.get(`${import.meta.env.VITE_SERVER_URL}/api/usage/stats`, {
          withCredentials: true
        });

        if (usageResponse.data.success) {
          setUsageStats(usageResponse.data.data);
        }
      } catch (err) {
        console.error('Error fetching usage stats:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUsageStats();
  }, []);

  const getProgressColor = (current, maximum) => {
    const percentage = (current / maximum) * 100;
    if (percentage >= 100) return 'bg-red-500';
    if (percentage >= 80) return 'bg-orange-500';
    if (percentage >= 60) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  if (loading) {
    return (
      <div className="flex items-center gap-3">
        <div className="animate-pulse">
          <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
        <div className="animate-pulse">
          <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !usageStats) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <AlertCircle className="h-4 w-4" />
        <span>Stats unavailable</span>
      </div>
    );
  }

  const { usage, meterData } = usageStats;

  // Calculate overage status
  const hasSubmissionsOverage = usage.submissions.overage > 0;

  // Get pricing from Polar API (fallback to defaults if not available)
  const formsPricePerUnit = meterData?.forms?.pricePerUnit || 5;
  const submissionsPricePerUnit = meterData?.submissions?.pricePerUnit || 0.002; // Default: $2 per 1000

  // Format pricing for display - always show per submission
  const formatSubmissionPricing = () => {
    return `$${submissionsPricePerUnit.toFixed(3)}/submission`;
  };

  // Mobile dropdown view
  const MobileUsageDropdown = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="md:hidden p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
          <BarChart3 className="h-5 w-5 text-gray-600 dark:text-gray-400" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuItem className="flex flex-col items-start p-4">
          <div className="flex items-center gap-2 w-full mb-2">
            <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <span className="font-medium">Forms Usage</span>
          </div>
          <div className="flex items-center gap-2 ml-6">
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {usage.forms.current}
            </span>
            <span className="text-xs text-gray-500">forms created</span>
          </div>
          <div className="text-xs text-blue-600 dark:text-blue-400 mt-1 ml-6">
            ${formsPricePerUnit}/form charged
          </div>
        </DropdownMenuItem>

        <DropdownMenuItem className="flex flex-col items-start p-4">
          <div className="flex items-center gap-2 w-full mb-2">
            <Send className="h-4 w-4 text-green-600 dark:text-green-400" />
            <span className="font-medium">Submissions Usage</span>
          </div>
          <div className="flex items-center gap-1 ml-6">
            <span className={`text-sm font-medium ${hasSubmissionsOverage ? 'text-orange-600 dark:text-orange-400' : 'text-gray-900 dark:text-gray-100'}`}>
              {usage.submissions.current}
            </span>
            <span className="text-xs text-gray-500">/</span>
            <span className="text-xs text-gray-600 dark:text-gray-400">
              {usage.submissions.included}
            </span>
          </div>
          <div className="w-40 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mt-1 ml-6">
            <div
              className={`h-full transition-all duration-300 ${hasSubmissionsOverage ? 'bg-orange-500' : getProgressColor(usage.submissions.current, usage.submissions.included)}`}
              style={{ width: `${Math.min((usage.submissions.current / usage.submissions.included) * 100, 100)}%` }}
            />
          </div>
          {hasSubmissionsOverage ? (
            <div className="flex flex-col gap-1 mt-1 ml-6">
              <div className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3 text-orange-500" />
                <span className="text-xs font-medium text-orange-600 dark:text-orange-400">
                  +{usage.submissions.overage} overage
                </span>
              </div>
              <span className="text-xs font-semibold text-green-600 dark:text-green-400 ml-4">
                @ {formatSubmissionPricing()}
              </span>
            </div>
          ) : (
            <div className="flex flex-col gap-1 mt-1 ml-6">
              <div className="text-xs text-gray-500">
                {usage.submissions.remaining} remaining this month
              </div>
              <div className="text-xs font-semibold text-green-600 dark:text-green-400">
                {formatSubmissionPricing()} after limit
              </div>
            </div>
          )}
          {usage.submissions.resetDate && (
            <div className="text-xs text-gray-500 mt-1 ml-6">
              Resets: {new Date(usage.submissions.resetDate).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}
            </div>
          )}
        </DropdownMenuItem>

        {hasSubmissionsOverage && (
          <DropdownMenuItem className="p-4 pt-0">
            <Badge variant="warning" className="flex items-center gap-1 w-full justify-center bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300">
              <TrendingUp className="h-3 w-3" />
              <span className="text-xs">Submissions Overage</span>
            </Badge>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <TooltipProvider>
      {/* Desktop view - hidden on mobile */}
      <div className="hidden md:flex items-center gap-2 md:gap-3">
        {/* Forms Usage */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Card className="px-1 py-1 md:px-3 md:py-2 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 border-blue-200 dark:border-blue-800 hover:shadow-md transition-all duration-200 cursor-pointer rounded-md">
              <div className="flex items-center gap-2">
                <FileText className="h-3 w-3 md:h-4 md:w-4 text-blue-600 dark:text-blue-400" />
                <div className="flex flex-col">
                  <div className="flex items-center gap-1">
                    <span className="text-xs md:text-sm font-medium text-gray-900 dark:text-gray-100">
                      {usage.forms.current} Forms
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-center">
              <p className="font-medium">Forms Usage</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {usage.forms.current} forms created
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                ${formsPricePerUnit} charged per form
              </p>
            </div>
          </TooltipContent>
        </Tooltip>

        {/* Submissions Usage */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Card className={`px-1 py-1 md:px-3 md:py-2 ${hasSubmissionsOverage ? 'bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/50 dark:to-amber-950/50 border-orange-200 dark:border-orange-800' : 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/50 dark:to-emerald-950/50 border-green-200 dark:border-green-800'} hover:shadow-md transition-all duration-200 cursor-pointer rounded-md`}>
              <div className="flex items-center gap-2">
                <Send className={`h-3 w-3 md:h-4 md:w-4 ${hasSubmissionsOverage ? 'text-orange-600 dark:text-orange-400' : 'text-green-600 dark:text-green-400'}`} />
                <div className="flex flex-col">
                  <div className="flex items-center gap-1">
                    <span className={`text-xs md:text-sm font-medium ${hasSubmissionsOverage ? 'text-orange-600 dark:text-orange-400' : 'text-gray-900 dark:text-gray-100'}`}>
                      {usage.submissions.current}
                    </span>
                    <span className="text-xs text-gray-500">/</span>
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      {usage.submissions.included}
                    </span>
                  </div>
                  <div className="w-14 md:w-16 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${hasSubmissionsOverage ? 'bg-orange-500' : getProgressColor(usage.submissions.current, usage.submissions.included)}`}
                      style={{ width: `${Math.min((usage.submissions.current / usage.submissions.included) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </Card>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-center">
              <p className="font-medium">Monthly Submissions</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {usage.submissions.current} of {usage.submissions.included} used
              </p>
              {hasSubmissionsOverage ? (
                <>
                  <p className="text-xs font-medium text-orange-600 dark:text-orange-400 mt-1">
                    Overage: +{usage.submissions.overage}
                  </p>
                  <p className="text-xs font-semibold text-green-600 dark:text-green-400 mt-1">
                    @ {formatSubmissionPricing()}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-xs text-gray-500 mt-1">
                    {usage.submissions.remaining} remaining this month
                  </p>
                  <p className="text-xs font-semibold text-green-600 dark:text-green-400">
                    {formatSubmissionPricing()} after limit
                  </p>
                </>
              )}
              {usage.submissions.resetDate && (
                <p className="text-xs text-gray-500 mt-1">
                  Resets: {new Date(usage.submissions.resetDate).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                </p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>

        {/* Status Badge */}
        {hasSubmissionsOverage && (
          <Badge className="flex items-center gap-1 bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300 border-orange-300 dark:border-orange-700">
            <TrendingUp className="h-3 w-3" />
            <span className="text-xs">Overage</span>
          </Badge>
        )}
      </div>

      {/* Mobile view - hidden on desktop */}
      <div className="md:hidden">
        <MobileUsageDropdown />
      </div>
    </TooltipProvider>
  );
};

export default UsageIndicators;