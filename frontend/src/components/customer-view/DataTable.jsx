import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableRow, TableHeader, TableBody, TableCell, TableHead } from "@/components/ui/table";
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
import { useState } from "react";

const DataTable = ({ data, columns, setForms }) => {
	const [sorting, setSorting] = useState([
		{ id: "created_at", desc: true },
	]);
	const [columnFilters, setColumnFilters] = useState([]);


	const updateData = (newData) => {
		setForms(newData);
	};


	const table = useReactTable({
		data,
		columns,
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		onSortingChange: setSorting,
		getSortedRowModel: getSortedRowModel(),
		onColumnFiltersChange: setColumnFilters,
		getFilteredRowModel: getFilteredRowModel(),
		state: {
			sorting,
			columnFilters,
		},
	});

	return (
		<div>
			<div className="flex flex-col gap-4">
				<div className="flex items-center py-4">
					<Input placeholder="Filter form name..."
						value={table.getColumn("form_name")?.getFilterValue() ?? ""}
						onChange={(event) => table.getColumn("form_name")?.setFilterValue(event.target.value)}
						className="max-w-sm" />
				</div>
				<div className="rounded-md border flex">
					<ScrollArea className="w-1 flex-1" orientation="horizontal">
						<Table className="relative w-full">
							<TableHeader>
								{table.getHeaderGroups().map((headerGroup) => (
									<TableRow key={headerGroup.id}>
										{headerGroup.headers.map((header) => (
											<TableHead key={header.id} className="p-0">
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
												{flexRender(cell.column.columnDef.Cell || cell.column.columnDef.cell, { ...cell.getContext(), updateData })}
											</TableCell>
										))}
									</TableRow>
								))}
							</TableBody>
						</Table>
						<ScrollBar orientation="horizontal" />
					</ScrollArea>
				</div>
				<div className="flex items-center justify-end space-x-2 py-4">
					<Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
						Previous
					</Button>
					<Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
						Next
					</Button>
				</div>
			</div>
		</div>
	);
};

export default DataTable;