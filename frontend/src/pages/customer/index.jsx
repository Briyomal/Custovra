import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import CustomerLayoutPage from "../customer/LayoutPage";
import { useAuthStore } from "@/store/authStore";
import useSubmissionStore from "@/store/submissionStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BadgeAlert,
  MessageSquareText,
  SquareDashedMousePointer,
  SquareEqual,
  Star,
  Zap,
} from "lucide-react";

const CustomerDashboardPage = () => {
  const { user, isAuthenticated } = useAuthStore();
  const { submissions, fetchSubmissions } = useSubmissionStore();

  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const userId = user?._id;

  const totalSubmissionsCount = useMemo(() => submissions.length, [submissions]);

  useEffect(() => {
    const fetchForms = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_SERVER_URL}/api/forms/`);
        setForms(response.data);
      } catch (error) {
        console.error("Error fetching forms:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchForms();
  }, []);

  useEffect(() => {
    if (isAuthenticated && userId) {
      fetchSubmissions(userId).catch((error) => console.error("Error fetching submissions:", error));
    }
  }, [isAuthenticated, userId, fetchSubmissions]);

  const totalFormsCount = forms.length;
  const totalPublishedCount = forms.filter((form) => form.is_active).length;
  const totalDraftedCount = forms.filter((form) => !form.is_active).length;
  const totalReviewCount = forms.filter((form) => form.form_type === "Review").length;
  const totalComplaintCount = forms.filter((form) => form.form_type === "Complaint").length;

  const cardItems = [
    { label: "Total Forms", count: totalFormsCount, icon: <SquareEqual className="text-green-600" />, border: "border-b-green-600" },
    { label: "Published", count: totalPublishedCount, icon: <Zap className="text-indigo-500" />, border: "border-b-indigo-600" },
    { label: "Draft", count: totalDraftedCount, icon: <SquareDashedMousePointer className="text-gray-500" />, border: "border-b-gray-600" },
    { label: "Review", count: totalReviewCount, icon: <Star className="text-amber-500" />, border: "border-b-amber-600" },
    { label: "Complaint", count: totalComplaintCount, icon: <BadgeAlert className="text-red-500" />, border: "border-b-red-600" },
    { label: "Total Submissions", count: totalSubmissionsCount, icon: <MessageSquareText className="text-lime-600" />, border: "border-b-lime-400" },
  ];

  return (
    <CustomerLayoutPage>
      <div className="flex flex-col gap-2 pt-4 md:gap-4 md:p-4">
        <h2 className="text-xl md:text-2xl font-bold text-blue-600 dark:text-blue-400">
          Welcome Back, <span className="text-slate-800 dark:text-slate-200">{user.name}</span>
        </h2>
        <p className="text-sm md:text-base">
          Here&apos;s a quick overview of your dashboard. Let&apos;s make today productive!
        </p>

        <div className="grid auto-rows-min gap-4 grid-cols-2 md:grid-cols-3 xl:grid-cols-6 mt-4">
          {cardItems.map((item, index) => (
            <Card key={index} className={`border-b-4 ${item.border}`}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm md:text-md font-regular">{item.label}</CardTitle>
                {item.icon}
              </CardHeader>
              <CardContent className="px-6 pb-2 md:pb-6">
                <div className="text-2xl md:text-3xl font-bold">
                  {loading ? <Skeleton className="h-8 md:h-9 w-full" /> : item.count}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </CustomerLayoutPage>
  );
};

export default CustomerDashboardPage;
