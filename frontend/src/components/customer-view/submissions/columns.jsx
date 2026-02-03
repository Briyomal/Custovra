import { MoreHorizontal, ArrowUpDown, Star, StarHalf, Trash2, Eye, ImageOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogContent, AlertDialogFooter, AlertDialogHeader } from "@/components/ui/alert-dialog";
import { useState } from "react";
import toast from "react-hot-toast";
import useSubmissionStore from "@/store/submissionStore";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox"

// Image cell component with proper error handling
const ImageCell = ({ value }) => {
	const [imageError, setImageError] = useState(false);
	const [imageLoaded, setImageLoaded] = useState(false);

	if (imageError) {
		return (
			<div className="flex items-center space-x-2">
				<div className="w-16 h-16 flex flex-col items-center justify-center bg-red-50 dark:bg-red-950 rounded border border-red-200 dark:border-red-800">
					<ImageOff className="w-5 h-5 text-red-400" />
					<span className="text-[10px] text-red-400 mt-1">Not found</span>
				</div>
			</div>
		);
	}

	return (
		<div className="flex items-center space-x-2">
			{!imageLoaded && (
				<div className="w-16 h-16 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded border animate-pulse">
					<span className="text-xs text-gray-400">Loading...</span>
				</div>
			)}
			<img
				src={value}
				alt="Submission"
				className={`w-16 h-16 object-cover rounded border ${imageLoaded ? '' : 'hidden'}`}
				onLoad={() => setImageLoaded(true)}
				onError={() => setImageError(true)}
			/>
			{imageLoaded && (
				<a href={value} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline text-sm">
					View Full Size
				</a>
			)}
		</div>
	);
};

// Generate dynamic columns based on submission data and form field definitions
export const generateDynamicColumns = (submissions, formData = null) => {
	if (!submissions || submissions.length === 0) {
		return staticColumns;
	}

	// If we have form data, use the current field definitions to determine columns
	if (formData) {
		// Create arrays to maintain order
		const orderedFields = [];
		const employeeFieldsWithRating = new Map(); // Map to track employee fields with their rating fields
		
		// Process default fields
		if (formData.default_fields && Array.isArray(formData.default_fields)) {
			formData.default_fields.forEach(field => {
				if (field.enabled) {
					orderedFields.push(field.field_name);
					// If this is an employee field with rating enabled, track it
					if (field.field_type === 'employee' && field.hasEmployeeRating) {
						employeeFieldsWithRating.set(field.field_name, `${field.field_name}_rating`);
					}
				}
			});
		}
		
		// Process custom fields
		if (formData.custom_fields && Array.isArray(formData.custom_fields)) {
			formData.custom_fields.forEach(field => {
				if (field.enabled) {
					orderedFields.push(field.field_name);
					// If this is an employee field with rating enabled, track it
					if (field.field_type === 'employee' && field.hasEmployeeRating) {
						employeeFieldsWithRating.set(field.field_name, `${field.field_name}_rating`);
					}
				}
			});
		}
		
		// Create columns in the proper order
		const dynamicColumns = [];
		orderedFields.forEach(fieldName => {
			// Add the main field column
			dynamicColumns.push(createColumnForField(fieldName));
			
			// If this is an employee field with rating, add the rating column right after
			if (employeeFieldsWithRating.has(fieldName)) {
				const ratingFieldName = employeeFieldsWithRating.get(fieldName);
				dynamicColumns.push(createEmployeeRatingColumn(ratingFieldName));
			}
		});
		
		// Combine with static columns
		return [
			staticColumns[0], // select checkbox
			...dynamicColumns,
			staticColumns[staticColumns.length - 2], // createdAt
			staticColumns[staticColumns.length - 1], // actions
		];
	} else {
		// Fallback to original behavior if no form data is provided
		// Get all possible field names from all submissions
		const allFields = new Set();
		submissions.forEach(submission => {
			if (submission.submissions && typeof submission.submissions === 'object') {
				Object.keys(submission.submissions)
					.filter(key => key !== 'cf-turnstile-response' && key !== 'captchaToken')
					.forEach(key => allFields.add(key));
			}
		});

		// Convert to array and sort to group employee fields with their ratings
		const fieldArray = Array.from(allFields);
		
		// Separate regular fields from rating fields
		const regularFields = fieldArray.filter(field => !field.endsWith('_rating'));
		const ratingFields = fieldArray.filter(field => field.endsWith('_rating'));
		
		// Create columns, placing rating fields right after their corresponding employee fields
		const dynamicColumns = [];
		regularFields.forEach(fieldName => {
			// Add the main field column
			dynamicColumns.push(createColumnForField(fieldName));
			
			// Check if there's a corresponding rating field and add it right after
			const correspondingRatingField = `${fieldName}_rating`;
			if (ratingFields.includes(correspondingRatingField)) {
				dynamicColumns.push(createEmployeeRatingColumn(correspondingRatingField));
			}
		});
		
		// Add any remaining rating fields that don't have a corresponding employee field
		ratingFields.forEach(fieldName => {
			const employeeFieldName = fieldName.replace(/_rating$/, '');
			if (!regularFields.includes(employeeFieldName)) {
				dynamicColumns.push(createEmployeeRatingColumn(fieldName));
			}
		});

		// Combine with static columns
		return [
			staticColumns[0], // select checkbox
			...dynamicColumns,
			staticColumns[staticColumns.length - 2], // createdAt
			staticColumns[staticColumns.length - 1], // actions
		];
	}
};

