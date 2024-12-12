import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useNavigate } from "react-router-dom";

const FormsGrid = ({ forms = [], getSubmissionCountForForm, submissions = [] }) => {
    const navigate = useNavigate();

    return (
        <div className="grid auto-rows-min gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {forms.map((form) => {
                const submissionCount = getSubmissionCountForForm(form._id);
                return (
                    <Card key={form._id} className="bg-slate-50 dark:bg-blue-950/20 backdrop-blur-lg">
                        <CardHeader className="space-y-0 pb-2">
                            <CardTitle className="text-md font-regular text-lg">
                                {form.form_name}
                            </CardTitle>
                            <CardDescription className="text-xs text-muted-foreground">
                                {form.form_note}
                            </CardDescription>
                        </CardHeader>
                        <Separator className="my-2" />
                        <CardContent className="space-y-5">
                            <div className="flex flex-row justify-between items-center">
                                <p className="text-sm">Submissions</p>
                                <h3 className="text-gray-400 font-semibold text-3xl">
                                    {submissionCount}
                                </h3>
                            </div>
                            <div className="flex justify-between items-center">
                                <p className="text-sm">Form Type</p>
                                <Badge
                                    variant="outline"
                                    className={`rounded-sm text-sm font-normal ${
                                        form.form_type === "Complaint" ? "bg-red-600 text-white" : "bg-yellow-400 text-black"
                                    }`}
                                >
                                    {form.form_type}
                                </Badge>
                            </div>

                        </CardContent>
                        <Separator className="" />
                        <CardFooter className="flex flex-row justify-between items-center">
                            <Button 
                                variant="secondary"
                                className="py-1 mt-4 w-full
                                 border border-gray-400 dark:border-gray-800
                                "
                                submissions={submissions}
                                onClick={() => navigate(`/submissions/${form._id}`)}
                                
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
