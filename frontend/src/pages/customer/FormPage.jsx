import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import CustomerLayoutPage from "./LayoutPage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useEffect, useState, useMemo } from "react";
import useFormStore from "@/store/formStore";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import DataTable from "@/components/customer-view/DataTable";
import axios from "axios";
import LoadingSpinner from "@/components/LoadingSpinner";
import { columns } from "@/components/customer-view/form-columns";
import { ArrowRight, BadgeAlert, FilePlus, Info, Loader, SquareDashedMousePointer, SquareEqual, Star, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthStore } from "@/store/authStore";
import { parseLimitError, formatLimitMessage } from "@/utils/subscriptionLimits";
import { Alert, AlertDescription } from "@/components/ui/alert";
// Plan downgrade protection is now handled in BillingPage with modal-first approach

const FormPage = () => {
	const [formName, setFormName] = useState("");
	const [formNote, setFormNote] = useState("");
	const [formType, setFormType] = useState("Review");
	//const [fields, setFields] = useState([]);
	const { createForm, error } = useFormStore();
	const [isLoading, setIsLoading] = useState(false);
	const { user } = useAuthStore();

	// Overage warning states
	const [showOverageWarning, setShowOverageWarning] = useState(false);
	const [overageInfo, setOverageInfo] = useState(null);
	const [usageStats, setUsageStats] = useState(null);

	// Plan downgrade protection is now handled in BillingPage

	const navigate = useNavigate();

	// Fetch usage stats to check for overage
	useEffect(() => {
		const fetchUsageStats = async () => {
			try {
				const response = await axios.get(
					`${import.meta.env.VITE_SERVER_URL}/api/usage/stats`,
					{ withCredentials: true }
				);
				if (response.data.success) {
					setUsageStats(response.data.data);
				}
			} catch (error) {
				console.error('Error fetching usage stats:', error);
			}
		};

		fetchUsageStats();
	}, []);

	const handleSubmit = async (skipWarning = false) => {
		// Check if user is at form limit and show warning
		if (!skipWarning && usageStats) {
			const usage = usageStats.usage?.forms;
			if (usage && usage.current >= usage.maximum) {
				// Get pricing from Polar API (fallback to $5 if not available)
				const pricePerForm = usageStats.meterData?.forms?.pricePerUnit || 5;

				setOverageInfo({
					currentForms: usage.current,
					includedForms: usage.maximum,
					additionalCost: pricePerForm // Dynamic pricing from Polar
				});
				setShowOverageWarning(true);
				return; // Don't create form yet, wait for user confirmation
			}
		}

		setIsLoading(true);
		const formData = {
			user_id: user?._id,
			form_name: formName,
			form_note: formNote,
			form_type: formType,
			is_active: false,  // Start as draft until published from FormCreatePage
		};

		try {
			const response = await createForm(formData);

			// Check for overage warning in response
			if (response.overageWarning) {
				toast(
					<div>
						<strong className="text-yellow-700">⚠️ Form Created - Overage Charge</strong>
						<p className="text-sm mt-1">{response.overageWarning.message}</p>
						<p className="text-xs text-gray-600 mt-1">
							Estimated monthly cost: ${(response.overageWarning.estimatedCost / 100).toFixed(2)}
						</p>
					</div>,
					{
						duration: 8000,
						style: {
							background: '#fef3c7',
							color: '#92400e',
							border: '1px solid #f59e0b'
						}
					}
				);
			} else {
				toast.success(
					<div>
						<strong>Form is almost ready</strong>
						<p>Let&lsquo;s customise and publish it now.</p>
					</div>,
					{
						icon: "👏",
						duration: 5000,
					}
				);
			}

			navigate(`/forms/create-form/${response._id}`);
		} catch (error) {
			console.error("Form creation error:", error);
			
			// Check if this is a subscription limit error
			const limitError = parseLimitError(error);
			
			if (limitError) {
				// Handle subscription limit errors with user-friendly messages
				const formattedMessage = formatLimitMessage(limitError);
				
				toast.error(
					<div className="space-y-2">
						<div className="font-semibold">{formattedMessage.title}</div>
						<div className="text-sm">{formattedMessage.message}</div>
						<div className="text-xs text-gray-600">{formattedMessage.suggestion}</div>
					</div>,
					{
						icon: "⚠️",
						duration: 8000,
					}
				);
			} else {
				// Handle other errors
				const errorMessage = error?.response?.data?.error || 
									 error?.response?.data?.message || 
									 "Error creating form";
				toast.error(errorMessage);
			}
		} finally {
			setIsLoading(false);
		}
	};

	const [forms, setForms] = useState([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const fetchForms = async () => {
			try {
				const response = await axios.get(`${import.meta.env.VITE_SERVER_URL}/api/forms/`);
				console.log("Fetched forms:", response.data);
				setForms(response.data);
				setLoading(false);
			} catch (error) {
				console.error("Error fetching forms:", error);
				setLoading(false);
			}
		};

		fetchForms();
	}, []);

	const memoizedForms = useMemo(() => forms, [forms]);
	const memoizedColumns = useMemo(() => columns, []);
	const totalFormsCount = memoizedForms.length;
	const totalPublishedCount = memoizedForms.filter((form) => form.is_active).length;
	const totalDraftedCount = memoizedForms.filter((form) => !form.is_active).length;
	const totalReviewCount = memoizedForms.filter((form) => form.form_type === "Review").length;
	const totalComplaintCount = memoizedForms.filter((form) => form.form_type === "Complaint").length;

	// Debug setForms here
	const updateSetForms = (newData) => {
		setForms(newData); // Set the state
	};

	if (loading) {
		return <LoadingSpinner />;
	}

	return (
		<CustomerLayoutPage>
			<div className="flex flex-1 flex-col gap-4 md:p-4 pt-0">
				{/* Form Overage Warning Modal */}
				<Dialog open={showOverageWarning} onOpenChange={setShowOverageWarning}>
					<DialogContent className="sm:max-w-[500px]">
						<DialogHeader>
							<DialogTitle className="flex items-center gap-2">
								<BadgeAlert className="h-5 w-5 text-yellow-600" />
								Additional Form - Overage Charge
							</DialogTitle>
							<DialogDescription>
								You are creating form #{(overageInfo?.currentForms || 0) + 1}.
								Your plan includes {overageInfo?.includedForms || 1} form(s).
							</DialogDescription>
						</DialogHeader>

						<div className="space-y-4 py-4">
							<div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
								<div className="flex items-start">
									<BadgeAlert className="h-5 w-5 text-yellow-600 mr-3 mt-0.5" />
									<div>
										<h4 className="font-semibold text-yellow-900">Overage Billing</h4>
										<p className="text-sm text-yellow-800 mt-1">
											Each additional form costs <strong>${overageInfo?.additionalCost || 5}/month</strong>.
											This charge will be added to your next invoice.
										</p>
									</div>
								</div>
							</div>

							<div className="text-sm text-gray-600 space-y-1">
								<p>Current forms: {overageInfo?.currentForms || 0}</p>
								<p>Included in plan: {overageInfo?.includedForms || 1}</p>
								<p className="font-semibold mt-2 text-gray-900">
									Additional monthly cost: ${((overageInfo?.currentForms || 0) + 1 - (overageInfo?.includedForms || 1)) * (overageInfo?.additionalCost || 5)}
								</p>
							</div>
						</div>

						<DialogFooter>
							<Button variant="outline" onClick={() => setShowOverageWarning(false)}>
								Cancel
							</Button>
							<Button
								onClick={() => {
									setShowOverageWarning(false);
									handleSubmit(true); // Skip warning check on retry
								}}
								className="bg-yellow-600 hover:bg-yellow-700"
							>
								Create Form & Accept Charges
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>

				<Dialog>
					<DialogTrigger asChild>
						<Button className="w-full sm:w-fit mt-4 mb-4 left-0 rounded-md font-semibold text-black border
                                                          border-lime-500
                                                            bg-gradient-to-r from-[#16bf4c] to-lime-500
                                                            transition-all duration-200 ease-in-out 
                                                            hover:shadow-[0_0_15px_rgba(22,191,76,0.4)] hover:from-lime-400 hover:to-[#1cbf16] 
                                                            focus:outline-none focus:ring-2 focus:ring-lime-400">
							<FilePlus /> Create Form
						</Button>
					</DialogTrigger>
					<DialogContent className="sm:max-w-[425px] max-w-[calc(100%-2rem)] rounded-md">
						<DialogHeader className="border-b py-4 text-left">
							<DialogTitle>Create Form</DialogTitle>
							<DialogDescription>Create your form here. Click next when you&apos;re done.</DialogDescription>
						</DialogHeader>

						{/* Billing Notice */}
						{usageStats && usageStats.usage?.forms && (
							<Alert className="mt-4 bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800">
								<Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
								<AlertDescription className="ml-2">
									<div className="flex flex-col gap-1">
										<div className="flex items-center justify-between text-sm">
											<span className="font-medium">
												Forms: {usageStats.usage.forms.current}
											</span>
											{usageStats.meterData?.forms?.pricePerUnit && (
												<span className="text-xs text-gray-600 dark:text-gray-400">
													${usageStats.meterData.forms.pricePerUnit}/form
												</span>
											)}
										</div>
								<p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
									${usageStats.meterData?.forms?.pricePerUnit || 5} will be charged for every form you create.
								</p>
							</div>
								</AlertDescription>
							</Alert>
						)}

						<div className="grid gap-4 py-4">
							<Label htmlFor="form_name">Form Name</Label>
							<Input type="text" placeholder="Type your form name here" value={formName} onChange={(e) => setFormName(e.target.value)} />
							<Label htmlFor="form_description">Note</Label>
							<Textarea placeholder="Personel note to identify the form" value={formNote} onChange={(e) => setFormNote(e.target.value)} />
							<Label htmlFor="form_type">Type</Label>
							<Select value={formType} onValueChange={(value) => setFormType(value)}>
								<SelectTrigger>
									<SelectValue placeholder="Select an option" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="Review">Review</SelectItem>
									<SelectItem value="Complaint">Complaint</SelectItem>
								</SelectContent>
							</Select>
							<div className="flex flex-col">{error && <p className="text-red-500">Error: {error}</p>}</div>
						</div>
						<DialogFooter>
							<Button className="rounded-md font-semibold text-black border
                                                          border-lime-500
                                                            bg-gradient-to-r from-[#16bf4c] to-lime-500
                                                            transition-all duration-200 ease-in-out 
                                                            hover:shadow-[0_0_15px_rgba(22,191,76,0.4)] hover:from-lime-400 hover:to-[#1cbf16] 
                                                            focus:outline-none focus:ring-2 focus:ring-lime-400 flex items-center justify-center" onClick={handleSubmit} disabled={isLoading}>
								{isLoading ? (
									<div className="flex items-center space-x-2">
										<Loader className="animate-spin" size={28} />
										<span>Saving...</span>
									</div>
								) : (
									<div className="flex items-center space-x-2">
										<span>Next</span>
										<ArrowRight />
									</div>
								)}
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
				<div className="grid auto-rows-min gap-4 grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
					<Card className="border-b-4 border-b-green-600">
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm md:text-md font-regular">Total</CardTitle>
							<SquareEqual className="text-green-600" />
						</CardHeader>
						<CardContent className="px-6 pb-2 md:pb-6">
							<p className="text-2xl md:text-3xl font-bold">{loading ? "Loading..." : totalFormsCount}</p>
						</CardContent>
					</Card>
					<Card className="border-b-4 border-b-indigo-600">
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm md:text-md font-regular">Published</CardTitle>
							<Zap className="text-indigo-500" />
						</CardHeader>
						<CardContent className="px-6 pb-2 md:pb-6">
							<p className="text-2xl md:text-3xl font-bold">{loading ? "Loading..." : totalPublishedCount}</p>
						</CardContent>
					</Card>
					<Card className="border-b-4 border-b-gray-600">
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm md:text-md font-regular">Draft</CardTitle>
							<SquareDashedMousePointer className="text-gray-500" />
						</CardHeader>
						<CardContent className="px-6 pb-2 md:pb-6">
							<p className="text-2xl md:text-3xl font-bold">{loading ? "Loading..." : totalDraftedCount}</p>
						</CardContent>
					</Card>
					<Card className="border-b-4 border-b-amber-600">
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm md:text-md font-regular">Review</CardTitle>
							<Star className="text-amber-500" />
						</CardHeader>
						<CardContent className="px-6 pb-2 md:pb-6">
							<p className="text-2xl md:text-3xl font-bold">{loading ? "Loading..." : totalReviewCount}</p>
						</CardContent>
					</Card>
					<Card className="border-b-4 border-b-red-600">
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm md:text-md font-regular">Complaint</CardTitle>
							<BadgeAlert className="text-red-500" />
						</CardHeader>
						<CardContent className="px-6 pb-2 md:pb-6">
							<p className="text-2xl md:text-3xl font-bold">{loading ? "Loading..." : totalComplaintCount}</p>
						</CardContent>
					</Card>
				</div>

				{totalFormsCount === 0 ? (
					<div className="text-center mt-20">
						<h1 className="text-2xl font-bold text-gray-700">😃 You haven&lsquo;t published a form yet!</h1>
						<p className="text-gray-600 mt-2">Create your first form and start collecting submissions effortlessly.</p>
					</div>
				) : (
					<DataTable data={memoizedForms} columns={memoizedColumns} setForms={updateSetForms} />
				)}
			</div>
		</CustomerLayoutPage>
	);
};

export default FormPage;
