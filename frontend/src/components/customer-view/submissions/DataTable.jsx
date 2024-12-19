import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableRow, TableHeader, TableBody, TableCell, TableHead } from "@/components/ui/Table";

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

const DataTable = ({ data, columns, setLocalSubmissions }) => {
	const [sorting, setSorting] = useState([{ id: "createdAt", desc: true }]);
	const [columnFilters, setColumnFilters] = useState([]);

	const updateData = (newData) => {
		setLocalSubmissions(newData);
	};

	// Filter out columns based on the presence of submissions.email
	const filteredColumns = useMemo(() => {
		const hasEmail = data.some((row) => row.submissions?.email);
		const hasPhone = data.some((row) => row.submissions?.phone);
		const hasName = data.some((row) => row.submissions?.name);
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
	}, [data, columns]);

	const table = useReactTable({
		data,
		columns: filteredColumns,
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
<div className="flex items-center py-4">
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
</div>


			<div className="rounded-md border">
				<Table>
					<TableHeader>
						{table.getHeaderGroups().map((headerGroup) => (
							<TableRow key={headerGroup.id}>
								{headerGroup.headers.map((header) => (
									<TableHead key={header.id}>{header.isPlaceholder ? null : flexRender(header.column.columnDef.header || header.column.columnDef.Header, header.getContext())}</TableHead>
								))}
							</TableRow>
						))}
					</TableHeader>
					<TableBody>
						{table.getRowModel().rows.map((row) => (
							<TableRow key={row.id}>
								{row.getVisibleCells().map((cell) => (
									<TableCell key={cell.id}>{flexRender(cell.column.columnDef.Cell || cell.column.columnDef.cell, { ...cell.getContext(), updateData })}</TableCell>
								))}
							</TableRow>
						))}
					</TableBody>
				</Table>
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
	);
};

export default DataTable;
