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

	const { updateForm } = useFormStore();

	// Fetch form details using the form ID
	useEffect(() => {
		const fetchFormDetails = async () => {
			try {
				setLoading(true);

				const response = await axios.get(`${import.meta.env.VITE_SERVER_URL}/api/forms/${formId}`);
				const fetchedDetails = response.data;

				// Check if default_fields is empty or undefined, and assign default values
				if (!Array.isArray(fetchedDetails.default_fields) || fetchedDetails.default_fields.length === 0) {
					fetchedDetails.default_fields = [
						{ field_name: "Name", field_type: "text", is_required: false, enabled: true, position: 1, placeholder: "John Doe" },
						{ field_name: "Email", field_type: "email", is_required: true, enabled: true, position: 2, placeholder: "mail@example.com" },
						{ field_name: "Phone", field_type: "tel", is_required: false, enabled: true, position: 3, placeholder: "+123456789" },
						{ field_name: "Rating", field_type: "rating", is_required: false, enabled: true, position: 4, placeholder: "" },
						{ field_name: "Comment", field_type: "textarea", is_required: false, enabled: true, position: 5, placeholder: "Write your review" },
					];
				}
				console.log("Fetched form details main:", fetchedDetails);
				setFormDetails(fetchedDetails); // Set updated form details
			} catch (error) {
				console.error("Error fetching form details:", error);
				setError(error.response?.data?.message || "Something went wrong!"); // Store error message
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

	const [selectedImage, setSelectedImage] = useState(null);

	const handleFileSelect = (file) => {
		if (!file) return;

		const validTypes = ["image/jpeg", "image/jpg", "image/png"];
		const maxSize = 1024 * 1024; // 1MB

		if (!validTypes.includes(file.type)) {
			toast.error("Only JPG, JPEG, and PNG files are allowed.");
			return;
		}

		if (file.size > maxSize) {
			toast.error("Image size should not exceed 1MB.");
			return;
		}

		setSelectedImage(file);
		console.log("Selected Image:", file);
	};

	const handlePublish = async () => {
		setLoadingForm(true);
		try {
			// Validate the Google link
			if (formDetails.google_link && !formDetails.google_link.startsWith("https://g.page") && !formDetails.google_link.startsWith("https://www.google.com")) {
				toast.error("Invalid URL. Must start with https://g.page or https://www.google.com");
				setLoadingForm(false);
				return;
			}

			console.log("Form details before update:", formDetails);

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
				.map((field) => ({
					label: field.label,
					type: field.type,
					isRequired: field.is_required,
					enabled: field.enabled,
					position: field.position,
					placeholder: field.placeholder || "",
				}));

			const customFieldPayloads = allFields
				.filter((field) => field.isNew)
				.map((field) => ({
					//form_id: formDetails._id,
					label: field.label,
					type: field.type,
					isRequired: field.is_required,
					enabled: field.enabled,
					position: field.position,
					placeholder: field.placeholder || "",
					is_new: true,
				}));

			// Prepare form payload
			const formPayload = {
				form_name: formDetails.form_name,
				form_note: formDetails.form_note,
				form_type: formDetails.form_type,
				form_description: formDetails.form_description || "",
				google_link: formDetails.google_link || "",
				is_active: formDetails.is_active,
				default_fields: defaultFields,
			};

			// Use FormData to send with optional image
			const formData = new FormData();
			for (const key in formPayload) {
				if (key === "default_fields") {
					formData.append(key, JSON.stringify(formPayload[key]));
				} else {
					formData.append(key, formPayload[key]);
				}
			}

			if (selectedImage) {
				formData.append("image", selectedImage);
			}

			// Save the form
			formData.append("custom_fields", JSON.stringify(customFieldPayloads));
			console.log("🚀 FormData (before sending):");
			for (let pair of formData.entries()) {
				console.log(pair[0], ":", pair[1]);
			}
			await updateForm(formDetails._id, formData);

			toast.success("Form saved successfully!");
		} catch (error) {
			toast.error("Error publishing form");
			console.error("Error publishing form:", error);
		} finally {
			setLoadingForm(false);
		}
	};

	/*
        const handleShare = async () => {      try {
            setPreviewLoading(true);
            const response = await axios.get(`${import.meta.env.VITE_SERVER_URL}/api/forms/${formId}`);
            setPreviewDetails(response.data);
        } catch (error) {
            console.error("Error fetching preview details:", error);
        } finally {
            setPreviewLoading(false);
        }
        }
        */
	return (
		<CustomerLayoutPage>
			{error ? (
				<div className="text-center mt-20">
					<h1 className="text-2xl font-bold text-red-700">🙁 {error}</h1>
					<p className="text-gray-600 mt-2">Please check if the form ID is correct or ensure that you are authorized to view this form.</p>
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
									<Button variant="outline" onClick={fetchPreviewDetails}>
										<ScanSearch /> Preview
									</Button>
								</DialogTrigger>
								<DialogContent className="sm:max-w-[500px] p-10">{previewLoading ? <FormPreviewSkelton /> : <FormPreview formPreview={previewDetails} />}</DialogContent>
							</Dialog>

							<Dialog>
								<DialogTrigger asChild>
									<Button variant="secondary" onClick={() => setIsShareDialogOpen(true)}>
										<QrCode />
										Share
									</Button>
								</DialogTrigger>
								<ShareDialog formId={formId} isOpen={isShareDialogOpen} setIsOpen={setIsShareDialogOpen} />
							</Dialog>

							{formDetails.is_active ? (
								<Button className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-800" onClick={handlePublish} disabled={loadingForm}>
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
								<Button className="bg-gradient-to-r dark:from-slate-900 dark:to-indigo-950 text-white dark:hover:from-slate-800 dark:hover:to-indigo-800" onClick={handlePublish} disabled={loadingForm}>
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
						<FormBuilder formDetails={formDetails} onFieldUpdate={handleFieldUpdate} onFileSelect={handleFileSelect} fields={fields} setFields={setFields} />
					</div>
				</>
			)}
		</CustomerLayoutPage>
	);
};

export default FormCreatePage;
