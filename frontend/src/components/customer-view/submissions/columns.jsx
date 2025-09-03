import { MoreHorizontal, ArrowUpDown, Star, StarHalf, Trash2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogContent, AlertDialogFooter, AlertDialogHeader } from "@/components/ui/alert-dialog";
import { useState } from "react";
import toast from "react-hot-toast";
import useSubmissionStore from "@/store/submissionStore";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox"

// Generate dynamic columns based on submission data
export const generateDynamicColumns = (submissions) => {
	if (!submissions || submissions.length === 0) {
		return staticColumns;
	}

	// Get all possible field names from all submissions
	const allFields = new Set();
	submissions.forEach(submission => {
		if (submission.submissions && typeof submission.submissions === 'object') {
			Object.keys(submission.submissions)
				.filter(key => key !== 'cf-turnstile-response' && key !== 'captchaToken')
				.forEach(key => allFields.add(key));
		}
	});

	// Create columns for each field
	const dynamicColumns = Array.from(allFields).map(fieldName => {
		if (fieldName === 'rating') {
			return {
				id: "rating",
				header: ({ column }) => (
					<Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
						Rating
						<ArrowUpDown className="ml-2 h-4 w-4" />
					</Button>
				),
				accessorKey: "submissions.rating",
				accessorFn: (row) => parseFloat(row.submissions?.rating) || 0,
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
			};
		} else {
			return {
				id: fieldName,
				header: ({ column }) => (
					<Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
						{fieldName.charAt(0).toUpperCase() + fieldName.slice(1)}
						<ArrowUpDown className="ml-2 h-4 w-4" />
					</Button>
				),
				accessorKey: `submissions.${fieldName}`,
				enableSorting: true,
				cell: ({ row }) => {
					const value = row.original.submissions?.[fieldName];
					return <span>{value || 'N/A'}</span>;
				},
			};
		}
	});

	// Combine with static columns (select, timestamp, actions)
	return [
		staticColumns[0], // select checkbox
		...dynamicColumns,
		staticColumns[staticColumns.length - 2], // createdAt
		staticColumns[staticColumns.length - 1], // actions
	];
};

// Static columns that don't depend on submission data
const staticColumns = [
	{
		id: "select",
		header: ({ table }) => {
			const totalRowCount = table.getFilteredRowModel().rows.length;
			const selectedRowCount = table.getFilteredSelectedRowModel().rows.length;
			const isAllSelected = totalRowCount > 0 && selectedRowCount === totalRowCount;
			const isIndeterminate = selectedRowCount > 0 && selectedRowCount < totalRowCount;
			
			return (
				<Checkbox
					checked={isAllSelected}
					ref={(checkbox) => {
						if (checkbox) checkbox.indeterminate = isIndeterminate;
					}}
					onCheckedChange={(value) => {
						if (value) {
							// Select all filtered rows
							table.getFilteredRowModel().rows.forEach(row => row.toggleSelected(true));
						} else {
							// Deselect all rows
							table.getFilteredRowModel().rows.forEach(row => row.toggleSelected(false));
						}
					}}
					aria-label="Select all"
				/>
			);
		},

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
					<DropdownMenu modal={false}>
						<DropdownMenuTrigger asChild>
							<Button variant="ghost" className="h-8 w-8 p-0">
								<span className="sr-only">Open menu</span>
								<MoreHorizontal className="h-4 w-4" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" side="left" className="w-40" sideOffset={8}>
							<DropdownMenuLabel>Actions</DropdownMenuLabel>
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
							<AlertDialogFooter className="flex flex-row md:flex-none space-x-2">
								<Button className="w-1/2 md:w-auto mt-2" variant="outline" onClick={() => setIsDialogOpen(false)}>
									Cancel
								</Button>
								<Button className="w-1/2 md:w-auto mt-2" variant="destructive" onClick={confirmDelete}>
									<Trash2 />
									Delete
								</Button>
							</AlertDialogFooter>
						</AlertDialogContent>
					</AlertDialog>

					<Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
						<DialogContent className="max-w-2xl">
							<DialogHeader className="text-left">
								<DialogTitle>Submission Details</DialogTitle>
								<DialogDescription>View the details of this submission.</DialogDescription>
							</DialogHeader> 
							<Separator />
							<div className="flex flex-col gap-3 max-h-96 overflow-y-auto">
								{Object.entries(row.original.submissions || {})
									.filter(([key]) => key !== 'cf-turnstile-response' && key !== 'captchaToken') // Filter out unnecessary fields
									.map(([key, value]) => (
									<div key={key} className="flex items-start gap-2 p-2 bg-slate-50 dark:bg-slate-800 rounded">
										<span className="font-semibold min-w-32">{key.charAt(0).toUpperCase() + key.slice(1)}:</span>
										{key === "rating" ? (
											<div className="flex items-center">
												{[...Array(5)].map((_, index) => {
													if (index + 1 <= value) {
														return <Star fill="yellow" key={index} className="h-4 w-4 text-yellow-500" />;
													} else {
														return <Star key={index} className="h-4 w-4 text-gray-300" />;
													}
												})}
												<span className="ml-2 text-sm text-gray-600">{value}/5</span>
											</div>
										) : (
											<span className="flex-1">{value || 'N/A'}</span>
										)}
									</div>
								))}
								{Object.keys(row.original.submissions || {}).length === 0 && (
									<div className="text-center py-4 text-gray-500">
										No submission data available
									</div>
								)}
							</div>
							<DialogFooter>
								<Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
									Close
								</Button>
							</DialogFooter>
						</DialogContent>
					</Dialog>
				</div>
			);
		},
	},
];

// Export both static columns and dynamic column generator
export const columns = staticColumns;