// Helper function to create a column for a specific field
const createColumnForField = (fieldName) => {
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
	} else if (fieldName.endsWith('.jpg') || fieldName.endsWith('.jpeg') || fieldName.endsWith('.png') ||
	           fieldName.includes('image') || fieldName.includes('photo') || fieldName.includes('Image') || fieldName.includes('Photo')) {
		// Handle image fields
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
				// Check if the value looks like a URL (presigned URL)
				if (value && (value.startsWith('http://') || value.startsWith('https://'))) {
					return <ImageCell value={value} />;
				}
				// If it's an S3 key, show a placeholder (backend should have converted this to URL)
				else if (value && (value.startsWith('form_submissions/') || value.includes('form_submissions'))) {
					return <span className="text-amber-500">[Image loading failed - S3 key]</span>;
				}
				return <span>{value || 'N/A'}</span>;
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
};

// Helper function to create a column for employee rating fields
const createEmployeeRatingColumn = (fieldName) => {
	// Extract the employee field name (remove _rating suffix)
	const employeeFieldName = fieldName.replace(/_rating$/, '');
	
	return {
		id: fieldName,
		header: ({ column }) => (
			<Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
				{employeeFieldName.charAt(0).toUpperCase() + employeeFieldName.slice(1)} Rating
				<ArrowUpDown className="ml-2 h-4 w-4" />
			</Button>
		),
		accessorKey: `submissions.${fieldName}`,
		accessorFn: (row) => parseFloat(row.submissions?.[fieldName]) || 0,
		enableSorting: true,
		cell: ({ row }) => {
			const rating = parseFloat(row.original.submissions?.[fieldName]) || 0;
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
										) : (key.endsWith('.jpg') || key.endsWith('.jpeg') || key.endsWith('.png') || 
										     key.includes('image') || key.includes('photo') || key.includes('Image') || key.includes('Photo')) ? (
											// Handle image fields in the view dialog
											value && (value.startsWith('http://') || value.startsWith('https://')) ? (
												<div className="flex flex-col gap-2">
													<img 
														src={value} 
														alt={key} 
														className="w-32 h-32 object-cover rounded border"
														onError={(e) => {
															// If image fails to load, show the URL
															e.target.onerror = null;
															e.target.style.display = 'none';
															e.target.parentElement.innerHTML = `<a href="${value}" target="_blank" rel="noopener noreferrer" class="text-blue-500 hover:underline">${value}</a>`;
														}}
													/>
													<a href={value} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline text-sm">
														View Full Size
													</a>
												</div>
											) : (
												<span>{value || 'N/A'}</span>
											)
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