import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import useFormStore from "@/store/formStore";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import FloatingBackground from "@/components/FloatingBackground";
import { motion } from "framer-motion";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Ban, Check, Loader } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import StarRating from "@/components/customer-view/StarRating";
import FormPreviewSkelton from "@/components/customer-view/FormPreviewSkelton";
import LoadingSpinner from "@/components/LoadingSpinner";
import useSubmissionStore from "@/store/submissionStore";
import toast from "react-hot-toast";
import { Turnstile } from "@marsidev/react-turnstile";

const FormViewPage = () => {
    // Helper function to lighten a hex color
    const lightenedColor = (hex) => {
        // Remove the # if present
        const color = hex.replace('#', '');
        
        // Convert to RGB
        const r = parseInt(color.substring(0, 2), 16);
        const g = parseInt(color.substring(2, 4), 16);
        const b = parseInt(color.substring(4, 6), 16);
        
        // Lighten by increasing each component toward 255
        const lightenedR = Math.min(255, r + 50);
        const lightenedG = Math.min(255, g + 50);
        const lightenedB = Math.min(255, b + 50);
        
        // Convert back to hex
        const lightenedHex = `#${lightenedR.toString(16).padStart(2, '0')}${lightenedG.toString(16).padStart(2, '0')}${lightenedB.toString(16).padStart(2, '0')}`;
        
        return lightenedHex;
    };
    
    // Security Note: This component handles public form viewing
    // Sensitive information like form owner's user_id should never be logged or exposed
    const { viewForm } = useFormStore();
    const { formId } = useParams();
    const [loading, setLoading] = useState(false);
    const [formDetails, setFormDetails] = useState(null);
    const [error, setError] = useState(null);
    const [formErrors, setFormErrors] = useState({});
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [showGooglePrompt, setShowGooglePrompt] = useState(false); // State to control prompt visibility
    const [googleLink, setGoogleLink] = useState(""); // Store Google review link
    const [captchaToken, setCaptchaToken] = useState(null);

    // Helper function to get initials for avatar fallback
    const getInitials = (name) => {
        return name
            .split(' ')
            .map(word => word.charAt(0))
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };


    useEffect(() => {
        const fetchFormDetails = async () => {
            setLoading(true);
            setError(null);
            try {
                const data = await viewForm(formId);
                if (data?.error) {
                    // Check if the error is due to submission limit being reached
                    if (data.error.toLowerCase().includes('limit') || data.error.toLowerCase().includes('monthly') || data.error.toLowerCase().includes('submission')) {
                        setError(data.error); // Use the full error message from backend
                    } else {
                        setError(data.error);
                    }
                } else {
                    // Initialize rating fields with value: 0 if not set
                    const initializeFields = (fields) => {
                        return fields ? fields.map(field => ({
                            ...field,
                            value: field.field_type === 'rating' ? (field.value || 0) : (field.value || ''),
                            employeeRatingValue: field.field_type === 'employee' && field.hasEmployeeRating ? (field.employeeRatingValue || 0) : undefined
                        })) : [];
                    };
                    
                    const initializedData = {
                        ...data,
                        default_fields: initializeFields(data.default_fields),
                        custom_fields: initializeFields(data.custom_fields)
                    };
                    
                    // Remove sensitive information before logging and setting state
                    const publicFormData = {
                        ...initializedData,
                        user_id: undefined, // Remove form owner's user ID for security
                    };
                    
                    // Only log in development environment
                    if (import.meta.env.MODE === 'development') {
                        console.log("Public form data loaded (sensitive info removed):", {
                            form_name: publicFormData.form_name,
                            form_type: publicFormData.form_type,
                            is_active: publicFormData.is_active,
                            fields_count: (publicFormData.default_fields?.length || 0) + (publicFormData.custom_fields?.length || 0)
                        });
                    }
                    
                    // Set the original data with user_id for internal use
                    setFormDetails(initializedData);
                }
            } catch (err) {
                console.error("Error fetching form details:", err);
                // Check if this is a 403 error (submission limit reached) or contains limit-related text
                if (err?.response?.status === 403 || err?.response?.data?.error?.toLowerCase().includes('limit') || err?.response?.data?.error?.toLowerCase().includes('monthly') || err?.response?.data?.error?.toLowerCase().includes('submission')) {
                    setError(err?.response?.data?.error || 'Monthly submission limit reached for this form. Please contact the form owner to upgrade their plan.');
                } else {
                    setError("Failed to fetch form details. Please try again later.");
                }
            } finally {
                setLoading(false);
            }
        };

        const loadForm = async () => {
            setLoading(true);
            
            fetchFormDetails();
        };
        
        if (formId) {
            loadForm();
        }
    }, [formId, viewForm]);

    // Debug log without sensitive information (development only)
    if (import.meta.env.MODE === 'development' && formDetails) {
        console.log("Form loaded:", {
            form_name: formDetails.form_name,
            form_type: formDetails.form_type,
            is_active: formDetails.is_active,
            has_logo: !!formDetails.logo,
            total_fields: (formDetails.default_fields?.length || 0) + (formDetails.custom_fields?.length || 0)
        });
    }

    const validateField = (name, value, field) => {
        if (field.is_required) {
            // Ensure `value` is processed appropriately for each field type
            const fieldValue = typeof value === "string" ? value.trim() : value;

            if (fieldValue === null || fieldValue === undefined || fieldValue === "") {
                // Special handling for image fields - check if it's a File object
                if (field.field_type === "image" && value instanceof File) {
                    return null; // File is present, so it's valid
                }
                return `${field.field_name} is required.`;
            }

            // Additional validations based on field name and type
            if (field.field_type === "rating" && (typeof fieldValue !== "number" || fieldValue < 1 || fieldValue > 5)) {
                return "Please provide a valid rating between 1 and 5.";
            }

            if (field.field_name === "name" && fieldValue.length < 3) {
                return "Name must be at least 3 characters long.";
            }

            if (field.field_type === "email" && !/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(fieldValue)) {
                return "Please enter a valid email address.";
            }

            if (field.field_name === "phone" && !/^\+?[1-9]\d{9,14}$/.test(fieldValue)) {
                return "Please enter a valid phone number with at least 10 digits";
            }

            if (field.field_type === "textarea" && fieldValue.length < 10) {
                return "Comment must be at least 10 characters long.";
            }
        }

        return null;
    };


    const handleChange = (e, field) => {
        let name, value;
        
        // Handle file inputs differently
        if (e.target.type === 'file') {
            name = e.target.name;
            value = e.target.files[0]; // Get the file object
        } else {
            name = e.target.name;
            value = e.target.value;
        }
        
        // Development-only logging
        if (import.meta.env.MODE === 'development') {
            console.log("Field changed:", name, "Value:", value);
        }

        // Validate the field and update the errors object
        const error = validateField(name, value, field);
        setFormErrors((prev) => {
            const newErrors = { ...prev };
            if (error) {
                newErrors[name] = error;
                // Development-only error logging
                if (import.meta.env.MODE === 'development') {
                    console.log("Validation Error for", name + ":", error);
                }
            } else {
                delete newErrors[name];
            }
            return newErrors;
        });

        // Update the value in both default_fields and custom_fields
        setFormDetails((prevDetails) => {
            // Special handling for employee rating fields
            if (name.endsWith('_rating') && field.field_type === "employee" && field.hasEmployeeRating) {
                // This is an employee rating field, update the employeeRatingValue property
                const employeeFieldName = name.replace('_rating', '');
                return {
                    ...prevDetails,
                    default_fields: prevDetails.default_fields.map((f) =>
                        f.field_name === employeeFieldName ? { ...f, employeeRatingValue: value } : f
                    ),
                    custom_fields: prevDetails.custom_fields ? prevDetails.custom_fields.map((f) =>
                        f.field_name === employeeFieldName ? { ...f, employeeRatingValue: value } : f
                    ) : [],
                };
            } else {
                // Regular field update
                return {
                    ...prevDetails,
                    default_fields: prevDetails.default_fields.map((f) =>
                        f.field_name === name ? { ...f, value } : f
                    ),
                    custom_fields: prevDetails.custom_fields ? prevDetails.custom_fields.map((f) =>
                        f.field_name === name ? { ...f, value } : f
                    ) : [],
                };
            }
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!captchaToken) {
            alert("Please complete the captcha.");
            return;
        }

        setSubmitLoading(true);

        try {
            // Development-only logging
            if (import.meta.env.MODE === 'development') {
                console.log("Form submission started for form:", formDetails.form_name);
            }

            const { submitForm } = useSubmissionStore.getState();
            
            let validationErrors = {};
            let ratingValue = 0; // Store rating value

            // Validate and ensure all required fields are included
            // Process both default_fields and custom_fields
            const allFields = [...(formDetails.default_fields || []), ...(formDetails.custom_fields || [])];
            
            // Create a submissions object to match backend expectations
            const submissions = {};
            
            // Track if we have any file uploads
            let hasFileUploads = false;
            
            allFields.forEach((field) => {
                // Handle employee rating field
                if (field.field_type === "employee" && field.hasEmployeeRating) {
                    // Add both employee selection and rating to submissions
                    if (field.value !== undefined && field.value !== null) {
                        submissions[field.field_name] = field.value.toString();
                    }
                    if (field.employeeRatingValue !== undefined && field.employeeRatingValue !== null) {
                        submissions[`${field.field_name}_rating`] = field.employeeRatingValue.toString();
                    }
                } 
                // Handle rating fields
                else if (field.field_type === "rating") {
                    ratingValue = Math.max(ratingValue, field.value || 0); // Use the highest rating for Google prompt
                    submissions[field.field_name] = field.value?.toString() || "0";
                } 
                // Handle image fields
                else if (field.field_type === "image" && field.value instanceof File) {
                    // We have a file upload
                    hasFileUploads = true;
                } 
                // Handle regular fields (including dropdown and radio)
                else if (field.value !== undefined && field.value !== null) {
                    // Add regular fields to submissions object
                    submissions[field.field_name] = field.value.toString();
                }
                
                // Validate required fields
                if (field.is_required) {
                    // Special validation for employee fields with rating
                    if (field.field_type === "employee" && field.hasEmployeeRating) {
                        // Both employee selection and rating might be required
                        if (!field.value) {
                            validationErrors[field.field_name] = `${field.field_name} is required.`;
                        }
                        // Note: We're not making the rating required even if the field is marked as required
                        // This is because the rating is a separate component and might be optional per the requirements
                    } else {
                        const error = validateField(field.field_name, field.value, field);
                        if (error) {
                            validationErrors[field.field_name] = error;
                        }
                    }
                }
            });

            // If there are validation errors, update state and stop submission
            if (Object.keys(validationErrors).length > 0) {
                setFormErrors(validationErrors);
                console.log("Validation Errors:", validationErrors);
                setSubmitLoading(false);
                return;
            }

            // Handle submission based on whether we have file uploads
            if (hasFileUploads) {
                // Use FormData for submissions with file uploads
                const formData = new FormData();
                
                // Add form_id and captchaToken to FormData
                formData.append('form_id', formDetails._id);
                formData.append('captchaToken', captchaToken);
                
                // Add all non-file fields to FormData
                Object.entries(submissions).forEach(([key, value]) => {
                    formData.append(key, value);
                });
                
                // Add file fields to FormData
                allFields.forEach((field) => {
                    if (field.field_type === "image" && field.value instanceof File) {
                        formData.append(field.field_name, field.value);
                    }
                });

                // Development-only logging
                if (import.meta.env.MODE === 'development') {
                    console.log("Submitting form with file uploads");
                    for (let pair of formData.entries()) {
                        console.log(pair[0] + ':', pair[1]);
                    }
                }

                // Submit the form with FormData
                await submitForm(formData);
            } else {
                // Use JSON for submissions without file uploads
                const jsonData = {
                    form_id: formDetails._id,
                    captchaToken: captchaToken,
                    submissions: submissions
                };

                // Development-only logging
                if (import.meta.env.MODE === 'development') {
                    console.log("Submitting form without file uploads:", jsonData);
                }

                // Submit the form with JSON data
                await submitForm(jsonData);
            }

            const { error } = useSubmissionStore.getState();

            if (error) {
                // Check if the error is due to submission limit being reached
                if (error.toLowerCase().includes('limit') || error.toLowerCase().includes('monthly') || error.toLowerCase().includes('submission')) {
                    toast.error("Monthly submission limit reached. Please upgrade your plan.");
                } else {
                    toast.error("Form submission failed.");
                }
                console.log("Submission Error:", error);
                setSubmitLoading(false);
                return;
            } else {
                toast.success("Form submitted successfully!");
                setSubmitSuccess(true);

                // Check if rating is 4 or 5 AND google_link is available
                if (ratingValue >= 4 && formDetails.google_link) {
                    setGoogleLink(formDetails.google_link);
                    setShowGooglePrompt(true); // Show review prompt
                }
            }
        } catch (err) {
            // Check if this is a 403 error (submission limit reached) or contains limit-related text
            if (err?.response?.status === 403 || err.message?.toLowerCase().includes('limit') || err.message?.toLowerCase().includes('monthly') || err.message?.toLowerCase().includes('submission')) {
                toast.error("Monthly submission limit reached. Please upgrade your plan.");
            } else {
                console.error("Unexpected Error during submission:", err);
                toast.error("An unexpected error occurred during submission.");
            }
        } finally {
            setSubmitLoading(false); // Ensure the loading state is reset regardless of success or failure
        }
    };

    const handleGoogleReview = () => {
        if (formDetails) {
          const commentField = formDetails.default_fields.find(field => field.field_type === "textarea");
          if (commentField?.value) {
            navigator.clipboard.writeText(commentField.value)
              .then(() => {
                toast.success("Your review text is copied! Please paste it on Google Reviews.");
                window.open(googleLink, "_blank");
              })
              .catch((err) => {
                console.error('Failed to copy: ', err);
                window.open(googleLink, "_blank");
              });
          } else {
            window.open(googleLink, "_blank");
          }
        }
      };
      


    if (loading && !error) {
        return <LoadingSpinner />;
    }

    // Only show generic error if it's not a submission limit error
    if (error && !(error.toLowerCase().includes('limit') || error.toLowerCase().includes('monthly') || error.toLowerCase().includes('submission'))) {
        return <p>Error: {error}</p>;
    }

    return (
        <FloatingBackground>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="max-w-lg w-full"
            >
                {error && (error.toLowerCase().includes('limit') || error.toLowerCase().includes('monthly') || error.toLowerCase().includes('submission')) ? (
                    <Card className="text-center p-4 backdrop-blur-md">
                        <CardHeader>
                            <Ban size={48} className="mx-auto mb-2 text-red-500" />
                            <CardTitle>Monthly Limit Reached</CardTitle>
                        </CardHeader>
                        <CardDescription className="pb-3">
                            This form has reached its monthly submission limit. Please contact the form owner to upgrade their plan.
                        </CardDescription>
                    </Card>
                ) : !formDetails?.is_active ? (
                    <Card className="text-center p-4 backdrop-blur-md">
                        <CardHeader>
                            <Ban size={48} className="mx-auto mb-2 text-red-500" />
                            <CardTitle>Form Unavailable</CardTitle>
                        </CardHeader>
                        <CardDescription className="pb-3">
                            This form is currently inactive. Please check back later or contact the form owner for more details.
                        </CardDescription>
                    </Card>
                ) : (
                    <>
                        {submitSuccess ? (
                            showGooglePrompt ? (
                                <Card className="text-center p-4 m-4 md:m-0">
                                    <CardHeader>
                                        <Check size={48} className="mx-auto mb-2 text-green-500" />
                                        <CardTitle className="text-xl md:text-2xl">Thank you for your review!</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-md md:text-lg">Would you like to leave a review on Google as well?</p>
                                        <small>Your review text will be copied to your clipboard. Please paste it on Google Reviews.</small>
                                        <div className="flex justify-center gap-2 md:gap-4 mt-4">
                                            <Button
                                                className="text-md rounded-md font-semibold border
                                                          border-lime-500"
                                                style={{
                                                    backgroundColor: formDetails?.button_bg_color || '#16bf4c',
                                                    color: formDetails?.button_text_color || '#000000',
                                                    border: `1px solid ${formDetails?.button_bg_color ? lightenedColor(formDetails.button_bg_color) : '#16bf4c'}`,
                                                    transition: 'all 0.2s ease-in-out',
                                                    boxShadow: `0 0 15px ${formDetails?.button_bg_color ? formDetails.button_bg_color + '66' : 'rgba(22,191,76,0.4)'}`,
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.target.style.boxShadow = `0 0 20px ${formDetails?.button_bg_color || '#16bf4c'}`;
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.target.style.boxShadow = `0 0 15px ${formDetails?.button_bg_color ? formDetails.button_bg_color + '66' : 'rgba(22,191,76,0.4)'}`;
                                                }}
                                                //onClick={() => window.open(googleLink, "_blank")}
                                                onClick={handleGoogleReview}
                                            >
                                                Yes, Review on Google
                                            </Button>
                                            <Button
                                                className="rounded-md font-semibold border 
               											border-[#16bf4c] text-[#16bf4c] dark:text-white bg-transparent 
               											hover:!text-[#000000] hover:border-lime-500 hover:bg-lime-500
               											transition-all duration-200 ease-in-out 
               											hover:shadow-[0_0_15px_rgba(22,191,76,0.4)] 
               											focus:outline-none focus:ring-2 focus:ring-lime-500"
                                                onClick={() => setShowGooglePrompt(false)}
                                            >
                                                No, Thanks
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ) : (
                                <Card className="text-center p-4 m-4 md:m-0">
                                    <CardHeader>
                                        <Check size={48} className="mx-auto mb-2 text-green-500" />
                                        <CardTitle className="text-xl md:text-2xl">Form Submission Successful</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-md md:text-lg">Thank you for your submission!</p>
                                    </CardContent>
                                </Card>
                            )
                        ) : (
                            <Card className=" text-center p-0 md:p-4 my-16 mx-4 md:my-6 md:mx-4 backdrop-blur-lg bg-white dark:bg-[#0d0d0dce]" style={{borderBottom: `4px solid ${formDetails?.button_bg_color || '#16bf4c'}`}}>
                                {loading ? (
                                    <FormPreviewSkelton />
                                ) : (
                                    <>
                                        <CardHeader>
                                            <CardTitle className="mb-2">{formDetails?.form_name}</CardTitle>
                                            {formDetails.logo && (
                                                <img
                                                src={formDetails?.logo}
                                                    //src={`${import.meta.env.VITE_SERVER_URL}${formDetails.logo}`}
                                                    alt="Uploaded"
                                                    className="mt-1 w-28 md:w-44 h-auto rounded-md mx-auto"
                                                />
                                            )}
                                            {formDetails?.form_description && (
                                                <CardDescription>{formDetails?.form_description}</CardDescription>
                                            )}
                                        </CardHeader>
                                        <CardContent>
                                            <form onSubmit={handleSubmit} className="grid gap-6 py-4 text-left">
                                                {[...(formDetails?.default_fields || []), ...(formDetails?.custom_fields || [])]
                                                    .filter((field) => field?.enabled)
                                                    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0)) // ✅ sort by position
                                                    .map((field, index) => {
                                                        // Create unique key for each field
                                                        const fieldKey = field._id || `${field.field_name}-${field.field_type}-${index}`;
                                                        return (
                                                        <div key={fieldKey} className="flex flex-col space-y-2">
                                                            <Label className="capitalize">
                                                                {field.field_name || `Field ${index + 1}`}
                                                                {field.is_required && <span className="text-red-500 ml-1">*</span>}
                                                            </Label>

                                                            {field.field_type === "textarea" ? (
                                                                <Textarea
                                                                    name={field.field_name}
                                                                    placeholder={field.placeholder || ""}
                                                                    required={field.is_required}
                                                                    onChange={(e) => handleChange(e, field)}
                                                                />
                                                            ) : field.field_type === "rating" ? (
                                                                <StarRating
                                                                    key={`star-${fieldKey}`} // Unique key for StarRating
                                                                    rating={field.value || 0}
                                                                    onChange={(value) =>
                                                                        handleChange({ target: { name: field.field_name, value } }, field)
                                                                    }
                                                                />
                                                            ) : field.field_type === "employee" ? (
                                                                <div className="space-y-4">
                                                                    <Select
                                                                        name={field.field_name}
                                                                        required={field.is_required}
                                                                        onValueChange={(value) =>
                                                                            handleChange({ target: { name: field.field_name, value } }, field)
                                                                        }
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
                                                                        <div className="flex flex-col space-y-2">
                                                                            <Label className="text-sm font-medium">Rate this employee</Label>
                                                                            <StarRating
                                                                                key={`employee-rating-${fieldKey}`}
                                                                                rating={field.employeeRatingValue || 0}
                                                                                onChange={(value) =>
                                                                                    handleChange({ target: { name: `${field.field_name}_rating`, value } }, field)
                                                                                }
                                                                            />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ) : field.field_type === "image" ? (
                                                                <div className="space-y-2">
                                                                    <div className="flex items-center justify-center w-full">
                                                                        <label 
                                                                            htmlFor={`file-upload-${field.field_name}`}
                                                                            className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 dark:border-gray-600 dark:bg-themebglight dark:hover:bg-themebgdark transition-colors duration-200"
                                                                        >
                                                                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                                                <svg className="w-8 h-8 mb-4 text-gray-500 dark:text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 18">
                                                                                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 3v4l3-3m6 4H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2Z"/>
                                                                                </svg>
                                                                                <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                                                                                    <span className="font-semibold">Click to upload</span> or drag and drop
                                                                                </p>
                                                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                                                    PNG, JPG, JPEG (MAX. 1MB)
                                                                                </p>
                                                                            </div>
                                                                            <Input
                                                                                id={`file-upload-${field.field_name}`}
                                                                                name={field.field_name}
                                                                                type="file"
                                                                                accept="image/*"
                                                                                required={field.is_required}
                                                                                onChange={(e) => handleChange(e, field)}
                                                                                className="hidden"
                                                                            />
                                                                        </label>
                                                                    </div>
                                                                    {field.value && typeof field.value === "object" && field.value.name && (
                                                                        <div className="flex items-center justify-between p-2 bg-blue-50 dark:bg-green-900 rounded-md">
                                                                            <div className="flex items-center">
                                                                                <svg className="w-5 h-5 text-green-500 dark:text-green-400 mr-2" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 18">
                                                                                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 3v4l3-3m6 4H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2Z"/>
                                                                                </svg>
                                                                                <span className="text-sm font-medium text-green-700 dark:text-green-300 truncate">
                                                                                    {field.value.name}
                                                                                </span>
                                                                            </div>
                                                                            <span className="text-xs text-lime-600 dark:text-lime-400">
                                                                                Selected
                                                                            </span>
                                                                        </div>
                                                                    )}
                                                                    {field.placeholder && (
                                                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                                                            {field.placeholder}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            ) : field.field_type === "dropdown" ? (
                                                                <Select
                                                                    name={field.field_name}
                                                                    required={field.is_required}
                                                                    onValueChange={(value) =>
                                                                        handleChange({ target: { name: field.field_name, value } }, field)
                                                                    }
                                                                >
                                                                    <SelectTrigger>
                                                                        <SelectValue placeholder={field.placeholder || "Select an option"} />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        {field.options && field.options.length > 0 ? (
                                                                            field.options
                                                                                .filter(option => option && option.trim() !== "") // Filter out empty options
                                                                                .map((option, index) => (
                                                                                    <SelectItem key={index} value={option}>
                                                                                        {option}
                                                                                    </SelectItem>
                                                                                ))
                                                                        ) : (
                                                                            <SelectItem value="" disabled>
                                                                                No options available
                                                                            </SelectItem>
                                                                        )}
                                                                    </SelectContent>
                                                                </Select>
                                                            ) : field.field_type === "radio" ? (
                                                                <RadioGroup
                                                                    name={field.field_name}
                                                                    required={field.is_required}
                                                                    onValueChange={(value) =>
                                                                        handleChange({ target: { name: field.field_name, value } }, field)
                                                                    }
                                                                >
                                                                    {field.options && field.options.length > 0 ? (
                                                                        field.options
                                                                            .filter(option => option && option.trim() !== "") // Filter out empty options
                                                                            .map((option, index) => (
                                                                                <div key={index} className="flex items-center space-x-2">
                                                                                    <RadioGroupItem value={option} id={`${field.field_name}-${index}`} />
                                                                                    <Label htmlFor={`${field.field_name}-${index}`}>{option}</Label>
                                                                                </div>
                                                                            ))
                                                                    ) : (
                                                                        <p className="text-sm text-gray-500">No options available</p>
                                                                    )}
                                                                </RadioGroup>
                                                            ) : (
                                                                <Input
                                                                    name={field.field_name}
                                                                    type={field.field_type || "text"}
                                                                    placeholder={field.placeholder || ""}
                                                                    required={field.is_required}
                                                                    onChange={(e) => handleChange(e, field)}
                                                                />
                                                            )}

                                                            {formErrors[field.field_name] && (
                                                                <p className="text-sm text-red-500">{formErrors[field.field_name]}</p>
                                                            )}
                                                        </div>
                                                    );
                                                })}

                                                <div className="mt-4">
                                                    <Turnstile
                                                        siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY}
                                                        onSuccess={(token) => setCaptchaToken(token)}
                                                        onExpire={() => setCaptchaToken(null)}
                                                        onError={() => setCaptchaToken(null)}
                                                    />
                                                </div>

                                                <Button
                                                    type="submit"
                                                    className="text-md w-full rounded-md font-semibold border
                                                          border-lime-500"
                                                    style={{
                                                        backgroundColor: formDetails?.button_bg_color || '#16bf4c',
                                                        color: formDetails?.button_text_color || '#000000',
                                                        border: `1px solid ${formDetails?.button_bg_color || '#16bf4c'}`,
                                                        transition: 'all 0.2s ease-in-out',
                                                        boxShadow: `0 0 10px ${formDetails?.button_bg_color ? formDetails.button_bg_color + '66' : 'rgba(22,191,76,0.4)'}`,
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.target.style.boxShadow = `0 0 20px ${formDetails?.button_bg_color || '#16bf4c'}`;
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.target.style.boxShadow = `0 0 15px ${formDetails?.button_bg_color ? formDetails.button_bg_color + '66' : 'rgba(22,191,76,0.4)'}`;
                                                    }}
                                                    disabled={submitLoading}
                                                >
                                                    {submitLoading ? (
                                                        <>
                                                            <Loader className="animate-spin mr-1" size={28} /> Submitting...
                                                        </>
                                                    ) : (
                                                        <>Submit</>
                                                    )}
                                                </Button>
                                            </form>
                                        </CardContent>
                                    </>
                                )}
                            </Card>
                        )}

                    </>
                )}
            </motion.div>
        </FloatingBackground>
    );
};

export default FormViewPage;
