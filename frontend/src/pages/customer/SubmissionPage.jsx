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
    const totalSubmissionsCount = useMemo(() => {
        return submissions.length;
    }, [submissions]);

    const getSubmissionCountForForm = useMemo(() => {
        return (formId) => {
            const count = submissions.filter((submission) => {
                // Handle both populated form_id object and string ID
                const submissionFormId = submission.form_id?._id || submission.form_id;
                return submissionFormId === formId;
            }).length;
            return count;
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
            <div className="pt-4 md:gap-4 md:p-4">
            <div className="grid auto-rows-min gap-4 grid-cols-1 md:grid-cols-3 xl:grid-cols-5 ">
                <Card className="border-b-4 border-b-green-600 mt-4">
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
                submissions={submissions}
            />

            </div>
        </CustomerLayoutPage>
    );
};

export default SubmissionPage;