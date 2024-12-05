import { Badge } from "@/components/ui/badge";
import { Skeleton } from "../ui/skeleton";
import ImageUpload from "./ImageUpload";
import { Switch } from "@/components/ui/switch";
import { useEffect, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const FormSidebar = ({ formDetails, onFieldUpdate, onFileSelect  }) => {
    // Fallback for when formDetails is null or undefined
    const isLoading = !formDetails || Object.keys(formDetails).length === 0;
    const [isActive, setIsActive] = useState();
    const [formDescription, setFormDescription] = useState("");

    console.log("Form Details:", formDetails);

    useEffect(() => {
        if (formDetails && formDetails.is_active !== undefined) {
            setIsActive(formDetails.is_active); // Only set if formDetails is defined and has is_active
        }
        if (formDetails && formDetails.form_description) {
            setFormDescription(formDetails.form_description); // Only set if formDetails is defined and has form_description
        }
    }, [formDetails]);

    const handleDescriptionChange = (e) => {
        const value = e.target.value;
        setFormDescription(value); // Update local state
        onFieldUpdate("form_description", value); // Update parent state
    };

    const handleSwitchChange = (value) => {
        setIsActive(value);
        onFieldUpdate("is_active", value);
    };




    if (isLoading) {
        return (
            <aside className="w-[400px] max-w-[400px] flex flex-col flex-grow gap-2 border-l-2 border-muted p-4 bg-background overflow-y-auto h-full">
                <div className="flex flex-row justify-between items-center">
                    <Skeleton className="w-20 h-4" />
                    <Skeleton className="w-20 h-8" />
                </div>
                <Skeleton className="w-full h-16 mt-4" />
                <Skeleton className="w-full h-16 mt-4" />
                <Skeleton className="w-32 h-8 mt-6" />
            </aside>
        );
    }

    return (
        <aside className="w-[400px] max-w-[400px] flex flex-col flex-grow gap-4 border-l-2 border-muted p-4 bg-background overflow-y-auto h-full">
            {/* Form Type */}
            <div className="flex flex-row justify-between items-center">
                <p className="text-md font-medium">Form Type</p>
                <Badge
                    variant="outline"
                    className="rounded-sm text-md text-white bg-gradient-to-r from-orange-500 to-yellow-500"
                >
                    {formDetails.form_type || "N/A"}
                </Badge>
            </div>

            {/* Form Status */}
            <div className="flex flex-row justify-between items-center mt-4">
                <p className="text-md font-medium">Form Status</p>
                <Switch
                
                    className="data-[state=checked]:bg-green-500  data-[state=unchecked]:bg-gray-800" 
                    checked={isActive}
                    onCheckedChange={handleSwitchChange}
                />
            </div>
            {/* Image Upload */}
            <div className="mt-6">
                <ImageUpload  
                    existingImageUrl={formDetails.logo} 
                    onFileSelect={onFileSelect} 
                />
            </div>
            <div className="mt-6"> 
                <Label>Description</Label>
                <Textarea 
                    className="mt-2" 
                    value={formDescription}
                    onChange={handleDescriptionChange}  
                    placeholder="Write short description of the form" 
                />
            </div>
        </aside>
    );
};

export default FormSidebar;
