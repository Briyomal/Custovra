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
			
			// Define color classes for different roles
			const getRoleClass = (roleName) => {
				switch (roleName) {
					case 'admin':
						return 'bg-red-500 hover:bg-red-600 text-white';
					case 'customer':
						return 'bg-blue-500 hover:bg-blue-600 text-white';
					default:
						return 'bg-gray-500 hover:bg-gray-600 text-white';
				}
			};
			
			return (
				<Badge className={getRoleClass(role)}>
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
			
			// Define gradient classes for different plans based on the project specification
			const getPlanGradientClass = (planName) => {
				switch (planName) {
					case 'Gold':
					case 'Diamond':
						return 'bg-gradient-to-r from-green-400 to-green-600 text-white';
					case 'Silver':
					case 'Platinum':
						return 'bg-gradient-to-r from-purple-400 to-purple-600 text-white';
					case 'Bronze':
						return 'bg-gradient-to-r from-blue-400 to-blue-600 text-white';
					default:
						return 'bg-gradient-to-r from-gray-400 to-gray-600 text-white';
				}
			};
			
			return (
				<Badge className={`${getPlanGradientClass(plan)} border`}>
					{plan || 'Free'}
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
		id: "subscription_status",
		header: "Status",
		accessorKey: "subscription_status",
		cell: ({ row }) => {
			const status = row.original.subscription_status;
			
			// Define color classes for different statuses
			const getStatusClass = (statusName) => {
				switch (statusName) {
					case 'active':
						return 'bg-green-600 hover:bg-green-700 text-white';
					case 'past_due':
						return 'bg-red-500 hover:bg-red-600 text-white';
					case 'canceled':
						return 'bg-gray-500 hover:bg-gray-600 text-white';
					case 'incomplete':
						return 'bg-yellow-500 hover:bg-yellow-600 text-white';
					case 'trialing':
						return 'bg-blue-400 hover:bg-blue-500 text-white';
					default:
						return 'bg-gray-200 hover:bg-gray-300 text-gray-800';
				}
			};
			
			const formattedStatus = status ? status.replace('_', ' ') : 'N/A';
			
			return (
				<Badge className={getStatusClass(status)}>
					{formattedStatus}
				</Badge>
			);
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
			
			// Define color classes based on count
			const getCountClass = (countValue) => {
				if (countValue > 50) {
					return 'bg-blue-100 hover:bg-blue-200 text-blue-800 dark:bg-blue-900 dark:hover:bg-blue-800 dark:text-blue-100';
				} else if (countValue > 20) {
					return 'bg-green-100 hover:bg-green-200 text-green-800 dark:bg-green-900 dark:hover:bg-green-800 dark:text-green-100';
				} else if (countValue > 5) {
					return 'bg-yellow-100 hover:bg-yellow-200 text-yellow-800 dark:bg-yellow-900 dark:hover:bg-yellow-800 dark:text-yellow-100';
				} else {
					return 'bg-gray-100 hover:bg-gray-200 text-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-100';
				}
			};
			
			return (
				<Badge className={`${getCountClass(count)} font-bold`}>
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
					Feedbacks
					<ArrowUpDown className="ml-2 h-4 w-4" />
				</Button>
			);
		},
		accessorKey: "submissionCount",
		cell: ({ row }) => {
			const count = row.original.submissionCount;
			
			// Define color classes based on count
			const getCountClass = (countValue) => {
				if (countValue > 500) {
					return 'bg-purple-100 hover:bg-purple-200 text-purple-800 dark:bg-purple-900 dark:hover:bg-purple-800 dark:text-purple-100';
				} else if (countValue > 100) {
					return 'bg-blue-100 hover:bg-blue-200 text-blue-800 dark:bg-blue-900 dark:hover:bg-blue-800 dark:text-blue-100';
				} else if (countValue > 20) {
					return 'bg-green-100 hover:bg-green-200 text-green-800 dark:bg-green-900 dark:hover:bg-green-800 dark:text-green-100';
				} else {
					return 'bg-gray-100 hover:bg-gray-200 text-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-100';
				}
			};
			
			return (
				<Badge className={`${getCountClass(count)} font-bold`}>
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