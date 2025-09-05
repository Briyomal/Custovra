import { MoreHorizontal, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { useState } from "react";
import { ViewUserDialog } from "./ViewUserDialog";
import { EditUserDialog } from "./EditUserDialog";
import { DeleteUserDialog } from "./DeleteUserDialog";

// We'll pass the refresh function through props
export const columns = (refreshUsers) => [
	{
		id: "name",
		header: ({ column }) => {
			return (
				<Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
					Name
					<ArrowUpDown className="ml-2 h-4 w-4" />
				</Button>
			);
		},
		accessorKey: "name",
		enableSorting: true,
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
		enableSorting: true,
	},
	{
		id: "phone",
		header: ({ column }) => {
			return (
				<Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
					Phone
					<ArrowUpDown className="ml-2 h-4 w-4" />
				</Button>
			);
		},
		accessorKey: "phone",
		cell: ({ row }) => {
			const phone = row.original.phone;
			return phone && phone !== 'N/A' ? phone : 'N/A';
		}
	},
	{
		id: "role",
		header: ({ column }) => {
			return (
				<Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
					Role
					<ArrowUpDown className="ml-2 h-4 w-4" />
				</Button>
			);
		},
		accessorKey: "role",
		cell: ({ row }) => {
			const role = row.original.role;
			return (
				<Badge variant={role === "admin" ? "default" : "secondary"}>
					{role}
				</Badge>
			);
		}
	},
	{
		id: "subscription_plan",
		header: ({ column }) => {
			return (
				<Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
					Current Plan
					<ArrowUpDown className="ml-2 h-4 w-4" />
				</Button>
			);
		},
		accessorKey: "subscription_plan",
		cell: ({ row }) => {
			const plan = row.original.subscription_plan;
			const status = row.original.subscription_status;
			
			let variant = "secondary";
			if (status === "active") variant = "default";
			else if (status === "past_due") variant = "destructive";
			
			return (
				<Badge variant={variant}>
					{plan}
				</Badge>
			);
		}
	},
	{
		id: "subscription_expiry",
		header: "Next Due Date",
		accessorKey: "subscription_expiry",
		cell: ({ row }) => {
			const expiryDate = row.original.subscription_expiry;
			return expiryDate ? format(new Date(expiryDate), "MMM dd, yyyy") : "N/A";
		}
	},
	{
		id: "formCount",
		header: ({ column }) => {
			return (
				<Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
					Forms
					<ArrowUpDown className="ml-2 h-4 w-4" />
				</Button>
			);
		},
		accessorKey: "formCount",
		cell: ({ row }) => {
			const count = row.original.formCount;
			return (
				<Badge variant="outline">
					{count}
				</Badge>
			);
		}
	},
	{
		id: "submissionCount",
		header: ({ column }) => {
			return (
				<Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
					Submissions
					<ArrowUpDown className="ml-2 h-4 w-4" />
				</Button>
			);
		},
		accessorKey: "submissionCount",
		cell: ({ row }) => {
			const count = row.original.submissionCount;
			return (
				<Badge variant="outline">
					{count}
				</Badge>
			);
		}
	},
	{
		id: "actions",
		header: "Actions",
		accessorKey: "actions",
		Cell: ({ row }) => {
			const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
			const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
			const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
			
			return (
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
							<DropdownMenuItem onClick={() => setIsViewDialogOpen(true)}>View User</DropdownMenuItem>
							<DropdownMenuItem onClick={() => setIsEditDialogOpen(true)}>Edit User</DropdownMenuItem>
							<DropdownMenuSeparator />
							<DropdownMenuItem 
								onClick={() => setIsDeleteDialogOpen(true)}
								className="text-red-600 focus:text-red-600 focus:bg-red-50"
							>
								Delete User
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
					<ViewUserDialog 
						user={row.original} 
						open={isViewDialogOpen} 
						onOpenChange={setIsViewDialogOpen} 
					/>
					<EditUserDialog 
						user={row.original} 
						open={isEditDialogOpen} 
						onOpenChange={setIsEditDialogOpen} 
						onUserUpdated={refreshUsers}
					/>
					<DeleteUserDialog 
						user={row.original} 
						open={isDeleteDialogOpen} 
						onOpenChange={setIsDeleteDialogOpen} 
						onUserDeleted={refreshUsers}
					/>
				</div>
			);
		},
	},
];