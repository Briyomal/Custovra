import { useEffect, useState, useMemo } from "react";
import AdminLayoutPage from "./LayoutPage";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { ChevronDown, Loader, Download, Calendar as CalendarIcon, Users, FileText, MessageSquare } from "lucide-react";
import jsPDF from "jspdf";
import axios from "axios";

import { format } from "date-fns";
import html2canvas from "html2canvas";
import { cn } from "@/lib/utils";

const PIE_COLORS = ["#bedcfe", "#a3c8f7", "#7aaff7", "#5197f7", "#3b86f7", "#2563eb"];

function AdminReportPage() {
    const { user, isAuthenticated } = useAuthStore();
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState("all");
    const [adminStats, setAdminStats] = useState(null);
    const [userStats, setUserStats] = useState(null);
    
    // Date range selection states
    const [filter, setFilter] = useState("all");
    const [customDateRange, setCustomDateRange] = useState({
        start: null,
        end: null
    });
    const [isCustomDateRange, setIsCustomDateRange] = useState(false);
    
    // PDF export states
    const [isExporting, setIsExporting] = useState(false);

    // Fetch users for admin
    useEffect(() => {
        if (isAuthenticated && user?.role === 'admin') {
            const fetchUsers = async () => {
                try {
                    const response = await axios.get(`${import.meta.env.VITE_SERVER_URL}/api/users/all-users`, {
                        withCredentials: true
                    });
                    setUsers(response.data);
                } catch (error) {
                    console.error("Error fetching users:", error);
                }
            };
            
            const fetchAdminStats = async () => {
                try {
                    const response = await axios.get(`${import.meta.env.VITE_SERVER_URL}/api/reports/admin/stats`, {
                        withCredentials: true
                    });
                    setAdminStats(response.data);
                } catch (error) {
                    console.error("Error fetching admin stats:", error);
                } finally {
                    setLoading(false);
                }
            };
            
            fetchUsers();
            fetchAdminStats();
        }
    }, [isAuthenticated, user]);

    // Fetch user-specific stats when a user is selected
    useEffect(() => {
        if (selectedUser !== "all") {
            const fetchUserStats = async () => {
                try {
                    const response = await axios.get(`${import.meta.env.VITE_SERVER_URL}/api/reports/admin/user/${selectedUser}`, {
                        withCredentials: true
                    });
                    setUserStats(response.data);
                } catch (error) {
                    console.error("Error fetching user stats:", error);
                }
            };
            
            fetchUserStats();
        } else {
            setUserStats(null);
        }
    }, [selectedUser]);

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
    const exportToPDF = async () => {
        setIsExporting(true);
        try {
            // Get chart elements for screenshots
            const summaryChartElement = document.querySelector('[data-chart-id="summary-chart"]');
            const formTypeChartElement = document.querySelector('[data-chart-id="form-type-chart"]');
            
            // Create canvas from chart elements if they exist
            let summaryImgData = null;
            let summaryCanvas = null;
            let formTypeImgData = null;
            let formTypeCanvas = null;
            
            if (summaryChartElement) {
                summaryCanvas = await html2canvas(summaryChartElement, {
                    scale: 2,
                    useCORS: true,
                    allowTaint: true,
                    backgroundColor: '#ffffff',
                    width: summaryChartElement.scrollWidth,
                    height: summaryChartElement.scrollHeight
                });
                summaryImgData = summaryCanvas.toDataURL('image/png');
            }
            
            if (formTypeChartElement) {
                formTypeCanvas = await html2canvas(formTypeChartElement, {
                    scale: 2,
                    useCORS: true,
                    allowTaint: true,
                    backgroundColor: '#ffffff',
                    width: formTypeChartElement.scrollWidth,
                    height: formTypeChartElement.scrollHeight
                });
                formTypeImgData = formTypeCanvas.toDataURL('image/png');
            }
            
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });
            
            // Set up styling
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            
            // Add title
            pdf.setFontSize(22);
            pdf.setTextColor(37, 99, 235); // Blue color
            pdf.text('Admin Report', pageWidth / 2, 20, { align: 'center' });
            
            // Add subtitle
            pdf.setFontSize(14);
            pdf.setTextColor(0, 0, 0); // Black color
            pdf.text('Platform Analytics', pageWidth / 2, 30, { align: 'center' });
            
            // Add report info
            pdf.setFontSize(10);
            pdf.setTextColor(100, 100, 100); // Gray color
            const selectedUserName = selectedUser === "all" ? "All Users" : 
                users.find(u => u._id === selectedUser)?.name || "Unknown User";
            const dateRange = getDateRangeDisplay();
            const generatedDate = format(new Date(), 'MMM dd, yyyy HH:mm');
            
            pdf.text(`User: ${selectedUserName}`, 20, 45);
            pdf.text(`Date Range: ${dateRange}`, 20, 50);
            pdf.text(`Generated: ${generatedDate}`, 20, 55);
            
            // Add summary section
            pdf.setFontSize(16);
            pdf.setTextColor(37, 99, 235); // Blue color
            pdf.text('Platform Summary', 20, 70);
            
            pdf.setFontSize(12);
            pdf.setTextColor(0, 0, 0); // Black color
            
            const stats = selectedUser === "all" ? adminStats : userStats;
            if (stats) {
                if (selectedUser === "all") {
                    pdf.text(`Total Users: ${stats.totalUsers}`, 25, 80);
                    pdf.text(`Total Forms: ${stats.totalForms}`, 25, 87);
                    pdf.text(`Total Submissions: ${stats.totalSubmissions}`, 25, 94);
                    pdf.text(`Average Rating: ${stats.averageRating} stars`, 25, 101);
                } else {
                    pdf.text(`User: ${stats.user?.name || 'N/A'}`, 25, 80);
                    pdf.text(`Email: ${stats.user?.email || 'N/A'}`, 25, 87);
                    pdf.text(`Forms Created: ${stats.formCount}`, 25, 94);
                    pdf.text(`Submissions Received: ${stats.submissionCount}`, 25, 101);
                    pdf.text(`Average Rating: ${stats.averageRating} stars`, 25, 108);
                }
            }
            
            let yPos = 115;
            
            // Add summary chart image if available
            if (summaryImgData && summaryCanvas) {
                pdf.setFontSize(16);
                pdf.setTextColor(37, 99, 235); // Blue color
                pdf.text('Platform Statistics', 20, yPos);
                
                // Calculate dimensions to fit the chart image
                const chartImgWidth = summaryCanvas.width;
                const chartImgHeight = summaryCanvas.height;
                const maxChartWidth = pageWidth - 40;
                const maxChartHeight = 80;
                const chartRatio = Math.min(maxChartWidth / chartImgWidth, maxChartHeight / chartImgHeight);
                const finalChartWidth = chartImgWidth * chartRatio;
                const finalChartHeight = chartImgHeight * chartRatio;
                const chartX = (pageWidth - finalChartWidth) / 2;
                
                yPos += 10;
                pdf.addImage(summaryImgData, 'PNG', chartX, yPos, finalChartWidth, finalChartHeight);
                yPos += finalChartHeight + 15;
            }
            
            // Add form type distribution chart image if available
            if (formTypeImgData && formTypeCanvas) {
                pdf.setFontSize(16);
                pdf.setTextColor(37, 99, 235); // Blue color
                if (yPos > pageHeight - 100) {
                    pdf.addPage();
                    yPos = 20;
                }
                pdf.text('Form Type Distribution', 20, yPos);
                
                // Calculate dimensions to fit the chart image
                const formTypeImgWidth = formTypeCanvas.width;
                const formTypeImgHeight = formTypeCanvas.height;
                const maxFormTypeWidth = pageWidth - 40;
                const maxFormTypeHeight = 80;
                const formTypeRatio = Math.min(maxFormTypeWidth / formTypeImgWidth, maxFormTypeHeight / formTypeImgHeight);
                const finalFormTypeWidth = formTypeImgWidth * formTypeRatio;
                const finalFormTypeHeight = formTypeImgHeight * formTypeRatio;
                const formTypeX = (pageWidth - finalFormTypeWidth) / 2;
                
                yPos += 10;
                pdf.addImage(formTypeImgData, 'PNG', formTypeX, yPos, finalFormTypeWidth, finalFormTypeHeight);
                yPos += finalFormTypeHeight + 15;
            }
            
            // Add users list if showing all users
            if (selectedUser === "all" && users.length > 0) {
                pdf.setFontSize(16);
                pdf.setTextColor(37, 99, 235); // Blue color
                if (yPos > pageHeight - 50) {
                    pdf.addPage();
                    yPos = 20;
                } else {
                    yPos += 10;
                }
                pdf.text('Users List', 20, yPos);
                
                pdf.setFontSize(12);
                pdf.setTextColor(0, 0, 0); // Black color
                yPos += 10;
                
                // Add users data (limit to first 20 for brevity)
                const usersToShow = users.slice(0, 20);
                usersToShow.forEach((user, index) => {
                    if (yPos > pageHeight - 50) {
                        pdf.addPage();
                        yPos = 20;
                    }
                    
                    pdf.text(`${index + 1}. ${user.name} (${user.email})`, 25, yPos);
                    yPos += 6;
                    
                    pdf.setFontSize(10);
                    pdf.text(`   Forms: ${user.formCount} | Submissions: ${user.submissionCount} | Plan: ${user.subscription_plan}`, 30, yPos);
                    pdf.setFontSize(12);
                    yPos += 8;
                });
                
                // Add note if there are more users than shown
                if (users.length > 20) {
                    if (yPos > pageHeight - 30) {
                        pdf.addPage();
                        yPos = 20;
                    }
                    pdf.text(`Note: Only first 20 of ${users.length} users shown`, 25, yPos);
                }
            }
            
            // Save the PDF
            const fileName = `admin-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
            pdf.save(fileName);
            
        } catch (error) { 
            console.error("Error generating PDF:", error);
            alert('Failed to generate PDF. Please try again.');
        } finally {
            setIsExporting(false);
        }
    };

    // Prepare data for charts
    const summaryData = useMemo(() => {
        if (selectedUser === "all" && adminStats) {
            return [
                { name: 'Users', value: adminStats.totalUsers },
                { name: 'Forms', value: adminStats.totalForms },
                { name: 'Submissions', value: adminStats.totalSubmissions },
            ];
        } else if (userStats) {
            return [
                { name: 'Forms', value: userStats.formCount },
                { name: 'Submissions', value: userStats.submissionCount },
            ];
        }
        return [];
    }, [adminStats, userStats, selectedUser]);

    const formTypeData = useMemo(() => {
        const stats = selectedUser === "all" ? adminStats : userStats;
        if (stats && stats.formTypeCounts) {
            return [
                { name: 'Review', value: stats.formTypeCounts.Review },
                { name: 'Complaint', value: stats.formTypeCounts.Complaint },
            ];
        }
        return [];
    }, [adminStats, userStats, selectedUser]);

    const chartConfig = {
        value: { label: "Count", color: "#2563eb" },
    };

    const formTypeChartConfig = {
        value: { label: "Count", color: "#10b981" },
    };

    return (
        <AdminLayoutPage>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-8">
                <div className="flex flex-col gap-1">
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Report</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Analyze platform usage and user statistics</p>
                </div>
                <Button 
                    onClick={exportToPDF}
                    disabled={isExporting || loading}
                    className="flex items-center gap-2 h-10 px-4 shrink-0"
                    variant="outline"
                    size="sm"
                >
                    {isExporting ? (
                        <>
                            <Loader className="animate-spin h-4 w-4" />
                            Generating PDF...
                        </>
                    ) : (
                        <>
                            <Download className="h-4 w-4" />
                            Export to PDF
                        </>
                    )}
                </Button>
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
                                        <CalendarIcon className="h-4 w-4 mr-2 text-gray-500" />
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
                        <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">User Selection</Label>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="justify-between w-full h-11 text-left">
                                    <div className="flex items-center min-w-0">
                                        <span className="truncate">
                                            {selectedUser === "all" ? "All Users" : users.find(u => u._id === selectedUser)?.name || "Select User"}
                                        </span>
                                    </div>
                                    <ChevronDown className="h-4 w-4 text-gray-500 flex-shrink-0 ml-2" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent side="bottom" align="start" className="w-64">
                                <DropdownMenuLabel>Select a User</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => setSelectedUser("all")}>All Users</DropdownMenuItem>
                                {users.map(user => (
                                    <DropdownMenuItem key={user._id} onClick={() => setSelectedUser(user._id)}>
                                        <span className="truncate">{user.name} ({user.email})</span>
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
                ) : (
                    <>
                        {/* Report Summary */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                            {selectedUser === "all" ? (
                                <>
                                    <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 border-blue-200 dark:border-blue-700">
                                        <CardContent className="p-6">
                                            <div className="text-center">
                                                <Users className="h-8 w-8 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
                                                <p className="text-sm text-blue-700 dark:text-blue-300 font-medium mb-2">Total Users</p>
                                                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{adminStats?.totalUsers || 0}</p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                    <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900 dark:to-green-800 border-green-200 dark:border-green-700">
                                        <CardContent className="p-6">
                                            <div className="text-center">
                                                <FileText className="h-8 w-8 text-green-600 dark:text-green-400 mx-auto mb-2" />
                                                <p className="text-sm text-green-700 dark:text-green-300 font-medium mb-2">Total Forms</p>
                                                <p className="text-3xl font-bold text-green-600 dark:text-green-400">{adminStats?.totalForms || 0}</p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                    <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900 dark:to-purple-800 border-purple-200 dark:border-purple-700">
                                        <CardContent className="p-6">
                                            <div className="text-center">
                                                <MessageSquare className="h-8 w-8 text-purple-600 dark:text-purple-400 mx-auto mb-2" />
                                                <p className="text-sm text-purple-700 dark:text-purple-300 font-medium mb-2">Total Submissions</p>
                                                <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{adminStats?.totalSubmissions || 0}</p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                    <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900 dark:to-orange-800 border-orange-200 dark:border-orange-700">
                                        <CardContent className="p-6">
                                            <div className="text-center">
                                                <p className="text-sm text-orange-700 dark:text-orange-300 font-medium mb-2">Average Rating</p>
                                                <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">{adminStats?.averageRating || "0.0"} ⭐</p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </>
                            ) : (
                                userStats && (
                                    <>
                                        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 border-blue-200 dark:border-blue-700">
                                            <CardContent className="p-6">
                                                <div className="text-center">
                                                    <FileText className="h-8 w-8 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
                                                    <p className="text-sm text-blue-700 dark:text-blue-300 font-medium mb-2">Forms Created</p>
                                                    <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{userStats.formCount}</p>
                                                </div>
                                            </CardContent>
                                        </Card>
                                        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900 dark:to-green-800 border-green-200 dark:border-green-700">
                                            <CardContent className="p-6">
                                                <div className="text-center">
                                                    <MessageSquare className="h-8 w-8 text-green-600 dark:text-green-400 mx-auto mb-2" />
                                                    <p className="text-sm text-green-700 dark:text-green-300 font-medium mb-2">Submissions</p>
                                                    <p className="text-3xl font-bold text-green-600 dark:text-green-400">{userStats.submissionCount}</p>
                                                </div>
                                            </CardContent>
                                        </Card>
                                        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900 dark:to-purple-800 border-purple-200 dark:border-purple-700">
                                            <CardContent className="p-6">
                                                <div className="text-center">
                                                    <p className="text-sm text-purple-700 dark:text-purple-300 font-medium mb-2">Average Rating</p>
                                                    <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{userStats.averageRating} ⭐</p>
                                                </div>
                                            </CardContent>
                                        </Card>
                                        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900 dark:to-orange-800 border-orange-200 dark:border-orange-700">
                                            <CardContent className="p-6">
                                                <div className="text-center">
                                                    <p className="text-sm text-orange-700 dark:text-orange-300 font-medium mb-2">User</p>
                                                    <p className="text-sm font-semibold text-orange-600 dark:text-orange-400 truncate" title={userStats.user?.name || "Unknown"}>
                                                        {userStats.user?.name || "Unknown"}
                                                    </p>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </>
                                )
                            )}
                        </div>
                        
                        {/* Charts Section */}
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
                            {/* Summary Chart */}
                            <Card className="shadow-sm">
                                <CardHeader className="border-b bg-gray-50 dark:bg-gray-800">
                                    <CardTitle className="text-xl font-semibold text-center text-gray-900 dark:text-white">
                                        {selectedUser === "all" ? "Platform Statistics" : "User Statistics"}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-6">
                                    <ChartContainer 
                                        config={chartConfig} 
                                        className="aspect-auto h-[300px] w-full" 
                                        data-chart-id="summary-chart"
                                    >
                                        <BarChart data={summaryData} margin={{ top: 20, left: 12, right: 12, bottom: 20 }}>
                                            <CartesianGrid vertical={false} strokeDasharray="3 3" className="opacity-30" />
                                            <XAxis
                                                dataKey="name"
                                                tick={{ fontSize: 12 }}
                                            />
                                            <YAxis width={30} tick={{ fontSize: 12 }} />
                                            <ChartTooltip
                                                content={
                                                    <ChartTooltipContent
                                                        className="w-[150px]"
                                                        nameKey="value"
                                                    />
                                                }
                                            />
                                            <Bar dataKey="value" fill={chartConfig.value.color} radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ChartContainer>
                                </CardContent>
                            </Card>

                            {/* Form Type Distribution */}
                            <Card className="shadow-sm">
                                <CardHeader className="border-b bg-gray-50 dark:bg-gray-800">
                                    <CardTitle className="text-xl font-semibold text-center text-gray-900 dark:text-white">
                                        Form Type Distribution
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-6">
                                    <ChartContainer
                                        config={formTypeChartConfig}
                                        className="mx-auto aspect-square max-h-[300px] [&_.recharts-pie-label-text]:fill-foreground"
                                        data-chart-id="form-type-chart"
                                    >
                                        <PieChart>
                                            <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                                            <Pie
                                                data={formTypeData}
                                                dataKey="value"
                                                nameKey="name"
                                                cx="50%"
                                                cy="50%"
                                                outerRadius={85}
                                                label
                                            >
                                                {formTypeData.map((_, index) => (
                                                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                                ))}
                                            </Pie>
                                        </PieChart>
                                    </ChartContainer>
                                </CardContent>
                            </Card>
                        </div>
                        
                        {/* Users List (only when showing all users) */}
                        {selectedUser === "all" && users.length > 0 && (
                            <Card className="shadow-sm">
                                <CardHeader className="border-b bg-gray-50 dark:bg-gray-800">
                                    <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white">Users Overview</CardTitle>
                                </CardHeader>
                                <CardContent className="p-6">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                                            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                                                <tr>
                                                    <th scope="col" className="px-4 py-3">User</th>
                                                    <th scope="col" className="px-4 py-3">Email</th>
                                                    <th scope="col" className="px-4 py-3">Forms</th>
                                                    <th scope="col" className="px-4 py-3">Submissions</th>
                                                    <th scope="col" className="px-4 py-3">Plan</th>
                                                    <th scope="col" className="px-4 py-3">Joined</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {users.map((user) => (
                                                    <tr key={user._id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                                                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-white whitespace-nowrap">
                                                            {user.name}
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            {user.email}
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            {user.formCount}
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            {user.submissionCount}
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                                                                {user.subscription_plan}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            {user.createdAt ? format(new Date(user.createdAt), "MMM dd, yyyy") : "N/A"}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </>
                )}
            </div>
        </AdminLayoutPage>
    );
}

export default AdminReportPage;