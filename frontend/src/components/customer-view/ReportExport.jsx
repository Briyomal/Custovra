import { useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Loader, Download } from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { format } from "date-fns";
import Logo from "@/assets/Logo.png";

function ReportExport({ 
    isExporting, 
    setIsExporting, 
    filteredSubmissions, 
    chartData, 
    ratingData, 
    selectedEmployee, 
    employees, 
    selectedForm, 
    forms, 
    filter, 
    getDateRangeDisplay 
}) {
    // Function to draw star icons in PDF
    const drawStar = (pdf, x, y, size = 5, color = [255, 215, 0]) => {
        pdf.setFillColor(...color);
        pdf.circle(x, y, size, 'F');
    };

    // Function to draw star rating in PDF
    const drawStarRating = (pdf, x, y, rating, maxRating = 5) => {
        const starSize = 2;
        const spacing = 3;
        
        // Draw outline stars
        for (let i = 0; i < maxRating; i++) {
            drawStar(pdf, x + i * (starSize * 2 + spacing), y, starSize, [200, 200, 200]);
        }
        
        // Draw filled stars
        const fullStars = Math.floor(rating);
        const partialStar = rating % 1;
        
        for (let i = 0; i < fullStars; i++) {
            drawStar(pdf, x + i * (starSize * 2 + spacing), y, starSize, [255, 215, 0]);
        }
        
        // Draw partial star if needed
        if (partialStar > 0) {
            drawStar(pdf, x + fullStars * (starSize * 2 + spacing), y, starSize * partialStar, [255, 215, 0]);
        }
    };

    // **PDF Export Function**
    const exportToPDF = useCallback(async () => {
        setIsExporting(true);
        try {
            // Get chart elements for screenshots
            const timelineChartElement = document.querySelector('[data-chart-id="timeline-chart"]');
            const ratingChartElement = document.querySelector('[data-chart-id="rating-chart"]');
            const ratingTrendChartElement = document.querySelector('[data-chart-id="rating-trend-chart"]');
            
            // Create canvas from chart elements if they exist
            let timelineImgData = null;
            let timelineCanvas = null;
            let ratingImgData = null;
            let ratingCanvas = null;
            let ratingTrendImgData = null;
            let ratingTrendCanvas = null;
            
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
                // Create a temporary clone of the rating chart element to modify styles
                const clonedElement = ratingChartElement.cloneNode(true);
                document.body.appendChild(clonedElement);
                
                // Force text color to be gray for better visibility in PDF
                const textElements = clonedElement.querySelectorAll('.recharts-pie-label-text');
                textElements.forEach(textEl => {
                    textEl.style.fill = '#666666'; // Dark gray color for better contrast
                    textEl.style.stroke = 'none';
                });
                
                // Remove tooltips from the cloned element
                const tooltipElements = clonedElement.querySelectorAll('.recharts-tooltip-wrapper');
                tooltipElements.forEach(tooltipEl => {
                    tooltipEl.style.display = 'none';
                });
                
                ratingCanvas = await html2canvas(clonedElement, {
                    scale: 2,
                    useCORS: true,
                    allowTaint: true,
                    backgroundColor: '#ffffff',
                    width: clonedElement.scrollWidth,
                    height: clonedElement.scrollHeight
                });
                
                ratingImgData = ratingCanvas.toDataURL('image/png');
                document.body.removeChild(clonedElement);
            }
            
            if (ratingTrendChartElement) {
                ratingTrendCanvas = await html2canvas(ratingTrendChartElement, {
                    scale: 2,
                    useCORS: true,
                    allowTaint: true,
                    backgroundColor: '#ffffff',
                    width: ratingTrendChartElement.scrollWidth,
                    height: ratingTrendChartElement.scrollHeight
                });
                
                ratingTrendImgData = ratingTrendCanvas.toDataURL('image/png');
            }
            
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });
            
            // Set up styling
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            
            // Add decorative header line
            pdf.setDrawColor(34, 197, 94); // Blue color
            pdf.setLineWidth(1);
            pdf.line(20, 30, pageWidth - 20, 30);
            
            // Add title
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(24);
            pdf.setTextColor(34, 197, 94); // Blue color
            pdf.text('Submissions Report', pageWidth / 2, 22, { align: 'center' });
            
            // Add subtitle
            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(14);
            pdf.setTextColor(0, 0, 0); // Black color
            pdf.text('Detailed Analysis', pageWidth / 2, 35, { align: 'center' });
            
            // Add report info in a box
            pdf.setDrawColor(200, 200, 200);
            pdf.setFillColor(245, 245, 245);
            pdf.rect(15, 40, pageWidth - 30, 25, 'FD');
            
            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(10);
            pdf.setTextColor(100, 100, 100); // Gray color
            const selectedFormName = selectedForm === "all" ? "Review App" : 
                forms.find(f => f._id === selectedForm)?.form_name || "Unknown Form";
            const dateRange = getDateRangeDisplay();
            const generatedDate = format(new Date(), 'MMM dd, yyyy HH:mm');
            
            pdf.text(`Form: ${selectedFormName}`, 20, 50);
            pdf.text(`Date Range: ${dateRange}`, 20, 55);
            pdf.text(`Generated: ${generatedDate}`, 20, 60);
            
            // Add employee info if selected
            if (selectedEmployee && selectedEmployee !== "all" && selectedEmployee !== "") {
                const employee = employees.find(e => e._id === selectedEmployee);
                if (employee) {
                    pdf.setDrawColor(200, 200, 200);
                    pdf.setFillColor(245, 245, 245);
                    pdf.rect(15, 68, pageWidth - 30, 15, 'FD');
                    
                    pdf.setFont('helvetica', 'normal');
                    pdf.setFontSize(10);
                    pdf.setTextColor(100, 100, 100);
                    pdf.text(`Employee: ${employee.name}`, 20, 73);
                    pdf.text(`Designation: ${employee.designation || 'N/A'}`, 20, 78);
                }
            }
            
            let yPos = 95; // Increased spacing to avoid overlap
            
            // Add summary section with better formatting
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(18);
            pdf.setTextColor(34, 197, 94); // Blue color
            pdf.text('Summary', 20, yPos);
            
            // Add decorative line under summary
            pdf.setDrawColor(200, 200, 200);
            pdf.setLineWidth(0.5);
            pdf.line(20, yPos + 2, pageWidth - 20, yPos + 2);
            
            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(12);
            pdf.setTextColor(0, 0, 0); // Black color
            yPos += 12;
            pdf.text(`Total Submissions: ${filteredSubmissions.length}`, 25, yPos);
            
            // Add rating information based on employee selection with proper spacing and alignment
            yPos += 15;
            
            if (selectedEmployee === "") {
                // When no employee filter is selected, only show general ratings
                pdf.text(`General Ratings: ${ratingData.averageRating} stars`, 25, yPos);
                drawStarRating(pdf, 100, yPos - 2, parseFloat(ratingData.averageRating));
                if (ratingData.generalRatingCount > 0) {
                    yPos += 10;
                    pdf.text(`Based on ${ratingData.generalRatingCount} general ratings`, 25, yPos);
                }
            } else if (selectedEmployee === "all") {
                // When "All Employees" is selected
                pdf.text(`Overall Average Rating: ${ratingData.averageRating} stars`, 25, yPos);
                drawStarRating(pdf, 110, yPos - 2, parseFloat(ratingData.averageRating));
                yPos += 12;
                if (ratingData.averageGeneralRating) {
                    pdf.text(`General Ratings: ${ratingData.averageGeneralRating} stars (${ratingData.generalRatingCount} ratings)`, 25, yPos);
                    drawStarRating(pdf, 110, yPos - 2, parseFloat(ratingData.averageGeneralRating));
                    yPos += 10;
                }
                if (ratingData.averageEmployeeRating) {
                    pdf.text(`All Employee Ratings: ${ratingData.averageEmployeeRating} stars (${ratingData.employeeRatingCount} ratings)`, 25, yPos);
                    drawStarRating(pdf, 110, yPos - 2, parseFloat(ratingData.averageEmployeeRating));
                    yPos += 10;
                }
            } else {
                // When a specific employee is selected
                const selectedEmployeeName = employees.find(e => e._id === selectedEmployee)?.name || "Unknown Employee";
                pdf.text(`Employee: ${selectedEmployeeName}`, 25, yPos);
                yPos += 10;
                pdf.text(`Average Rating: ${ratingData.averageRating} stars`, 25, yPos);
                drawStarRating(pdf, 100, yPos - 2, parseFloat(ratingData.averageRating));
                yPos += 12;
                if (ratingData.averageGeneralRating) {
                    pdf.text(`General Ratings: ${ratingData.averageGeneralRating} stars (${ratingData.generalRatingCount} ratings)`, 25, yPos);
                    drawStarRating(pdf, 110, yPos - 2, parseFloat(ratingData.averageGeneralRating));
                    yPos += 10;
                }
                if (ratingData.averageEmployeeRating) {
                    pdf.text(`Employee Ratings: ${ratingData.averageEmployeeRating} stars (${ratingData.employeeRatingCount} ratings)`, 25, yPos);
                    drawStarRating(pdf, 110, yPos - 2, parseFloat(ratingData.averageEmployeeRating));
                    yPos += 10;
                }
            }
            
            yPos += 20; // Extra space to prevent overlap
            
            // Add timeline chart image if available
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(18);
            pdf.setTextColor(22, 191, 65); // Blue color
            pdf.text('Submission Timeline Chart', 20, yPos);
            
            // Add decorative line under chart title
            pdf.setDrawColor(200, 200, 200);
            pdf.setLineWidth(0.5);
            pdf.line(20, yPos + 2, pageWidth - 20, yPos + 2);
            
            // Calculate dimensions to fit the chart image
            const chartImgWidth = timelineCanvas?.width || 0;
            const chartImgHeight = timelineCanvas?.height || 0;
            const maxChartWidth = pageWidth - 40;
            const maxChartHeight = 80;
            const chartRatio = Math.min(maxChartWidth / chartImgWidth, maxChartHeight / chartImgHeight);
            const finalChartWidth = chartImgWidth * chartRatio;
            const finalChartHeight = chartImgHeight * chartRatio;
            const chartX = (pageWidth - finalChartWidth) / 2;
            
            yPos += 15;
            if (timelineImgData) {
                pdf.addImage(timelineImgData, 'PNG', chartX, yPos, finalChartWidth, finalChartHeight);
                yPos += finalChartHeight + 20;
            } else {
                pdf.text('No timeline chart data available', 25, yPos + 5);
                yPos += 15;
            }
            
            // Add timeline data section in table format
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(18);
            pdf.setTextColor(22, 191, 65); // Blue color
            if (yPos > pageHeight - 100) {
                pdf.addPage();
                yPos = 30;
            }
            pdf.text('Submission Timeline Data', 20, yPos);
            
            // Add decorative line under timeline data title
            pdf.setDrawColor(200, 200, 200);
            pdf.setLineWidth(0.5);
            pdf.line(20, yPos + 2, pageWidth - 20, yPos + 2);
            
            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(12);
            pdf.setTextColor(0, 0, 0); // Black color
            yPos += 12;
            
            // Add timeline data in table format with consistent borders
            if (chartData.length > 0) {
                // Table header with borders
                pdf.setFillColor(240, 240, 240);
                pdf.setDrawColor(200, 200, 200);
                pdf.rect(20, yPos, pageWidth - 40, 8, 'FD');
                pdf.text('Date', 25, yPos + 5);
                pdf.text('Submissions', pageWidth - 50, yPos + 5);
                
                yPos += 8;
                
                // Table rows with consistent borders
                chartData.forEach((point, index) => {
                    if (yPos > pageHeight - 30) {
                        pdf.addPage();
                        yPos = 30;
                        // Re-add table header on new page
                        pdf.setFillColor(240, 240, 240);
                        pdf.setDrawColor(200, 200, 200);
                        pdf.rect(20, yPos, pageWidth - 40, 8, 'FD');
                        pdf.text('Date', 25, yPos + 5);
                        pdf.text('Submissions', pageWidth - 50, yPos + 5);
                        yPos += 8;
                    }
                    
                    const date = new Date(point.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                    });
                    
                    // Alternate row colors with borders
                    pdf.setDrawColor(200, 200, 200);
                    if (index % 2 === 0) {
                        pdf.setFillColor(250, 250, 250);
                        pdf.rect(20, yPos, pageWidth - 40, 8, 'FD');
                    } else {
                        pdf.rect(20, yPos, pageWidth - 40, 8);
                    }
                    
                    pdf.text(date, 25, yPos + 5);
                    pdf.text(point.submissions.toString(), pageWidth - 50, yPos + 5);
                    yPos += 8;
                });
            } else {
                if (yPos > pageHeight - 30) {
                    pdf.addPage();
                    yPos = 30;
                }
                pdf.text('No timeline data available', 25, yPos + 5);
                yPos += 10;
            }
            
            yPos += 15;
            
            // Add rating distribution chart image if available
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(18);
            pdf.setTextColor(22, 191, 65); // Blue color
            if (yPos > pageHeight - 120) {
                pdf.addPage();
                yPos = 30;
            }
            pdf.text('Rating Distribution Chart', 20, yPos);
            
            // Add decorative line under chart title
            pdf.setDrawColor(200, 200, 200);
            pdf.setLineWidth(0.5);
            pdf.line(20, yPos + 2, pageWidth - 20, yPos + 2);
            
            // Calculate dimensions to fit the chart image
            const ratingImgWidth = ratingCanvas?.width || 0;
            const ratingImgHeight = ratingCanvas?.height || 0;
            const maxRatingWidth = pageWidth - 40;
            const maxRatingHeight = 80;
            const ratingRatio = Math.min(maxRatingWidth / ratingImgWidth, maxRatingHeight / ratingImgHeight);
            const finalRatingWidth = ratingImgWidth * ratingRatio;
            const finalRatingHeight = ratingImgHeight * ratingRatio;
            const ratingX = (pageWidth - finalRatingWidth) / 2;
            
            yPos += 15;
            if (ratingImgData) {
                pdf.addImage(ratingImgData, 'PNG', ratingX, yPos, finalRatingWidth, finalRatingHeight);
                yPos += finalRatingHeight + 10;
            } else {
                pdf.text('No rating distribution chart data available', 25, yPos + 5);
                yPos += 15;
            }
            
            // Add rating distribution section in table format with consistent borders
            pdf.setFont('helvetica', 'normal'); // Changed back to normal font
            pdf.setFontSize(12);
            pdf.setTextColor(0, 0, 0); // Black color for data
            yPos += 10;
            
            // Add rating data in table format with consistent borders
            if (ratingData.ratingData.length > 0) {
                // Table header with borders (in bold)
                pdf.setFont('helvetica', 'bold');
                pdf.setFillColor(240, 240, 240);
                pdf.setDrawColor(200, 200, 200);
                pdf.rect(20, yPos, pageWidth - 40, 8, 'FD');
                pdf.text('Rating', 25, yPos + 5);
                pdf.text('Count', pageWidth - 50, yPos + 5);
                
                yPos += 8;
                
                // Table rows with consistent borders (in normal font)
                pdf.setFont('helvetica', 'normal');
                ratingData.ratingData.forEach((rating, index) => {
                    if (yPos > pageHeight - 30) {
                        pdf.addPage();
                        yPos = 30;
                        // Re-add table header on new page (in bold)
                        pdf.setFont('helvetica', 'bold');
                        pdf.setFillColor(240, 240, 240);
                        pdf.setDrawColor(200, 200, 200);
                        pdf.rect(20, yPos, pageWidth - 40, 8, 'FD');
                        pdf.text('Rating', 25, yPos + 5);
                        pdf.text('Count', pageWidth - 50, yPos + 5);
                        yPos += 8;
                        // Switch back to normal font for data
                        pdf.setFont('helvetica', 'normal');
                    }
                    
                    const ratingValue = parseInt(rating.name);
                    
                    // Alternate row colors with borders
                    pdf.setDrawColor(200, 200, 200);
                    if (index % 2 === 0) {
                        pdf.setFillColor(250, 250, 250);
                        pdf.rect(20, yPos, pageWidth - 40, 8, 'FD');
                    } else {
                        pdf.rect(20, yPos, pageWidth - 40, 8);
                    }
                    
                    if (!isNaN(ratingValue)) {
                        // It's a star rating
                        pdf.text(`${rating.name}`, 25, yPos + 5); // Removed "stars" duplication
                        drawStarRating(pdf, 70, yPos + 3, ratingValue);
                    } else {
                        // Other rating types
                        pdf.text(rating.name, 25, yPos + 5);
                    }
                    
                    pdf.text(rating.value.toString(), pageWidth - 50, yPos + 5);
                    yPos += 8;
                });
            } else {
                if (yPos > pageHeight - 30) {
                    pdf.addPage();
                    yPos = 30;
                }
                pdf.text('No rating data available', 25, yPos + 5);
                yPos += 10;
            }
            
            // Add extra spacing to prevent overlap
            yPos += 20;
            
            // Add rating trend chart image if available
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(18);
            pdf.setTextColor(22, 191, 65); // Blue color
            if (yPos > pageHeight - 150) {
                pdf.addPage();
                yPos = 30;
            }
            pdf.text('Rating Trend Over Time Chart', 20, yPos);
            
            // Add decorative line under chart title
            pdf.setDrawColor(200, 200, 200);
            pdf.setLineWidth(0.5);
            pdf.line(20, yPos + 2, pageWidth - 20, yPos + 2);
            
            // Calculate dimensions to fit the chart image with full width
            const ratingTrendImgWidth = ratingTrendCanvas?.width || 0;
            const ratingTrendImgHeight = ratingTrendCanvas?.height || 0;
            const maxRatingTrendWidth = pageWidth - 40;
            const maxRatingTrendHeight = 140; 
            const ratingTrendRatio = Math.min(maxRatingTrendWidth / ratingTrendImgWidth, maxRatingTrendHeight / ratingTrendImgHeight);
            const finalRatingTrendWidth = ratingTrendImgWidth * ratingTrendRatio;
            const finalRatingTrendHeight = ratingTrendImgHeight * ratingTrendRatio;
            const ratingTrendX = (pageWidth - finalRatingTrendWidth) / 2 ;
            
            yPos += 15;
            if (ratingTrendImgData) {
                pdf.addImage(ratingTrendImgData, 'PNG', ratingTrendX, yPos, finalRatingTrendWidth, finalRatingTrendHeight);
                yPos += finalRatingTrendHeight + 25; // Increased spacing
                
                // Add color legend for the rating trend lines
                pdf.setFont('helvetica', 'bold');
                pdf.setFontSize(14);
                pdf.setTextColor(22, 191, 65); // Blue color
                pdf.text('Rating Trend Legend', 20, yPos);
                
                // Add decorative line under legend title
                pdf.setDrawColor(200, 200, 200);
                pdf.setLineWidth(0.5);
                pdf.line(20, yPos + 2, pageWidth - 20, yPos + 2);
                
                pdf.setFont('helvetica', 'normal');
                pdf.setFontSize(12);
                pdf.setTextColor(0, 0, 0); // Black color
                yPos += 10;
                
                // Add legend items with colored squares
                const legendItems = [
                    { color: [245, 158, 11], label: 'Average Rating' }, // Orange-yellow
                    { color: [139, 92, 246], label: 'General Rating' }, // Purple
                    { color: [249, 115, 22], label: 'Employee Rating' } // Orange
                ];
                
                legendItems.forEach((item, index) => {
                    // Draw colored square
                    pdf.setFillColor(item.color[0], item.color[1], item.color[2]);
                    pdf.rect(25, yPos + index * 8, 5, 5, 'F');
                    
                    // Draw label
                    pdf.text(item.label, 35, yPos + index * 8 + 4);
                });
                
                yPos += legendItems.length * 8 + 15;
            } else {
                pdf.text('No rating trend chart data available', 25, yPos + 5);
                yPos += 15;
            }
            
            // Add footer with logo
            if (yPos > pageHeight - 30) {
                pdf.addPage();
                yPos = 30;
            }
            
            // Add platform logo and text
            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(10);
            pdf.setTextColor(150, 150, 150);
            
            // Add logo with proper aspect ratio (321 x 121)
            const logoOriginalWidth = 321;
            const logoOriginalHeight = 121;
            const logoDisplayHeight = 8; // Fixed height
            const logoDisplayWidth = (logoOriginalWidth / logoOriginalHeight) * logoDisplayHeight; // Maintain aspect ratio
            const logoX = (pageWidth - logoDisplayWidth) / 2;
            
            pdf.addImage(Logo, 'PNG', logoX, pageHeight - 18, logoDisplayWidth, logoDisplayHeight);
            
            // Position the text below the logo
            const text = 'Generated by Custovra';
            const textWidth = pdf.getStringUnitWidth(text) * pdf.getFontSize() / pdf.internal.scaleFactor;
            const textX = (pageWidth - textWidth) / 2;
            
            pdf.text(text, textX, pageHeight - 5);
            
            // Save the PDF
            const fileName = `submissions-report-detailed-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
            pdf.save(fileName);
            
        } catch { 
            alert('Failed to generate PDF. Please try again.');
        } finally {
            setIsExporting(false);
        }
    }, [
        filteredSubmissions, 
        chartData, 
        ratingData, 
        selectedEmployee, 
        employees, 
        selectedForm, 
        forms, 
        filter, 
        getDateRangeDisplay, 
        setIsExporting
    ]);

    return (
        <Button 
            onClick={exportToPDF}
            disabled={isExporting || (!chartData.length && ratingData.ratingData.every(r => r.value === 0))}
            className="flex items-center gap-2 h-10 px-4 shrink-0 rounded-md font-semibold border 
               											border-[#16bf4c] text-[#16bf4c] dark:text-white bg-transparent 
               											hover:!text-[#000000] hover:border-lime-500 hover:bg-lime-500
               											transition-all duration-200 ease-in-out 
               											hover:shadow-[0_0_15px_rgba(22,191,76,0.4)] 
               											focus:outline-none focus:ring-2 focus:ring-lime-500"
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
    );
}

export default ReportExport;