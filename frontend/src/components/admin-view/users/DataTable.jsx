import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableRow, TableHeader, TableBody, TableCell, TableHead } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

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

const DataTable = ({ data, columns }) => {
	const [sorting, setSorting] = useState([]);
	const [columnFilters, setColumnFilters] = useState([]);
	const [pagination, setPagination] = useState({
		pageIndex: 0,
		pageSize: 10,
	});
	const [planFilter, setPlanFilter] = useState("__all__");
	const [statusFilter, setStatusFilter] = useState("__all__");

	// Get unique plan values for filter dropdown
	const uniquePlans = useMemo(() => {
		const plans = new Set();
		data.forEach((row) => {
			if (row.subscription_plan) {
				plans.add(row.subscription_plan);
			}
		});
		return Array.from(plans).sort();
	}, [data]);

	// Apply filters to data
	const filteredData = useMemo(() => {
		let filtered = [...data];
		
		// Apply plan filter
		if (planFilter && planFilter !== "__all__") {
			filtered = filtered.filter((row) => 
				row.subscription_plan === planFilter
			);
		}
		
		// Apply status filter
		if (statusFilter && statusFilter !== "__all__") {
			filtered = filtered.filter((row) => 
				row.subscription_status === statusFilter
			);
		}
		
		return filtered;
	}, [data, planFilter, statusFilter]);

	const table = useReactTable({
		data: filteredData,
		columns,
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		onSortingChange: setSorting,
		getSortedRowModel: getSortedRowModel(),
		onColumnFiltersChange: setColumnFilters,
		getFilteredRowModel: getFilteredRowModel(),
		onPaginationChange: setPagination,
		state: {
			sorting,
			columnFilters,
			pagination,
		},
	});
	
	return (
		<div>
			<div className="flex flex-col md:flex-row items-center justify-between py-4 gap-2">
				<div className="flex flex-col md:flex-row items-center gap-2 w-full md:w-auto">
					<Input 
						placeholder="Filter emails..."
						value={table.getColumn("email")?.getFilterValue() ?? ""}
						onChange={(event) => table.getColumn("email")?.setFilterValue(event.target.value)}
						className="max-w-sm"
					/>
					<Select value={planFilter} onValueChange={setPlanFilter}>
						<SelectTrigger className="w-[180px]">
							<SelectValue placeholder="Filter by plan" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="__all__">All Plans</SelectItem>
							{uniquePlans.map((plan) => (
								<SelectItem key={plan} value={plan}>
									{plan}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					<Select value={statusFilter} onValueChange={setStatusFilter}>
						<SelectTrigger className="w-[180px]">
							<SelectValue placeholder="Filter by status" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="__all__">All Statuses</SelectItem>
							<SelectItem value="active">Active</SelectItem>
							<SelectItem value="past_due">Past Due</SelectItem>
							<SelectItem value="canceled">Canceled</SelectItem>
							<SelectItem value="incomplete">Incomplete</SelectItem>
							<SelectItem value="trialing">Trialing</SelectItem>
						</SelectContent>
					</Select>
					{(planFilter !== "__all__" || statusFilter !== "__all__") && (
						<Button
							variant="outline"
							size="sm"
							onClick={() => {
								setPlanFilter("__all__");
								setStatusFilter("__all__");
							}}
							className="px-2"
						>
							Clear Filters
						</Button>
					)}
				</div>
			</div>
			<div className="rounded-md border flex">
				<ScrollArea className="w-1 flex-1" orientation="horizontal">
					<Table className="relative w-full">
						<TableHeader className="bg-white dark:bg-slate-900">
							{table.getHeaderGroups().map((headerGroup) => (
								<TableRow key={headerGroup.id}>
									{headerGroup.headers.map((header) => (
										<TableHead key={header.id} className="whitespace-nowrap px-4 min-w-[120px]">
											{header.isPlaceholder ? null : flexRender(header.column.columnDef.header || header.column.columnDef.Header, header.getContext())}
										</TableHead>
									))}
								</TableRow>
							))}
						</TableHeader>
						<TableBody>
							{table.getRowModel().rows.map((row) => (
								<TableRow key={row.id}>
									{row.getVisibleCells().map((cell) => (
										<TableCell key={cell.id} className="whitespace-nowrap px-4 min-w-[120px]">
											{flexRender(cell.column.columnDef.Cell || cell.column.columnDef.cell, cell.getContext())}
										</TableCell>
									))}
								</TableRow>
							))}
						</TableBody>
					</Table>
					<ScrollBar orientation="horizontal" />
				</ScrollArea>
			</div>
			<div className="flex items-center justify-between mt-2">
				<div className="flex items-center gap-4">
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