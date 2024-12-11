import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import CustomerLayoutPage from "./LayoutPage";
import { Loader, MessageSquareText } from "lucide-react";
import { useEffect} from "react";
import { useAuthStore } from "@/store/authStore"
import useSubmissionStore from "@/store/submissionStore";
import { Separator } from "@/components/ui/separator";
import useFormStore from "@/store/formStore";
import FormsGrid from "@/components/customer-view/submissions/FormGrid";
//import DataTable from "@/components/customer-view/submissions/DataTable";
//import { columns } from "@/components/customer-view/submissions/columns";

const SubmissionPage = () => {
    const { user, isAuthenticated, isCheckingAuth } = useAuthStore(); // Access auth store
    const { submissions, fetchSubmissions, isLoading } = useSubmissionStore(); // Access submissions store
    const { forms, fetchFormsNew } = useFormStore(); // Access submissions store

    const userId = user?._id; // Get the user ID
    const totalSubmissonsCount = submissions.length;

    useEffect(() => {
        // Fetch submissions once user is authenticated and userId is available
        if (isAuthenticated && userId) {
            fetchSubmissions(userId);
            fetchFormsNew(userId);
        }
    }, [isAuthenticated, userId, fetchSubmissions, fetchFormsNew]);
    console.log("Submissions:", submissions);

    const getSubmissionCountForForm = (formId) => {
        return submissions.filter((submission) => submission.form_id === formId).length;
      };
    
  //const memoizedSubmissions = useMemo(() => submissions, [submissions]);
  //const memoizedColumns = useMemo(() => columns, []);

    return (
        <CustomerLayoutPage>
            <div className="grid auto-rows-min gap-4 grid-cols-3 xl:grid-cols-5">
                <Card className=" border-b-4 border-b-green-600">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-md font-regular">Total Submissions</CardTitle>
                        <MessageSquareText className="text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold">
                            {isLoading || isCheckingAuth ? <Loader className="animate-spin" size={36} /> : totalSubmissonsCount}
                        </p>
                    </CardContent>
                </Card>
            </div>
            {/*<DataTable data={memoizedSubmissions} columns={memoizedColumns} /> */}
            <Separator className="my-4" />
                
            <FormsGrid forms={forms} getSubmissionCountForForm={getSubmissionCountForForm} />

        </CustomerLayoutPage>
    );
};

export default SubmissionPage;
