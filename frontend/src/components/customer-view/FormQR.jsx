import {
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Copy, Download, Printer } from "lucide-react";
import toast from "react-hot-toast";
import { QRCodeCanvas } from "qrcode.react"; // Use QRCodeCanvas for canvas rendering

const FormQR = ({ formLink }) => {
    const fullUrl = `${import.meta.env.VITE_CLIENT_URL}/forms${formLink?.form_link}`;

    const handleCopy = () => {
        navigator.clipboard.writeText(fullUrl) // Copy to clipboard
            .then(() => {
                toast.success("Link copied to clipboard!"); // Optional: Success toast
            })
            .catch(() => {
                toast.error("Failed to copy the link."); // Optional: Error toast
            });
    };

    const handleDownload = () => {
        const canvas = document.getElementById("qr-code-canvas");
        const link = document.createElement("a");
        link.href = canvas.toDataURL("image/png"); // Export canvas as PNG
        link.download = "qr-code.png"; // Set download filename
        link.click();
    };

    const handlePrint = () => {
        const canvas = document.getElementById("qr-code-canvas");
    
        if (!canvas) {
            toast.error("QR Code not found for printing.");
            return;
        }
    
        // Convert canvas to PNG data URL
        const qrImage = canvas.toDataURL("image/png");
    
        // Create a temporary iframe for printing
        const iframe = document.createElement("iframe");
        iframe.style.position = "absolute";
        iframe.style.width = "0px";
        iframe.style.height = "0px";
        iframe.style.border = "none";
        document.body.appendChild(iframe);
    
        // Write the QR code image into the iframe's document
        const iframeDoc = iframe.contentWindow.document;
        iframeDoc.open();
        iframeDoc.write(`
            <html>
                <head>
                    <title>Print QR Code</title>
                    <style>
                        body {
                            display: flex;
                            justify-content: center;
                            align-items: center;
                            height: 100vh;
                            margin: 0;
                            background-color: white;
                        }
                        img {
                            width: 300px;
                            height: 300px;
                        }
                    </style>
                </head>
                <body>
                    <img id="qr-img" src="${qrImage}" />
                </body>
            </html>
        `);
        iframeDoc.close();
    
        // Use setTimeout to ensure the iframe is fully loaded before printing
        setTimeout(() => {
            const qrImg = iframe.contentWindow.document.getElementById("qr-img");
            
            // Check if the image is rendered, then trigger print
            if (qrImg.complete) {
                iframe.contentWindow.focus();
                iframe.contentWindow.print();
    
                // Optionally remove the iframe after printing
                setTimeout(() => {
                    document.body.removeChild(iframe);
                }, 500);
            } else {
                toast.error("QR Code failed to load for printing.");
            }
        }, 500); // Wait 500ms before triggering print
    };
    
    return (
        <>
            <DialogHeader className="text-left md:text-center">
                <DialogTitle>Share link</DialogTitle>
                <DialogDescription>
                    Anyone who has this link will be able to view this form.
                </DialogDescription>
            </DialogHeader>

            {!formLink?.form_link ? (
                <p className="text-red-500"> Please publish the form first</p>
            ) : (
                <div className="flex items-center space-x-2">
                    <div className="grid flex-1 gap-2">
                        <Label htmlFor="link" className="sr-only">
                            Link
                        </Label>
                        <Input
                            id="link"
                            defaultValue={`${import.meta.env.VITE_CLIENT_URL}/forms${formLink?.form_link}`}
                            readOnly
                        />
                    </div>
                    <Button
                        type="submit"
                        size="sm"
                        className="px-3"
                        onClick={handleCopy}
                    >
                        <span className="sr-only">Copy</span>
                        <Copy />
                    </Button>
                </div>
            )}

            {/* Generate QR Code using QRCodeCanvas */}
            {formLink?.form_link && (
                <div className="mt-4 flex flex-col items-center space-y-5">
                    <QRCodeCanvas
                        id="qr-code-canvas"
                        value={fullUrl}
                        marginSize={3}
                        size={300} // Set the QR Code size to 500px
                    />
                    <div className="space-x-2">
                        <Button variant="outline" onClick={handlePrint}>
                            <Printer /> Print
                        </Button>
                        <Button variant="secondary" onClick={handleDownload}>
                            <Download /> Download
                        </Button>
                    </div>
                </div>
            )}

            <DialogFooter className="sm:justify-start"></DialogFooter>
        </>
    );
};

export default FormQR;
