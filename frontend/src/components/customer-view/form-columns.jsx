import { MoreHorizontal, ArrowUpDown, Edit, Trash2, QrCode, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "../ui/badge";
import { useNavigate } from "react-router-dom";
import useFormStore from "@/store/formStore";
import toast from "react-hot-toast";
import { AlertDialog, AlertDialogContent, AlertDialogFooter, AlertDialogHeader } from "@/components/ui/alert-dialog";
import { useState } from "react";
import ShareDialog from "./ShareDialog";
import { Input } from "@/components/ui/input";

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
		enableSorting: true,
		cell: ({ getValue }) => {
			const formType = getValue();
			
			if (formType === 'Review') {
				return (
					<Badge className="rounded-sm bg-yellow-400 text-black hover:bg-yellow-500">
						{formType}
					</Badge>
				);
			} else if (formType === 'Complaint') {
				return (
					<Badge className="rounded-sm bg-red-600 text-white hover:bg-red-700">
						{formType}
					</Badge>
				);
			}
			
			// Default badge for any other form types
			return (
				<Badge className="rounded-sm bg-gray-500 text-white hover:bg-gray-600">
					{formType}
				</Badge>
			);
		},
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
		cell: ({ getValue, row }) => {
			const value = getValue(); // Retrieve the true/false value
			const form = row.original;
			// Updated to use is_locked field
			const isLocked = form.is_locked;
			
			if (isLocked) {
				return (
					<div className="flex items-center gap-1">
						<Badge className="rounded-sm bg-amber-100 text-amber-800 hover:bg-amber-200 flex items-center gap-1">
							<Lock className="h-3 w-3" />
							Locked
						</Badge>
					</div>
				);
			}
			
			return (
				<Badge className={value ? "rounded-sm bg-indigo-500 text-white hover:bg-indigo-600" : "rounded-sm bg-gray-200 text-black hover:bg-gray-300"}>
					{value ? "Published" : "Draft"}
				</Badge>
			);
		},
	},
	{
		id: "created_at",
		header: ({ column }) => {
			return (
				<Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
					Created At
					<ArrowUpDown className="ml-2 h-4 w-4" />
				</Button>
			);
		},
		accessorKey: "created_at",
		enableSorting: true,
		cell: ({ row }) => {
			// Support both createdAt (new format) and created_at (old format)
			const dateValue = row.original.createdAt || row.original.created_at;
			if (!dateValue) {
				return <span className="text-sm text-gray-600">N/A</span>;
			}
			const date = new Date(dateValue);
			if (isNaN(date.getTime())) {
				return <span className="text-sm text-gray-600">Invalid Date</span>;
			}
			const formattedDate = date.toLocaleDateString("en-US", {
				year: "numeric",
				month: "short",
				day: "numeric",
			});
			return <span className="text-sm text-gray-600">{formattedDate}</span>;
		},
	},
	{
		id: "actions",
		header: "Actions",
		accessorKey: "actions",
		setForms: [],
		Cell: ({ row, updateData }) => {
			const navigate = useNavigate(); // Use inside the functional component
			const form = row.original;
			// Updated to use is_locked field
			const isLocked = form.is_locked;

			// Handle form editing
			const handleEditForm = () => {
				if (isLocked) {
					toast.error('This form is locked due to plan restrictions. Upgrade your plan to edit it.');
					return;
				}
				navigate(`/forms/create-form/${row.original._id}`); // Navigate to the dynamic route
			};

			const handleShareForm = () => {
				if (isLocked) {
					toast.error('This form is locked due to plan restrictions. Upgrade your plan to share it.');
					return;
				}
				setIsShareDialogOpen(true);
			};

			const { deleteForm } = useFormStore();

			const [isDialogOpen, setIsDialogOpen] = useState(false);
			const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);

			 const [confirmationText, setConfirmationText] = useState("");

  const isConfirmed = confirmationText.trim().toLowerCase() === "delete";
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
							<DropdownMenuItem 
								className={`cursor-pointer ${isLocked ? 'opacity-50' : ''}`} 
								onClick={handleShareForm}
								disabled={isLocked}
							>
								<QrCode className="h-4 w-4" />
								Share Form
								{isLocked && <Lock className="h-3 w-3 ml-1" />}
							</DropdownMenuItem>
							<DropdownMenuSeparator />
							<DropdownMenuItem 
								className={`cursor-pointer ${isLocked ? 'opacity-50' : ''}`} 
								onClick={handleEditForm}
								disabled={isLocked}
							>
								<Edit className="h-4 w-4" />
								Edit Form
								{isLocked && <Lock className="h-3 w-3 ml-1" />}
							</DropdownMenuItem>
							<DropdownMenuItem className="cursor-pointer text-red-500 dark:text-red-500 dark:hover:text-white hover:bg-red-500 dark:hover:bg-red-700" onClick={() => setIsDialogOpen(true)}>
								<Trash2 className="h-4 w-4" />
								Delete Form
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
					<ShareDialog 
						formId={row.original._id} 
						isOpen={isShareDialogOpen && !isLocked} 
						setIsOpen={setIsShareDialogOpen} 
					/>
    <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <AlertDialogContent className="sm:max-w-[500px] py-6 px-4 md:p-10 max-w-[calc(100%-2rem)] rounded-md">
        <AlertDialogHeader>
          <h3 className="text-xl font-semibold">Confirm Deletion</h3>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete this form?
            <span className="text-red-500 font-semibold block mt-2">
              This will also permanently delete all submissions made by users to this form.
            </span>
            This action cannot be undone.
          </p>
        </AlertDialogHeader>

        <div className="my-4">
          <label className="text-sm mb-1 block">
            To confirm, type <span className="font-bold text-destructive">Delete</span> below:
          </label>
          <Input
            type="text"
            placeholder="Type 'Delete' to confirm"
            value={confirmationText}
            onChange={(e) => setConfirmationText(e.target.value)}
          />
        </div>

        <AlertDialogFooter className="flex flex-row md:flex-none space-x-2">
          <Button
            className="w-1/2 md:w-auto mt-2"
            variant="outline"
            onClick={() => {
              setConfirmationText("");
              setIsDialogOpen(false);
            }}
          >
            Cancel
          </Button>

          <Button
            className="w-1/2 md:w-auto mt-2"
            variant="destructive"
            onClick={() => {
              confirmDelete();
              setConfirmationText("");
            }}
            disabled={!isConfirmed}
          >
            <Trash2 className="mr-2 h-4 w-4" />
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