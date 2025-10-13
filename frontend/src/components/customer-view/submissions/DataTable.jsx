import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableRow, TableHeader, TableBody, TableCell, TableHead } from "@/components/ui/table";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

import {
	/*
  ColumnDef,
  SortingState,
	ColumnFiltersState,
  */
	flexRender,
	getCoreRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	useReactTable,
	getFilteredRowModel,
} from "@tanstack/react-table";
import { useMemo, useState } from "react";
import { FileDown, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import useSubmissionStore from "@/store/submissionStore";
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

const DataTable = ({ data, columns, setLocalSubmissions }) => {
	const [sorting, setSorting] = useState([{ id: "createdAt", desc: true }]);
	const [columnFilters, setColumnFilters] = useState([]);
	const [rowSelection, setRowSelection] = useState({});
	const [employeeFilter, setEmployeeFilter] = useState("");
	const [dateFrom, setDateFrom] = useState(null);
	const [dateTo, setDateTo] = useState(null);
	const [pagination, setPagination] = useState({
		pageIndex: 0,
		pageSize: 10,
	});
	const [confirmationText, setConfirmationText] = useState("");
	const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
	
	const isConfirmed = confirmationText.trim().toLowerCase() === "delete";

	const updateData = (newData) => {
		setLocalSubmissions(newData);
	};

	// Check if submissions contain employee data
	const hasEmployeeData = useMemo(() => {
		return data.some((row) => {
			// Check for employee field in submissions
			const submissions = row.submissions || {};
			return Object.keys(submissions).some(key => 
				key.toLowerCase().includes('employee') && submissions[key]
			);
		});
	}, [data]);

	// Bulk delete functionality
	const { deleteSubmission } = useSubmissionStore();
	
	// Get unique employee values for filter dropdown
	const uniqueEmployees = useMemo(() => {
		if (!hasEmployeeData) return [];
		
		const employees = new Set();
		data.forEach((row) => {
			const submissions = row.submissions || {};
			Object.keys(submissions).forEach(key => {
				if (key.toLowerCase().includes('employee') && submissions[key]) {
					employees.add(submissions[key]);
				}
			});
		});
		
		return Array.from(employees).sort();
	}, [data, hasEmployeeData]);

	// Apply employee filter to data
	const employeeFilteredData = useMemo(() => {
		if (!employeeFilter || employeeFilter === "all-employees" || !hasEmployeeData) return data;
		
		return data.filter((row) => {
			const submissions = row.submissions || {};
			return Object.keys(submissions).some(key => {
				if (key.toLowerCase().includes('employee') && submissions[key]) {
					return submissions[key] === employeeFilter;
				}
				return false;
			});
		});
	}, [data, employeeFilter, hasEmployeeData]);

	// Apply date range filter to data
	const dateFilteredData = useMemo(() => {
		if (!dateFrom && !dateTo) return employeeFilteredData;
		
		return employeeFilteredData.filter((row) => {
			const createdAt = new Date(row.createdAt);
			
			if (dateFrom && dateTo) {
				return createdAt >= dateFrom && createdAt <= dateTo;
			} else if (dateFrom) {
				return createdAt >= dateFrom;
			} else if (dateTo) {
				return createdAt <= dateTo;
			}
			
			return true;
		});
	}, [employeeFilteredData, dateFrom, dateTo]);

	// Filter out columns based on the presence of submissions.email
	const filteredColumns = useMemo(() => {
		const dataToUse = dateFilteredData;
		const hasEmail = dataToUse.some((row) => row.submissions?.email);
		const hasPhone = dataToUse.some((row) => row.submissions?.phone);
		const hasName = dataToUse.some((row) => row.submissions?.name);
		return columns.filter((column) => {
			if (column.accessorKey === "submissions.email") {
				return hasEmail;
			}
			if (column.accessorKey === "submissions.phone") {
				return hasPhone;
			}
			if (column.accessorKey === "submissions.name") {
				return hasName;
			}
			return true; // Keep other columns
		});
	}, [dateFilteredData, columns]);

	const table = useReactTable({
		data: dateFilteredData,
		columns: filteredColumns,
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		onSortingChange: setSorting,
		getSortedRowModel: getSortedRowModel(),
		onColumnFiltersChange: setColumnFilters,
		getFilteredRowModel: getFilteredRowModel(),
		onRowSelectionChange: setRowSelection,
		getRowId: (row) => row._id, // Add this to maintain selection across pages
		onPaginationChange: setPagination, // Use React Table's pagination state
		state: {
			sorting,
			columnFilters,
			rowSelection,
			pagination, // Use the pagination state directly
		},
	});
	
	const selectedRows = table.getFilteredSelectedRowModel().rows;
	const selectedCount = selectedRows.length;

	const handleBulkDelete = async () => {
		if (selectedCount === 0) {
			toast.error("No items selected for deletion.");
			return;
		}

		toast.promise(
			(async () => {
				const selectedIds = selectedRows.map(row => row.original._id);
				
				// Delete all selected submissions
				for (const id of selectedIds) {
					await deleteSubmission(id);
				}

				// Update local state to reflect deletions
				updateData((prevData) => 
					prevData.filter(item => !selectedIds.includes(item._id))
				);

				// Clear selection
				setRowSelection({});
				// Reset confirmation text
				setConfirmationText("");
			})(),
			{
				loading: `Deleting ${selectedCount} submission${selectedCount > 1 ? 's' : ''}...`,
				success: `${selectedCount} submission${selectedCount > 1 ? 's' : ''} deleted successfully!`,
				error: "Failed to delete submissions.",
			}
		);
	};
/*
	// CSV Export Utility Function
	const exportToCSV = () => {
		const visibleData = table.getRowModel().rows.map((row) =>
			row.getVisibleCells().reduce((acc, cell) => {
				acc[cell.column.id] = cell.getValue();
				return acc;
			}, {})
		);

		const csvRows = [];

		// Define headers and format them
		const headers = Object.keys(visibleData[0] || {})
			.filter((header) => header !== "select" && header !== "actions") // Exclude 'select' and 'actions'
			.map((header) => {
				switch (header) {
					case "name": return "Name";
					case "email": return "Email";
					case "phone": return "Phone";
					case "rating": return "Rating";
					case "createdAt": return "Submitted At";
					default: return header;
				}
			});

		// Add formatted headers to CSV
		csvRows.push(headers.join(","));

		// Add row values
		visibleData.forEach((row) => {
			const values = headers.map((header) => {
				const originalHeader = Object.keys(row).find((key) => {
					switch (header) {
						case "Name": return key === "name";
						case "Email": return key === "email";
						case "Phone": return key === "phone";
						case "Rating": return key === "rating";
						case "Submitted At": return key === "createdAt";
						default: return key === header;
					}
				});

				if (originalHeader === "createdAt" && row[originalHeader]) {
					// Format 'createdAt' value
					return JSON.stringify(
						format(new Date(row[originalHeader]), "dd MMMM yyyy 'at' hh:mm a")
					);
				}

				return JSON.stringify(row[originalHeader] || "");
			});

			csvRows.push(values.join(","));
		});

		// Create and download the CSV file
		const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
		const url = window.URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.setAttribute("hidden", "");
		a.setAttribute("href", url);
		a.setAttribute("download", "table-data.csv");
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
	};
*/
const exportToCSV = () => {
	const selectedData = table.getSelectedRowModel().rows.map((row) =>
		row.getVisibleCells().reduce((acc, cell) => {
			acc[cell.column.id] = cell.getValue();
			return acc;
		}, {})
	);

	if (selectedData.length === 0) {
		toast.error("No rows selected for export.");
		return;
	}

	const csvRows = [];

	// Define headers and format them
	const headers = Object.keys(selectedData[0] || {})
		.filter((header) => header !== "select" && header !== "actions") // Exclude 'select' and 'actions'
		.map((header) => {
			switch (header) {
				case "name":
					return "Name";
				case "email":
					return "Email";
				case "phone":
					return "Phone";
				case "rating":
					return "Rating";
				case "createdAt":
					return "Submitted At";
				default:
					return header;
			}
		});

	// Add formatted headers to CSV
	csvRows.push(headers.join(","));

	// Add row values
	selectedData.forEach((row) => {
		const values = headers.map((header) => {
			const originalHeader = Object.keys(row).find((key) => {
				switch (header) {
					case "Name":
						return key === "name";
					case "Email":
						return key === "email";
					case "Phone":
						return key === "phone";
					case "Rating":
						return key === "rating";
					case "Submitted At":
						return key === "createdAt";
					default:
						return key === header;
				}
			});

			if (originalHeader === "createdAt" && row[originalHeader]) {
				// Format 'createdAt' value
				return JSON.stringify(
					format(new Date(row[originalHeader]), "dd MMMM yyyy 'at' hh:mm a")
				);
			}

			return JSON.stringify(row[originalHeader] || "");
		});

		csvRows.push(values.join(","));
	});

	// Create and download the CSV file
	const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
	const url = window.URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.setAttribute("hidden", "");
	a.setAttribute("href", url);
	a.setAttribute("download", "selected-data.csv");
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
};

	return (
		<div>
			<div className="flex items-center justify-between py-4 gap-2">
				<div className="flex items-center gap-2">
					{data.some((row) => row.submissions?.email) ? (
						<Input
							placeholder="Filter emails..."
							value={table.getColumn("email")?.getFilterValue() ?? ""}
							onChange={(event) =>
								table.getColumn("email")?.setFilterValue(event.target.value)
							}
							className="max-w-sm"
						/>
					) : data.some((row) => row.submissions?.phone) ? (
						<Input
							placeholder="Filter phones..."
							value={table.getColumn("phone")?.getFilterValue() ?? ""}
							onChange={(event) =>
								table.getColumn("phone")?.setFilterValue(event.target.value)
							}
							className="max-w-sm"
						/>
					) : data.some((row) => row.submissions?.name) ? (
						<Input
							placeholder="Filter names..."
							value={table.getColumn("name")?.getFilterValue() ?? ""}
							onChange={(event) =>
								table.getColumn("name")?.setFilterValue(event.target.value)
							}
							className="max-w-sm"
						/>
					) : null}
					
					{hasEmployeeData && (
						<Select value={employeeFilter} onValueChange={(value) => setEmployeeFilter(value === "all-employees" ? "" : value)}>
							<SelectTrigger className="w-[200px]">
								<SelectValue placeholder="Filter by employee" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all-employees">All Employees</SelectItem>
								{uniqueEmployees.map((employee) => (
									<SelectItem key={employee} value={employee}>
										{employee}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					)}
					
					{/* Date Range Filter */}
					<div className="flex items-center gap-2">
						<Popover>
							<PopoverTrigger asChild>
								<Button
									variant="outline"
									size="sm"
									className={cn(
										"w-[140px] justify-start text-left font-normal",
										!dateFrom && "text-muted-foreground"
									)}
								>
									<CalendarIcon className="mr-2 h-4 w-4" />
									{dateFrom ? format(dateFrom, "dd/MM/yyyy") : "From date"}
								</Button>
							</PopoverTrigger>
							<PopoverContent className="w-auto p-0" align="start">
								<Calendar
									mode="single"
									selected={dateFrom}
									onSelect={setDateFrom}
									initialFocus
								/>
							</PopoverContent>
						</Popover>
						
						<Popover>
							<PopoverTrigger asChild>
								<Button
									variant="outline"
									size="sm"
									className={cn(
										"w-[140px] justify-start text-left font-normal",
										!dateTo && "text-muted-foreground"
									)}
								>
									<CalendarIcon className="mr-2 h-4 w-4" />
									{dateTo ? format(dateTo, "dd/MM/yyyy") : "To date"}
								</Button>
							</PopoverTrigger>
							<PopoverContent className="w-auto p-0" align="start">
								<Calendar
									mode="single"
									selected={dateTo}
									onSelect={setDateTo}
									initialFocus
								/>
							</PopoverContent>
						</Popover>
						
						{(dateFrom || dateTo) && (
							<Button
								variant="outline"
								size="sm"
								onClick={() => {
									setDateFrom(null);
									setDateTo(null);
								}}
								className="px-2"
							>
								Clear
							</Button>
						)}
					</div>
				</div>
				<div className="flex items-center gap-2">
					{selectedCount > 0 && (
						<AlertDialog open={isBulkDeleteDialogOpen} onOpenChange={setIsBulkDeleteDialogOpen}>
							<AlertDialogTrigger asChild>
								<Button
									variant="destructive"
									size="sm"
									className="gap-2"
								>
									<Trash2 className="h-4 w-4" />
									Delete {selectedCount} item{selectedCount > 1 ? 's' : ''}
								</Button>
							</AlertDialogTrigger>
							<AlertDialogContent>
								<AlertDialogHeader>
									<AlertDialogTitle>Confirm Bulk Deletion</AlertDialogTitle>
									<AlertDialogDescription>
										Are you sure you want to delete {selectedCount} selected submission{selectedCount > 1 ? 's' : ''}? This action cannot be undone.
									</AlertDialogDescription>
								</AlertDialogHeader>
								<div className="my-4">
									<label className="text-sm mb-1 block">
										To confirm, type <span className="font-bold text-destructive">delete</span> below:
									</label>
									<Input
										type="text"
										placeholder="Type 'delete' to confirm"
										value={confirmationText}
										onChange={(e) => setConfirmationText(e.target.value)}
									/>
								</div>
								<AlertDialogFooter>
									<Button variant="outline" onClick={() => {
										setConfirmationText("");
										setIsBulkDeleteDialogOpen(false);
									}}>
										Cancel
									</Button>
									<Button 
										variant="destructive" 
										onClick={handleBulkDelete}
										disabled={!isConfirmed}
									>
										Delete {selectedCount} item{selectedCount > 1 ? 's' : ''}
									</Button>
								</AlertDialogFooter>
							</AlertDialogContent>
						</AlertDialog>
					)}
					<Button
						size="sm"
						onClick={exportToCSV}
						className="bg-green-600 text-white hover:bg-green-700"
					>
						<FileDown /> Export as CSV
					</Button>
				</div>
			</div>
			<div className="rounded-md border flex">
				<ScrollArea className="w-1 flex-1" orientation="horizontal">
						<Table className="relative w-full">
							<TableHeader className="bg-white dark:bg-slate-900">
								{table.getHeaderGroups().map((headerGroup) => (
									<TableRow key={headerGroup.id}>
										{headerGroup.headers.map((header) => {
											const isActionsColumn = header.column.id === 'actions';
											return (
												<TableHead 
													key={header.id} 
													className={isActionsColumn ? 'sticky right-0 bg-white dark:bg-slate-900 shadow-[-4px_0_6px_-1px_rgba(0,0,0,0.1)] z-10 min-w-[100px]' : 'whitespace-nowrap px-4 min-w-[120px]'}
												>
													{header.isPlaceholder ? null : flexRender(header.column.columnDef.header || header.column.columnDef.Header, header.getContext())}
												</TableHead>
											);
										})}
									</TableRow>
								))}
							</TableHeader>
							<TableBody>
								{table.getPaginationRowModel().rows.map((row) => (
									<TableRow key={row.id}>
										{row.getVisibleCells().map((cell) => {
											const isActionsColumn = cell.column.id === 'actions';
											return (
												<TableCell 
													key={cell.id}
													className={isActionsColumn ? 'sticky right-0 bg-white dark:bg-slate-900 shadow-[-4px_0_6px_-1px_rgba(0,0,0,0.1)] z-10 min-w-[100px]' : 'whitespace-nowrap px-4 min-w-[120px]'}
												>
													{flexRender(cell.column.columnDef.Cell || cell.column.columnDef.cell, { ...cell.getContext(), updateData })}
												</TableCell>
											);
										})}
									</TableRow>
								))}
							</TableBody>
						</Table>
					<ScrollBar orientation="horizontal" />
				</ScrollArea>
			</div>
			<div className="flex items-center justify-between mt-2">
				<div className="flex items-center gap-4">
					<div className="flex-1 text-sm text-muted-foreground">
						{table.getFilteredSelectedRowModel().rows.length} of{" "}
						{table.getFilteredRowModel().rows.length} row(s) selected.
					</div>
					<div className="flex items-center gap-2">
						<span className="text-sm text-muted-foreground">Rows per page:</span>
						<Select value={pagination.pageSize.toString()} onValueChange={(value) => {
							const newPageSize = Number(value);
							table.setPageSize(newPageSize);
						}}>
							<SelectTrigger className="w-[70px]">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="10">10</SelectItem>
								<SelectItem value="25">25</SelectItem>
								<SelectItem value="50">50</SelectItem>
								<SelectItem value="100">100</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</div>
				<div className="flex items-center gap-2">
					<div className="text-sm text-muted-foreground">
						Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
					</div>
					<div className="flex items-center space-x-2">
						<Button 
							variant="outline" 
							size="sm" 
							onClick={() => table.setPageIndex(0)} 
							disabled={!table.getCanPreviousPage()}
						>
							«
						</Button>
						<Button 
							variant="outline" 
							size="sm" 
							onClick={() => table.previousPage()} 
							disabled={!table.getCanPreviousPage()}
						>
							‹
						</Button>
						
						{/* Page Numbers */}
						{(() => {
							const currentPage = table.getState().pagination.pageIndex;
							const totalPages = table.getPageCount();
							const pages = [];
							
							// Show max 5 page numbers
							let startPage = Math.max(0, currentPage - 2);
							let endPage = Math.min(totalPages - 1, startPage + 4);
							
							// Adjust if we're near the end
							if (endPage - startPage < 4) {
								startPage = Math.max(0, endPage - 4);
							}
							
							for (let i = startPage; i <= endPage; i++) {
								pages.push(
									<Button
										key={i}
										variant={currentPage === i ? "default" : "outline"}
										size="sm"
										onClick={() => table.setPageIndex(i)}
										className="w-8 h-8 p-0"
									>
										{i + 1}
									</Button>
								);
							}
							
							return pages;
						})()}
						
						<Button 
							variant="outline" 
							size="sm" 
							onClick={() => table.nextPage()} 
							disabled={!table.getCanNextPage()}
						>
							›
						</Button>
						<Button 
							variant="outline" 
							size="sm" 
							onClick={() => table.setPageIndex(table.getPageCount() - 1)} 
							disabled={!table.getCanNextPage()}
						>
							»
						</Button>
					</div>
					</div>
			</div>
		</div>
	);
};

export default DataTable;
