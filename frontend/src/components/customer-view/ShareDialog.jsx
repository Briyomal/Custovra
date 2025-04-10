import { Dialog, DialogContent } from "@/components/ui/dialog";
import FormQR from "@/components/customer-view/FormQR";
import FormQRSkelton from "@/components/customer-view/FormQRSkelton";
import { useState, useEffect } from "react";
import axios from "axios";

const ShareDialog = ({ formId, isOpen, setIsOpen }) => {
    const [previewLoading, setPreviewLoading] = useState(false);
    const [previewDetails, setPreviewDetails] = useState(null);

    useEffect(() => {
        if (isOpen && formId) {
            const fetchPreviewDetails = async () => {
                try {
                    setPreviewLoading(true);
                    const response = await axios.get(`${import.meta.env.VITE_SERVER_URL}/api/forms/${formId}`);
                    setPreviewDetails(response.data);
                } catch (error) {
                    console.error("Error fetching preview details:", error);
                } finally {
                    setPreviewLoading(false);
                }
            };
            fetchPreviewDetails();
        }
    }, [isOpen, formId]);

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-[500px] py-6 px-4 md:p-10 max-w-[calc(100%-2rem)] rounded-md">
                {previewLoading ? (
                    <FormQRSkelton />
                ) : (
                    <FormQR formLink={previewDetails} />
                )}
            </DialogContent>
        </Dialog>
    );
};

export default ShareDialog;
