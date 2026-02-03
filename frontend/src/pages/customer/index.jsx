import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import CustomerLayoutPage from "../customer/LayoutPage";
import { useAuthStore } from "@/store/authStore";
import useSubmissionStore from "@/store/submissionStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import {
  MessageSquareText,
  SquareDashedMousePointer,
  SquareEqual,
  Star,
  Zap,
  TrendingUp,
  BarChart as BarChartIcon,
  LineChart as LineChartIcon,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart as RechartsLineChart,
  Line,
  ResponsiveContainer
} from "recharts";

const CustomerDashboardPage = () => {
  const { user, isAuthenticated } = useAuthStore();
  const { submissions, fetchSubmissions } = useSubmissionStore();

  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const userId = user?._id;

  const totalSubmissionsCount = useMemo(() => submissions.length, [submissions]);

  useEffect(() => {
    const fetchForms = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_SERVER_URL}/api/forms/`);
        setForms(response.data);
      } catch (error) {
        console.error("Error fetching forms:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchForms();
  }, []);

  useEffect(() => {
    if (isAuthenticated && userId) {
      fetchSubmissions(userId).catch((error) => console.error("Error fetching submissions:", error));
    }
  }, [isAuthenticated, userId, fetchSubmissions]);

  const totalFormsCount = forms.length;
  const totalPublishedCount = forms.filter((form) => form.is_active).length;
  const totalDraftedCount = forms.filter((form) => !form.is_active).length;

  // Prepare data for charts
  const submissionsOverTime = useMemo(() => {
    if (!submissions.length) return [];

    // Group submissions by date
    const grouped = {};
    submissions.forEach(submission => {
      if (submission.createdAt) {
        const date = new Date(submission.createdAt).toISOString().split('T')[0];
        grouped[date] = (grouped[date] || 0) + 1;
      }
    });

    // Convert to array and sort by date
    return Object.entries(grouped)
      .map(([date, count]) => ({ date, submissions: count }))
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(-30); // Last 30 days
  }, [submissions]);

  // Calculate average submissions per day
  const avgSubmissionsPerDay = useMemo(() => {
    if (submissionsOverTime.length === 0) return 0;
    const totalSubmissions = submissionsOverTime.reduce((sum, day) => sum + day.submissions, 0);
    return Math.round(totalSubmissions / submissionsOverTime.length);
  }, [submissionsOverTime]);

  // Calculate rating trend data
  const ratingTrendData = useMemo(() => {
    if (!submissions.length) return [];

    // Filter out submissions with empty data
    const validSubmissions = submissions.filter(sub => {
      if (!sub.createdAt) {
        return false;
      }
      // Also check if submissions data is empty
      if (!sub.submissions || Object.keys(sub.submissions).length === 0) {
        return false;
      }
      return true;
    });

    // Group submissions by date and calculate average rating for each date
    const groupedData = validSubmissions.reduce((acc, submission) => {
      if (!submission.createdAt) {
        return acc;
      }

      const date = new Date(submission.createdAt).toISOString().split("T")[0];

      // Extract ratings from submissions
      let generalRating = null;
      let employeeRating = null;

      if (typeof submission.submissions === 'object') {
        for (const key in submission.submissions) {
          // Skip technical fields
          if (key === 'cf-turnstile-response' || key === 'captchaToken' || key === 'createdAt' || key === 'updatedAt') {
            continue;
          }

          const value = submission.submissions[key];

          // Check if this looks like a rating field
          if (key.toLowerCase().includes('rating') ||
            key.toLowerCase().includes('rate') ||
            (typeof value === 'string' && !isNaN(Number(value)) && Number(value) >= 0 && Number(value) <= 5)) {

            const numericValue = Number(value);
            // Only consider ratings from 1 to 5 (exclude 0 stars)
            if (!isNaN(numericValue) && numericValue >= 1 && numericValue <= 5) {
              // Check if this is an employee rating
              if (key.toLowerCase().includes('employee') && key.toLowerCase().includes('rating')) {
                employeeRating = numericValue;
              } else {
                // This is a general rating
                generalRating = numericValue;
              }
            }
          }
        }
      }

      // Initialize date entry if not exists
      if (!acc[date]) {
        acc[date] = {
          ratings: [],
          generalRatings: [],
          employeeRatings: []
        };
      }

      // Add ratings to respective arrays
      if (generalRating !== null) {
        acc[date].generalRatings.push(generalRating);
        acc[date].ratings.push(generalRating);
      }

      if (employeeRating !== null) {
        acc[date].employeeRatings.push(employeeRating);
        acc[date].ratings.push(employeeRating);
      }

      return acc;
    }, {});

    // Calculate average ratings for each date
    const trendData = Object.keys(groupedData)
      .sort()
      .map(date => {
        const dateData = groupedData[date];
        const avgRating = dateData.ratings.length > 0
          ? dateData.ratings.reduce((sum, rating) => sum + rating, 0) / dateData.ratings.length
          : 0;

        const avgGeneralRating = dateData.generalRatings.length > 0
          ? dateData.generalRatings.reduce((sum, rating) => sum + rating, 0) / dateData.generalRatings.length
          : 0;

        const avgEmployeeRating = dateData.employeeRatings.length > 0
          ? dateData.employeeRatings.reduce((sum, rating) => sum + rating, 0) / dateData.employeeRatings.length
          : 0;

        return {
          date,
          avgRating: parseFloat(avgRating.toFixed(2)),
          avgGeneralRating: parseFloat(avgGeneralRating.toFixed(2)),
          avgEmployeeRating: parseFloat(avgEmployeeRating.toFixed(2)),
          submissionCount: dateData.ratings.length
        };
      })
      .filter(item => item.avgRating > 0); // Only include dates with ratings

    return trendData;
  }, [submissions]);

  // Calculate general rating
  const generalRating = useMemo(() => {
    if (!submissions.length) return 0;
    
    let totalGeneralRating = 0;
    let generalRatingCount = 0;

    submissions.forEach((submission) => {
      if (!submission.submissions) return;
      
      if (typeof submission.submissions === 'object') {
        for (const key in submission.submissions) {
          // Skip technical fields
          if (key === 'cf-turnstile-response' || key === 'captchaToken' || key === 'createdAt' || key === 'updatedAt') {
            continue;
          }
          
          const value = submission.submissions[key];
          
          // Check if this looks like a rating field but not an employee rating
          if ((key.toLowerCase().includes('rating') || 
               key.toLowerCase().includes('rate')) &&
              !key.toLowerCase().includes('employee')) {
            
            const numericValue = Number(value);
            // Only consider ratings from 1 to 5
            if (!isNaN(numericValue) && numericValue >= 1 && numericValue <= 5) {
              totalGeneralRating += numericValue;
              generalRatingCount++;
            }
          }
        }
      }
    });

    return generalRatingCount > 0 ? (totalGeneralRating / generalRatingCount).toFixed(1) : 0;
  }, [submissions]);

  const cardItems = [
    { label: "Total Forms (Outlets)", count: totalFormsCount, icon: <SquareEqual className="text-green-600" />, border: "border-b-green-600" },
    { label: "Published", count: totalPublishedCount, icon: <Zap className="text-purple-500" />, border: "border-b-purple-600" },
    { label: "Draft", count: totalDraftedCount, icon: <SquareDashedMousePointer className="text-gray-500" />, border: "border-b-gray-600" },
    { label: "Avg Feedback/Day", count: avgSubmissionsPerDay, icon: <TrendingUp className="text-blue-500" />, border: "border-b-blue-500" },
    { label: "General Rating", count: generalRating, icon: <Star className="text-orange-500" />, border: "border-b-orange-500" },
    { label: "Total Feedback", count: totalSubmissionsCount, icon: <MessageSquareText className="text-lime-600" />, border: "border-b-lime-400" },
  ];

  const chartConfig = {
    submissions: {
      label: "Submissions",
      color: "#16bf4c",
    },
    avgRating: { label: "Average Rating", color: "#16bf4c" },
    avgGeneralRating: { label: "General Rating", color: "#abdb18" },
    avgEmployeeRating: { label: "Employee Rating", color: "#dbb118" },
  };



  return (
    <CustomerLayoutPage>
      <div className="flex flex-col gap-2 pt-4 md:gap-4 md:p-4">
        <h2 className="text-xl md:text-2xl font-bold text-[#16bf4c] dark:text-[#16bf4c]">
          Welcome Back, <span className="text-slate-800 dark:text-slate-200">{user.name}</span>
        </h2>
        <p className="text-sm md:text-base">
          Here&apos;s a quick overview of your dashboard. Let&apos;s make today productive!
        </p>

        {/* Summary Cards */}
        <div className="grid auto-rows-min gap-4 grid-cols-2 md:grid-cols-3 xl:grid-cols-6 mt-4">
          {cardItems.map((item, index) => (
            <Card key={index} className={`border-b-4 ${item.border}`}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm md:text-md font-regular">{item.label}</CardTitle>
                {item.icon}
              </CardHeader>
              <CardContent className="px-6 pb-2 md:pb-6">
                <div className="text-2xl md:text-3xl font-bold">
                  {loading ? <Skeleton className="h-8 md:h-9 w-full" /> : item.count}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {/* Submissions Over Time Chart */}
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-medium flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-[#16bf4c]" />
                Feedback Over Time
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              {loading ? (
                <div className="h-80 flex items-center justify-center">
                  <Skeleton className="h-64 w-full" />
                </div>
              ) : submissionsOverTime.length > 0 ? (
                <div className="h-80 w-full">
                  <ChartContainer config={chartConfig} className="aspect-auto h-[320px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={submissionsOverTime}>
                        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#3B526B" className="opacity-30" />
                        <XAxis
                          dataKey="date"
                          tickLine={false}
                          axisLine={false}
                          tickMargin={8}
                          tickFormatter={(value) => {
                            const date = new Date(value);
                            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                          }}
                        />
                        <YAxis width={30} tick={{ fontSize: 12 }} />
                        <ChartTooltip
                          content={
                            <ChartTooltipContent
                              className="w-[180px]"
                              labelFormatter={(value) =>
                                new Date(value).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })
                              }
                            />
                          }
                        />
                        <Bar
                          dataKey="submissions"
                          fill="#16bf4c"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </div>
              ) : (
                <div className="h-80 flex flex-col items-center justify-center text-gray-500">
                  <BarChartIcon className="h-12 w-12 mb-2" />
                  <p>No feedback data available</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Rating Trend Over Time Chart */}
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-medium flex items-center gap-2">
                <LineChartIcon className="h-5 w-5 text-amber-500" />
                Rating Trend Over Time
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              {loading ? (
                <div className="h-80 flex items-center justify-center">
                  <Skeleton className="h-64 w-full" />
                </div>
              ) : ratingTrendData.length > 0 ? (
                <div className="h-80 w-full">
                  <ChartContainer config={chartConfig} className="aspect-auto h-[320px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsLineChart data={ratingTrendData} margin={{
                        top: 20,
                        left: 12,
                        right: 12,
                        bottom: 20,
                      }}>
                        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#3B526B" className="opacity-30" />
                        <XAxis
                          dataKey="date"
                          tickLine={false}
                          axisLine={false}
                          tickMargin={8}
                          tickFormatter={(value) => {
                            const date = new Date(value);
                            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                          }}
                          interval={ratingTrendData.length > 6 ? Math.floor(ratingTrendData.length / 6) : 0}
                          angle={ratingTrendData.length > 4 ? -45 : 0}
                          textAnchor={ratingTrendData.length > 4 ? "end" : "middle"}
                          height={ratingTrendData.length > 4 ? 80 : 60}
                          tick={{ fontSize: 12 }}
                        />
                        <YAxis domain={[0, 5]}
                          tickCount={6}
                          width={30}
                          tick={{ fontSize: 12 }} />
                        <ChartTooltip
                          cursor={false}
                          content={
                            <ChartTooltipContent
                              labelFormatter={(value) => {
                                return new Date(value).toLocaleDateString("en-US", {
                                  month: "long",
                                  year: "numeric",
                                });
                              }}
                              formatter={(value, name, item, index) => {
                                // Get the label from chartConfig or use the name
                                const label = chartConfig[name] ? chartConfig[name].label : name;

                                return (
                                  <>
                                    <div
                                      className="h-2.5 w-2.5 shrink-0 rounded-[2px] bg-[--color-bg]"
                                      style={{
                                        "--color-bg": `var(--color-${name})`
                                      }}
                                    />
                                    {label}
                                    <div className="text-foreground ml-auto flex items-baseline gap-0.5 font-mono font-medium tabular-nums">
                                      {parseFloat(value).toFixed(1)}
                                      <span className="text-muted-foreground font-normal">
                                        stars
                                      </span>
                                    </div>
                                    {/* Add total submission count after the last item */}
                                    {index === Object.keys(item.payload).filter(key =>
                                      key.includes('avg') && item.payload[key] > 0).length - 1 && (
                                        <div className="text-foreground mt-1.5 flex basis-full items-center border-t pt-1.5 text-xs font-medium">
                                          Feedback
                                          <div className="text-foreground ml-auto flex items-baseline gap-0.5 font-mono font-medium tabular-nums">
                                            {item.payload.submissionCount}
                                          </div>
                                        </div>
                                      )}
                                  </>
                                );
                              }}
                            />
                          }
                        />
                        <Line
                          type="natural"
                          dataKey="avgRating"
                          stroke="var(--color-avgRating)"
                          strokeWidth={2}
                          dot={{ r: 4 }}
                          activeDot={{ r: 6, stroke: "var(--color-avgRating)", strokeWidth: 2 }}
                        />
                        <Line
                          type="natural"
                          dataKey="avgGeneralRating"
                          stroke="var(--color-avgGeneralRating)"
                          strokeWidth={2}
                          dot={{ r: 4 }}
                          activeDot={{ r: 6, stroke: "var(--color-avgGeneralRating)", strokeWidth: 2 }}
                        />
                        <Line
                          type="natural"
                          dataKey="avgEmployeeRating"
                          stroke="var(--color-avgEmployeeRating)"
                          strokeWidth={2}
                          dot={{ r: 4 }}
                          activeDot={{ r: 6, stroke: "var(--color-avgEmployeeRating)", strokeWidth: 2 }}
                        />
                      </RechartsLineChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </div>
              ) : (
                <div className="h-80 flex flex-col items-center justify-center text-gray-500">
                  <LineChartIcon className="h-12 w-12 mb-2" />
                  <p>No rating data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

      </div>
    </CustomerLayoutPage>
  );
};

export default CustomerDashboardPage;