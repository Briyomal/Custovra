import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import CustomerLayoutPage from "./LayoutPage";
import { Loader, MessageSquareText } from "lucide-react";
import { useEffect, useMemo } from "react";
import { useAuthStore } from "@/store/authStore";
import useSubmissionStore from "@/store/submissionStore";
import { Separator } from "@/components/ui/separator";
import useFormStore from "@/store/formStore";
import FormsGrid from "@/components/customer-view/submissions/FormGrid";

const SubmissionPage = () => {
    const { user, isAuthenticated } = useAuthStore();
    const { submissions, fetchSubmissions, isLoading } = useSubmissionStore();
    const { forms, fetchFormsNew } = useFormStore();

    const userId = user?._id;
    const totalSubmissionsCount = useMemo(() => submissions.length, [submissions]);

    const getSubmissionCountForForm = useMemo(() => {
        return (formId) => {
            return submissions.filter((submission) => submission.form_id === formId).length;
        };
    }, [submissions]);

    useEffect(() => {
        // eslint-disable-next-line no-unused-vars
        let isMounted = true;

        const fetchData = async () => {
            if (isAuthenticated && userId) {
                try {
                    // Fetch data in parallel
                    await Promise.all([
                        fetchSubmissions(userId),
                        fetchFormsNew(userId)
                    ]);
                } catch (error) {
                    console.error('Error fetching data:', error);
                }
            }
        };

        fetchData();

        // Cleanup function
        return () => {
            isMounted = false;
        };
    }, [isAuthenticated, userId, fetchSubmissions, fetchFormsNew]); // Remove forms from dependency array

    return (
        <CustomerLayoutPage>
            <div className="grid auto-rows-min gap-4 grid-cols-3 xl:grid-cols-5">
                <Card className="border-b-4 border-b-green-600">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-md font-regular">Total Submissions</CardTitle>
                        <MessageSquareText className="text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold">
                            {isLoading ? (
                                <Loader className="animate-spin" size={36} />
                            ) : (
                                totalSubmissionsCount
                            )}
                        </p>
                    </CardContent>
                </Card>
            </div>

            <Separator className="my-4" />

            <FormsGrid
                forms={forms}
                getSubmissionCountForForm={getSubmissionCountForForm}
            />
        </CustomerLayoutPage>
    );
};

export default SubmissionPage;