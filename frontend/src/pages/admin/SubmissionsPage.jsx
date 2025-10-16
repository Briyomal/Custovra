import { useParams, useNavigate } from "react-router-dom";
import { Separator } from "@/components/ui/separator";
import AdminLayoutPage from "./LayoutPage";
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import DataTable from "@/components/customer-view/submissions/DataTable";
import { generateDynamicColumns } from "@/components/customer-view/submissions/columns";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const SubmissionsPage = () => {
    const { formId } = useParams();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [submissions, setSubmissions] = useState([]);
    const [formInfo, setFormInfo] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (!formId) return;

            try {
                // Fetch form information using admin endpoint for security
                const formResponse = await axios.get(`${import.meta.env.VITE_SERVER_URL}/api/forms/admin/${formId}`, {
                    withCredentials: true
                });
                setFormInfo(formResponse.data);

                // Fetch submissions for this form
                const submissionsResponse = await axios.get(`${import.meta.env.VITE_SERVER_URL}/api/submissions/admin/form/${formId}`, {
                    withCredentials: true
                });
                setSubmissions(submissionsResponse.data);
                setLoading(false);
            } catch (error) {
                console.error("Error fetching data:", error);
                toast({
                    title: "Error",
                    description: "Failed to fetch form data or submissions",
                    variant: "destructive",
                });
                setLoading(false);
            }
        };

        fetchData();
    }, [formId, toast]);

    const updateSetSubmissions = (newData) => {
        setSubmissions(newData);
    };

    const memoizedSubmissions = useMemo(() => submissions, [submissions]);
    const memoizedColumns = useMemo(() => {
        // Generate dynamic columns based on actual submission data and form information
        return generateDynamicColumns(submissions, formInfo);
    }, [submissions, formInfo]);

    const totalSubmissionsCount = memoizedSubmissions.length;

    const handleGoBack = () => {
        navigate("/admin/forms");
    };

    if (loading) {
        return <LoadingSpinner />;
    }

    return (
        <AdminLayoutPage>
            <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
                <div className="my-4 p-4">
                    <Button variant="outline" onClick={handleGoBack} className="mb-4">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Forms
                    </Button>
                    {formInfo && (
                        <div className="flex flex-col">
                            <h2 className="text-lg font-semibold">
                                {formInfo.form_name}
                            </h2>
                            <p className="text-sm text-slate-600 dark:text-slate-400"> {formInfo.form_note}</p>
                        </div>
                    )}
                    <Separator className="my-4" />
                </div>
                {totalSubmissionsCount === 0 ? (
                    <div className="flex flex-col items-center justify-center mt-20 space-y-4">
                        <h1 className="text-xl md:text-3xl font-semibold text-gray-500 flex items-center">
                            <span role="img" aria-label="clipboard" className="mr-2">📋</span>
                            No Submissions Yet!
                        </h1>
                        <p className="text-lg text-gray-400 max-w-md text-center">
                            It looks like this form hasn&#39;t received any submissions yet.
                        </p>
                    </div>
                ) : (
                    <DataTable data={memoizedSubmissions} columns={memoizedColumns} setLocalSubmissions={updateSetSubmissions} />
                )}
            </div>
        </AdminLayoutPage>
    );
};

export default SubmissionsPage;