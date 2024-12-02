import { MoreHorizontal, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "../ui/badge";
import { useNavigate } from "react-router-dom";

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
		id: "form_description",
		header: "Description",
		accessorKey: "form_description",
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
        return (
            <Badge className={value ? "rounded-sm bg-indigo-500 text-white hover:bg-indigo-600" : "rounded-sm bg-gray-200 text-black hover:bg-gray-300"}>
                {value ? "Published" : "Draft"}
            </Badge>
        );
        },
	},
	{
		
		id: "actions",
		header: "Actions",
		accessorKey: "actions",
		Cell: ({ row }) => {
			const navigate = useNavigate(); // Use inside the functional component
	  
			const handleEditForm = () => {
			  navigate(`/forms/create-form/${row.original._id}`); // Navigate to the dynamic route
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
							<DropdownMenuItem onClick={() => navigator.clipboard.writeText(row.original._id)}>Copy form id</DropdownMenuItem>

							<DropdownMenuSeparator />
							<DropdownMenuItem>View Form</DropdownMenuItem>
							<DropdownMenuItem onClick={handleEditForm}>
        					    Edit Form
        					</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			);
		},
	},
];
