import { useState, useEffect } from "react";
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
import EmployeeSelectionDialog from "./EmployeeSelectionDialog";

const SortableItem = ({ field, onFieldUpdate, onFieldRemove }) => {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
        id: field.id,
    });

    const [open, setOpen] = useState(false);
    const [employeeDialogOpen, setEmployeeDialogOpen] = useState(false);
    const [editValues, setEditValues] = useState({
        label: field.label,
        type: field.type,
        placeholder: field.placeholder || "",
    });
    const [selectedEmployees, setSelectedEmployees] = useState(field.employees || []);

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
        console.log('SortableItem field.employees updated:', field.employees);
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

    const handleDialogSave = () => {
        const updates = {
            label: editValues.label,
            type: editValues.type,
            placeholder: editValues.placeholder,
        };
        
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
                                            <SelectItem value="rating">Rating</SelectItem>
                                            <SelectItem value="employee">Employee Dropdown</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

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
