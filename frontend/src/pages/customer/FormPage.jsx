import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import CustomerLayoutPage from "./LayoutPage"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useEffect, useState, useMemo } from "react";
import useFormStore from "@/store/formStore"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import DataTable from "@/components/customer-view/DataTable"
import axios from "axios"
import LoadingSpinner from "@/components/LoadingSpinner";
import { columns } from "@/components/customer-view/form-columns"
import { ArrowRight, BadgeAlert, FilePlus, Loader, SquareDashedMousePointer, SquareEqual, Star, Zap } from "lucide-react"
import { useNavigate } from "react-router-dom"
import toast from "react-hot-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuthStore } from "@/store/authStore"


const FormPage = () => {
    const [formName, setFormName] = useState("");
    const [formNote, setFormNote] = useState("");
    const [formType, setFormType] = useState("Review");
    //const [fields, setFields] = useState([]);
    const { createForm, error } = useFormStore();
    const [isLoading, setIsLoading] = useState(false);
    const { user } = useAuthStore();

    const navigate = useNavigate();

    const handleSubmit = async () => {
        setIsLoading(true);
        const formData = {
            user_id: user?._id, // Replace with actual user ID
            form_name: formName,
            form_note: formNote,
            form_type: formType,
            //fields,
        };

        try {
            const response = await createForm(formData);
            navigate(`/forms/create-form/${response._id}`);
            toast.success(
                <div>
                    <strong>Form is almost ready</strong>
                    <p>Let&lsquo;s customise and publish it now.</p>
                </div>,
                {
                    icon: '👏',
                    duration: 5000,
                },
            );
        } catch {
            toast.error("Error creating form");
        } finally {
            setIsLoading(false);
        }
    };


    const [forms, setForms] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchForms = async () => {
            try {
                const response = await axios.get("http://localhost:5000/api/forms/");
                console.log("Fetched forms:", response.data);
                setForms(response.data);
                setLoading(false);
            } catch (error) {
                console.error("Error fetching users:", error);
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
            <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
                <Dialog>
                    <DialogTrigger asChild>
                        <Button className="w-fit mb-4 left-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-800">
                            <FilePlus /> Create Form
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Create Form</DialogTitle>
                            <DialogDescription>
                                Create your form here. Click next when you&apos;re done.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <Label htmlFor="form_name">
                                Form Name
                            </Label>
                            <Input
                                type='text'
                                placeholder='Type your form name here'
                                value={formName}
                                onChange={(e) => setFormName(e.target.value)}
                            />
                            <Label htmlFor="form_description">
                                Note
                            </Label>
                            <Textarea
                                placeholder='Personel note to identify the form'
                                value={formNote}
                                onChange={(e) => setFormNote(e.target.value)}
                            />
                            <Label htmlFor="form_type">
                                Type
                            </Label>
                            <Select
                                value={formType}
                                onValueChange={(value) => setFormType(value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select an option" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Review">Review</SelectItem>
                                    <SelectItem value="Complaint">Complaint</SelectItem>
                                </SelectContent>
                            </Select>
                            <div className="flex flex-col">
                                {error && <p className="text-red-500">Error: {error}</p>}
                            </div>
                        </div>
                        <DialogFooter>
                            <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-800"
                                onClick={handleSubmit}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader className="animate-spin mx-auto mr-1" size={28} /> Saving...
                                    </>
                                ) : (
                                    <>
                                        Next
                                        <ArrowRight className="" />
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
                <div className="grid auto-rows-min gap-4 grid-cols-3 xl:grid-cols-5">
                    <Card className=" border-b-4 border-b-green-600">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-md font-regular">Total</CardTitle>
                            <SquareEqual className="text-green-600" />
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-bold">{loading ? "Loading..." : totalFormsCount}</p>
                        </CardContent>
                    </Card>
                    <Card className=" border-b-4 border-b-indigo-600">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-md font-regular">Published</CardTitle>
                            <Zap className="text-indigo-500" />
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-bold">{loading ? "Loading..." : totalPublishedCount}</p>
                        </CardContent>
                    </Card>
                    <Card className=" border-b-4 border-b-gray-600">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-md font-regular">Draft</CardTitle>
                            <SquareDashedMousePointer className="text-gray-500" />
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-bold">{loading ? "Loading..." : totalDraftedCount}</p>
                        </CardContent>
                    </Card>
                    <Card className=" border-b-4 border-b-amber-600">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-md font-regular">Review</CardTitle>
                            <Star className="text-amber-500" />
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-bold">{loading ? "Loading..." : totalReviewCount}</p>
                        </CardContent>
                    </Card>
                    <Card className=" border-b-4 border-b-red-600">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-md font-regular">Complaint</CardTitle>
                            <BadgeAlert className="text-red-500" />
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-bold">{loading ? "Loading..." : totalComplaintCount}</p>
                        </CardContent>
                    </Card>
                </div>

                {totalFormsCount === 0 ? (
                    <div className="text-center mt-20">
                        <h1 className="text-2xl font-bold text-gray-700">
                            😃 You haven&lsquo;t published a form yet!
                        </h1>
                        <p className="text-gray-600 mt-2">
                            Create your first form and start collecting submissions effortlessly.
                        </p>
                    </div>
                ) : (
                    <DataTable data={memoizedForms} columns={memoizedColumns} setForms={updateSetForms} />

                )}
            </div>
        </CustomerLayoutPage>
    )
}

export default FormPage
