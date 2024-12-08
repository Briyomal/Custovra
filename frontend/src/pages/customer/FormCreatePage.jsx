import { useParams, } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import axios from "axios";
import CustomerLayoutPage from "./LayoutPage";
import FormBuilder from "@/components/customer-view/FormBuilder";
import { Loader, QrCode, ScanSearch, SquareArrowOutUpRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton"
import toast from "react-hot-toast";
import useFormStore from "@/store/formStore"
import FormPreview from "@/components/customer-view/FormPreview";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import FormPreviewSkelton from "@/components/customer-view/FormPreviewSkelton";
import FormQR from "@/components/customer-view/FormQR";
import FormQRSkelton from "@/components/customer-view/FormQRSkelton";

const FormCreatePage = () => {
    const [formDetails, setFormDetails] = useState({}); // State for form details
    const { formId } = useParams();
    const [loading, setLoading] = useState(false);
    const [loadingForm, setLoadingForm] = useState(false);
    const [previewLoading, setPreviewLoading] = useState(false);
    const [previewDetails, setPreviewDetails] = useState(null); // For fetching preview details
    
    const { updateForm } = useFormStore();

    // Fetch form details using the form ID
    useEffect(() => {
        const fetchFormDetails = async () => {
            try {
                setLoading(true);

                const response = await axios.get(`http://localhost:5000/api/forms/${formId}`);
                setFormDetails(response.data); // Set form details
            } catch (error) {
                console.error("Error fetching form details:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchFormDetails();
    }, [formId]);

    // Fetch preview details on demand
    const fetchPreviewDetails = async () => {
        try {
            setPreviewLoading(true);
            const response = await axios.get(`http://localhost:5000/api/forms/${formId}`);
            setPreviewDetails(response.data);
        } catch (error) {
            console.error("Error fetching preview details:", error);
        } finally {
            setPreviewLoading(false);
        }
    };

    const handleFieldUpdate = (field, value) => {
        setFormDetails((prevDetails) => ({
            ...prevDetails,
            [field]: value,
        }));
    };

    const [selectedImage, setSelectedImage] = useState(null);
 
    const handleFileSelect = (file) => {
        setSelectedImage(file); // This should set the selected image in state
        console.log("Selected Image:", file);
      };

      const handlePublish = async () => {
        setLoadingForm(true);
        try {
            let fields = formDetails.default_fields.map((field) => ({
                label: field.field_name,
                type: field.field_type,
                isRequired: field.is_required,
                enabled: field.enabled,
                position: field.position,
                placeholder: field.placeholder || "",
            }));

                    // Check if mapped fields are empty, and add default fields as fallback
        if (fields.length === 0) {
            fields = [
                { label: "Name", type: "text", isRequired: false, enabled: true, position: 1, placeholder: "John Doe" },
                { label: "Email", type: "email", isRequired: true, enabled: true, position: 2, placeholder: "mail@example.com" },
                { label: "Phone", type: "phone", isRequired: false, enabled: true, position: 3, placeholder: "+123456789" },
                { label: "Rating", type: "rating", isRequired: false, enabled: true, position: 4, placeholder: "" },
                { label: "Comment", type: "textarea", isRequired: false, enabled: true, position: 5, placeholder: "Write your review" },
            ];
            console.log("Fields were empty, default fields added:", fields);
        }
    
            console.log("Mapped Fields:", fields);
    
            // Create FormData object
            const formData = new FormData();
            formData.append("form_name", formDetails.form_name);
            formData.append("form_note", formDetails.form_note);
            formData.append("form_type", formDetails.form_type);
            formData.append("fields", JSON.stringify(fields)); // Convert fields array to a string
            formData.append("form_description", formDetails.form_description);
            formData.append("is_active", formDetails.is_active);

            console.log("Form Data Handle Publish:", formData);
    
            // Append the image file only if it's selected
            if (selectedImage) {
                formData.append("image", selectedImage); // 'image' must match the field name in `upload.single('image')`
            }
    
            // Call the update function
            await updateForm(formDetails._id, formData);
    
            toast.success("Form published successfully!", {
                style: {
                    borderRadius: "10px",
                    background: "#222",
                    color: "#fff",
                    padding: "10px",
                    textAlign: "center",
                    marginBottom: "10px",
                },
            });
    
        } catch (error) {
            toast.error("Error publishing form", {
                style: {
                    borderRadius: "10px",
                    background: "#222",
                    color: "#fff",
                    padding: "10px",
                    textAlign: "center",
                    marginBottom: "10px",
                },
            });
            console.error("Error publishing form:", error);
        } finally {
            setLoadingForm(false);
        }
    };

    const handleShare = async () => {      try {
        setPreviewLoading(true);
        const response = await axios.get(`http://localhost:5000/api/forms/${formId}`);
        setPreviewDetails(response.data);
    } catch (error) {
        console.error("Error fetching preview details:", error);
    } finally {
        setPreviewLoading(false);
    }
    }
console.log("Form Details:", formDetails);
    return (
        <CustomerLayoutPage>
            <div className="flex justify-between border-b-2 p-4 gap-3 items-center ">
                {loading &&
                    <div className="flex flex-col">
                        <Skeleton className="w-20 h-6" />
                        <Skeleton className="w-80 h-4 mt-2" />
                    </div>
                }
                {formDetails && (
                    <div className="flex flex-col">
                        <h2 className="text-lg  font-semibold">
                            {formDetails.form_name}
                        </h2>
                        <p className="text-sm text-slate-600 dark:text-slate-400"> {formDetails.form_note}</p>
                    </div>
                )}
                <div className="flex gap-2 items-center">
                    <Dialog>
                        <DialogTrigger asChild>
                        <Button 
                            variant="outline"
                            onClick={fetchPreviewDetails}
                        >
                            <ScanSearch /> Preview</Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px] p-10">
                            {previewLoading ? (
                                    <FormPreviewSkelton />
                            ) : (
                                <FormPreview formPreview={previewDetails} />
                            )}
                        </DialogContent>
                    </Dialog>
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button 
                                variant="secondary"
                                onClick={handleShare}
                            >
                                <QrCode />
                                Share
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px] p-10">
                            {previewLoading ? (
                                    <FormQRSkelton />
                            ) : (
                                <FormQR formLink={previewDetails} />
                            )}
                        </DialogContent>
                    </Dialog>
                    <Button
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-800"
                        onClick={handlePublish}
                        disabled={loadingForm}
                    >
                        {loadingForm ? (
                            <>
                                <Loader className="animate-spin mx-auto mr-0.5" size={28} />Publishing...
                            </>
                        ) : (
                            <>
                                <SquareArrowOutUpRight />
                                Publish
                            </>
                        )}
                    </Button>
                </div>
            </div>
            <div className="flex w-full flex-grow items-center justify-center relative overflow-y-auto h-[80vh]">
                <FormBuilder
                    formDetails={formDetails}
                    onFieldUpdate={handleFieldUpdate}
                    onFileSelect={handleFileSelect}
                />
            </div>
        </CustomerLayoutPage >
    )
}

export default FormCreatePage
