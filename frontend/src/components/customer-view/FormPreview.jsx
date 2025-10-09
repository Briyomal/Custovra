import {
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Star } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const FormPreview = (formPreview) => {
    const { default_fields = [], custom_fields = [] } = formPreview.formPreview || {}

    const allEnabledFields = [...default_fields, ...custom_fields].filter(field => field.enabled)

    // Helper function to get initials for avatar fallback
    const getInitials = (name) => {
        return name
            .split(' ')
            .map(word => word.charAt(0))
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    // Function to determine if the logo URL is a full URL or needs to be constructed
    const getLogoUrl = (logo) => {
        if (!logo) return null;
        
        // If it's already a full URL (includes http), return as is
        if (logo.startsWith('http')) {
            return logo;
        }
        
        // Otherwise, construct the URL (for backward compatibility)
        return `${import.meta.env.VITE_SERVER_URL}${logo}`;
    };

    const logoUrl = getLogoUrl(formPreview.formPreview.logo);

    return (
        <>
            {!allEnabledFields.length ? (
                <>
                    <h3 className="text-2xl font-semibold text-center text-red-500">🚨 Oops!</h3>
                    <p className="text-center text-gray-500">
                        Please save or publish your form first to preview it.
                    </p>
                </>
            ) : (
                <>
                    <DialogTitle className="text-center">{formPreview.formPreview.form_name}</DialogTitle>
                    <DialogHeader className="text-center flex flex-col">
                        {logoUrl && (
                            <img
                                src={logoUrl}
                                alt="Uploaded"
                                className="mt-1 w-48 h-auto rounded-md text-center mx-auto"
                            />
                        )}
                        <DialogDescription className="text-center">
                            {formPreview.formPreview.form_description}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-6 py-4">
                        {allEnabledFields
                            .sort((a, b) => (a.position || 0) - (b.position || 0))
                            .map((field, index) => (
                                <div key={field._id || index} className="flex flex-col space-y-2">
                                    <Label className="capitalize">
                                        {field.label || field.field_name || `Field ${index + 1}`}
                                        {field.is_required && <span className="text-red-500 ml-1">*</span>}
                                    </Label>

                                    {field.type === "textarea" || field.field_type === "textarea" ? (
                                        <Textarea
                                            name={field.label || field.field_name}
                                            placeholder={field.placeholder || ""}
                                            defaultValue={field.value || ""}
                                        />
                                    ) : field.type === "rating" || field.field_type === "rating" ? (
                                        <div className="flex space-x-1">
                                            {Array.from({ length: 5 }).map((_, i) => (
                                                <Star key={i} className="mt-3 w-5 h-5 text-gray-400" />
                                            ))}
                                        </div>
                                    ) : field.type === "employee" || field.field_type === "employee" ? (
                                        <div className="space-y-4">
                                            <Select
                                                name={field.label || field.field_name}
                                                defaultValue=""
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder={field.placeholder || "Select an employee"} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {field.employees && field.employees.length > 0 ? (
                                                        field.employees.map(employee => (
                                                            <SelectItem key={employee._id} value={employee._id}>
                                                                <div className="flex items-center gap-3">
                                                                    <Avatar className="h-8 w-8">
                                                                        <AvatarImage 
                                                                            src={employee.profile_photo?.url} 
                                                                            alt={employee.name}
                                                                            className="object-cover"
                                                                        />
                                                                        <AvatarFallback className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                                                                            {getInitials(employee.name)}
                                                                        </AvatarFallback>
                                                                    </Avatar>
                                                                    <div className="flex flex-col">
                                                                        <span className="font-medium text-sm">{employee.name}</span>
                                                                        <span className="text-xs text-gray-500">{employee.designation}</span>
                                                                    </div>
                                                                </div>
                                                            </SelectItem>
                                                        ))
                                                    ) : (
                                                        <SelectItem value="no-employees" disabled>
                                                            No employees available
                                                        </SelectItem>
                                                    )}
                                                </SelectContent>
                                            </Select>
                                            {/* Employee Rating Field */}
                                            {field.hasEmployeeRating && (
                                                <div className="space-y-2">
                                                    <Label className="text-sm font-medium">Rate this employee</Label>
                                                    <div className="flex space-x-1">
                                                        {Array.from({ length: 5 }).map((_, i) => (
                                                            <Star key={i} className="w-5 h-5 text-gray-400 cursor-pointer hover:text-yellow-500" />
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ) : field.type === "image" || field.field_type === "image" ? (
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-center w-full">
                                                <label 
                                                    className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 dark:border-gray-600 dark:bg-slate-950  dark:hover:bg-slate-800 transition-colors duration-200"
                                                >
                                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                        <svg className="w-8 h-8 mb-4 text-gray-500 dark:text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                                                            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                                                        </svg>
                                                        <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                                                            <span className="font-semibold">Click to upload</span> or drag and drop
                                                        </p>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                                            PNG, JPG, JPEG (MAX. 1MB)
                                                        </p>
                                                    </div>
                                                    <Input
                                                        type="file"
                                                        accept="image/*"
                                                        className="hidden"
                                                    />
                                                </label>
                                            </div>
                                            {field.placeholder && (
                                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                                    {field.placeholder}
                                                </p>
                                            )}
                                        </div>
                                    ) : (
                                        <Input
                                            name={field.label || field.field_name}
                                            type={field.type || field.field_type || "text"}
                                            placeholder={field.placeholder || ""}
                                            defaultValue={field.value || ""}
                                        />
                                    )}
                                </div>
                            ))}
                    </div>

                    <DialogFooter>
                        <Button
                            variant="default"
                            className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 text-white hover:from-blue-700 hover:to-indigo-800"
                        >
                            Submit
                        </Button>
                    </DialogFooter>
                </>
            )}
        </>
    )
}

export default FormPreview