import { useEffect, useState, useMemo, useCallback } from "react";
import CustomerLayoutPage from "./LayoutPage";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell, LineChart, Line } from "recharts";
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
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import useFormStore from "@/store/formStore";
import useSubmissionStore from "@/store/submissionStore";
import { ChevronDown, Loader, Calendar as CalendarIcon, User, FileText, Star, CalendarRange, FormInput } from "lucide-react";
import ReportExport from "@/components/customer-view/ReportExport";

import { format } from "date-fns";
import { cn } from "@/lib/utils";

const PIE_COLORS = ["#bedcfe", "#a3c8f7", "#7aaff7", "#5197f7", "#3b86f7", "#2563eb"];

function ReportPage() {
    const { user, isAuthenticated } = useAuthStore();
    const { fetchFormsNew, forms } = useFormStore();
    const { fetchSubmissions, submissions } = useSubmissionStore();
    const [loading, setLoading] = useState(true);
    const [employees, setEmployees] = useState([]);
    const [selectedEmployee, setSelectedEmployee] = useState(""); // Change default to empty string instead of "all"

    const userId = user?._id;
    const [filter, setFilter] = useState("all");
    const [selectedForm, setSelectedForm] = useState("all"); // Add missing state
    
    // Date range selection states
    const [customDateRange, setCustomDateRange] = useState({
        start: null,
        end: null
    });
    const [isCustomDateRange, setIsCustomDateRange] = useState(false);
    
    // PDF export states
    const [isExporting, setIsExporting] = useState(false);

    // Fetch employees
    const fetchEmployees = useCallback(async () => {
        try {
            const response = await fetch(`${import.meta.env.VITE_SERVER_URL}/api/employees`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    setEmployees(result.data || []);
                }
            }
        } catch (error) {
            console.error('Error fetching employees:', error);
        }
    }, []);

    // **Fetch Data Once When Component Mounts**
    useEffect(() => {
        if (isAuthenticated && userId) {
            setLoading(true);
            Promise.all([
                fetchFormsNew(userId), 
                fetchSubmissions(userId),
                fetchEmployees() // Fetch employees as well
            ])
                .finally(() => setLoading(false));
        }
    }, [userId, isAuthenticated, fetchEmployees]);

    // Add effect to log data when it changes
    useEffect(() => {
        // Removed debugging logs for production environment
    }, [forms, submissions, employees]);

    // **Filtering Function with Custom Date Range Support**
    const filterSubmissions = useCallback((data) => {
        if (!data || !Array.isArray(data)) return [];
        
        // Don't wait for forms to load before filtering - filter based on available data
        // If forms are not loaded yet, we'll filter submissions without form ownership check
        let filteredData = [...data];
        
        // Only filter by form ownership if forms are loaded
        if (forms && forms.length > 0) {
            // First, filter by form ownership - only show submissions for forms owned by current user
            const userFormIds = forms.map(form => form._id);
            
            filteredData = filteredData.filter(sub => {
                // Handle both string and ObjectId comparisons
                // Also handle populated form objects
                let formId;
                if (typeof sub.form_id === 'object' && sub.form_id !== null) {
                    // This is a populated form object, get the _id
                    formId = sub.form_id._id;
                } else {
                    // This is just an ID string
                    formId = typeof sub.form_id === 'object' ? sub.form_id.toString() : sub.form_id;
                }
                
                const isIncluded = userFormIds.includes(formId);
                return isIncluded;
            });
        }
        
        // Then filter by selected form if not "all"
        if (selectedForm !== "all") {
            filteredData = filteredData.filter(sub => {
                // Handle both string and ObjectId comparisons
                // Also handle populated form objects
                let formId;
                if (typeof sub.form_id === 'object' && sub.form_id !== null) {
                    // This is a populated form object, get the _id
                    formId = sub.form_id._id;
                } else {
                    // This is just an ID string
                    formId = typeof sub.form_id === 'object' ? sub.form_id.toString() : sub.form_id;
                }
                
                return formId === selectedForm;
            });
        }

        // Filter by selected employee if not empty (not "no employee filter")
        if (selectedEmployee !== "") {
            if (selectedEmployee === "all") {
                // When "All Employees" is selected, don't filter by employee
                // This means we include all submissions regardless of employee
            } else {
                // When a specific employee is selected, filter by that employee
                // Find the selected employee details
                const employeeDetails = employees.find(emp => emp._id === selectedEmployee);
                
                filteredData = filteredData.filter(sub => {
                    // Check if any field in submissions contains the selected employee
                    if (!sub.submissions) return false;
                    
                    // Look for employee fields that match the selected employee
                    const matchesEmployee = Object.keys(sub.submissions).some(key => {
                        // More specific check for employee fields
                        const isEmployeeField = key.toLowerCase().includes('employee') && 
                                              !key.toLowerCase().includes('rating');
                        
                        if (isEmployeeField) {
                            const submissionValue = sub.submissions[key];
                            
                            // Check multiple matching conditions:
                            // 1. Direct ID match (if form stores ID)
                            const directIdMatch = submissionValue === selectedEmployee || 
                                                String(submissionValue) === String(selectedEmployee);
                            
                            // 2. Name match (if form stores name)
                            const nameMatch = employeeDetails && (
                                submissionValue === employeeDetails.name ||
                                submissionValue.includes(employeeDetails.name) ||
                                (employeeDetails.employee_number && submissionValue.includes(employeeDetails.employee_number))
                            );
                            
                            const match = directIdMatch || nameMatch;
                            
                            return match;
                        }
                        return false;
                    });
                    
                    return matchesEmployee;
                });
            }
        } else {
            // When no employee filter is selected, don't filter by employee
            // This means we include all submissions regardless of employee
        }

        if (filter !== "all") {
            if (filter === "custom" && isCustomDateRange) {
                // Custom date range filtering with Date objects
                const { start, end } = customDateRange;
                if (start && end) {
                    const startDate = new Date(start);
                    const endDate = new Date(end);
                    endDate.setHours(23, 59, 59, 999); // Include the entire end date
                    filteredData = filteredData.filter(sub => {
                        const submissionDate = new Date(sub.createdAt);
                        return submissionDate >= startDate && submissionDate <= endDate;
                    });
                }
            } else {
                // Predefined date range filtering
                const startDate = new Date();
                if (filter === "6months") startDate.setMonth(startDate.getMonth() - 6);
                if (filter === "30days") startDate.setDate(startDate.getDate() - 30);
                if (filter === "7days") startDate.setDate(startDate.getDate() - 7);
                
                // Set start of day for proper comparison
                startDate.setHours(0, 0, 0, 0);
                
                filteredData = filteredData.filter(sub => {
                    const submissionDate = new Date(sub.createdAt);
                    return submissionDate >= startDate;
                });
            }
        }
        
        return filteredData;
    }, [filter, selectedForm, selectedEmployee, customDateRange, isCustomDateRange, forms, employees]);

    // **Filtered Submissions Memoized**
    const filteredSubmissions = useMemo(() => {
        const filtered = filterSubmissions(submissions);
        return filtered;
    }, [submissions, filterSubmissions]);

    // **Bar Chart Data with Smart Date Distribution**
    const chartData = useMemo(() => {
        if (!filteredSubmissions.length) {
            return [];
        }
        
        // Filter out submissions with empty data
        const validSubmissions = filteredSubmissions.filter(sub => {
            if (!sub.createdAt) {
                return false;
            }
            // Also check if submissions data is empty
            if (!sub.submissions || Object.keys(sub.submissions).length === 0) {
                return false;
            }
            return true;
        });
        
        const groupedData = validSubmissions.reduce((acc, submission) => {
            if (!submission.createdAt) {
                return acc;
            }
            const date = new Date(submission.createdAt).toISOString().split("T")[0];
            acc[date] = (acc[date] || 0) + 1;
            return acc;
        }, {});

        const sortedDates = Object.keys(groupedData).sort();
        const chartPoints = sortedDates.map(date => ({ date, submissions: groupedData[date] }));
        
        // Return all data points - we'll limit the X-axis labels in the chart configuration
        return chartPoints;
    }, [filteredSubmissions]);

    // **Rating Trend Data**
    const ratingTrendData = useMemo(() => {
        if (!filteredSubmissions.length) {
            return [];
        }
        
        // Filter out submissions with empty data
        const validSubmissions = filteredSubmissions.filter(sub => {
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
    }, [filteredSubmissions]);

    // **Pie Chart Data (Ratings Distribution)**
    const ratingData = useMemo(() => {
        // Initialize rating counts excluding 0 stars
        const ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        let totalRating = 0;
        let totalRatings = 0;
        let employeeRatingTotal = 0;
        let employeeRatingCount = 0;
        let generalRatingTotal = 0;
        let generalRatingCount = 0;

        filteredSubmissions.forEach((submission) => {
            // Handle the case where submissions might be an empty object or null
            if (!submission.submissions) {
                return;
            }
            
            // If submissions is an empty object, skip it
            if (Object.keys(submission.submissions).length === 0) {
                return;
            }
            
            // Extract ratings from submissions object
            let generalRating = null;
            let employeeRating = null;
            
            // Simple approach: iterate through all keys and look for anything that might be a rating
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
            
            // Apply rating logic based on employee selection
            if (selectedEmployee === "") {
                // When no employee filter is selected, only include general ratings
                if (generalRating !== null) {
                    const roundedRating = Math.round(generalRating);
                    // Only count ratings from 1 to 5
                    if (roundedRating >= 1 && roundedRating <= 5) {
                        ratingCounts[roundedRating]++;
                        totalRating += roundedRating;
                        totalRatings++;
                        generalRatingTotal += roundedRating;
                        generalRatingCount++;
                    }
                }
            } else if (selectedEmployee === "all") {
                // When "All Employees" is selected, include both general and all employee ratings
                if (generalRating !== null) {
                    const roundedRating = Math.round(generalRating);
                    // Only count ratings from 1 to 5
                    if (roundedRating >= 1 && roundedRating <= 5) {
                        ratingCounts[roundedRating]++;
                        totalRating += roundedRating;
                        totalRatings++;
                        generalRatingTotal += roundedRating;
                        generalRatingCount++;
                    }
                }
                
                if (employeeRating !== null) {
                    const roundedRating = Math.round(employeeRating);
                    // Only count ratings from 1 to 5
                    if (roundedRating >= 1 && roundedRating <= 5) {
                        ratingCounts[roundedRating]++;
                        totalRating += roundedRating;
                        totalRatings++;
                        employeeRatingTotal += roundedRating;
                        employeeRatingCount++;
                    }
                }
            } else {
                // When a specific employee is selected, include general ratings and that employee's ratings
                if (generalRating !== null) {
                    const roundedRating = Math.round(generalRating);
                    // Only count ratings from 1 to 5
                    if (roundedRating >= 1 && roundedRating <= 5) {
                        ratingCounts[roundedRating]++;
                        totalRating += roundedRating;
                        totalRatings++;
                        generalRatingTotal += roundedRating;
                        generalRatingCount++;
                    }
                }
                
                if (employeeRating !== null) {
                    const roundedRating = Math.round(employeeRating);
                    // Only count ratings from 1 to 5
                    if (roundedRating >= 1 && roundedRating <= 5) {
                        ratingCounts[roundedRating]++;
                        totalRating += roundedRating;
                        totalRatings++;
                        employeeRatingTotal += roundedRating;
                        employeeRatingCount++;
                    }
                }
            }
        });

        const averageRating = totalRatings > 0 ? totalRating / totalRatings : 0;
        const averageEmployeeRating = employeeRatingCount > 0 ? employeeRatingTotal / employeeRatingCount : 0;
        const averageGeneralRating = generalRatingCount > 0 ? generalRatingTotal / generalRatingCount : 0;

        const result = {
            ratingData: Object.entries(ratingCounts).map(([rating, count]) => ({
                name: `${rating} Stars`,
                value: count,
            })),
            averageRating: totalRatings > 0 ? averageRating.toFixed(1) : "0.0", // Format to 1 decimal place
            averageEmployeeRating: employeeRatingCount > 0 ? averageEmployeeRating.toFixed(1) : null,
            averageGeneralRating: generalRatingCount > 0 ? averageGeneralRating.toFixed(1) : null,
            employeeRatingCount,
            generalRatingCount
        };
        
        // Calculate and return the rating data along with the average rating
        return result;
    }, [filteredSubmissions, selectedEmployee]);
    
    const chartConfig = {
        submissions: { label: "Submissions", color: "#2563eb" },
        avgRating: { label: "Average Rating", color: "#f59e0b" },
        avgGeneralRating: { label: "General Rating", color: "#8b5cf6" },
        avgEmployeeRating: { label: "Employee Rating", color: "#f97316" },
    };

    const starChartConfig = {
        responsive: true, // Ensures the chart scales properly
        maintainAspectRatio: false,
        tooltip: { enabled: true },
        legend: { position: "bottom" },
    };
    
    // **Handle Custom Date Range Change with Date Objects and Validation**
    const handleCustomDateChange = (field, date) => {
        // Validate date input following project specifications
        if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
            return;
        }
        
        setCustomDateRange(prev => {
            const newRange = {
                ...prev,
                [field]: date
            };
            
            return newRange;
        });
    };
    
    // **Handle Filter Change with Custom Date Support**
    const handleFilterChange = (filterValue) => {
        setFilter(filterValue);
        if (filterValue === "custom") {
            setIsCustomDateRange(true);
        } else {
            setIsCustomDateRange(false);
            setCustomDateRange({ start: null, end: null });
        }
    };
    
    // **Format Date Range Display with Validation**
    const getDateRangeDisplay = () => {
        if (filter === "all") return "All Time";
        if (filter === "custom" && isCustomDateRange) {
            const { start, end } = customDateRange;
            // Date validation following project specifications
            if (start && end) {
                try {
                    // Validate dates before formatting
                    if (start instanceof Date && !isNaN(start.getTime()) && 
                        end instanceof Date && !isNaN(end.getTime())) {
                        return `${format(start, 'MMM dd, yyyy')} - ${format(end, 'MMM dd, yyyy')}`;
                    }
                } catch { 
                    return "Invalid Date Range";
                }
            }
            return "Custom Range";
        }
        const filterLabels = {
            "7days": "Last 7 Days",
            "30days": "Last 30 Days", 
            "6months": "Last 6 Months"
        };
        return filterLabels[filter] || "All Time";
    };
    
    // **PDF Export Function**
    return (
        <CustomerLayoutPage>
            <div className="pt-4 md:gap-4 md:p-4">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-8">
                <div className="flex flex-col gap-1">
                    <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Submissions Report</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Analyze your form submissions and ratings</p>
                </div>
                <ReportExport 
                    isExporting={isExporting}
                    setIsExporting={setIsExporting}
                    filteredSubmissions={filteredSubmissions}
                    chartData={chartData}
                    ratingData={ratingData}
                    selectedEmployee={selectedEmployee}
                    employees={employees}
                    selectedForm={selectedForm}
                    forms={forms}
                    filter={filter}
                    getDateRangeDisplay={getDateRangeDisplay}
                />
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-gray-900 rounded-lg border p-6 mb-8 shadow-sm">
                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Filter Options</h3>
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex flex-col gap-2 sm:flex-1">
                        <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Date Range</Label>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="justify-between w-full h-11 text-left">
                                    <div className="flex items-center">
                                        <CalendarRange className="h-4 w-4 mr-2 text-gray-500" />
                                        <span className="truncate">{getDateRangeDisplay()}</span>
                                    </div>
                                    <ChevronDown className="h-4 w-4 text-gray-500 flex-shrink-0" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent side="bottom" align="start" className="w-64">
                                <DropdownMenuLabel>Select Date Range</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleFilterChange("all")}>All Time</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleFilterChange("6months")}>Last 6 Months</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleFilterChange("30days")}>Last 30 Days</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleFilterChange("7days")}>Last 7 Days</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleFilterChange("custom")}>Custom Range</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-1">
                        <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Form Selection</Label>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="justify-between w-full h-11 text-left">
                                    <div className="flex items-center min-w-0">
                                        <span className="truncate">
                                            {selectedForm === "all" ? "All Forms" : forms.find(f => f._id === selectedForm)?.form_name || "Select Form"}
                                        </span>
                                    </div>
                                    <ChevronDown className="h-4 w-4 text-gray-500 flex-shrink-0 ml-2" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent side="bottom" align="start" className="w-64">
                                <DropdownMenuLabel>Select a Form</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => setSelectedForm("all")}>All Forms</DropdownMenuItem>
                                {forms.map(form => (
                                    <DropdownMenuItem key={form._id} onClick={() => setSelectedForm(form._id)}>
                                        <span className="truncate">{form.form_name}</span>
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                    
                    {/* Add Employee Filter */}
                    <div className="flex flex-col gap-2 sm:flex-1">
                        <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Employee Selection</Label>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="justify-between w-full h-11 text-left">
                                    <div className="flex items-center min-w-0">
                                        <span className="truncate">
                                            {selectedEmployee === "" ? "No Employee Filter" : 
                                             selectedEmployee === "all" ? "All Employees" : 
                                             employees.find(e => e._id === selectedEmployee)?.name || "Select Employee"}
                                        </span>
                                    </div>
                                    <ChevronDown className="h-4 w-4 text-gray-500 flex-shrink-0 ml-2" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent side="bottom" align="start" className="w-64">
                                <DropdownMenuLabel>Select an Employee</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => setSelectedEmployee("")}>No Employee Filter</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setSelectedEmployee("all")}>All Employees</DropdownMenuItem>
                                {employees.map(employee => (
                                    <DropdownMenuItem key={employee._id} onClick={() => setSelectedEmployee(employee._id)}>
                                        <div className="flex items-center gap-2">
                                            {employee.profile_photo?.url ? (
                                                <img 
                                                    src={employee.profile_photo.url} 
                                                    alt={employee.name} 
                                                    className="w-6 h-6 rounded-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
                                                    <User className="w-4 h-4 text-gray-500" />
                                                </div>
                                            )}
                                            <span className="truncate">{employee.name}</span>
                                        </div>
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
                
                
                {/* Custom Date Range Date Pickers */}
                {isCustomDateRange && (
                    <div className="mt-4 p-4 border rounded-lg bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                        <h4 className="text-sm font-semibold mb-3 text-gray-900 dark:text-white">Custom Date Range</h4>
                        <div className="flex flex-col lg:flex-row gap-4">
                            <div className="flex flex-col gap-2 flex-1">
                                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Start Date</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className={cn(
                                                "w-full justify-start text-left font-normal h-11",
                                                !customDateRange.start && "text-muted-foreground"
                                            )}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4 text-gray-500" />
                                            {customDateRange.start ? (
                                                format(customDateRange.start, "PPP")
                                            ) : (
                                                <span>Pick start date</span>
                                            )}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={customDateRange.start}
                                            onSelect={(date) => handleCustomDateChange('start', date)}
                                            disabled={(date) =>
                                                customDateRange.end ? date > customDateRange.end : false
                                            }
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>
                            
                            <div className="flex flex-col gap-2 flex-1">
                                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">End Date</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className={cn(
                                                "w-full justify-start text-left font-normal h-11",
                                                !customDateRange.end && "text-muted-foreground"
                                            )}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4 text-gray-500" />
                                            {customDateRange.end ? (
                                                format(customDateRange.end, "PPP")
                                            ) : (
                                                <span>Pick end date</span>
                                            )}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={customDateRange.end}
                                            onSelect={(date) => handleCustomDateChange('end', date)}
                                            disabled={(date) =>
                                                customDateRange.start ? date < customDateRange.start : false
                                            }
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>
                            
                            {(customDateRange.start || customDateRange.end) && (
                                <div className="flex flex-col gap-2 justify-end">
                                    <Label className="text-sm font-medium text-transparent">Actions</Label>
                                    <Button 
                                        variant="outline" 
                                        size="sm"
                                        className="h-11"
                                        onClick={() => {
                                            setCustomDateRange({ start: null, end: null });
                                            setFilter("all");
                                            setIsCustomDateRange(false);
                                        }}
                                    >
                                        Clear Dates
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Charts */}
            <div id="report-container" className="bg-white dark:bg-gray-900 p-4 rounded-lg">
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <Loader className="animate-spin h-8 w-8 text-slate-800 dark:text-white" />
                    </div>
                ) : chartData.length === 0 && ratingData.ratingData.every(r => r.value === 0) ? (
                    <div className="text-center py-12">
                        <p className="text-gray-500 text-lg">No submissions data available for the selected criteria.</p>
                        <p className="text-gray-400 text-sm mt-2">Try adjusting your date range or form selection.</p>
                    </div>
                ) : (
                    <>
                        {/* Report Summary */}
                        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/50 dark:to-blue-800 border-blue-200 dark:border-blue-700">
                                <CardContent className="p-4 md:p-6">
                                    <div className="text-center">
                                        <p className="text-sm text-blue-700 dark:text-blue-300 font-medium mb-2">Total Submissions</p>
                                        <div className="flex items-center justify-center gap-2">
                                            <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{filteredSubmissions.length}</p>
                                        </div>
                                    </div>

                                </CardContent>
                            </Card>
                            <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/50 dark:to-green-800 border-green-200 dark:border-green-700">
                                <CardContent className="p-4 md:p-6">
                                    <div className="text-center">
                                        <p className="text-sm text-green-700 dark:text-green-300 font-medium mb-2">
                                            {selectedEmployee === "" ? "General Ratings" : 
                                             selectedEmployee !== "all" ? "Average Rating" : "Overall Average"}
                                        </p>
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <div className="flex items-center gap-1">
                                            {[...Array(5)].map((_, i) => (
                                                <Star 
                                                    key={i} 
                                                    className={`h-4 w-4 ${i < Math.floor(ratingData.averageRating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} 
                                                />
                                            ))}

                                            </div>
                                            <p className="text-3xl font-bold text-green-600 dark:text-green-400 ml-2">{ratingData.averageRating}</p>
                                        </div>
                                    </div>

                                </CardContent>
                            </Card>
                            
                            {/* Conditional rating cards based on employee selection */}
                            {ratingData.averageGeneralRating && selectedEmployee !== "" && (
                                <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/50 dark:to-purple-800 border-purple-200 dark:border-purple-700">
                                    <CardContent className="p-4 md:p-6">
                                        <div className="text-center">
                                            <p className="text-sm text-purple-700 dark:text-purple-300 font-medium mb-2">General Ratings</p>
                                            <div className="flex flex-col items-center justify-center gap-2">
                                                
                                                <div className="flex items-center gap-1">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star 
                                                        key={i} 
                                                        className={`h-4 w-4 ${i < Math.floor(ratingData.averageGeneralRating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} 
                                                    />
                                                ))}
                                                </div>
                                                <p className="text-3xl font-bold text-purple-600 dark:text-purple-400 ml-2">{ratingData.averageGeneralRating}</p>
                                            </div>
                                            <p className="text-xs text-purple-500 dark:text-purple-300 mt-1">{ratingData.generalRatingCount} ratings</p>
                                        </div>

                                    </CardContent>
                                </Card>
                            )}
                            
                            {selectedEmployee === "all" && ratingData.averageEmployeeRating && (
                                <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/50 dark:to-orange-800 border-orange-200 dark:border-orange-700">
                                    <CardContent className="p-4 md:p-6">
                                        <div className="text-center">
                                            <p className="text-sm text-orange-700 dark:text-orange-300 font-medium mb-2">Employees Average</p>
                                            <div className="flex flex-col items-center justify-center gap-2">
                                                
                                            <div className="flex items-center gap-1">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star 
                                                        key={i} 
                                                        className={`h-4 w-4 ${i < Math.floor(ratingData.averageEmployeeRating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} 
                                                    />
                                                ))}
                                                </div>
                                                <p className="text-3xl font-bold text-orange-600 dark:text-orange-400 ml-2">{ratingData.averageEmployeeRating}</p>
                                            </div>
                                            <p className="text-xs text-orange-500 dark:text-orange-300 mt-1">{ratingData.employeeRatingCount} ratings</p>
                                        </div>

                                    </CardContent>
                                </Card>
                            )}
                            
                            {selectedEmployee !== "" && selectedEmployee !== "all" && ratingData.averageEmployeeRating && (
                                <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/50 dark:to-orange-800 border-orange-200 dark:border-orange-700">
                                    <CardContent className="p-4 md:p-6">
                                        <div className="text-center">
                                            <p className="text-sm text-orange-700 dark:text-orange-300 font-medium mb-2">Employee Ratings</p>
                                            <div className="flex flex-col items-center justify-center gap-2">
                                                <div className="flex items-center gap-1"> 
                                                {[...Array(5)].map((_, i) => (
                                                    <Star 
                                                        key={i} 
                                                        className={`h-4 w-4 ${i < Math.floor(ratingData.averageEmployeeRating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} 
                                                    />
                                                ))}
                                                </div>
                                                <p className="text-3xl font-bold text-orange-600 dark:text-orange-400 ml-2">{ratingData.averageEmployeeRating}</p>
                                            </div>
                                            <p className="text-xs text-orange-500 dark:text-orange-300 mt-1">{ratingData.employeeRatingCount} ratings</p>
                                        </div>

                                    </CardContent>
                                </Card>
                            )}
                            
                            {/* Date Range and Form Selection cards when not showing specialized ratings */}
                            {(!ratingData.averageGeneralRating || selectedEmployee === "") && (
                                <>
                                    <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900 dark:to-purple-800 border-purple-200 dark:border-purple-700">
                                        <CardContent className="p-4 md:p-6">
                                            <div className="text-center">
                                                <p className="text-sm text-purple-700 dark:text-purple-300 font-medium mb-2">Date Range</p>
                                                <div className="flex items-center justify-center gap-2">
                                                    <CalendarRange className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                                                    <p className="text-sm font-semibold text-purple-600 dark:text-purple-400 truncate" title={getDateRangeDisplay()}>{getDateRangeDisplay()}</p>
                                                </div>
                                            </div>

                                        </CardContent>
                                    </Card>
                                    <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900 dark:to-orange-800 border-orange-200 dark:border-orange-700">
                                        <CardContent className="p-4 md:p-6">
                                            <div className="text-center">
                                                <p className="text-sm text-orange-700 dark:text-orange-300 font-medium mb-2">Selected Form</p>
                                                <div className="flex items-center justify-center gap-2">
                                                    <FormInput className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                                                    <p className="text-sm font-semibold text-orange-600 dark:text-orange-400 truncate" title={selectedForm === "all" ? "All Forms" : forms.find(f => f._id === selectedForm)?.form_name || "Unknown"}>
                                                        {selectedForm === "all" ? "All Forms" : 
                                                         forms.find(f => f._id === selectedForm)?.form_name || "Unknown"}
                                                    </p>
                                                </div>
                                            </div>

                                        </CardContent>
                                    </Card>
                                </>
                            )}
                        </div>
                        
                        {/* Charts Section */}
                        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                            {/* Bar Chart */}
                            <Card className="xl:col-span-2 shadow-sm">
                                <CardHeader className="border-b bg-gray-50 dark:bg-gray-800">
                                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                                        <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white">Submissions Timeline</CardTitle>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm text-gray-600 dark:text-gray-400">Total:</span>
                                            <span className="text-lg font-bold text-blue-600 dark:text-blue-400">{filteredSubmissions.length}</span>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-6">
                                    <ChartContainer config={chartConfig} className="aspect-auto h-[350px] w-full" data-chart-id="timeline-chart">
                                        <BarChart data={chartData} margin={{ top: 20, left: 12, right: 12, bottom: 20 }}>
                                            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#3B526B" className="opacity-30" />
                                            <XAxis
                                                dataKey="date"
                                                tickFormatter={(value) =>
                                                    new Date(value).toLocaleDateString("en-US", {
                                                        month: "short",
                                                        day: "numeric",
                                                        year: chartData.length > 3 ? "2-digit" : "numeric",
                                                    })
                                                }
                                                interval={chartData.length > 6 ? Math.floor(chartData.length / 6) : 0}
                                                angle={chartData.length > 4 ? -45 : 0}
                                                textAnchor={chartData.length > 4 ? "end" : "middle"}
                                                height={chartData.length > 4 ? 70 : 50}
                                                tick={{ fontSize: 12 }}
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
                                            <Bar dataKey="submissions" fill={chartConfig.submissions.color} radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ChartContainer>
                                </CardContent>
                            </Card>

                            {/* Pie Chart */}
                            <Card className="shadow-sm">
                                <CardHeader className="border-b bg-gray-50 dark:bg-gray-800">
                                    <CardTitle className="text-xl font-semibold text-center text-gray-900 dark:text-white">Ratings Distribution</CardTitle>
                                </CardHeader>
                                <CardContent className="p-6">
                                    <ChartContainer
                                        config={starChartConfig}
                                        className="mx-auto aspect-square max-h-[280px] [&_.recharts-pie-label-text]:fill-foreground"
                                        data-chart-id="rating-chart"
                                    >
                                        <PieChart>
                                            <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                                            <Pie
                                                data={ratingData.ratingData}
                                                dataKey="value"
                                                nameKey="name"
                                                cx="50%"
                                                cy="50%"
                                                outerRadius={85}
                                                label
                                            >
                                                {ratingData.ratingData.map((_, index) => (
                                                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                                ))}
                                            </Pie>
                                        </PieChart>
                                    </ChartContainer>
                                </CardContent>
                                <CardFooter className="flex-col border-t pt-4 bg-gray-50 dark:bg-gray-800">
                                    <p className="text-center text-sm text-gray-600 dark:text-gray-400">
                                        {selectedEmployee === "" ? "General Ratings" : 
                                         selectedEmployee !== "all" ? "Average Rating" : "Overall Average"}
                                    </p>
                                    <h2 className="text-center text-3xl font-bold text-gray-900 dark:text-white">{ratingData.averageRating}</h2>
                                    <p className="text-center text-sm text-gray-500 dark:text-gray-400">Stars</p>
                                    
                                    {/* Additional rating information */}
                                    <div className="mt-2 text-center">
                                        {selectedEmployee !== "" && ratingData.averageGeneralRating && (
                                            <p className="text-xs text-purple-600 dark:text-purple-400">
                                                General: {ratingData.averageGeneralRating} ({ratingData.generalRatingCount} ratings)
                                            </p>
                                        )}
                                        {selectedEmployee === "all" && ratingData.averageEmployeeRating && (
                                            <p className="text-xs text-orange-600 dark:text-orange-400">
                                                All Employees: {ratingData.averageEmployeeRating} ({ratingData.employeeRatingCount} ratings)
                                            </p>
                                        )}
                                        {selectedEmployee !== "" && selectedEmployee !== "all" && ratingData.averageEmployeeRating && (
                                            <p className="text-xs text-orange-600 dark:text-orange-400">
                                                Employee: {ratingData.averageEmployeeRating} ({ratingData.employeeRatingCount} ratings)
                                            </p>
                                        )}
                                    </div>
                                    
                                    {/* Employee information when specific employee is selected */}
                                    {selectedEmployee !== "" && selectedEmployee !== "all" && (
                                        <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-1">
                                            {employees.find(e => e._id === selectedEmployee)?.name || "Unknown Employee"}
                                        </p>
                                    )}
                                </CardFooter>
                            </Card>
                        </div>

                        {/* Rating Trend Chart */}
                        {ratingTrendData.length > 0 && (
                            <div className="grid grid-cols-1 xl:grid-cols-3 mt-6">
                                <Card className="shadow-sm col-span-2">
                                    <CardHeader className="border-b bg-gray-50 dark:bg-gray-800">
                                        <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white">Rating Trend Over Time</CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-6">
                                        <ChartContainer config={chartConfig} className="aspect-auto h-[350px] w-full" data-chart-id="rating-trend-chart">
                                            <LineChart
                                                accessibilityLayer
                                                data={ratingTrendData}
                                                margin={{
                                                    top: 20,
                                                    left: 10,
                                                    right: 10,
                                                    bottom: 20,
                                                }}
                                            >
                                                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#3B526B" className="opacity-30" />
                                                <XAxis
                                                    dataKey="date"
                                                    tickLine={false}
                                                    axisLine={false}
                                                    tickMargin={8}
                                                    tickFormatter={(value) =>
                                                        new Date(value).toLocaleDateString("en-US", {
                                                            month: "short",
                                                            day: "numeric",
                                                        })
                                                    }
                                                    interval={ratingTrendData.length > 6 ? Math.floor(ratingTrendData.length / 6) : 0}
                                                    angle={ratingTrendData.length > 4 ? -45 : 0}
                                                    textAnchor={ratingTrendData.length > 4 ? "end" : "middle"}
                                                    height={ratingTrendData.length > 4 ? 80 : 60}
                                                    tick={{ fontSize: 12 }}
                                                />
                                                <YAxis 
                                                    domain={[0, 5]} 
                                                    tickCount={6}
                                                    width={30} 
                                                    tick={{ fontSize: 12 }} 
                                                />
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
                                                                                Submissions
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
                                                dataKey="avgRating"
                                                type="natural"
                                                stroke="var(--color-avgRating)"
                                                strokeWidth={2}
                                                dot={{ r: 4 }}
                                                activeDot={{ r: 6, stroke: "var(--color-avgRating)", strokeWidth: 2 }}
                                            />
                                            {selectedEmployee !== "" && (
                                                <>
                                                    <Line
                                                        dataKey="avgGeneralRating"
                                                        type="natural"
                                                        stroke="var(--color-avgGeneralRating)"
                                                        strokeWidth={2}
                                                        dot={{ r: 4 }}
                                                        activeDot={{ r: 6, stroke: "var(--color-avgGeneralRating)", strokeWidth: 2 }}
                                                    />
                                                    <Line
                                                        dataKey="avgEmployeeRating"
                                                        type="natural"
                                                        stroke="var(--color-avgEmployeeRating)"
                                                        strokeWidth={2}
                                                        dot={{ r: 4 }}
                                                        activeDot={{ r: 6, stroke: "var(--color-avgEmployeeRating)", strokeWidth: 2 }}
                                                    />
                                                </>
                                            )}
                                        </LineChart>
                                    </ChartContainer>
                                    </CardContent>
                                    <CardFooter className="flex-col border-t pt-4 bg-gray-50 dark:bg-gray-800">
                                        <div className="flex flex-wrap justify-center gap-4">
                                            <div className="flex items-center">
                                                <div className="w-3 h-3 rounded-full bg-[#f59e0b] mr-2"></div>
                                                <span className="text-sm">Average Rating</span>
                                            </div>
                                            {selectedEmployee !== "" && (
                                                <>
                                                    <div className="flex items-center">
                                                        <div className="w-3 h-3 rounded-full bg-[#8b5cf6] mr-2"></div>
                                                        <span className="text-sm">General Rating</span>
                                                    </div>
                                                    <div className="flex items-center">
                                                        <div className="w-3 h-3 rounded-full bg-[#f97316] mr-2"></div>
                                                        <span className="text-sm">Employee Rating</span>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </CardFooter>
                                </Card>
                            </div>
                        )}
                    </>
                )}
            </div>
            </div>
        </CustomerLayoutPage>
    );
}

export default ReportPage;
