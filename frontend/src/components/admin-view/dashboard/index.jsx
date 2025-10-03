import { useEffect, useState } from "react";
import axios from "axios";
import { Users, FileText, MessageSquare, DollarSign, TrendingUp, Calendar, BarChart3 } from "lucide-react";
import { StatsCard } from "./StatsCard";
import { OverviewChart } from "./OverviewChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_SERVER_URL}/api/reports/admin/stats`, {
          withCredentials: true
        });
        setStats(response.data);
        setLoading(false);
      } catch (err) {
        setError("Failed to fetch dashboard data");
        setLoading(false);
        console.error("Error fetching admin stats:", err);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="h-32 animate-pulse bg-muted" />
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-4 h-80 animate-pulse bg-muted" />
          <Card className="col-span-3 h-80 animate-pulse bg-muted" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  // Prepare data for charts
  const formTypeData = stats?.formTypeCounts ? [
    { name: 'Review', value: stats.formTypeCounts.Review },
    { name: 'Complaint', value: stats.formTypeCounts.Complaint }
  ] : [];

  const revenueData = [
    { name: 'Total Revenue', value: stats?.totalRevenue || 0 },
    { name: 'This Month', value: stats?.thisMonthRevenue || 0 }
  ];

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Users"
          value={stats?.totalUsers || 0}
          description="All registered users"
          icon={Users}
          className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800"
        />
        <StatsCard
          title="New Users (This Month)"
          value={stats?.newUsersCount || 0}
          description="Users registered this month"
          icon={Calendar}
          className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900 dark:to-green-800"
        />
        <StatsCard
          title="Total Forms"
          value={stats?.totalForms || 0}
          description="All created forms"
          icon={FileText}
          className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900 dark:to-purple-800"
        />
        <StatsCard
          title="Total Submissions"
          value={stats?.totalSubmissions || 0}
          description="All form submissions"
          icon={MessageSquare}
          className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900 dark:to-orange-800"
        />
      </div>

      {/* Revenue Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <StatsCard
          title="Total Revenue"
          value={`$${(stats?.totalRevenue || 0).toFixed(2)}`}
          description="Lifetime revenue"
          icon={DollarSign}
          className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900 dark:to-emerald-800"
        />
        <StatsCard
          title="Revenue (This Month)"
          value={`$${(stats?.thisMonthRevenue || 0).toFixed(2)}`}
          description="Current month revenue"
          icon={TrendingUp}
          className="bg-gradient-to-br from-teal-50 to-teal-100 dark:from-teal-900 dark:to-teal-800"
        />
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 shadow-sm">
          <CardHeader>
            <CardTitle>Form Distribution</CardTitle>
            <p className="text-sm text-muted-foreground">Breakdown of form types</p>
          </CardHeader>
          <CardContent className="h-80">
            {formTypeData.length > 0 ? (
              <OverviewChart 
                data={formTypeData} 
                type="pie" 
                title="Form Distribution" 
                description="Breakdown of form types" 
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <p>No data available</p>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card className="col-span-3 shadow-sm">
          <CardHeader>
            <CardTitle>Revenue Overview</CardTitle>
            <p className="text-sm text-muted-foreground">Total vs current month</p>
          </CardHeader>
          <CardContent className="h-80">
            <OverviewChart 
              data={revenueData} 
              type="bar" 
              title="Revenue Overview" 
              description="Total vs current month" 
            />
          </CardContent>
        </Card>
      </div>

      {/* Additional Stats */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Platform Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col items-center justify-center p-4">
                <FileText className="h-8 w-8 text-blue-500" />
                <p className="mt-2 text-sm font-medium">Total Forms</p>
                <p className="text-2xl font-bold">{stats?.totalForms || 0}</p>
              </div>
              <div className="flex flex-col items-center justify-center p-4">
                <MessageSquare className="h-8 w-8 text-green-500" />
                <p className="mt-2 text-sm font-medium">Total Submissions</p>
                <p className="text-2xl font-bold">{stats?.totalSubmissions || 0}</p>
              </div>
              <div className="flex flex-col items-center justify-center p-4">
                <Users className="h-8 w-8 text-purple-500" />
                <p className="mt-2 text-sm font-medium">Total Users</p>
                <p className="text-2xl font-bold">{stats?.totalUsers || 0}</p>
              </div>
              <div className="flex flex-col items-center justify-center p-4">
                <BarChart3 className="h-8 w-8 text-orange-500" />
                <p className="mt-2 text-sm font-medium">Avg Rating</p>
                <p className="text-2xl font-bold">{stats?.averageRating || "0.0"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center">
                <div className="bg-blue-100 p-2 rounded-full mr-3">
                  <Users className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">New Users</p>
                  <p className="text-xs text-muted-foreground">
                    {stats?.newUsersCount || 0} users registered this month
                  </p>
                </div>
              </div>
              <div className="flex items-center">
                <div className="bg-green-100 p-2 rounded-full mr-3">
                  <DollarSign className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">Revenue</p>
                  <p className="text-xs text-muted-foreground">
                    ${stats?.thisMonthRevenue?.toFixed(2) || "0.00"} earned this month
                  </p>
                </div>
              </div>
              <div className="flex items-center">
                <div className="bg-purple-100 p-2 rounded-full mr-3">
                  <FileText className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">Forms</p>
                  <p className="text-xs text-muted-foreground">
                    {stats?.totalForms || 0} total forms created
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;