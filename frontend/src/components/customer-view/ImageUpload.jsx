import { ImageUp } from "lucide-react";
import { useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { Label } from "@/Components/ui/label";

const ImageUpload = ({ existingImageUrl, onFileSelect }) => {
    const [uploadedImage, setUploadedImage] = useState(existingImageUrl || null);

    // Update the state when the existingImageUrl prop changes
    useEffect(() => {
        if (existingImageUrl && existingImageUrl.startsWith('/public/')) {
            setUploadedImage(`http://localhost:5000${existingImageUrl}`);
        } else {
            setUploadedImage(existingImageUrl);
        }
    }, [existingImageUrl]);

    const onDrop = (acceptedFiles) => {
        const file = acceptedFiles[0];
        if (file) {
            setUploadedImage(URL.createObjectURL(file)); // Preview the new image
            if (onFileSelect) {
                onFileSelect(file); // Pass the file to the parent component
            }
        }
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            "image/*": [".jpeg", ".png", ".jpg"],
        },
        multiple: false,
    });

    return (
        <>
            <div>
                <Label className="text-md font-medium">Logo</Label>
            </div>
            <div className="flex flex-col items-center space-y-4 mt-4">
                {/* Display the preview if an image is uploaded or an existing image is available */}
                {uploadedImage && (
                    <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg bg-gray-100 dark:border-gray-600 dark:bg-slate-950">
                        <img
                            src={uploadedImage}
                            alt="Uploaded"
                            className="mt-1 w-full h-auto rounded-md "
                        />
                    </div>
                )}

                {/* Dropzone */}
                <div
                    {...getRootProps()}
                    className={`border-2 border-dashed rounded-lg p-6 w-full max-w-lg min-h-[160px] content-center ${isDragActive
                            ? "border-blue-500 bg-blue-50 dark:bg-slate-900 dark:border-gray-500"
                            : "border-gray-300 bg-gray-50 dark:bg-slate-950 dark:border-gray-600"
                        } cursor-pointer hover:border-blue-500 transition dark:hover:border-blue-400`}
                >
                    <input {...getInputProps()} />
                    <div className="text-center">
                        {isDragActive ? (
                            <div className="flex flex-col items-center">
                                <ImageUp strokeWidth={0.8} className="w-12 h-16 text-blue-500" />
                                <p className="text-blue-500">Drop your image here...</p>
                            </div>
                        ) : (
                            <div className="text-gray-500 flex flex-col items-center text-sm dark:text-gray-400">
                                <ImageUp strokeWidth={0.8} className="w-12 h-16 text-gray-400" />
                                <p>
                                    Drop your image here, or{" "}
                                    <span className="text-blue-400">browse</span>
                                </p>
                            </div>
                        )}
                        <p className="text-xs text-gray-400 mt-1 dark:text-gray-500">
                            Supports: JPG, JPEG, PNG
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
};

export default ImageUpload;
