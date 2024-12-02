import { Badge } from "@/components/ui/badge"
import { Skeleton } from "../ui/skeleton";
import ImageUpload from "./ImageUpload";

const FormSidebar = ({ formDetails }) => {
    if (formDetails === null) {
        return (
            
            <aside className="w-[400px] max-w-[400px] flex flex-col flex-grow gap-2 border-l-2 border-muted p-4 bg-background overflow-y-auto h-full">
                <div className="flex flex-row justify-between">
                    <Skeleton className="w-20 h-4" />
                    <Skeleton className="w-20 h-8" />
                </div>
            </aside>
        )
    }

    return (
        <aside className="w-[400px] max-w-[400px] flex flex-col flex-grow gap-2 border-l-2 border-muted p-4 bg-background overflow-y-auto h-full">
            <div className="flex flex-row justify-between">
                <p className="text-md">Form Type</p>
                <Badge variant={"outline"} className="rounded-sm text-md text-white bg-gradient-to-r from-orange-500 to-yellow-500" >{formDetails.form_type}</Badge>
            </div>
            <ImageUpload />
        </aside>
    )
}

export default FormSidebar