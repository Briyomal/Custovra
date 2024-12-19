import { MoreHorizontal, ArrowUpDown, Edit, Trash2, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "../ui/badge";
import { useNavigate } from "react-router-dom";
import useFormStore from "@/store/formStore";
import toast from "react-hot-toast";
import { AlertDialog, AlertDialogContent, AlertDialogFooter, AlertDialogHeader } from "@/components/ui/alert-dialog";
import { useState } from "react";
import ShareDialog from "./ShareDialog";

export const columns = [
	{
		id: "form_name",
		header: ({ column }) => {
			return (
				<Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
					Name
					<ArrowUpDown className="ml-2 h-4 w-4" />
				</Button>
			);
		},
		accessorKey: "form_name",
		enableSorting: true, // Enable sorting for the name column
	},
	{
		id: "form_note",
		header: "Note",
		accessorKey: "form_note",
	},
	{
		id: "form_type",
		header: ({ column }) => {
			return (
				<Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
					Type
					<ArrowUpDown className="ml-2 h-4 w-4" />
				</Button>
			);
		},
		accessorKey: "form_type",
		enableSorting: true, // Enable sorting for the email column
	},
	{
		id: "is_active",
		header: ({ column }) => {
			return (
				<Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
					Status
					<ArrowUpDown className="ml-2 h-4 w-4" />
				</Button>
			);
		},
		accessorKey: "is_active",
		cell: ({ getValue }) => {
			const value = getValue(); // Retrieve the true/false value
			return <Badge className={value ? "rounded-sm bg-indigo-500 text-white hover:bg-indigo-600" : "rounded-sm bg-gray-200 text-black hover:bg-gray-300"}>{value ? "Published" : "Draft"}</Badge>;
		},
	},
	{
		id: "actions",
		header: "Actions",
		accessorKey: "actions",
		setForms: [],
		Cell: ({ row, updateData }) => {
			const navigate = useNavigate(); // Use inside the functional component

			// Handle form editing
			const handleEditForm = () => {
				navigate(`/forms/create-form/${row.original._id}`); // Navigate to the dynamic route
			};

			const { deleteForm } = useFormStore();

			const [isDialogOpen, setIsDialogOpen] = useState(false);
			const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
			// Get delete function from the store
			// Confirm Delete Handler
			const confirmDelete = async () => {
				try {
					setIsDialogOpen(false); // Close the dialog
					await deleteForm(row.original._id); // Call the delete function

					// Update local state to reflect deletion
					updateData((prevData) => prevData.filter((item) => item._id !== row.original._id));
					toast.success("Form deleted successfully!");
				} catch (error) {
					console.error("Error deleting form:", error);
					toast.error("Failed to delete form.");
				}
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
							<DropdownMenuItem className="cursor-pointer" onClick={() => setIsShareDialogOpen(true)}>
								<QrCode className="h-4 w-4" />
								Share Form
							</DropdownMenuItem>
							<DropdownMenuSeparator />
							<DropdownMenuItem className="cursor-pointer" onClick={handleEditForm}>
								<Edit className="h-4 w-4" />
								Edit Form
							</DropdownMenuItem>
							<DropdownMenuItem className="cursor-pointer text-red-500 dark:text-red-500 dark:hover:text-white hover:bg-red-500 dark:hover:bg-red-700" onClick={() => setIsDialogOpen(true)}>
								<Trash2 className="h-4 w-4" />
								Delete Form
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
					<ShareDialog formId={row.original._id} isOpen={isShareDialogOpen} setIsOpen={setIsShareDialogOpen} />
					<AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
						<AlertDialogContent>
							<AlertDialogHeader>
								<h3>Confirm Deletion</h3>
								<p>Are you sure you want to delete this form? This action cannot be undone.</p>
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
				</div>
			);
		},
	},
];
