import { DialogDescription, DialogFooter, DialogHeader } from "@/components/ui/dialog";
import { Skeleton } from "../ui/skeleton";
import { DialogTitle } from "@radix-ui/react-dialog";

const FormQRSkelton = () => {
	return (
		<div>
			<DialogHeader className="items-start md:items-center">
				<DialogTitle>
				    <Skeleton className="h-6 w-24"></Skeleton>
                </DialogTitle>
				<DialogDescription>
					<Skeleton className="h-3 w-80"></Skeleton>
				</DialogDescription>
			</DialogHeader>
			<div className="flex items-center space-x-2 mt-3">
				<div className="grid flex-1 gap-2">
					<Skeleton className="h-10"></Skeleton>
				</div>
				<Skeleton className="h-10 w-10"></Skeleton>
			</div>

			<div className="mt-4 flex flex-col items-center space-y-5">
				<div>
					<Skeleton className="h-[300px] w-[300px] rounded-none"></Skeleton>
				</div>
				<div className="flex space-x-2">
					<Skeleton className="h-10 w-16"></Skeleton>
					<Skeleton className="h-10 w-28"></Skeleton>
				</div>
			</div>
			<DialogFooter className="sm:justify-start"></DialogFooter>
		</div>
	);
};

export default FormQRSkelton;
