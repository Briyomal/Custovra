import { MoreHorizontal, ArrowUpDown, Star, StarHalf} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export const columns = [
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
				<Button variant="ghost" 
					onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
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
				<Button variant="ghost"
					onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
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
		enableSorting: true,
		cell: ({ row }) => {
		  const rating = parseFloat(row.original.submissions?.rating) || 0; // Default to 0 if undefined or NaN
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
			const formattedDate = date.toLocaleString('en-GB', {
				day: '2-digit',
				month: 'long', // Full month name
				year: 'numeric',
				hour: '2-digit',
				minute: '2-digit',
				hour12: true,
			});
	
			return <span>{formattedDate}</span>;
		},
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
