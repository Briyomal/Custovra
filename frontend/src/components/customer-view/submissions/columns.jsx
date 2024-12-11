import { MoreHorizontal, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export const columns = [
	{
		id: "name",
		header: ({ column }) => {
			return (
				<Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
					Form Name
					<ArrowUpDown className="ml-2 h-4 w-4" />
				</Button>
			);
		},
		accessorKey: "form_name",
		enableSorting: true, // Enable sorting for the name column
	},
	{
		id: "email",
		header: ({ column }) => {
			return (
				<Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
					Email
					<ArrowUpDown className="ml-2 h-4 w-4" />
				</Button>
			);
		},
		accessorKey: "email",
		enableSorting: true, // Enable sorting for the email column
	},
	{
		id: "createdAt",
		header: ({ column }) => {
			return (
				<Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
                    Submitted At
					<ArrowUpDown className="ml-2 h-4 w-4" />
				</Button>
			);
		},
		accessorKey: "createdAt", 
        enableSorting: true,
	},
	{
		id: "actions",
		header: "Actions",
		accessorKey: "actions",
		Cell: ({ row }) => (
			<div>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button variant="ghost" className="h-8 w-8 p-0">
							<span className="sr-only">Open menu</span>
							<MoreHorizontal className="h-4 w-4" />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						<DropdownMenuLabel>Actions</DropdownMenuLabel>
						<DropdownMenuItem onClick={() => navigator.clipboard.writeText(row.original.email)}>Copy User Email</DropdownMenuItem>
						<DropdownMenuSeparator />
						<DropdownMenuItem>View User</DropdownMenuItem>
						<DropdownMenuItem>Edit User</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
		),
	},
];
