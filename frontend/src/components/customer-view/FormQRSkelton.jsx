import {
    DialogClose,
    DialogDescription,
    DialogFooter,
    DialogHeader,
} from "@/components/ui/dialog"
import { Skeleton } from "../ui/skeleton";

const FormQRSkelton = () => {
  return ( 
    <>
    <DialogHeader>
        <Skeleton className="h-6 w-24"></Skeleton>
        <DialogDescription>
        <Skeleton className="h-3 w-80"></Skeleton>
        </DialogDescription>
    </DialogHeader>
    <div className="flex items-center space-x-2">
        <div className="grid flex-1 gap-2">
        <Skeleton className="h-10"></Skeleton>
        </div>
        <Skeleton className="h-10 w-10"></Skeleton>
    </div>
    <DialogFooter className="sm:justify-start">
        <DialogClose asChild>
            <Skeleton className="h-10 w-16"></Skeleton>
        </DialogClose>
    </DialogFooter>
  
</>
  )
}

export default FormQRSkelton
