import { ImageUp, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import imageCompression from "browser-image-compression";

const ImageUpload = ({ existingImageUrl, onFileSelect, onRemoveImage, showRemoveButton = true }) => {
    const [uploadedImage, setUploadedImage] = useState(existingImageUrl || null);
    const [errorMessage, setErrorMessage] = useState("");

    // Update the state when the existingImageUrl prop changes
    useEffect(() => {
        // If it's already a full URL (including S3 presigned URLs), use it as is
        if (existingImageUrl && (existingImageUrl.startsWith('http') || existingImageUrl.startsWith('/public/'))) {
            if (existingImageUrl.startsWith('/public/')) {
                setUploadedImage(`${import.meta.env.VITE_SERVER_URL}${existingImageUrl}`);
            } else {
                setUploadedImage(existingImageUrl);
            }
        } else if (existingImageUrl) {
            // For S3 keys, we need to generate a presigned URL
            // In this case, we'll just show the key as a placeholder
            // The parent component should handle URL generation
            setUploadedImage(existingImageUrl);
        } else {
            setUploadedImage(null);
        }
    }, [existingImageUrl]);

    const compressAndConvertToWebP = async (file) => {
        try {
            // Compress the image with browser-image-compression
            const options = {
                maxSizeMB: 1,
                maxWidthOrHeight: 1920,
                useWebWorker: true,
            };
            
            const compressedFile = await imageCompression(file, options);
            
            // Convert to WebP format
            const webpBlob = await convertToWebP(compressedFile);
            
            // Create a new File object with .webp extension
            const webpFile = new File([webpBlob], `${file.name.split('.')[0]}.webp`, {
                type: 'image/webp'
            });
            
            return webpFile;
        } catch (error) {
            console.error("Error compressing or converting image:", error);
            // Return original file if compression/conversion fails
            return file;
        }
    };

    const convertToWebP = (file) => {
        return new Promise((resolve, reject) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();
            
            img.onload = () => {
                canvas.width = img.width;
                canvas.height = img.height;
                
                ctx.drawImage(img, 0, 0);
                
                canvas.toBlob(
                    (blob) => {
                        if (blob) {
                            resolve(blob);
                        } else {
                            reject(new Error('Failed to convert to WebP'));
                        }
                    },
                    'image/webp',
                    0.8 // Quality factor
                );
            };
            
            img.onerror = (error) => {
                reject(error);
            };
            
            img.src = URL.createObjectURL(file);
        });
    };

    const onDrop = async (acceptedFiles, fileRejections) => {
        // Clear any previous error messages
        setErrorMessage("");
        
        // Handle file rejection errors
        if (fileRejections.length > 0) {
            const { errors } = fileRejections[0];
            console.error("File rejection errors:", errors);
            const fileType = fileRejections[0]?.file?.type;
            const fileName = fileRejections[0]?.file?.name;
            console.error(`File rejected: ${fileName} (${fileType})`);
            
            // Set a user-friendly error message
            setErrorMessage("Only JPG, JPEG, PNG, and WEBP files are allowed.");
            return;
        }
        
        const file = acceptedFiles[0];
        if (file) {
            // Validate file type
            const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
            if (!validTypes.includes(file.type.toLowerCase())) {
                setErrorMessage("Only JPG, JPEG, PNG, and WEBP files are allowed.");
                return;
            }
            
            // Show preview of original image immediately
            setUploadedImage(URL.createObjectURL(file));
            
            // Compress and convert the image
            try {
                const processedFile = await compressAndConvertToWebP(file);
                
                // Update preview with processed image
                setUploadedImage(URL.createObjectURL(processedFile));
                
                if (onFileSelect) {
                    onFileSelect(processedFile); // Pass the processed file to the parent component
                }
            } catch (error) {
                console.error("Error processing image:", error);
                setErrorMessage("Error processing image. Please try another file.");
            }
        }
    };

    const handleRemoveImage = () => {
        setUploadedImage(null);
        setErrorMessage("");
        if (onRemoveImage) {
            onRemoveImage(); // Notify parent component that image should be removed
        }
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            "image/*": [".jpeg", ".png", ".jpg", ".webp"],
        },
        multiple: false,
        maxSize: 1048576, // 1MB in bytes
    });

    return (
        <>
            <div>
                <Label className="text-md font-medium">Logo</Label>
            </div>
            <div className="flex flex-col items-center space-y-4 mt-4">
                {/* Combined Dropzone with Preview */}
                <div
                    {...getRootProps()}
                    className={`border-2 border-dashed rounded-lg p-6 w-full max-w-lg min-h-[160px] content-center relative ${isDragActive
                            ? "border-blue-500 bg-blue-50 dark:bg-slate-900 dark:border-gray-500"
                            : "border-gray-300 bg-gray-50 dark:bg-slate-950 dark:border-gray-600"
                        } cursor-pointer hover:border-blue-500 transition dark:hover:border-blue-400`}
                >
                    <input {...getInputProps()} />
                    
                    {/* Display the preview if an image is uploaded or an existing image is available */}
                    {uploadedImage ? (
                        <div className="flex flex-col items-center">
                            <img
                                src={uploadedImage}
                                alt="Uploaded"
                                className="max-h-40 max-w-full rounded-md mb-2"
                            />
                            {showRemoveButton && (
                                <Button
                                    type="button"
                                    variant="destructive"
                                    size="sm"
                                    className="absolute top-2 right-2"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleRemoveImage();
                                    }}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    ) : (
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
                                Supports: JPG, JPEG, PNG, WEBP (max 1MB)
                            </p>
                        </div>
                    )}
                </div>
                
                {/* Error message display */}
                {errorMessage && (
                    <div className="text-red-500 text-sm mt-2">
                        {errorMessage}
                    </div>
                )}
            </div>
        </>
    );
};

export default ImageUpload;