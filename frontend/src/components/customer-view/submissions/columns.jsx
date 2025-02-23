import { MoreHorizontal, ArrowUpDown, Star, StarHalf, Trash2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogContent, AlertDialogFooter, AlertDialogHeader } from "@/components/ui/alert-dialog";
import { useState } from "react";
import toast from "react-hot-toast";
import useSubmissionStore from "@/store/submissionStore";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox"

export const columns = [
	{
		id: "select",
		header: ({ table }) => (
			<Checkbox
				checked={
					table.getIsAllPageRowsSelected() ||
					(table.getIsSomePageRowsSelected() && "indeterminate")
				}
				onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
				aria-label="Select all"
			/>
		),

		enableSorting: false,
		enableHiding: false,
		cell: ({ row }) => (
			<Checkbox
				checked={row.getIsSelected()}
				onCheckedChange={(value) => row.toggleSelected(!!value)}
				aria-label="Select row"
			/>
		),

	},
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
		accessorKey: "submissions.name",
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
		accessorKey: "submissions.email",
		enableSorting: true, // Enable sorting for the email column
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
		accessorKey: "submissions.phone",
		enableSorting: true, // Enable sorting for the email column
	},
	{
		id: "rating",
		header: ({ column }) => {
			return (
				<Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
					Rating
					<ArrowUpDown className="ml-2 h-4 w-4" />
				</Button>
			);
		},
		accessorKey: "submissions.rating",
		accessorFn: (row) => parseFloat(row.submissions?.rating) || 0, // Ensure 0 is treated as a valid number
		enableSorting: true,
		cell: ({ row }) => {
			const rating = parseFloat(row.original.submissions?.rating) || 0;
			const maxStars = 5;

			return (
				<div className="flex items-center">
					{[...Array(maxStars)].map((_, index) => {
						if (index + 1 <= rating) {
							return <Star fill="yellow" key={index} className="h-4 w-4 text-yellow-500" />;
						} else if (index < rating) {
							return <StarHalf key={index} className="h-4 w-4 text-yellow-500" />;
						} else {
							return <Star key={index} className="h-4 w-4 text-gray-300" />;
						}
					})}
				</div>
			);
		},
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
		cell: ({ row }) => {
			const date = new Date(row.original.createdAt);
			const formattedDate = date.toLocaleString("en-GB", {
				day: "2-digit",
				month: "long", // Full month name
				year: "numeric",
				hour: "2-digit",
				minute: "2-digit",
				hour12: true,
			});

			return <span>{formattedDate}</span>;
		},
	},

	{
		id: "actions",
		header: "Actions",
		accessorKey: "actions",
		Cell: ({ row, updateData }) => {
			const { deleteSubmission } = useSubmissionStore();
			const [isDialogOpen, setIsDialogOpen] = useState(false);
			const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

			const confirmDelete = async () => {
				setIsDialogOpen(false); // Close the dialog

				toast.promise(
					(async () => {
						await deleteSubmission(row.original._id); // Call the delete function

						// Update local state to reflect deletion
						updateData((prevData) => prevData.filter((item) => item._id !== row.original._id));
					})(),
					{
						loading: "Deleting submission...",
						success: "Submission deleted successfully!",
						error: "Failed to delete submission.",
					}
				);
			};
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
							<DropdownMenuItem onClick={() => navigator.clipboard.writeText(row.original._id)}>Copy Submission ID</DropdownMenuItem>
							<DropdownMenuItem className="cursor-pointer" onClick={() => setIsViewDialogOpen(true)}>
								<Eye className="h-4 w-4" />
								View
							</DropdownMenuItem>
							<DropdownMenuSeparator />
							<DropdownMenuItem className="cursor-pointer text-red-500 dark:text-red-500 hover:text-white  dark:hover:text-white hover:bg-red-500 dark:hover:bg-red-700" onClick={() => setIsDialogOpen(true)}>
								<Trash2 className="h-4 w-4" />
								Delete
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
					<AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
						<AlertDialogContent>
							<AlertDialogHeader>
								<h3>Confirm Deletion</h3>
								<p>Are you sure you want to delete this submission? This action cannot be undone.</p>
							</AlertDialogHeader>
							<AlertDialogFooter>
								<Button variant="outline" onClick={() => setIsDialogOpen(false)}>
									Cancel
								</Button>
								<Button variant="destructive" onClick={confirmDelete}>
									<Trash2 />
									Delete
								</Button>
							</AlertDialogFooter>
						</AlertDialogContent>
					</AlertDialog>

					<Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
						<DialogContent>
							<DialogHeader>
								<DialogTitle>Submission Details</DialogTitle>
							</DialogHeader>
							<Separator />
							<div className="flex flex-col gap-3">
								{Object.entries(row.original.submissions).map(([key, value]) => (
									<div key={key} className="flex items-center gap-2">
										<span className="font-semibold">{key.charAt(0).toUpperCase() + key.slice(1)}:</span>
										{key === "rating" ? (
											<div className="flex items-center">
												{[...Array(5)].map((_, index) => {
													if (index + 1 <= value) {
														return <Star fill="yellow" key={index} className="h-4 w-4 text-yellow-500" />;
													} else {
														return <Star key={index} className="h-4 w-4 text-gray-300" />;
													}
												})}
											</div>
										) : (
											<span>{value}</span>
										)}
									</div>
								))}
							</div>
							<DialogFooter>
								<Button variant="outline" onClick={() => setIsDialogOpen(false)}>
									Cancel
								</Button>
							</DialogFooter>
						</DialogContent>
					</Dialog>
				</div>
			);
		},
	},
];
