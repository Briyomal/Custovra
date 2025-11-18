import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";

const FormsGrid = ({ forms = [], getSubmissionCountForForm, submissions = [] }) => {
    const navigate = useNavigate();
    const [unreadCounts, setUnreadCounts] = useState({});

    // Fetch unread submission counts for all forms
    useEffect(() => {
        const fetchUnreadCounts = async () => {
            const counts = {};
            for (const form of forms) {
                try {
                    const response = await axios.get(`${import.meta.env.VITE_SERVER_URL}/api/submissions/unread/form/${form._id}`, {
                        withCredentials: true
                    });
                    counts[form._id] = response.data.count;
                } catch (error) {
                    console.error(`Error fetching unread count for form ${form._id}:`, error);
                    counts[form._id] = 0;
                }
            }
            setUnreadCounts(counts);
        };

        if (forms.length > 0) {
            fetchUnreadCounts();
        }
    }, [forms]);

    // Function to mark submissions as read for a specific form
    const markFormSubmissionsAsRead = async (formId) => {
        try {
            await axios.post(`${import.meta.env.VITE_SERVER_URL}/api/submissions/mark-as-read/form/${formId}`, {}, {
                withCredentials: true
            });
            // Update the unread count for this form to 0
            setUnreadCounts(prev => ({
                ...prev,
                [formId]: 0
            }));
        } catch (error) {
            console.error(`Error marking submissions as read for form ${formId}:`, error);
        }
    };

    // Handle view submissions button click
    const handleViewSubmissions = async (formId) => {
        // Mark submissions as read for this form
        await markFormSubmissionsAsRead(formId);
        // Navigate to the submissions page
        navigate(`/submissions/${formId}`);
    };

    return (
        <div className="grid auto-rows-min  gap-3 md:gap-4 grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {forms.map((form) => {
                const submissionCount = getSubmissionCountForForm(form._id);
                const unreadCount = unreadCounts[form._id] || 0;
                
                return (
                    <Card key={form._id} className="bg-slate-50 dark:bg-[#161616] backdrop-blur-lg">
                        <CardHeader className="space-y-0 pb-2 pt-3 md:pt-4 px-2 md:px-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className="text-md font-regular text-lg md:text-lg">
                                        {form.form_name}
                                    </CardTitle>
                                    <CardDescription className="text-xs text-muted-foreground">
                                        {form.form_note}
                                    </CardDescription>
                                </div>
                                {unreadCount > 0 && (
                                    <Badge className="bg-red-600 hover:bg-red-700 text-white rounded-full h-5 px-2 text-xs">
                                        {unreadCount}
                                    </Badge>
                                )}
                            </div>
                        </CardHeader>
                        <Separator className="my-2" />
                        <CardContent className="space-y-3 md:space-y-5 px-2 md:px-4">
                            <div className="flex flex-row justify-between items-center">
                                <p className="text-sm">Submissions</p>
                                <h3 className="text-gray-400 font-semibold text-2xl md:text-3xl">
                                    {submissionCount}
                                </h3>
                            </div>
                            <div className="flex justify-between items-center">
                                <p className="text-sm">Form Type</p>
                                <Badge
                                    variant="outline"
                                    className={`px-1 md:px-3 rounded-sm text-sm font-normal ${
                                        form.form_type === "Complaint" ? "bg-red-600 text-white" : "bg-yellow-400 text-black"
                                    }`}
                                >
                                    {form.form_type}
                                </Badge>
                            </div>

                        </CardContent>
                        <Separator className="" />
                        <CardFooter className="flex flex-row justify-between items-center pb-4 px-2 md:px-4">
                            <Button 
                                variant="secondary"
                                className="py-1 mt-4 gap-1 md:gap-2 w-full left-0 rounded-md font-semibold border 
               											border-[#16bf4c] text-[#16bf4c] dark:text-white bg-transparent 
               											hover:!text-[#000000] hover:border-lime-500 hover:bg-lime-500
               											transition-all duration-200 ease-in-out 
               											hover:shadow-[0_0_15px_rgba(22,191,76,0.4)] 
               											focus:outline-none focus:ring-2 focus:ring-lime-500"
                                submissions={submissions}
                                onClick={() => handleViewSubmissions(form._id)}
                            >
                                <Eye className="h-4 w-4" />
                                View Submissions
                            </Button>
                        </CardFooter>
                    </Card>
                );
            })}
        </div>
    );
};

export default FormsGrid;