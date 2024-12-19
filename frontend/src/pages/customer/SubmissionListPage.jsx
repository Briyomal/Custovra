import { useParams } from "react-router-dom";
import { Separator } from "@/components/ui/separator";
import CustomerLayoutPage from "./LayoutPage";
import { useAuthStore } from "@/store/authStore";
import { useEffect, useMemo, useState } from "react";
import useSubmissionStore from "@/store/submissionStore";
import useFormStore from "@/store/formStore";
import DataTable from "@/components/customer-view/submissions/DataTable";
import { columns } from "@/components/customer-view/submissions/columns";
import LoadingSpinner from "@/components/LoadingSpinner";

const SubmissionListPage = () => {
	const { user, isAuthenticated } = useAuthStore();
	const { formId } = useParams();
	const { fetchSubmissionsByForm } = useSubmissionStore();
	const [localSubmissions, setLocalSubmissions] = useState([]);
	const [isloading, setIsLoading] = useState(true);

	const { forms, fetchFormsByUser } = useFormStore();

	const [formData, setFormData] = useState(null);

	const userId = user?._id;

	console.log("Form ID:", useParams());

	useEffect(() => {
		if (forms && formId) {
			// Find the form data for the current form ID
			const currentForm = forms.find((form) => form._id === formId);
			setFormData(currentForm); // Set the current form data
		}
	}, [forms, formId]);

	useEffect(() => {
		const loadSubmissions = async () => {
			if (isAuthenticated && formId) {
				try {
					const data = await fetchSubmissionsByForm(formId);
					setLocalSubmissions(data);
					await fetchFormsByUser(userId);
					setIsLoading(false)
				} catch (err) {
					console.error("Error fetching submissions:", err);
					setIsLoading(false);
				}
			}
		};

		loadSubmissions();

		// Cleanup function
		return () => {
			setLocalSubmissions([]);
		};
	}, [isAuthenticated, formId, fetchSubmissionsByForm, userId, fetchFormsByUser]);

	console.log("Form Data:", formData);

	// Use localSubmissions instead of filtering the store's submissions
	const filteredSubmissions = localSubmissions.filter((submission) => submission.form_id === formId);
	console.log("Submissions");

	const memoizedSubmissions = useMemo(() => filteredSubmissions, [filteredSubmissions]);
	const memoizedColumns = useMemo(() => columns, []);
	const totalSubmissionsCount = memoizedSubmissions.length;

	const updateSetSubmissions = (newData) => {
        setLocalSubmissions(newData); // Set the state
    };

	if (!isAuthenticated) {
		return (
			<CustomerLayoutPage>
				<div className="text-center py-8">
					<p className="text-gray-600">Please login to view submissions.</p>
				</div>
			</CustomerLayoutPage>
		);
	}

	if (isloading) {
		return <LoadingSpinner />;
	}

	return (
		<CustomerLayoutPage>
			<div className="flex flex-1 flex-col gap-4 p-4 pt-0">
				<div className="my-4 P-4">
					{formData && (
						<div className="flex flex-col">
							<h2 className="text-lg  font-semibold">
								{formData.form_name}
							</h2>
							<p className="text-sm text-slate-600 dark:text-slate-400"> {formData.form_note}</p>
						</div>
					)}
					<Separator className="my-4" />
				</div>
				{totalSubmissionsCount === 0 ? (
					<div className="flex flex-col items-center justify-center mt-20 space-y-4">
						<h1 className="text-3xl font-semibold text-gray-600 flex items-center">
							<span role="img" aria-label="clipboard" className="mr-2">📋</span>
							No Submissions Yet!
						</h1>
						<p className="text-lg text-gray-400 max-w-md text-center">
							It looks like you haven&lsquo;t received any submissions yet. Share your form to get started and begin collecting responses.
						</p>
					</div>
				) :

					(
						<DataTable data={memoizedSubmissions} columns={memoizedColumns} setLocalSubmissions={updateSetSubmissions} />
					)}

			</div>
		</CustomerLayoutPage>
	);
};

export default SubmissionListPage;
