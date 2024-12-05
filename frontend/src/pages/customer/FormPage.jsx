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
import { FilePlus, Loader } from "lucide-react"
import { useNavigate } from "react-router-dom"
import toast from "react-hot-toast";


const FormPage = () => {
    const [formName, setFormName] = useState("");
    const [formNote, setFormNote] = useState("");
    const [formType, setFormType] = useState("Review");
    //const [fields, setFields] = useState([]);
    const { createForm, error } = useFormStore();
    const [isLoading, setIsLoading] = useState(false);

    const navigate = useNavigate();
     
    const handleSubmit = async () => {
        setIsLoading(true);
        const formData = {
            user_id: "user-id-here", // Replace with actual user ID
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
                }
            );
        } catch {
            toast.error("Error creating form");
        } finally {
            setIsLoading(false);
        }
    };


    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
  
    useEffect(() => {
      const fetchForms = async () => {
        try {
          const response = await axios.get("http://localhost:5000/api/forms/");
          setUsers(response.data);
          setLoading(false);
        } catch (error) {
          console.error("Error fetching users:", error);
          setLoading(false);
        }
      };
  
      fetchForms();
    }, []);
  
    const memoizedUsers = useMemo(() => users, [users]);
    const memoizedColumns = useMemo(() => columns, []);

    if (loading) {
        return <LoadingSpinner/>;
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
                              Create your form here. Click save when you&apos;re done.
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
                            {/*
                            <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-800"
                                onClick={handleSubmit} 
                                disabled={isLoading}
                            >
                                {isLoading ? <span className="flex flex-row"><Loader className=' animate-spin mx-auto mr-1' size={28} />Creating...</span>  : "Create Form"}
                            </Button>
                            */}
                            
                            <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-800"
                                onClick={handleSubmit} 
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader className="animate-spin mx-auto mr-1" size={28} /> Creating...
                                    </>
                                ) : (
                                    "Create Form"
                                )}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
                <div className="grid auto-rows-min gap-4 md:grid-cols-3">
                    <div className="aspect-video rounded-xl bg-muted/50" />
                    <div className="aspect-video rounded-xl bg-muted/50" />
                    <div className="aspect-video rounded-xl bg-muted/50" />
                </div>
                
                <DataTable data={memoizedUsers} columns={memoizedColumns} />
            </div>
        </CustomerLayoutPage>
    )
}

export default FormPage
