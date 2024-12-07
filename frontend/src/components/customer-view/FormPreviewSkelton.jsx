import {
    DialogContent,
    DialogFooter,
    DialogHeader,
} from "@/components/ui/dialog"

import { Skeleton } from "../ui/skeleton";

const FormPreviewSkelton = () => {
  return (
    <DialogContent className="sm:max-w-[500px]">
        <Skeleton className="h-4 w-60 mx-auto"></Skeleton>
        <DialogHeader className="flex flex-col align-middle text-center">
            <Skeleton className="mt-1 w-48 h-20 mx-auto mb-2" />
            <Skeleton className="h-3 w-72 mx-auto "></Skeleton>
        </DialogHeader>
        <div className="grid gap-6 py-4">
            <div className="flex flex-col space-y-4">
                <div>
                    <Skeleton className="h-4 w-24 mb-2"></Skeleton>
                    <Skeleton className="h-10 w-full"></Skeleton>
                </div>
                <div>
                    <Skeleton className="h-4 w-24 mb-2"></Skeleton>
                    <Skeleton className="h-10 w-full"></Skeleton>
                </div>
                <div>
                    <Skeleton className="h-4 w-24 mb-2"></Skeleton>
                    <Skeleton className="h-10 w-full"></Skeleton>
                </div>
                <div>
                    <Skeleton className="h-4 w-24 mb-2"></Skeleton>
                    <Skeleton className="h-20 w-full"></Skeleton>
                </div>
            </div>
        </div>
        <DialogFooter>
            <Skeleton variant="default" className="w-full h-8"></Skeleton>
        </DialogFooter>
    </DialogContent>
  )
}

export default FormPreviewSkelton
