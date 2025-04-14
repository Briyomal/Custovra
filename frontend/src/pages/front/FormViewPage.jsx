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
import { Button } from "@/components/ui/button";
import { Ban, Check, Loader } from "lucide-react";
import StarRating from "@/components/customer-view/StarRating";
import FormPreviewSkelton from "@/components/customer-view/FormPreviewSkelton";
import LoadingSpinner from "@/components/LoadingSpinner";
import useSubmissionStore from "@/store/submissionStore";
import toast from "react-hot-toast";

const FormViewPage = () => {
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


    useEffect(() => {
        const fetchFormDetails = async () => {
            setLoading(true);
            setError(null);
            try {
                const data = await viewForm(formId);
                if (data?.error) {
                    setError(data.error);
                } else {
                    setFormDetails(data);
                }
            } catch (err) {
                console.error("Error fetching form details:", err);
                setError("Failed to fetch form details. Please try again later.");
            } finally {
                setLoading(false);
            }
        };

        if (formId) {
            fetchFormDetails();
        }
    }, [formId, viewForm]);

    console.log("Form Details:", formDetails);

    const validateField = (name, value, field) => {
        if (field.is_required) {
            // Ensure `value` is processed appropriately for each field type
            const fieldValue = typeof value === "string" ? value.trim() : value;

            if (fieldValue === null || fieldValue === undefined || fieldValue === "") {
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

        console.log("Field Value:", e.target.value);
        console.log("Field Details:", field);
        const { name, value } = e.target;

        // Validate the field and update the errors object
        const error = validateField(name, value, field);
        setFormErrors((prev) => {
            const newErrors = { ...prev };
            if (error) {
                newErrors[name] = error;
                console.log("Validation Error:", error);
            } else {
                delete newErrors[name];
            }
            return newErrors;
        });

        // Update the value in the form details
        setFormDetails((prevDetails) => ({
            ...prevDetails,
            default_fields: prevDetails.default_fields.map((f) =>
                f.field_name === name ? { ...f, value } : f
            ),
        }));
    };

    /*
    const handleSubmit = (e) => {
        e.preventDefault();
    
        console.log("Form State on Submit:", formDetails);
    
        const formData = new FormData(e.target);
        let validationErrors = {};
    
        // Validate and ensure all required fields are included
        formDetails.default_fields.forEach((field) => {
            const value = field.field_type === "rating" ? field.value : formData.get(field.field_name)?.trim();
    
            if (field.is_required) {
                const error = validateField(field.field_name, value, field);
                if (error) {
                    validationErrors[field.field_name] = error;
                }
            }
    
            // Manually append the rating value to formData
            if (field.field_type === "rating") {
                formData.set(field.field_name, field.value);
            }
        });
    
        // If there are validation errors, update state and stop submission
        if (Object.keys(validationErrors).length > 0) {
            setFormErrors(validationErrors);
            console.log("Validation Errors:", validationErrors);
            return;
        }
    
        // Log all form data, including the rating
        console.log(
            "Form submitted with data:",
            Object.fromEntries(formData.entries())
        );
    
        // Perform the actual form submission logic here

    };
    */
    const handleSubmit = async (e) => {
        e.preventDefault();

        setSubmitLoading(true);

        try {
            console.log("Form State on Submit:", formDetails);

            const { submitForm, error } = useSubmissionStore.getState();
            const formData = new FormData(e.target);
            let validationErrors = {};
            let ratingValue = 0; // Store rating value

            // Validate and ensure all required fields are included
            formDetails.default_fields.forEach((field) => {
                const value = field.field_type === "rating" ? field.value : formData.get(field.field_name)?.trim();

                if (field.is_required) {
                    const error = validateField(field.field_name, value, field);
                    if (error) {
                        validationErrors[field.field_name] = error;
                    }
                }

                // Manually append the rating value to formData and Capture rating value
                if (field.field_type === "rating") {
                    ratingValue = field.value;
                    formData.set(field.field_name, field.value);
                }
            });

            // If there are validation errors, update state and stop submission
            if (Object.keys(validationErrors).length > 0) {
                setFormErrors(validationErrors);
                console.log("Validation Errors:", validationErrors);
                return;
            }

            // Prepare form details for submission
            const submissionDetails = {
                form_id: formDetails._id,
                user_id: formDetails.user_id,
                submissions: Object.fromEntries(formData.entries()),
            };

            console.log("Form submitted with data:", submissionDetails);

            // Submit the form
            await submitForm(submissionDetails);

            if (error) {
                toast.error("Form submission failed.");
                console.log("Submission Error:", error);
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
            console.error("Unexpected Error during submission:", err);
            toast.error("An unexpected error occurred during submission.");
        } finally {
            setSubmitLoading(false); // Ensure the loading state is reset regardless of success or failure
        }
    };


    if (loading || !formDetails) {
        return <LoadingSpinner />;
    }

    if (error) return <p>Error: {error}</p>;

    return (
        <FloatingBackground>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="max-w-lg w-full"
            >
                {!formDetails?.is_active ? (
                    <Card className="text-center p-4">
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
                                        <div className="flex justify-center gap-2 md:gap-4 mt-4">
                                            <Button
                                                className="text-md bg-gradient-to-r from-blue-600 to-indigo-700 text-white hover:from-blue-700 hover:to-indigo-800"
                                                onClick={() => window.open(googleLink, "_blank")}
                                            >
                                                Yes, Review on Google
                                            </Button>
                                            <Button

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
                            <Card className="text-center p-4">
                                {loading ? (
                                    <FormPreviewSkelton />
                                ) : (
                                    <>
                                        <CardHeader>
                                            <CardTitle>{formDetails?.form_name}</CardTitle>
                                            {formDetails.logo && (
                                                <img
                                                    src={`${import.meta.env.VITE_SERVER_URL}${formDetails.logo}`}
                                                    alt="Uploaded"
                                                    className="mt-1 w-48 h-auto rounded-md mx-auto"
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
                                                    .map((field, index) => (
                                                        <div key={field._id || `${field.field_name}-${index}`} className="flex flex-col space-y-2">
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
                                                                    rating={field.value || 0}
                                                                    onChange={(value) =>
                                                                        handleChange({ target: { name: field.field_name, value } }, field)
                                                                    }
                                                                />
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
                                                    ))}


                                                <Button
                                                    type="submit"
                                                    className="text-md w-full bg-gradient-to-r from-blue-600 to-indigo-700 text-white hover:from-blue-700 hover:to-indigo-800"
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

                                    </>)}
                            </Card>
                        )}

                    </>
                )}
            </motion.div>
        </FloatingBackground>
    );
};

export default FormViewPage;
