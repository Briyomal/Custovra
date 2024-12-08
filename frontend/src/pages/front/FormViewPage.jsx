import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import useFormStore from "@/store/formStore" 
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
  } from "@/components/ui/card"
import FloatingBackground from "@/components/FloatingBackground";
import { motion } from "framer-motion";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Ban } from "lucide-react";
//import { StarIcon } from "lucide-react";

const FormViewPage = () => {
    const { viewForm } = useFormStore();
    const { formId } = useParams();
    const [loading, setLoading] = useState(false);
    const [formDetails, setFormDetails] = useState(null);
    const [error, setError] = useState(null);

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
    

    console.log("Form details:", formDetails);
    //const { default_fields = [] } = formDetails.default_fields || {}; 

    if (loading) {
        return <p>Loading form details...</p>;
    }

    if (error) {
        return <p>Error: {error}</p>;
    }

    if (!formDetails) {
        return <p>No form details found.</p>;
    }

    return (
        <>
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
                        <CardDescription className="pb-3">This form is currently inactive. Please check back later or contact the form owner for more details.</CardDescription>
                    </Card>
                ) : (
                    <Card className="text-center p-4">
                        <CardHeader>
                            <CardTitle>{formDetails.form_name}</CardTitle>
                            {formDetails.logo && (
                                <img
                                    src={`http://localhost:5000${formDetails.logo}`}
                                    alt="Uploaded"
                                    className="mt-1 w-48 h-auto rounded-md text-center mx-auto"
                                />
                            )}
                            
                            {formDetails.form_description?.trim() && (
                                <CardDescription>{formDetails.form_description}</CardDescription>
                            )}
                        </CardHeader>
                        <CardContent>
                            <form className="grid gap-6 py-4 text-left">
                                {formDetails.default_fields
                                    .filter((field) => field.enabled) // Filter only enabled fields
                                    .map((field, index) => (
                                        <div key={field._id || index} className="flex flex-col space-y-2">
                                            <Label className="capitalize font-medium text-gray-700">
                                                {field.field_name || `Field ${index + 1}`}
                                                {field.is_required && (
                                                    <span className="text-red-500 ml-1">*</span>
                                                )}
                                            </Label>
                                            
                                            {field.field_type === "textarea" ? (
                                                <Textarea
                                                    name={field.field_name}
                                                    placeholder={field.placeholder || ""}
                                                    defaultValue={field.value || ""}
                                                    required={field.is_required}
                                                />
                                            ) : field.field_type === "rating" ? (
                                                <div className="flex space-x-1">
                                                    {Array.from({ length: 5 }).map((_, starIndex) => (
                                                        <svg
                                                            key={starIndex}
                                                            xmlns="http://www.w3.org/2000/svg"
                                                            className={`w-5 h-5 ${
                                                                starIndex < field.value ? "text-yellow-400" : "text-gray-400"
                                                            }`}
                                                            fill="currentColor"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                                                        </svg>
                                                    ))}
                                                </div>
                                            ) : (
                                                <Input
                                                    name={field.field_name}
                                                    type={field.field_type || "text"} // Default to "text" if type is not specified
                                                    placeholder={field.placeholder || ""}
                                                    defaultValue={field.value || ""}
                                                    required={field.is_required}
                                                />
                                            )}
                                        </div>
                                    ))}
                                <Button
                                    type="submit"
                                    className="text-md w-full bg-gradient-to-r from-blue-600 to-indigo-700 text-white hover:from-blue-700 hover:to-indigo-800"
                                >
                                    Submit
                                </Button>
                            </form>
                        </CardContent>
                        <CardFooter>
                        </CardFooter>
                    </Card>

                )}
            </motion.div>

        </FloatingBackground>
        </>
    );
};

export default FormViewPage;