import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import CustomerLayoutPage from "../customer/LayoutPage";
import { useAuthStore } from "@/store/authStore";
import useSubmissionStore from "@/store/submissionStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BadgeAlert,
  MessageSquareText,
  SquareDashedMousePointer,
  SquareEqual,
  Star,
  Zap,
  TrendingUp,
  Calendar,
  BarChart3,
  PieChart,
  Users,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip
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
  const totalReviewCount = forms.filter((form) => form.form_type === "Review").length;
  const totalComplaintCount = forms.filter((form) => form.form_type === "Complaint").length;

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

  const formTypeDistribution = useMemo(() => {
    const types = {};
    forms.forEach(form => {
      const type = form.form_type || 'Other';
      types[type] = (types[type] || 0) + 1;
    });
    
    return Object.entries(types).map(([name, value]) => ({
      name,
      value
    }));
  }, [forms]);

  const COLORS = ["#2563eb", "#a3c8f7", "#7aaff7", "#5197f7", "#3b86f7", "#2563eb"];

  const cardItems = [
    { label: "Total Forms", count: totalFormsCount, icon: <SquareEqual className="text-green-600" />, border: "border-b-green-600" },
    { label: "Published", count: totalPublishedCount, icon: <Zap className="text-indigo-500" />, border: "border-b-indigo-600" },
    { label: "Draft", count: totalDraftedCount, icon: <SquareDashedMousePointer className="text-gray-500" />, border: "border-b-gray-600" },
    { label: "Review", count: totalReviewCount, icon: <Star className="text-amber-500" />, border: "border-b-amber-600" },
    { label: "Complaint", count: totalComplaintCount, icon: <BadgeAlert className="text-red-500" />, border: "border-b-red-600" },
    { label: "Total Submissions", count: totalSubmissionsCount, icon: <MessageSquareText className="text-lime-600" />, border: "border-b-lime-400" },
  ];

  const chartConfig = {
    submissions: {
      label: "Submissions",
      color: "#3b82f6",
    },
  };

  // Custom tooltip for bar chart
  const CustomBarChartTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-md shadow-md">
          <p className="font-medium text-gray-900 dark:text-white">{`Date: ${new Date(label).toLocaleDateString()}`}</p>
          <p className="text-blue-600 dark:text-blue-400">{`Submissions: ${payload[0].value}`}</p>
        </div>
      );
    }
    return null;
  };

  // Custom tooltip for pie chart
  const CustomPieChartTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-md shadow-md">
          <p className="font-medium text-gray-900 dark:text-white">{`${payload[0].name}`}</p>
          <p className="text-purple-600 dark:text-purple-400">{`Count: ${payload[0].value}`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <CustomerLayoutPage>
      <div className="flex flex-col gap-2 pt-4 md:gap-4 md:p-4">
        <h2 className="text-xl md:text-2xl font-bold text-blue-600 dark:text-blue-400">
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
                <TrendingUp className="h-5 w-5 text-blue-500" />
                Submissions Over Time
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              {loading ? (
                <div className="h-80 flex items-center justify-center">
                  <Skeleton className="h-64 w-full" />
                </div>
              ) : submissionsOverTime.length > 0 ? (
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={submissionsOverTime}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(value) => {
                          const date = new Date(value);
                          return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                        }}
                      />
                      <YAxis />
                      <Tooltip content={<CustomBarChartTooltip />} />
                      <Bar dataKey="submissions" fill={chartConfig.submissions.color} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-80 flex flex-col items-center justify-center text-gray-500">
                  <BarChart3 className="h-12 w-12 mb-2" />
                  <p>No submission data available</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Form Types Distribution Chart */}
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-medium flex items-center gap-2">
                <PieChart className="h-5 w-5 text-purple-500" />
                Form Types Distribution
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              {loading ? (
                <div className="h-80 flex items-center justify-center">
                  <Skeleton className="h-64 w-full rounded-full" />
                </div>
              ) : formTypeDistribution.length > 0 ? (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Tooltip content={<CustomPieChartTooltip />} />
                      <Pie
                        data={formTypeDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        stroke="none"
                      >
                        {formTypeDistribution.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={COLORS[index % COLORS.length]} 
                          />
                        ))}
                      </Pie>
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-80 flex flex-col items-center justify-center text-gray-500">
                  <PieChart className="h-12 w-12 mb-2" />
                  <p>No form data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <Card className="shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="rounded-full bg-blue-100 p-3 dark:bg-blue-900/50">
                  <Calendar className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Active Forms</p>
                  <p className="text-2xl font-bold">{totalPublishedCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="rounded-full bg-green-100 p-3 dark:bg-green-900/50">
                  <Users className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Total Submissions</p>
                  <p className="text-2xl font-bold">{totalSubmissionsCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="rounded-full bg-purple-100 p-3 dark:bg-purple-900/50">
                  <BarChart3 className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Avg. Submissions/Day</p>
                  <p className="text-2xl font-bold">
                    {submissionsOverTime.length > 0 
                      ? Math.round(submissionsOverTime.reduce((sum, day) => sum + day.submissions, 0) / submissionsOverTime.length)
                      : 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </CustomerLayoutPage>
  );
};

export default CustomerDashboardPage;