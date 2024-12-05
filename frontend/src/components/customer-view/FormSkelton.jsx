import { Skeleton } from "../ui/skeleton";

const FormSkeleton = () => (
    <div className="bg-background max-w-[900px] w-full h-full items-center justify-start overflow-y-auto overflow-x-hidden px-4 xl:px-40 lg:px-6 py-4">
        {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="w-100 h-32 mt-4" />
        ))}
    </div>
);

export default FormSkeleton;