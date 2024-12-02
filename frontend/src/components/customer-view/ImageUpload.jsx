
import { ImageUp } from "lucide-react";
import { useState } from "react";
import { useDropzone } from "react-dropzone";

const ImageUpload = () => {
  const [uploadedImage, setUploadedImage] = useState(null);

  const onDrop = (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setUploadedImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".png", ".jpg", ".gif"],
    },
    multiple: false,
  });

  return (
    <div className="flex flex-col items-center space-y-4">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-6 w-full max-w-lg ${
          isDragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 bg-gray-50 dark:bg-gray-800 dark:border-gray-600"  
        } cursor-pointer hover:border-blue-500 transition`}
      >
        <input {...getInputProps()} />
        <div className="text-center">
          {isDragActive ? (
            <>
                <ImageUp className="w-10 h-16 text-blue-500"/>
                <p className="text-blue-500">Drop your image here...</p>
            </>
          ) : (
            <p className="text-gray-500 flex flex-col items-center">
                <ImageUp className="w-10 h-16 text-blue-500"/>
              Drag & drop an image here, or <span className="text-blue-500 underline">click to upload</span>
            </p>
          )}
          <p className="text-sm text-gray-400 mt-1">JPEG, PNG, JPG, GIF</p>
        </div>
      </div>
      {uploadedImage && (
        <div className="mt-4">
          <h2 className="text-lg font-semibold text-gray-700">Preview:</h2>
          <img
            src={uploadedImage}
            alt="Uploaded"
            className="mt-2 rounded-lg border shadow-md w-full max-w-lg"
          />
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
