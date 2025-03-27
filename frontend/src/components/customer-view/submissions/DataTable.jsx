import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableRow, TableHeader, TableBody, TableCell, TableHead } from "@/components/ui/table";
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
import { FileDown } from "lucide-react";
import toast from "react-hot-toast";

const DataTable = ({ data, columns, setLocalSubmissions }) => {
	const [sorting, setSorting] = useState([{ id: "createdAt", desc: true }]);
	const [columnFilters, setColumnFilters] = useState([]);
	const [rowSelection, setRowSelection] = useState({});

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
		onRowSelectionChange: setRowSelection,
		state: {
			sorting,
			columnFilters,
			rowSelection,
		},
	});
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
			<div className="flex items-center justify-between py-4">
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
				<Button
					size="sm"
					onClick={exportToCSV}
					className="bg-green-600 text-white hover:bg-green-700"

				>
					<FileDown /> Export as CSV
				</Button>
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
			<div className="flex items-center justify-between">
				<div className="flex-1 text-sm text-muted-foreground">
					{table.getFilteredSelectedRowModel().rows.length} of{" "}
					{table.getFilteredRowModel().rows.length} row(s) selected.
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
