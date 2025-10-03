import { useParams, useNavigate } from "react-router-dom";
import { Separator } from "@/components/ui/separator";
import CustomerLayoutPage from "./LayoutPage";
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import DataTable from "@/components/customer-view/submissions/DataTable";
import { generateDynamicColumns } from "@/components/customer-view/submissions/columns";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/store/authStore";

const SubmissionListPage = () => {
	const { formId } = useParams();
	const navigate = useNavigate();
	const { toast } = useToast();
	const [formData, setFormData] = useState(null);
	const [isloading, setIsLoading] = useState(true);
	const [localSubmissions, setLocalSubmissions] = useState([]);
	const { user } = useAuthStore();

	const userId = user?._id;

	useEffect(() => {
		const fetchData = async () => {
			if (!formId) return;

			try {
				// Fetch form information
				const formResponse = await axios.get(`${import.meta.env.VITE_SERVER_URL}/api/forms/${formId}`, {
					withCredentials: true
				});
				setFormData(formResponse.data);

				// Fetch submissions for this form
				const submissionResponse = await axios.get(`${import.meta.env.VITE_SERVER_URL}/api/submissions/form/${formId}`, {
					withCredentials: true
				});
				setLocalSubmissions(submissionResponse.data);
				
				// Mark submissions as read when user visits the page
				if (userId) {
					// Mark submissions as read for this specific form
					await axios.post(`${import.meta.env.VITE_SERVER_URL}/api/submissions/mark-as-read/form/${formId}`, {}, {
						withCredentials: true
					});
				}
			} catch (error) {
				console.error("Error fetching data:", error);
				toast({
					title: "Error",
					description: "Failed to fetch form data. Please try again.",
					variant: "destructive",
				});
			} finally {
				setIsLoading(false);
			}
		};

		fetchData();
	}, [formId, toast, userId]);

	const filteredSubmissions = useMemo(() => {
		return localSubmissions.map((submission) => ({
			...submission,
			// Add a displayId field for easier identification
			displayId: submission._id.slice(-6),
		}));
	}, [localSubmissions]);

	const memoizedColumns = useMemo(() => generateDynamicColumns(filteredSubmissions), [filteredSubmissions]);
	const memoizedSubmissions = useMemo(() => filteredSubmissions, [filteredSubmissions]);
	const totalSubmissionsCount = memoizedSubmissions.length;

	const updateSetSubmissions = (newData) => {
		setLocalSubmissions(newData); // Set the state
	};

	const handleGoBack = () => {
		navigate("/submissions");
	};

	if (isloading) {
		return <LoadingSpinner />;
	}

	return (
		<CustomerLayoutPage>
			<div className="flex flex-1 flex-col gap-4 p-4 pt-0">
				<div className="my-4 P-4">
					<Button variant="outline" onClick={handleGoBack} className="mb-4">
						<ArrowLeft className="h-4 w-4 mr-2" />
						Back to Forms
					</Button>
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