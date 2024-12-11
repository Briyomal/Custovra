import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { Separator } from "@/components/ui/separator";

const FormsGrid = ({ forms = [], getSubmissionCountForForm }) => {
    return (
      <div className="grid auto-rows-min gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {forms.map((form) => {
          const submissionCount = getSubmissionCountForForm(form._id);
          return (
            <Card key={form._id} className="bg-slate-50 dark:bg-blue-950/40 backdrop-blur-lg">
              <CardHeader className="space-y-0 pb-2">
                <CardTitle className="text-md font-regular text-lg">
                  {form.form_name}
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  {form.form_note}
                </CardDescription>
              </CardHeader>
              <Separator />
              <CardContent className="space-y-5">
                <div className="flex flex-row justify-between items-center">
                    <p className="text-sm">Submissions</p>
                    <h3 className="text-gray-400 font-semibold text-3xl">
                      {submissionCount}
                    </h3>
                </div>
                <div className="flex flex-row justify-between items-center">
                    <p className="text-sm">Form Type</p>
                    <Badge variant="outline"
                    className="rounded-sm text-sm text-white border bg-amber-600 border-amber-400/50">
                      {form.form_type}
                    </Badge>
                </div>
                <Button className="mt-4 w-full  bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-800" >
                  <Eye className="h-4 w-4" />
                  View Submissions
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };
  
  export default FormsGrid;
  