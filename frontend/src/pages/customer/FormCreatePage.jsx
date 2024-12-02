//import useFormStore from "@/store/formStore";

import { useParams,  } from "react-router-dom";
//import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

//import toast from "react-hot-toast";
//import { Label } from "@/components/ui/label";
//import { Input } from "@/components/ui/input";
//import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

import axios from "axios";
import CustomerLayoutPage from "./LayoutPage";
//import { Checkbox } from "@/components/ui/checkbox";
import FormBuilder from "@/components/customer-view/FormBuilder";
import { SaveAll, ScanSearch, SquareArrowOutUpRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton"


const FormCreatePage = () => {
    const [formDetails, setFormDetails] = useState(null); // State for form details
    const { formId } = useParams();
    const [loading, setLoading] = useState(false);
    /*
    const [fields, setFields] = useState([]);
    const { addFieldsToForm, loadingForm } = useFormStore();
    const navigate = useNavigate();
    */

    console.log(formId);

    // Fetch form details using the form ID
    useEffect(() => {
        const fetchFormDetails = async () => {
            try {
                setLoading(true);

                const response = await axios.get(`http://localhost:5000/api/forms/${formId}`);

                await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait for 1 second
                setFormDetails(response.data); // Set form details
            } catch (error) {
                console.error("Error fetching form details:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchFormDetails();
    }, [formId]);
/*
    
    const handleAddField = () => {
        setFields([...fields, { field_name: "", field_type: "text", is_required: false }]);
    };

    const handleFieldChange = (index, key, value) => {
        const updatedFields = [...fields];
        updatedFields[index][key] = value;
        setFields(updatedFields);
    };

    const handleSubmit = async () => {
        try {
            await addFieldsToForm(formId, fields);
            toast.success("Fields added successfully!");
            navigate("/forms"); // Navigate back to forms page
        } catch {
            toast.error("Error adding fields");
        }
    };
    */

    
  return (
    <CustomerLayoutPage>
       { /*
        <div className="flex flex-col gap-4 p-4 pt-0">
            <div className="p-4">
            {formDetails && (
                <div className="mb-4">
                    <p><strong>Form Name:</strong> {formDetails.form_name}</p>
                    <p><strong>Description:</strong> {formDetails.form_description}</p>
                    <p><strong>Form Type:</strong> {formDetails.form_type}</p>
                </div>
            )}
                <h1>Add Fields to Form</h1>
                {fields.map((field, index) => (
                    <div key={index} className="grid gap-2 mb-4">
                        <Label>Field Name</Label>
                        <Input
                            type="text"
                            value={field.field_name}
                            onChange={(e) => handleFieldChange(index, "field_name", e.target.value)}
                        />
                        <Label>Field Type</Label>
                        <Select
                            value={field.field_type}
                            onValueChange={(value) => handleFieldChange(index, "field_type", value)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select field type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="text">Text</SelectItem>
                                <SelectItem value="email">Email</SelectItem>
                                <SelectItem value="phone">Phone</SelectItem>
                                <SelectItem value="rating">Rating</SelectItem>
                                <SelectItem value="textarea">Textarea</SelectItem>
                            </SelectContent>
                        </Select>
                        <Label className="flex items-center space-x-2">
                            <Checkbox
                                checked={field.is_required}
                                onCheckedChange={(checked) => handleFieldChange(index, "is_required", checked)}
                            />
                            <div>Required</div>
                        </Label>
                    </div>
                ))}
                <Button onClick={handleAddField}>Add Field</Button>
                <Button onClick={handleSubmit} disabled={loadingForm}>
                    {loadingForm ? "Saving..." : "Save Fields"}
                </Button>
            </div>
        </div> 
        */ }




        <div className="flex justify-between border-b-2 p-4 gap-3 items-center ">
            {loading && 
                <div className="flex flex-col">
                    <Skeleton className="w-20 h-6" />
                    <Skeleton className="w-80 h-4 mt-2" />
                </div>
            }
                {formDetails && (
                <div className="flex flex-col">
                    <h2 className="text-lg  font-semibold">
                        {formDetails.form_name}
                    </h2>
                    <p className="text-sm text-slate-600 dark:text-slate-400"> {formDetails.form_description}</p>
                </div>
                )}
            
            <div className="flex gap-2 items-center">
                <Button variant ="outline"><ScanSearch /> Preview</Button>
                <Button variant="secondary"><SaveAll /> Save</Button>
                <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-800">
                    <SquareArrowOutUpRight />
                    Publish
                </Button>
            </div>
        </div>
        <div className="flex w-full flex-grow items-center justify-center relative overflow-y-auto h-[80vh]">
            <FormBuilder formDetails={formDetails} />
        </div>
    </CustomerLayoutPage >
  )
}

export default FormCreatePage
