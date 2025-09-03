import { useState, useEffect } from 'react';
import { FileText, Send, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import axios from 'axios';

const UsageIndicators = () => {
  const [usageStats, setUsageStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUsageStats = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_SERVER_URL}/api/usage/stats`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('authToken')}`
          }
        });
        
        if (response.data.success) {
          setUsageStats(response.data.data);
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

  const getStatusColor = (current, maximum) => {
    const percentage = (current / maximum) * 100;
    if (percentage >= 100) return 'text-red-500';
    if (percentage >= 80) return 'text-orange-500';
    if (percentage >= 60) return 'text-yellow-500';
    return 'text-green-500';
  };

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

  const { usage } = usageStats;

  return (
    <TooltipProvider>
      <div className="flex items-center gap-3">
        {/* Forms Usage */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Card className="px-3 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 border-blue-200 dark:border-blue-800 hover:shadow-md transition-all duration-200 cursor-pointer">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <div className="flex flex-col">
                  <div className="flex items-center gap-1">
                    <span className={`text-sm font-medium ${getStatusColor(usage.forms.current, usage.forms.maximum)}`}>
                      {usage.forms.current}
                    </span>
                    <span className="text-xs text-gray-500">/</span>
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      {usage.forms.maximum}
                    </span>
                  </div>
                  <div className="w-12 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-300 ${getProgressColor(usage.forms.current, usage.forms.maximum)}`}
                      style={{ width: `${Math.min((usage.forms.current / usage.forms.maximum) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </Card>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-center">
              <p className="font-medium">Forms Usage</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {usage.forms.remaining} remaining forms
              </p>
            </div>
          </TooltipContent>
        </Tooltip>

        {/* Submissions Usage */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Card className="px-3 py-2 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/50 dark:to-emerald-950/50 border-green-200 dark:border-green-800 hover:shadow-md transition-all duration-200 cursor-pointer">
              <div className="flex items-center gap-2">
                <Send className="h-4 w-4 text-green-600 dark:text-green-400" />
                <div className="flex flex-col">
                  <div className="flex items-center gap-1">
                    <span className={`text-sm font-medium ${getStatusColor(usage.submissions.current, usage.submissions.maximum)}`}>
                      {usage.submissions.current}
                    </span>
                    <span className="text-xs text-gray-500">/</span>
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      {usage.submissions.maximum}
                    </span>
                  </div>
                  <div className="w-16 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-300 ${getProgressColor(usage.submissions.current, usage.submissions.maximum)}`}
                      style={{ width: `${Math.min((usage.submissions.current / usage.submissions.maximum) * 100, 100)}%` }}
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
                {usage.submissions.remaining} remaining this month
              </p>
              {usage.submissions.resetDate && (
                <p className="text-xs text-gray-500">
                  Resets: {new Date(usage.submissions.resetDate).toLocaleDateString()}
                </p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>

        {/* Status Badge */}
        {(usage.forms.remaining === 0 || usage.submissions.remaining === 0) && (
          <Badge variant="destructive" className="flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            <span className="text-xs">Limit Reached</span>
          </Badge>
        )}
      </div>
    </TooltipProvider>
  );
};

export default UsageIndicators;