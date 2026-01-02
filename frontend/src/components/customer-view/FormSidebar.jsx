import { Badge } from "@/components/ui/badge";
import { Skeleton } from "../ui/skeleton";
import ImageUpload from "./ImageUpload";
import { Switch } from "@/components/ui/switch";
import { useEffect, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
  } from "@/components/ui/tooltip"
import { CircleHelp } from "lucide-react";
import { HexColorPicker } from "react-colorful";


const FormSidebar = ({ formDetails, onFieldUpdate, onFileSelect, onRemoveImage }) => {
    // Fallback for when formDetails is null or undefined
    const isLoading = !formDetails || Object.keys(formDetails).length === 0;
    const [isActive, setIsActive] = useState("");
    const [formDescription, setFormDescription] = useState("");
    const [formName, setFormName] = useState("");
    const [formNote, setFormNote] = useState("");
    const [formGoogleLink, setFormGoogleLink] = useState("");
    const [errorLink, setErrorLink] = useState("");
    const [buttonBgColor, setButtonBgColor] = useState("");
    const [buttonTextColor, setButtonTextColor] = useState("");
    const [showBgColorPicker, setShowBgColorPicker] = useState(false);
    const [showTextColorPicker, setShowTextColorPicker] = useState(false);

    useEffect(() => {
        if (formDetails && formDetails.is_active !== undefined) {
            setIsActive(formDetails.is_active); // Only set if formDetails is defined and has is_active
        }
        if (formDetails && formDetails.form_description) {
            setFormDescription(formDetails.form_description); // Only set if formDetails is defined and has form_description
        }
        if (formDetails && formDetails.form_name) {
            setFormName(formDetails.form_name); // Only set if formDetails is defined and has form_description
        }
        if (formDetails && formDetails.form_note) {
            setFormNote(formDetails.form_note); // Only set if formDetails is defined and has form_description
        }
        if (formDetails && formDetails.google_link) {
            setFormGoogleLink(formDetails.google_link); // Only set if formDetails is defined and has form_description
        }
        if (formDetails && formDetails.button_bg_color) {
            setButtonBgColor(formDetails.button_bg_color);
        }
        if (formDetails && formDetails.button_text_color) {
            setButtonTextColor(formDetails.button_text_color);
        }
    }, [formDetails]);


    const handleDescriptionChange = (e) => {
        const value = e.target.value;
        if (value !== formDescription) {
            setFormDescription(value); // Update local state
            onFieldUpdate("form_description", value); // Update parent state
        }
    };

    const handleSwitchChange = (value) => {
        if (value !== isActive) {
            setIsActive(value);
            onFieldUpdate("is_active", value);
        }
    };

    const handleFormNameChange = (e) => {
        const value = e.target.value;
        if (value !== formName) {
            setFormName(value); // Update local state
            onFieldUpdate("form_name", value); // Update parent state
        }
    };

    const handleFormNoteChange = (e) => {
        const value = e.target.value;
        if (value !== formNote) {
            setFormNote(value); // Update local state
            onFieldUpdate("form_note", value); // Update parent state
        }
    };

    const handleGoogleReviewLinkChange = (e) => {
        const value = e.target.value.trim(); // Trim to remove leading/trailing spaces
    
        // Allow empty input, but validate if a value is entered
        if (value && !value.startsWith("https://g.page") && !value.startsWith("https://www.google.com")) {
            setErrorLink("Invalid URL. Must start with https://g.page or https://www.google.com");
        } else {
            setErrorLink(""); // Clear error if valid or empty
        }
    
        if (value !== formGoogleLink) {
            setFormGoogleLink(value);
            onFieldUpdate("google_link", value);
        }
    };
    const handleBgColorChange = (color) => {
        if (color !== buttonBgColor) {
            setButtonBgColor(color);
            onFieldUpdate("button_bg_color", color);
        }
    };

    const handleTextColorChange = (color) => {
        if (color !== buttonTextColor) {
            setButtonTextColor(color);
            onFieldUpdate("button_text_color", color);
        }
    };

    
    if (isLoading) {
        return (
            <aside className="w-[400px] max-w-[400px] flex flex-col flex-grow gap-2 border-l-2 border-muted p-4 bg-background overflow-y-auto h-full">
                <div className="flex flex-row justify-between items-center">
                    <Skeleton className="w-20 h-4" />
                    <Skeleton className="w-20 h-8" />
                </div>
                <div className="flex flex-row justify-between items-center mt-4">
                    <Skeleton className="w-20 h-4" />
                    <Skeleton className="w-20 h-8" />
                </div>
                <Skeleton className="w-14 h-4 mt-8" />
                <Skeleton className="w-full h-48 mt-4" />
                <Skeleton className="w-full h-36 mt-4" />
                <Skeleton className="w-16 h-4 mt-8" />
                <Skeleton className="w-full h-24 mt-1" />
                <Separator className="my-4" />
            </aside>
        );
    }

    return (
        <aside className="w-[400px] max-w-[400px] flex flex-col flex-grow gap-4 border-l-2 border-muted p-2 bg-background overflow-y-auto h-full">
             <ScrollArea className="p-4">
                <div className="p-2">
            {/* Form Type */}
            <div className="flex flex-row justify-between items-center">
                <p className="text-md font-medium">Form Type</p>
                <Badge
                    variant="outline"
                    className="rounded-sm text-md text-white bg-gradient-to-r from-orange-500 to-yellow-500"
                >
                    {formDetails.form_type || "N/A"}
                </Badge>
            </div>

            {/* Form Status */}
            <div className="flex flex-row justify-between items-center mt-4">
                
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                        <p className="text-md font-medium flex items-center">
                            Status <span className="ml-1"><CircleHelp width={16} color="#6b7280"  /></span>
                        </p>
                    </TooltipTrigger>
                    
                    <TooltipContent>
                      <p className="w-32">
                        {isActive
                          ? "This form is active and accessible."
                          : "This form is inactive and cannot be accessed by users."}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <Switch
                    className="data-[state=checked]:bg-green-500  data-[state=unchecked]:bg-red-500" 
                    checked={isActive}
                    
                    onCheckedChange={handleSwitchChange}
                />
            </div>
            {/* Image Upload */}
            <div className="mt-6">
                <ImageUpload  
                    existingImageUrl={formDetails.logo} 
                    onFileSelect={onFileSelect} 
                    onRemoveImage={onRemoveImage}
                    showRemoveButton={!!formDetails.logo && !!onRemoveImage}
                />
            </div>
            <div className="mt-6"> 
                <Label>Description</Label>
                <Textarea 
                    className="mt-2" 
                    value={formDescription || ""}
                    onChange={handleDescriptionChange}  
                    placeholder="Write short description of the form" 
                />
            </div>
            {formDetails.form_type === "Review" && (
                <div className="mt-2"> 
                    <Label>Google Review Link</Label>
                    <Input 
                        className="mt-2" 
                        type="url"
                        value={formGoogleLink}
                        onChange={handleGoogleReviewLinkChange}   
                        placeholder="Enter your google review link" 
                        required
                    />
                    {errorLink && <p className="text-red-500 text-sm">{errorLink}</p>}
                </div>
            )}
            <Separator className="my-4" />
            <h4 className="text-md font-medium">Form Details</h4>
            <div className="mt-2"> 
                <Label>Form Name</Label>
                <Input 
                    className="mt-2" 
                    value={formName}
                    onChange={handleFormNameChange}  
                    placeholder="Type your form name here" 
                    required
                />
            </div>
            <div className="mt-2 mb-2"> 
                <Label>Note</Label>
                <Textarea 
                    className="mt-2" 
                    value={formNote}
                    onChange={handleFormNoteChange}  
                    placeholder="Personel note to identify the form" 
                />
            </div>
            <Separator className="my-4" />
            
            {/* Button Style Section */}
            <div className="mt-6 mb-6">
                <h4 className="text-md font-medium mb-4">Button Style</h4>
                
                {/* Background Color Picker */}
                <div className="mb-4">
                    <Label className="block mb-2">Button Background Color</Label>
                    <div className="flex items-center gap-2">
                        <div 
                            className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
                            style={{ backgroundColor: buttonBgColor || '#16bf4c' }}
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowBgColorPicker(!showBgColorPicker);
                            }}
                        />
                        <span className="text-sm">{buttonBgColor || '#16bf4c'}</span>
                    </div>
                    {showBgColorPicker && (
                        <div className="mt-2 relative">
                            <div 
                                className="fixed inset-0 z-10" 
                                onClick={() => setShowBgColorPicker(false)}
                            />
                            <div className="relative z-20">
                                <HexColorPicker 
                                    color={buttonBgColor || '#16bf4c'} 
                                    onChange={handleBgColorChange} 
                                />
                            </div>
                        </div>
                    )}
                </div>
                
                {/* Text Color Picker */}
                <div>
                    <Label className="block mb-2">Button Text Color</Label>
                    <div className="flex items-center gap-2">
                        <div 
                            className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
                            style={{ backgroundColor: buttonTextColor || '#000000' }}
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowTextColorPicker(!showTextColorPicker);
                            }}
                        />
                        <span className="text-sm">{buttonTextColor || '#000000'}</span>
                    </div>
                    {showTextColorPicker && (
                        <div className="mt-2 relative">
                            <div 
                                className="fixed inset-0 z-10" 
                                onClick={() => setShowTextColorPicker(false)}
                            />
                            <div className="relative z-20">
                                <HexColorPicker 
                                    color={buttonTextColor || '#000000'} 
                                    onChange={handleTextColorChange} 
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>
            
            </div>
            </ScrollArea>
            
        </aside>
    );
};

export default FormSidebar;