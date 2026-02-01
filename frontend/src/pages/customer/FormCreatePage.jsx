import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import axios from "axios";
import CustomerLayoutPage from "./LayoutPage";
import FormBuilder from "@/components/customer-view/FormBuilder";
import { Loader, QrCode, Save, ScanSearch, SquareArrowOutUpRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import toast from "react-hot-toast";
import useFormStore from "@/store/formStore";
import FormPreview from "@/components/customer-view/FormPreview";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import FormPreviewSkelton from "@/components/customer-view/FormPreviewSkelton";
import ShareDialog from "@/components/customer-view/ShareDialog";
import FormSidebar from "@/components/customer-view/FormSidebar";
import { useAuthStore } from "@/store/authStore";

const FormCreatePage = () => {
	const [formDetails, setFormDetails] = useState({}); // State for form details
	const { formId } = useParams();
	const [loading, setLoading] = useState(false);
	const [loadingForm, setLoadingForm] = useState(false);
	const [previewLoading, setPreviewLoading] = useState(false);
	const [previewDetails, setPreviewDetails] = useState(null); // For fetching preview details
	const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
	const [error, setError] = useState(null);
	const [fields, setFields] = useState([]);
	const [selectedImage, setSelectedImage] = useState(null);
	const [removeLogo, setRemoveLogo] = useState(false);

	const { user } = useAuthStore();



	// Check if image upload is enabled for the user's plan
	const isImageUploadEnabled = user?.subscription?.features?.image_upload || false;
	const isEmployeeManagementEnabled = user?.subscription?.features?.employee_management || false;


	const { updateForm } = useFormStore();

	// Fetch form details using the form ID
	useEffect(() => {
		const fetchFormDetails = async () => {
			try {
				setLoading(true);

				const response = await axios.get(`${import.meta.env.VITE_SERVER_URL}/api/forms/${formId}`);
				const fetchedDetails = response.data;

				// Check if form is locked
				if (fetchedDetails.isLocked) {
					setError(`This form is locked due to plan restrictions. ${fetchedDetails.lockStatus?.lockReason || 'Upgrade your plan to access it.'}`);
					return;
				}

				// Check if default_fields is empty or undefined, and assign default values
				const baseDefaultFields = [
					{ field_name: "Name", field_type: "text", is_required: false, enabled: true, position: 1, placeholder: "John Doe" },
					{ field_name: "Email", field_type: "email", is_required: true, enabled: true, position: 2, placeholder: "mail@example.com" },
					{ field_name: "Phone", field_type: "tel", is_required: false, enabled: true, position: 3, placeholder: "+123456789" },
					{ field_name: "Rating", field_type: "rating", is_required: false, enabled: true, position: 4, placeholder: "" },
					{ field_name: "Comment", field_type: "textarea", is_required: false, enabled: true, position: 5, placeholder: "Write your review" },
				];

				// Only add Image field if plan allows it
				if (isImageUploadEnabled) {
					baseDefaultFields.push({
						field_name: "Image",
						field_type: "image",
						is_required: false,
						enabled: true,
						position: 6,
						placeholder: "Upload an image",
					});
				}

				if (!Array.isArray(fetchedDetails.default_fields) || fetchedDetails.default_fields.length === 0) {
					fetchedDetails.default_fields = baseDefaultFields;
				} else if (!isImageUploadEnabled) {
					// Remove image field if it exists in DB
					fetchedDetails.default_fields = fetchedDetails.default_fields.filter(
						(field) => field.field_type !== "image"
					);
				}

				setFormDetails(fetchedDetails); // Set updated form details
			} catch (error) {
				// Handle locked form errors specifically
				if (error.response?.status === 403 && error.response?.data?.locked) {
					setError(`🔒 This form is locked due to plan restrictions. ${error.response.data.lockReason || 'Upgrade your plan to access it.'}`);
				} else {
					setError(error.response?.data?.message || "Something went wrong!"); // Store error message
				}
			} finally {
				setLoading(false);
			}
		};

		fetchFormDetails();
	}, [formId, isImageUploadEnabled]);

	// Fetch preview details on demand
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

	const handleFieldUpdate = (field, value) => {
		setFormDetails((prevDetails) => ({
			...prevDetails,
			[field]: value,
		}));
	};

	const handleFileSelect = (file) => {
		if (!file) return;

		// Updated to include WebP files
		const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
		const maxSize = 2 * 1024 * 1024; // 2MB

		if (!validTypes.includes(file.type)) {
			toast.error("Only JPG, JPEG, PNG, and WebP files are allowed.");
			return;
		}

		if (file.size > maxSize) {
			toast.error("Image size should not exceed 2MB.");
			return;
		}

		setSelectedImage(file);
		setRemoveLogo(false); // Reset remove logo flag when selecting a new image
	};

	const handleRemoveLogo = () => {
		setSelectedImage(null);
		setRemoveLogo(true);
	};

	const handlePublish = async () => {
		setLoadingForm(true);
		try {
			// Validate the Google link if provided
			const googleLink = formDetails.google_link ? formDetails.google_link.trim() : "";
			if (googleLink && !googleLink.startsWith("https://g.page") && !googleLink.startsWith("https://www.google.com")) {
				toast.error("Invalid URL. Must start with https://g.page or https://www.google.com");
				setLoadingForm(false);
				return;
			}

			// Validate essential form fields
			if (!formDetails.form_name || !formDetails.form_type) {
				toast.error("Form name and type are required");
				setLoadingForm(false);
				return;
			}

			// If no fields at all, apply defaults
			let allFields = fields;

			if (fields.length === 0) {
				allFields = [
					{ label: "Name", type: "text", is_required: false, enabled: true, position: 1, placeholder: "John Doe" },
					{ label: "Email", type: "email", is_required: true, enabled: true, position: 2, placeholder: "mail@example.com" },
					{ label: "Phone", type: "tel", is_required: false, enabled: true, position: 3, placeholder: "+123456789" },
					{ label: "Rating", type: "rating", is_required: true, enabled: true, position: 4, placeholder: "" },
					{ label: "Comment", type: "textarea", is_required: false, enabled: true, position: 5, placeholder: "Write your review" },
				];

				// ✅ Only add Image field if plan allows it
				if (isImageUploadEnabled) {
					allFields.push({
						label: "Image",
						type: "image",
						is_required: false,
						enabled: true,
						position: 6,
						placeholder: "Upload an image",
					});
				}
			}

			// ✅ Remove image field if plan does not allow it (safety for existing forms)
			if (!isImageUploadEnabled) {
				allFields = allFields.filter((field) => field.type !== "image");
			}
			// Ensure at least one field is enabled and required
			const hasEnabledAndRequiredField = fields.some((field) => field.enabled && field.is_required);
			if (!hasEnabledAndRequiredField) {
				toast.error("At least one field must be both enabled and required.");
				setLoadingForm(false);
				return;
			}
			// Separate default and custom fields
			const defaultFields = allFields
				.filter((field) => !field.isNew)
				.map((field) => {
					const processedField = {
						label: field.label,
						type: field.type,
						isRequired: field.is_required,
						enabled: field.enabled,
						position: field.position,
						placeholder: field.placeholder || "",
						employees: field.employees || [],
						// Filter out empty options
						options: field.options ? field.options.filter(option => option && option.trim() !== "") : [],
						hasEmployeeRating: field.hasEmployeeRating !== undefined ? field.hasEmployeeRating : false
					};
					return processedField;
				});

			const customFieldPayloads = allFields
				.filter((field) => field.isNew)
				.map((field) => {
					const processedField = {
						//form_id: formDetails._id,
						label: field.label,
						type: field.type,
						isRequired: field.is_required,
						enabled: field.enabled,
						position: field.position,
						placeholder: field.placeholder || "",
						is_new: true,
						employees: field.employees || [],
						// Filter out empty options
						options: field.options ? field.options.filter(option => option && option.trim() !== "") : [],
						hasEmployeeRating: field.hasEmployeeRating !== undefined ? field.hasEmployeeRating : false
					};
					return processedField;
				});

			// Prepare form payload with proper validation and defaults
			const formPayload = {
				form_name: formDetails.form_name || "",
				form_note: formDetails.form_note || "",
				form_type: formDetails.form_type || "",
				form_description: formDetails.form_description || "",
				google_link: (formDetails.google_link && formDetails.google_link.trim()) || "",
				is_active: formDetails.is_active !== undefined ? formDetails.is_active : false,
				button_bg_color: formDetails.button_bg_color || '#16bf4c',
				button_text_color: formDetails.button_text_color || '#000000',
				default_fields: defaultFields,
			};

			// Use FormData to send with optional image - ensure no undefined values
			const formData = new FormData();
			for (const key in formPayload) {
				const value = formPayload[key];

				// Skip undefined or null values
				if (value === undefined || value === null) {
					continue;
				}

				if (key === "default_fields") {
					formData.append(key, JSON.stringify(value));
				} else {
					// Ensure we're not appending 'undefined' as string
					formData.append(key, String(value));
				}
			}

			// Handle logo removal
			if (removeLogo) {
				formData.append("remove_logo", "true");
			}

			// Handle image upload
			if (selectedImage) {
				formData.append("image", selectedImage);
			}

			// Save the form
			formData.append("custom_fields", JSON.stringify(customFieldPayloads));

			await updateForm(formDetails._id, formData);

			toast.success("Form saved successfully!");

			// Reset logo states after successful save
			setRemoveLogo(false);
			setSelectedImage(null);

			// Refresh form details to get updated logo info
			try {
				const response = await axios.get(`${import.meta.env.VITE_SERVER_URL}/api/forms/${formId}`);
				const fetchedDetails = response.data;
				setFormDetails(fetchedDetails);
			} catch (error) {
				console.error("FormCreatePage: Error refreshing form details:", error);
			}
		} catch (error) {
			// Handle locked form errors specifically
			if (error.response?.status === 403 && error.response?.data?.locked) {
				toast.error(`🔒 ${error.response.data.message}`);
			} else {
				toast.error(error.response?.data?.message || "Error publishing form");
			}
		} finally {
			setLoadingForm(false);
		}
	};

	return (
		<CustomerLayoutPage>
			{error ? (
				<div className="text-center mt-20 space-y-4">
					<h1 className="text-2xl font-bold text-red-700">🙁 {error}</h1>
					<p className="text-gray-600 mt-2">Please check if the form ID is correct or ensure that you are authorized to view this form.</p>
					{error.includes('locked') && (
						<div className="mt-4">
							<Button
								onClick={() => window.open('/billing', '_blank')}
								ClassName="rounded-md font-semibold text-black border
                                                          border-lime-500
                                                            bg-gradient-to-r from-[#16bf4c] to-lime-500
                                                            transition-all duration-200 ease-in-out 
                                                            hover:shadow-[0_0_15px_rgba(22,191,76,0.4)] 
                                                            focus:outline-none focus:ring-2 focus:ring-lime-400"
							>
								🚀 Upgrade Plan
							</Button>
						</div>
					)}
				</div>
			) : (
				<>
					<div className="flex justify-between border-b-2 p-4 gap-3 items-center ">
						{loading && (
							<div className="flex flex-col">
								<Skeleton className="w-20 h-6" />
								<Skeleton className="w-80 h-4 mt-2" />
							</div>
						)}

						{formDetails && (
							<div className="flex flex-col">
								<h2 className="text-lg  font-semibold">{formDetails.form_name}</h2>
								<p className="text-sm text-slate-600 dark:text-slate-400"> {formDetails.form_note}</p>
							</div>
						)}
						<div className="flex gap-2 items-center">
							<Dialog>
								<DialogTrigger asChild>
									<Button className="rounded-md font-semibold border 
               											border-[#16bf4c] text-[#16bf4c] dark:text-white bg-transparent 
               											hover:!text-[#000000] hover:border-lime-500 hover:bg-lime-500
               											transition-all duration-200 ease-in-out 
               											hover:shadow-[0_0_15px_rgba(22,191,76,0.4)] 
               											focus:outline-none focus:ring-2 focus:ring-lime-500" onClick={fetchPreviewDetails}>
										<ScanSearch /> Preview
									</Button>
								</DialogTrigger>
								<DialogContent className="sm:max-w-[500px] p-10">{previewLoading ? <FormPreviewSkelton /> : <FormPreview formPreview={previewDetails} />}</DialogContent>
							</Dialog>

							<Dialog>
								<DialogTrigger asChild>
									<Button className="rounded-md font-semibold text-white border
                                                          border-lime-700
                                                            bg-gradient-to-r from-lime-700 to-green-800
                                                            transition-all duration-200 ease-in-out 
                                                            hover:shadow-[0_0_15px_rgba(22,191,76,0.4)] hover:from-green-600 hover:to-lime-600 
                                                            focus:outline-none focus:ring-2 focus:ring-lime-500" onClick={() => setIsShareDialogOpen(true)}>
										<QrCode />
										Share
									</Button>
								</DialogTrigger>
								<ShareDialog formId={formId} isOpen={isShareDialogOpen} setIsOpen={setIsShareDialogOpen} />
							</Dialog>

							{formDetails.is_active ? (
								<Button className="rounded-md font-semibold text-black border
                                                          border-lime-500
                                                            bg-gradient-to-r from-[#16bf4c] to-lime-500
                                                            transition-all duration-200 ease-in-out 
                                                            hover:shadow-[0_0_15px_rgba(22,191,76,0.4)] hover:from-lime-400 hover:to-[#1cbf16] 
                                                            focus:outline-none focus:ring-2 focus:ring-lime-400" onClick={handlePublish} disabled={loadingForm}>
									{loadingForm ? (
										<>
											<Loader className="animate-spin mx-auto mr-0.5" size={28} />
											Publishing...
										</>
									) : (
										<>
											<SquareArrowOutUpRight />
											Publish
										</>
									)}
								</Button>
							) : (
								<Button className="bg-gradient-to-r dark:from-green-900 dark:to-green-950 text-white dark:hover:from-green-800 dark:hover:to-green-800" onClick={handlePublish} disabled={loadingForm}>
									{loadingForm ? (
										<>
											<Loader className="animate-spin mx-auto mr-0.5" size={28} />
											Saving...
										</>
									) : (
										<>
											<Save />
											Save
										</>
									)}
								</Button>
							)}
						</div>
					</div>
					<div className="flex w-full flex-grow items-center justify-center relative overflow-y-auto h-[80vh]">
						<FormBuilder
							formDetails={formDetails}
							onFieldUpdate={handleFieldUpdate}
							onFileSelect={handleFileSelect}
							fields={fields}
							setFields={setFields}
							user={user}
							isImageUploadEnabled={isImageUploadEnabled}
							isEmployeeManagementEnabled={isEmployeeManagementEnabled}
						/>
						<FormSidebar
							formDetails={formDetails}
							onFieldUpdate={handleFieldUpdate}
							onFileSelect={handleFileSelect}
							onRemoveImage={handleRemoveLogo}
						/>
					</div>
				</>
			)}
		</CustomerLayoutPage>
	);
};

export default FormCreatePage;