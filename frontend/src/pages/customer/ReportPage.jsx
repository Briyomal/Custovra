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
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import useFormStore from "@/store/formStore";
import useSubmissionStore from "@/store/submissionStore";
import { ChevronDown, Loader, Download, Calendar as CalendarIcon } from "lucide-react";
import jsPDF from "jspdf";

import { format } from "date-fns";
import html2canvas from "html2canvas";
import { cn } from "@/lib/utils";

const PIE_COLORS = ["#bedcfe", "#a3c8f7", "#7aaff7", "#5197f7", "#3b86f7", "#2563eb"];

function ReportPage() {
    const { user, isAuthenticated } = useAuthStore();
    const { fetchFormsNew, forms } = useFormStore();
    const { fetchSubmissions, submissions } = useSubmissionStore();
    const [loading, setLoading] = useState(true);

    const userId = user?._id;
    const [filter, setFilter] = useState("all");
    const [selectedForm, setSelectedForm] = useState("all");
    
    // Date range selection states
    const [customDateRange, setCustomDateRange] = useState({
        start: null,
        end: null
    });
    const [isCustomDateRange, setIsCustomDateRange] = useState(false);
    
    // PDF export states
    const [isExporting, setIsExporting] = useState(false);

    // **Fetch Data Once When Component Mounts**
    useEffect(() => {
        if (isAuthenticated && userId) {
            setLoading(true);
            Promise.all([fetchFormsNew(userId), fetchSubmissions(userId)])
                .finally(() => setLoading(false));
        }
    }, [userId, isAuthenticated]);

    // Add effect to log data when it changes
    useEffect(() => {
        // Removed debugging logs for production environment
    }, [forms, submissions]);

    // **Filtering Function with Custom Date Range Support**
    const filterSubmissions = useCallback((data) => {
        if (!data || !Array.isArray(data)) return [];
        
        // Wait for forms to load before filtering
        if (!forms || forms.length === 0) {
            return [];
        }
        
        // First, filter by form ownership - only show submissions for forms owned by current user
        const userFormIds = forms.map(form => form._id);
        
        data = data.filter(sub => {
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
            
            return userFormIds.includes(formId);
        });
        
        // Then filter by selected form if not "all"
        if (selectedForm !== "all") {
            data = data.filter(sub => {
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

        if (filter !== "all") {
            if (filter === "custom" && isCustomDateRange) {
                // Custom date range filtering with Date objects
                const { start, end } = customDateRange;
                if (start && end) {
                    const startDate = new Date(start);
                    const endDate = new Date(end);
                    endDate.setHours(23, 59, 59, 999); // Include the entire end date
                    data = data.filter(sub => {
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
                data = data.filter(sub => new Date(sub.createdAt) >= startDate);
            }
        }
        
        return data;
    }, [filter, selectedForm, customDateRange, isCustomDateRange, forms]);

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

    // **Pie Chart Data (Ratings Distribution)**
    const ratingData = useMemo(() => {
        const ratingCounts = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        let totalRating = 0;
        let totalRatings = 0;

        filteredSubmissions.forEach(submission => {
            // Handle the case where submissions might be an empty object or null
            if (!submission.submissions) {
                return;
            }
            
            // If submissions is an empty object, skip it
            if (Object.keys(submission.submissions).length === 0) {
                return;
            }
            
            // Extract rating from submissions object
            let rating = null;
            
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
                        if (!isNaN(numericValue) && numericValue >= 0 && numericValue <= 5) {
                            rating = numericValue;
                            break;
                        }
                    }
                }
            }
            
            // If we found a rating, process it
            if (rating !== null && !isNaN(rating) && rating >= 0 && rating <= 5) {
                // Round the rating to nearest integer since ratings are typically whole numbers
                const roundedRating = Math.round(rating);
                ratingCounts[roundedRating]++;
                totalRating += roundedRating;
                totalRatings++;
            }
        });

        const averageRating = totalRatings > 0 ? totalRating / totalRatings : 0;

        // Calculate and return the rating data along with the average rating
        return {
            ratingData: Object.entries(ratingCounts).map(([rating, count]) => ({
                name: `${rating} Stars`,
                value: count,
            })),
            averageRating: totalRatings > 0 ? averageRating.toFixed(1) : "0.0", // Format to 1 decimal place
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
            const timelineChartElement = document.querySelector('[data-chart-id="timeline-chart"]');
            const ratingChartElement = document.querySelector('[data-chart-id="rating-chart"]');
            
            // Create canvas from chart elements if they exist
            let timelineImgData = null;
            let timelineCanvas = null;
            let ratingImgData = null;
            let ratingCanvas = null;
            
            if (timelineChartElement) {
                timelineCanvas = await html2canvas(timelineChartElement, {
                    scale: 2,
                    useCORS: true,
                    allowTaint: true,
                    backgroundColor: '#ffffff',
                    width: timelineChartElement.scrollWidth,
                    height: timelineChartElement.scrollHeight
                });
                timelineImgData = timelineCanvas.toDataURL('image/png');
            }
            
            if (ratingChartElement) {
                ratingCanvas = await html2canvas(ratingChartElement, {
                    scale: 2,
                    useCORS: true,
                    allowTaint: true,
                    backgroundColor: '#ffffff',
                    width: ratingChartElement.scrollWidth,
                    height: ratingChartElement.scrollHeight
                });
                ratingImgData = ratingCanvas.toDataURL('image/png');
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
            pdf.text('Submissions Report', pageWidth / 2, 20, { align: 'center' });
            
            // Add subtitle
            pdf.setFontSize(14);
            pdf.setTextColor(0, 0, 0); // Black color
            pdf.text('Detailed Analysis', pageWidth / 2, 30, { align: 'center' });
            
            // Add report info
            pdf.setFontSize(10);
            pdf.setTextColor(100, 100, 100); // Gray color
            const selectedFormName = selectedForm === "all" ? "All Forms" : 
                forms.find(f => f._id === selectedForm)?.form_name || "Unknown Form";
            const dateRange = getDateRangeDisplay();
            const generatedDate = format(new Date(), 'MMM dd, yyyy HH:mm');
            
            pdf.text(`Form: ${selectedFormName}`, 20, 45);
            pdf.text(`Date Range: ${dateRange}`, 20, 50);
            pdf.text(`Generated: ${generatedDate}`, 20, 55);
            
            // Add summary section
            pdf.setFontSize(16);
            pdf.setTextColor(37, 99, 235); // Blue color
            pdf.text('Summary', 20, 70);
            
            pdf.setFontSize(12);
            pdf.setTextColor(0, 0, 0); // Black color
            pdf.text(`Total Submissions: ${filteredSubmissions.length}`, 25, 80);
            pdf.text(`Average Rating: ${ratingData.averageRating} stars`, 25, 87);
            
            let yPos = 95;
            
            // Add timeline chart image if available
            if (timelineImgData && timelineCanvas) {
                pdf.setFontSize(16);
                pdf.setTextColor(37, 99, 235); // Blue color
                pdf.text('Submission Timeline Chart', 20, yPos);
                
                // Calculate dimensions to fit the chart image
                const chartImgWidth = timelineCanvas.width;
                const chartImgHeight = timelineCanvas.height;
                const maxChartWidth = pageWidth - 40;
                const maxChartHeight = 80;
                const chartRatio = Math.min(maxChartWidth / chartImgWidth, maxChartHeight / chartImgHeight);
                const finalChartWidth = chartImgWidth * chartRatio;
                const finalChartHeight = chartImgHeight * chartRatio;
                const chartX = (pageWidth - finalChartWidth) / 2;
                
                yPos += 10;
                pdf.addImage(timelineImgData, 'PNG', chartX, yPos, finalChartWidth, finalChartHeight);
                yPos += finalChartHeight + 15;
            }
            
            // Add timeline data section
            pdf.setFontSize(16);
            pdf.setTextColor(37, 99, 235); // Blue color
            if (yPos > pageHeight - 50) {
                pdf.addPage();
                yPos = 20;
            }
            pdf.text('Submission Timeline Data', 20, yPos);
            
            pdf.setFontSize(12);
            pdf.setTextColor(0, 0, 0); // Black color
            yPos += 10;
            
            // Add timeline data
            if (chartData.length > 0) {
                chartData.forEach((point) => {
                    if (yPos > pageHeight - 30) {
                        pdf.addPage();
                        yPos = 20;
                    }
                    
                    const date = new Date(point.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                    });
                    pdf.text(`${date}: ${point.submissions} submission(s)`, 25, yPos);
                    yPos += 6;
                });
            } else {
                if (yPos > pageHeight - 30) {
                    pdf.addPage();
                    yPos = 20;
                }
                pdf.text('No timeline data available', 25, yPos);
                yPos += 6;
            }
            
            // Add rating distribution chart image if available
            if (ratingImgData && ratingCanvas) {
                pdf.setFontSize(16);
                pdf.setTextColor(37, 99, 235); // Blue color
                if (yPos > pageHeight - 100) {
                    pdf.addPage();
                    yPos = 20;
                }
                pdf.text('Rating Distribution Chart', 20, yPos);
                
                // Calculate dimensions to fit the chart image
                const ratingImgWidth = ratingCanvas.width;
                const ratingImgHeight = ratingCanvas.height;
                const maxRatingWidth = pageWidth - 40;
                const maxRatingHeight = 80;
                const ratingRatio = Math.min(maxRatingWidth / ratingImgWidth, maxRatingHeight / ratingImgHeight);
                const finalRatingWidth = ratingImgWidth * ratingRatio;
                const finalRatingHeight = ratingImgHeight * ratingRatio;
                const ratingX = (pageWidth - finalRatingWidth) / 2;
                
                yPos += 10;
                pdf.addImage(ratingImgData, 'PNG', ratingX, yPos, finalRatingWidth, finalRatingHeight);
                yPos += finalRatingHeight + 15;
            }
            
            // Add rating distribution section
            pdf.setFontSize(16);
            pdf.setTextColor(37, 99, 235); // Blue color
            if (yPos > pageHeight - 50) {
                pdf.addPage();
                yPos = 20;
            } else {
                yPos += 10;
            }
            pdf.text('Rating Distribution Data', 20, yPos);
            
            pdf.setFontSize(12);
            pdf.setTextColor(0, 0, 0); // Black color
            yPos += 10;
            
            // Add rating data
            ratingData.ratingData.forEach((rating) => {
                if (yPos > pageHeight - 30) {
                    pdf.addPage();
                    yPos = 20;
                }
                
                pdf.text(`${rating.name}: ${rating.value} submission(s)`, 25, yPos);
                yPos += 6;
            });
            
            // Add detailed submissions section
            pdf.setFontSize(16);
            pdf.setTextColor(37, 99, 235); // Blue color
            if (yPos > pageHeight - 50) {
                pdf.addPage();
                yPos = 20;
            } else {
                yPos += 15;
            }
            pdf.text('Detailed Submissions', 20, yPos);
            
            pdf.setFontSize(12);
            pdf.setTextColor(0, 0, 0); // Black color
            yPos += 10;
            
            // Add individual submissions (limit to first 20 for brevity)
            const submissionsToShow = filteredSubmissions.slice(0, 20);
            submissionsToShow.forEach((submission, index) => {
                if (yPos > pageHeight - 50) {
                    pdf.addPage();
                    yPos = 20;
                }
                
                const submissionDate = submission.createdAt ? 
                    new Date(submission.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                    }) : 'N/A';
                
                pdf.text(`Submission #${index + 1} (${submissionDate})`, 25, yPos);
                yPos += 6;
                
                // Add submission details
                if (submission.submissions && Object.keys(submission.submissions).length > 0) {
                    Object.entries(submission.submissions).forEach(([key, value]) => {
                        if (yPos > pageHeight - 30) {
                            pdf.addPage();
                            yPos = 20;
                        }
                        
                        // Skip technical fields
                        if (key === 'cf-turnstile-response' || key === 'captchaToken') return;
                        
                        const displayValue = value !== null && value !== undefined ? String(value) : 'N/A';
                        pdf.text(`${key}: ${displayValue}`, 30, yPos);
                        yPos += 5;
                    });
                } else {
                    if (yPos > pageHeight - 30) {
                        pdf.addPage();
                        yPos = 20;
                    }
                    pdf.text('No submission data available', 30, yPos);
                    yPos += 5;
                }
                
                yPos += 3; // Add spacing between submissions
            });
            
            // Add note if there are more submissions than shown
            if (filteredSubmissions.length > 20) {
                if (yPos > pageHeight - 30) {
                    pdf.addPage();
                    yPos = 20;
                }
                pdf.text(`Note: Only first 20 of ${filteredSubmissions.length} submissions shown`, 25, yPos);
            }
            
            // Save the PDF
            const fileName = `submissions-report-detailed-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
            pdf.save(fileName);
            
        } catch { 
            alert('Failed to generate PDF. Please try again.');
        } finally {
            setIsExporting(false);
        }
    };


    return (
        <CustomerLayoutPage>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-8">
                <div className="flex flex-col gap-1">
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Submissions Report</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Analyze your form submissions and ratings</p>
                </div>
                <Button 
                    onClick={exportToPDF}
                    disabled={isExporting || (!chartData.length && ratingData.ratingData.every(r => r.value === 0))}
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
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 border-blue-200 dark:border-blue-700">
                                <CardContent className="p-6">
                                    <div className="text-center">
                                        <p className="text-sm text-blue-700 dark:text-blue-300 font-medium mb-2">Total Submissions</p>
                                        <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{filteredSubmissions.length}</p>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900 dark:to-green-800 border-green-200 dark:border-green-700">
                                <CardContent className="p-6">
                                    <div className="text-center">
                                        <p className="text-sm text-green-700 dark:text-green-300 font-medium mb-2">Average Rating</p>
                                        <p className="text-3xl font-bold text-green-600 dark:text-green-400">{ratingData.averageRating} ⭐</p>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900 dark:to-purple-800 border-purple-200 dark:border-purple-700">
                                <CardContent className="p-6">
                                    <div className="text-center">
                                        <p className="text-sm text-purple-700 dark:text-purple-300 font-medium mb-2">Date Range</p>
                                        <p className="text-sm font-semibold text-purple-600 dark:text-purple-400 truncate" title={getDateRangeDisplay()}>{getDateRangeDisplay()}</p>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900 dark:to-orange-800 border-orange-200 dark:border-orange-700">
                                <CardContent className="p-6">
                                    <div className="text-center">
                                        <p className="text-sm text-orange-700 dark:text-orange-300 font-medium mb-2">Selected Form</p>
                                        <p className="text-sm font-semibold text-orange-600 dark:text-orange-400 truncate" title={selectedForm === "all" ? "All Forms" : forms.find(f => f._id === selectedForm)?.form_name || "Unknown"}>
                                            {selectedForm === "all" ? "All Forms" : 
                                             forms.find(f => f._id === selectedForm)?.form_name || "Unknown"}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
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
                                            <CartesianGrid vertical={false} strokeDasharray="3 3" className="opacity-30" />
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
                                    <p className="text-center text-sm text-gray-600 dark:text-gray-400">Average Rating</p>
                                    <h2 className="text-center text-3xl font-bold text-gray-900 dark:text-white">{ratingData.averageRating}</h2>
                                    <p className="text-center text-sm text-gray-500 dark:text-gray-400">Stars</p>
                                </CardFooter>
                            </Card>
                        </div>
                    </>
                )}
            </div>
        </CustomerLayoutPage>
    );
}

export default ReportPage;
