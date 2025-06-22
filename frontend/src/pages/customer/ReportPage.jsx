import { useEffect, useState, useMemo, useCallback } from "react";
import CustomerLayoutPage from "./LayoutPage";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { useAuthStore } from "@/store/authStore";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import useFormStore from "@/store/formStore";
import useSubmissionStore from "@/store/submissionStore";
import { ChevronDown, Loader } from "lucide-react";

const PIE_COLORS = ["#bedcfe", "#a3c8f7", "#7aaff7", "#5197f7", "#3b86f7", "#2563eb"];

function ReportPage() {
    const { user, isAuthenticated } = useAuthStore();
    const { fetchFormsNew, forms } = useFormStore();
    const { fetchSubmissions, submissions } = useSubmissionStore();
    const [loading, setLoading] = useState(true);

    const userId = user?._id;
    const [filter, setFilter] = useState("all");
    const [selectedForm, setSelectedForm] = useState("all");

    // **Fetch Data Once When Component Mounts**
    useEffect(() => {
        if (isAuthenticated && userId) {
            setLoading(true);
            Promise.all([fetchFormsNew(userId), fetchSubmissions(userId)])
                .finally(() => setLoading(false));
        }
    }, [userId, isAuthenticated]);

    // **Filtering Function**
    const filterSubmissions = useCallback((data) => {
        if (!data || !Array.isArray(data)) return [];
        if (selectedForm !== "all") {
            data = data.filter(sub => sub.form_id === selectedForm);
        }

        if (filter !== "all") {
            const startDate = new Date();
            if (filter === "6months") startDate.setMonth(startDate.getMonth() - 6);
            if (filter === "30days") startDate.setDate(startDate.getDate() - 30);
            if (filter === "7days") startDate.setDate(startDate.getDate() - 7);
            data = data.filter(sub => new Date(sub.createdAt) >= startDate);
        }

        return data;
    }, [filter, selectedForm]);

    // **Filtered Submissions Memoized**
    const filteredSubmissions = useMemo(() => filterSubmissions(submissions), [submissions, filterSubmissions]);

    // **Bar Chart Data**
    const chartData = useMemo(() => {
        if (!filteredSubmissions.length) return [];
        const groupedData = filteredSubmissions.reduce((acc, submission) => {
            if (!submission.createdAt) return acc;
            const date = new Date(submission.createdAt).toISOString().split("T")[0];
            acc[date] = (acc[date] || 0) + 1;
            return acc;
        }, {});

        return Object.keys(groupedData).map(date => ({ date, submissions: groupedData[date] }));
    }, [filteredSubmissions]);

    // **Pie Chart Data (Ratings Distribution)**
    const ratingData = useMemo(() => {
        const ratingCounts = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        let totalRating = 0;
        let totalRatings = 0;

        filteredSubmissions.forEach(submission => {
            const ratings = Array.isArray(submission.submissions)
                ? submission.submissions.map(sub => Number(sub.rating))
                : [Number(submission.submissions?.rating)];

            ratings.forEach(rating => {
                if (!isNaN(rating) && rating >= 0 && rating <= 5) {
                    ratingCounts[rating]++;
                    totalRating += rating;
                    totalRatings++;
                }
            });
        });

        const averageRating = totalRatings > 0 ? totalRating / totalRatings : 0;

        // Calculate and return the rating data along with the average rating
        return {
            ratingData: Object.entries(ratingCounts).map(([rating, count]) => ({
                name: `${rating} Stars`,
                value: count,
            })),
            averageRating: averageRating.toFixed(1), // Format to 2 decimal places
        };
    }, [filteredSubmissions]);

    const chartConfig = {
        submissions: { label: "Submissions", color: "#2563eb" },
    };

    const starChartConfig = {
        responsive: true, // Ensures the chart scales properly
        maintainAspectRatio: false,
        tooltip: { enabled: true },
        legend: { position: "bottom" },

    };


    return (
        <CustomerLayoutPage>
            <h2 className="text-xl font-bold mb-4">Submissions Report</h2>

            {/* Filters */}
            <div className="space-x-2">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="flex-row justify-between w-36">
                            {filter === "all" ? "All Time" : `Last ${filter.replace(/\D/g, "")} Days`}
                            <ChevronDown />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent side="bottom" align="start">
                        <DropdownMenuLabel>Select Date Range</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => setFilter("all")}>All Time</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setFilter("6months")}>Last 6 Months</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setFilter("30days")}>Last 30 Days</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setFilter("7days")}>Last 7 Days</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="flex-row justify-between w-36">
                            {selectedForm === "all" ? "All Forms" : forms.find(f => f._id === selectedForm)?.form_name || "Select Form"}
                            <ChevronDown />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent side="bottom" align="start">
                        <DropdownMenuLabel>Select a Form</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => setSelectedForm("all")}>All Forms</DropdownMenuItem>
                        {forms.map(form => (
                            <DropdownMenuItem key={form._id} onClick={() => setSelectedForm(form._id)}>
                                {form.form_name}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* Charts */}
            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <Loader className="animate-spin h-8 w-8 text-slate-800 dark:text-white" />
                </div>
            ) : chartData.length === 0 && ratingData.ratingData.every(r => r.value === 0) ? (
                <p className="text-gray-500 mt-4">No submissions data available.</p>
            ) : (
                <div className="flex flex-col lg:flex-col xl:flex-row gap-4 pt-0 flex-wrap">
                    {/* Bar Chart */}
                    <Card className="mt-4">
                        <CardHeader className="border-b flex flex-row justify-between">
                            <CardTitle className="text-lg md:text-xl">Submissions</CardTitle>
                            <CardTitle className="text-md md:text-lg">Total: {filteredSubmissions.length}</CardTitle>
                        </CardHeader>
                        <CardContent className="px-2 sm:p-6">
                            <ChartContainer config={chartConfig} className="aspect-auto h-[300px] w-full md:w-full mt-4">
                                <BarChart data={chartData} margin={{ top: 20, left: 12, right: 12 }}>
                                    <CartesianGrid vertical={false} />
                                    <XAxis
                                        dataKey="date"
                                        tickFormatter={(value) =>
                                            new Date(value).toLocaleDateString("en-US", {
                                                month: "short",
                                                day: "numeric",
                                                year: "numeric",
                                            })
                                        }
                                    />
                                    <YAxis width={20} />
                                    <ChartTooltip
                                        content={
                                            <ChartTooltipContent
                                                className="w-[150px]"
                                                nameKey="submissions"
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
                                    <Bar dataKey="submissions" fill={chartConfig.submissions.color} />
                                </BarChart>
                            </ChartContainer>
                        </CardContent>
                    </Card>

                    {/* Pie Chart */}
                    <Card className="mt-4 min-w-[300px]">
                        <CardHeader className="border-b">
                            <CardTitle className="text-lg md:text-xl text-center">Ratings Distribution</CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 pb-4 mt-10 p-0">
                            <ChartContainer
                                config={starChartConfig}
                                className="mx-auto aspect-square w-80 max-h-[250px] pb-0 [&_.recharts-pie-label-text]:fill-foreground"
                            >

                                <PieChart>
                                    <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                                    <Pie
                                        data={ratingData.ratingData}
                                        dataKey="value"
                                        nameKey="name"
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={80}
                                        label
                                    >
                                        {ratingData.ratingData.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                        ))}
                                    </Pie>
                                </PieChart>
                            </ChartContainer>
                        </CardContent>
                        <CardFooter className="flex-col border-t pt-4">
                            <p className="text-center">Average Rating</p>
                            <h2 className="text-center text-3xl">{ratingData.averageRating}</h2>
                            <p className="text-center text-sm text-muted-foreground">Stars</p>
                        </CardFooter>
                    </Card>


                </div>
            )}
        </CustomerLayoutPage>
    );
}

export default ReportPage;
