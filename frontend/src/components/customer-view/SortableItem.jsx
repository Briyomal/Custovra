import React, { useState, useEffect, useContext } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Input } from "@/components/ui/input";
import { Textarea } from "../ui/textarea";
import { Star, MoreVertical, Users } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Dialog,
    DialogTrigger,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import EmployeeSelectionDialog from "./EmployeeSelectionDialog";

// Create a context to pass form type to SortableItem
export const FormTypeContext = React.createContext();

const SortableItem = ({ field, onFieldUpdate, onFieldRemove, isImageUploadEnabled, isEmployeeManagementEnabled }) => {
    const formType = useContext(FormTypeContext);
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
        id: field.id,
    });

    const [open, setOpen] = useState(false);
    const [employeeDialogOpen, setEmployeeDialogOpen] = useState(false);
    const [editValues, setEditValues] = useState({
        label: field.label,
        type: field.type,
        placeholder: field.placeholder || "",
        options: field.options || [], // For dropdown and radio fields
    });
    const [selectedEmployees, setSelectedEmployees] = useState(field.employees || []);
    const [newOption, setNewOption] = useState(""); // For adding new options

    // Helper function to get initials for avatar fallback
    const getInitials = (name) => {
        return name
            .split(' ')
            .map(word => word.charAt(0))
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    // Update selectedEmployees when field.employees changes
    useEffect(() => {
        setSelectedEmployees(field.employees || []);
    }, [field.employees]);

    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
        touchAction: "none",
    };

    const handleCheckedChange = (value) => {
        onFieldUpdate(field.id, { is_required: value });
    };

    const handleEnabledChange = (value) => {
        const updates = { enabled: value };
        if (!value) updates.is_required = false;
        onFieldUpdate(field.id, updates);
    };

    // Handle employee rating toggle for employee fields
    const handleEmployeeRatingChange = (value) => {
        // Only allow employee rating for Review forms
        if (formType === "Review") {
            onFieldUpdate(field.id, { hasEmployeeRating: value });
        }
    };

    // Handle adding a new option for dropdown/radio fields
    const handleAddOption = () => {
        if (newOption.trim() !== "") {
            const updatedOptions = [...editValues.options, newOption.trim()];
            setEditValues({ ...editValues, options: updatedOptions });
            setNewOption("");
        }
    };

    // Handle removing an option
    const handleRemoveOption = (index) => {
        const updatedOptions = editValues.options.filter((_, i) => i !== index);
        setEditValues({ ...editValues, options: updatedOptions });
    };

    const handleDialogSave = () => {
  if (editValues.type === "image" && !isImageUploadEnabled) {
    return; // block save
  }
  if (editValues.type === "employee" && !isEmployeeManagementEnabled) {
    return; // block save
  }
        const updates = {
            label: editValues.label,
            type: editValues.type,
            placeholder: editValues.placeholder,
        };
        
        // Include options for dropdown and radio fields
        if (editValues.type === 'dropdown' || editValues.type === 'radio') {
            updates.options = editValues.options;
        }
        
        // Include employees data for employee field type
        if (editValues.type === 'employee') {
            updates.employees = selectedEmployees;
        }
        
        onFieldUpdate(field.id, updates);
        setOpen(false);
    };

    const handleEmployeesSelect = (employees) => {
        setSelectedEmployees(employees);
        // Update the field immediately to save the employee selection
        onFieldUpdate(field.id, { employees });
    };

    const patchedListeners = {
        ...listeners,
        onMouseDown: (event) => {
            const nodeName = event.target?.nodeName;
            if (nodeName === "INPUT" || nodeName === "TEXTAREA" || nodeName === "SELECT" || event.target?.isContentEditable) {
                return; // Don't trigger drag on form elements
            }
            listeners?.onMouseDown?.(event);
        },
        onKeyDown: (event) => {
            const nodeName = event.target?.nodeName;
            if (nodeName === "INPUT" || nodeName === "TEXTAREA" || nodeName === "SELECT" || event.target?.isContentEditable) {
                return;
            }
            listeners?.onKeyDown?.(event);
        }
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...patchedListeners}
            className={`relative items-center justify-between rounded-md border px-6 py-2 mb-4 w-full backdrop-blur-md backdrop-filter 
        ${field.enabled ? "text-black dark:text-white bg-slate-100/20 dark:bg-slate-900/20" : "text-gray-500 bg-blue-400/10 dark:bg-slate-400/10"}`}
        >
            {/* Top Section with Label and Menu */}
            <div className="flex justify-between items-start">
                <Label className="capitalize font-semibold">{field.label}</Label>
                {field.isNew && (
                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                                <DialogTitle>Edit Field</DialogTitle>
                            </DialogHeader>

                            <div className="flex flex-col gap-4">
                                <div>
                                    <Label>Label</Label>
                                    <Input
                                        value={editValues.label}
                                        onChange={(e) => setEditValues({ ...editValues, label: e.target.value })}
                                        placeholder="Field Label"
                                    />
                                </div>

                                <div>
                                    <Label>Type</Label>
                                    <Select
                                        value={editValues.type}
                                        onValueChange={(value) => setEditValues({ ...editValues, type: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="text">Text</SelectItem>
                                            <SelectItem value="email">Email</SelectItem>
                                            <SelectItem value="number">Number</SelectItem>
                                            <SelectItem value="tel">Phone</SelectItem>
                                            <SelectItem value="textarea">Textarea</SelectItem>
                                            {/* Only show rating option for Review forms */}
                                            {formType === "Review" && (
                                                <SelectItem value="rating">Rating</SelectItem>
                                            )}
                                            {isEmployeeManagementEnabled && (
                                                <SelectItem value="employee">Employee Dropdown</SelectItem>
                                            )}
                                            {isImageUploadEnabled && (
                                                <SelectItem value="image">Image Upload</SelectItem>
                                            )}
                                            <SelectItem value="dropdown">Dropdown</SelectItem>
                                            <SelectItem value="radio">Radio Buttons</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Options section for dropdown and radio fields */}
                                {(editValues.type === "dropdown" || editValues.type === "radio") && (
                                    <div className="space-y-2">
                                        <Label>Options</Label>
                                        <div className="flex gap-2">
                                            <Input
                                                value={newOption}
                                                onChange={(e) => setNewOption(e.target.value)}
                                                placeholder="Add an option"
                                                onKeyPress={(e) => e.key === 'Enter' && handleAddOption()}
                                            />
                                            <Button onClick={handleAddOption} type="button">Add</Button>
                                        </div>
                                        <div className="mt-2 max-h-40 overflow-y-auto">
                                            {editValues.options
                                                .filter(option => option && option.trim() !== "") // Filter out empty options
                                                .map((option, index) => (
                                                    <div key={index} className="flex items-center justify-between p-2 bg-gray-100 dark:bg-gray-800 rounded mb-1">
                                                        <span>{option}</span>
                                                        <Button 
                                                            variant="ghost" 
                                                            size="sm"
                                                            onClick={() => handleRemoveOption(index)}
                                                        >
                                                            Remove
                                                        </Button>
                                                    </div>
                                                ))
                                            }
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <Label>Placeholder</Label>
                                    <Input
                                        value={editValues.placeholder}
                                        onChange={(e) =>
                                            setEditValues({ ...editValues, placeholder: e.target.value })
                                        }
                                        placeholder="Placeholder text"
                                    />
                                </div>
                            </div>

                            <DialogFooter className="flex justify-between">
                                <Button variant="destructive" onClick={() => onFieldRemove(field.id)}>
                                    Remove Field
                                </Button>
                                <Button onClick={handleDialogSave}>OK</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                )}
            </div>

            {/* Field preview */}
            {field.type === "textarea" ? (
                <Textarea className="mt-2" placeholder={field.placeholder} disabled={!field.enabled} />
            ) : field.type === "rating" ? (
                <div className="flex space-x-1 mt-3">
                    {Array.from({ length: 5 }).map((_, index) => (
                        <Star
                            key={index}
                            className={`w-5 h-5 ${field.enabled ? "text-yellow-500" : "text-gray-400"}`}
                            fill={field.enabled ? "yellow" : "gray"}
                        />
                    ))}
                </div>
            ) : field.type === "employee" ? (
                <div className="mt-2 space-y-2">
                    <Select disabled={!field.enabled}>
                        <SelectTrigger>
                            <SelectValue placeholder={field.placeholder || "Select an employee"} />
                        </SelectTrigger>
                        <SelectContent>
                            {selectedEmployees.length > 0 ? (
                                selectedEmployees.map(employee => (
                                    <SelectItem key={employee._id} value={employee._id}>
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-6 w-6">
                                                <AvatarImage 
                                                    src={employee.profile_photo?.url} 
                                                    alt={employee.name}
                                                    className="object-cover"
                                                />
                                                <AvatarFallback className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                                                    {getInitials(employee.name)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex flex-col">
                                                <span className="font-medium text-xs">{employee.name}</span>
                                                <span className="text-xs text-gray-500">{employee.designation}</span>
                                            </div>
                                        </div>
                                    </SelectItem>
                                ))
                            ) : (
                                <SelectItem value="no-employees" disabled>
                                    No employees selected
                                </SelectItem>
                            )}
                        </SelectContent>
                    </Select>
                    {field.enabled && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEmployeeDialogOpen(true)}
                            className="flex items-center gap-2"
                        >
                            <Users className="h-4 w-4" />
                            {selectedEmployees.length > 0 
                                ? `Manage Employees (${selectedEmployees.length})` 
                                : 'Select Employees'
                            }
                        </Button>
                    )}
                    {/* Employee Rating Toggle - only for Review forms */}
                    {formType === "Review" && field.enabled && (
                        <div className="flex items-center space-x-2 pt-2">
                            <Switch
                                id="employee-rating"
                                checked={field.hasEmployeeRating}
                                onCheckedChange={handleEmployeeRatingChange}
                            />
                            <Label htmlFor="employee-rating" className="text-sm">
                                Enable Employee Rating
                            </Label>
                        </div>
                    )}
                    {/* Preview of Employee Rating Field - only for Review forms */}
                    {formType === "Review" && field.hasEmployeeRating && field.enabled && (
                        <div className="mt-3 p-3 bg-gray-100 dark:bg-gray-800 rounded-md">
                            <Label className="text-sm font-medium">Employee Rating</Label>
                            <div className="flex space-x-1 mt-2">
                                {Array.from({ length: 5 }).map((_, index) => (
                                    <Star
                                        key={index}
                                        className="w-4 h-4 text-yellow-500"
                                        fill="yellow"
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            ) : field.type === "image" ? (
                <div className="mt-2 space-y-2">
                    <Input
                        type="file"
                        accept="image/*"
                        disabled={!field.enabled}
                        className="file:mr-4 file:py-1 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100 dark:file:bg-green-900 dark:file:text-green-100 dark:hover:file:bg-green-800"
                    />
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        {field.placeholder || "Upload an image file"}
                    </p>
                </div>
            ) : field.type === "dropdown" ? (
                <div className="mt-2">
                    <Select disabled={!field.enabled}>
                        <SelectTrigger>
                            <SelectValue placeholder={field.placeholder || "Select an option"} />
                        </SelectTrigger>
                        <SelectContent>
                            {field.options && field.options.length > 0 ? (
                                field.options.map((option, index) => (
                                    // Only render SelectItem if option is not empty
                                    option ? (
                                        <SelectItem key={index} value={option}>
                                            {option}
                                        </SelectItem>
                                    ) : null
                                ))
                                // Filter out any null items
                                .filter(item => item !== null)
                            ) : (
                                <SelectItem value="" disabled>
                                    No options available
                                </SelectItem>
                            )}
                        </SelectContent>
                    </Select>
                </div>
            ) : field.type === "radio" ? (
                <div className="mt-2 space-y-2">
                    <RadioGroup disabled={!field.enabled}>
                        {field.options && field.options.length > 0 ? (
                            field.options.map((option, index) => (
                                // Only render radio items if option is not empty
                                option ? (
                                    <div key={index} className="flex items-center space-x-2">
                                        <RadioGroupItem value={option} id={`${field.id}-option-${index}`} />
                                        <Label htmlFor={`${field.id}-option-${index}`}>{option}</Label>
                                    </div>
                                ) : null
                            ))
                            // Filter out any null items
                            .filter(item => item !== null)
                        ) : (
                            <p className="text-sm text-gray-500">No options available</p>
                        )}
                    </RadioGroup>
                </div>
            ) : (
                <Input
                    className="mt-2"
                    type={field.type}
                    placeholder={field.placeholder}
                    disabled={!field.enabled}
                />
            )}

            {/* Toggles */}
            <div className="flex flex-row justify-between items-center mt-2">
                <Label className="flex items-center space-x-2 capitalize">
                    <Checkbox
                        checked={field.is_required}
                        onCheckedChange={handleCheckedChange}
                        disabled={!field.enabled}
                    />
                    <span className={`${field.enabled ? "dark:text-white" : "text-gray-500"}`}>Required</span>
                </Label>
                <Switch
                    id="field-enabled"
                    checked={field.enabled}
                    onCheckedChange={handleEnabledChange}
                />
            </div>
            
            {/* Employee Selection Dialog */}
            <EmployeeSelectionDialog
                isOpen={employeeDialogOpen}
                onClose={() => setEmployeeDialogOpen(false)}
                selectedEmployees={selectedEmployees}
                onEmployeesSelect={handleEmployeesSelect}
            />
        </div>
    );
};

export default SortableItem;