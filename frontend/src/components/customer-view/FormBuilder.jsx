import { useEffect, useState } from "react";
import { useSensor, useSensors, MouseSensor, TouchSensor, KeyboardSensor } from "@dnd-kit/core";
import FormSidebar from "./FormSidebar";
import FormSkeleton from "./FormSkelton";
import FormFieldList from "./FormFields";
import { arrayMove } from "@dnd-kit/sortable";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area"

// Component for each sortable field

const FormBuilder = ({ formDetails, onFieldUpdate, onFileSelect, fields, setFields }) => {
    const [isLoading, setIsLoading] = useState(true);

    console.log("Form details fetched:", formDetails);

    useEffect(() => {
        if (formDetails?.default_fields || formDetails?.custom_fields) {
            const defaultFields = (formDetails.default_fields || [])
                .map((field, index) => {
                    // Exclude "Rating" field if form_type is "Complaint"
                    if (formDetails.form_type === "Complaint" && field.field_name === "rating") {
                        return null;
                    }

                    return {
                        id: `default-${field.position || index + 1}`,
                        label: field.field_name,
                        type: field.field_type,
                        is_required: field.is_required,
                        enabled: field.enabled,
                        position: field.position || index + 1,
                        placeholder: field.placeholder || "",
                        isNew: false, // Set as false since it's not a new field
                        employees: field.employees || [] // Load existing employee data
                    };
                })
                .filter(field => field !== null);

            const customFields = (formDetails.custom_fields || []).map((field, index) => ({
                id: `custom-${field.position || index + 1}`,
                label: field.field_name,
                type: field.field_type,
                is_required: field.is_required,
                enabled: field.enabled,
                position: field.position || index + 1,
                placeholder: field.placeholder || "",
                isNew: true, // Custom fields are not new
                employees: field.employees || [] // Load existing employee data
            }));

            // Combine and sort by position
            const allFields = [...defaultFields, ...customFields].sort((a, b) => a.position - b.position);

            setFields(allFields);
        }

        const timeout = setTimeout(() => setIsLoading(false), 800);
        return () => clearTimeout(timeout); // Clean up timeout
    }, [formDetails]);



    // Configure sensors with pointer activation constraints
    const sensors = useSensors(
        useSensor(MouseSensor, {
            activationConstraint: {
                distance: 8, // Minimum distance before triggering drag
            },
        }),
        useSensor(TouchSensor, {
            activationConstraint: {
                delay: 200, // Delay in ms before triggering drag
                tolerance: 6, // Finger movement tolerance
            },
        }),
        useSensor(KeyboardSensor)
    );

    // Handler for drag and drop
    const handleDragEnd = (event) => {
        const { active, over } = event;

        if (active.id !== over?.id) {
            setFields((prevFields) => {
                // Get the old and new indexes based on the IDs
                const oldIndex = prevFields.findIndex((item) => item.id === active.id);
                const newIndex = prevFields.findIndex((item) => item.id === over?.id);

                // Reorder the array
                const reorderedFields = arrayMove(prevFields, oldIndex, newIndex);

                // Update the position property for each field based on the new order
                const updatedFields = reorderedFields.map((item, index) => ({
                    ...item,
                    position: index + 1, // Set position to 1-based index
                }));

                // Update formDetails.default_fields to reflect new positions
                formDetails.default_fields = updatedFields.map(({ label, type, is_required, enabled, position, placeholder }) => ({
                    field_name: label,
                    field_type: type,
                    is_required: is_required,
                    enabled: enabled,
                    position: position,
                    placeholder: placeholder,
                }));

                return updatedFields; // Return the updated fields for rendering
            });
        }
    };

    const handleFieldUpdate = (id, updatedField) => {
        setFields((prevFields) =>
            prevFields.map((field) => (field.id === id ? { ...field, ...updatedField } : field))
        );
        // Reflect changes in formDetails
        const updatedDefaultFields = formDetails.default_fields.map((field, index) => {
            if (String(index + 1) === id) {
                const updated = { ...field, ...updatedField };
                // Handle employee field type with special employees data
                if (updatedField.employees) {
                    updated.employees = updatedField.employees;
                }
                // Handle field type changes
                if (updatedField.type) {
                    updated.field_type = updatedField.type;
                }
                if (updatedField.label) {
                    updated.field_name = updatedField.label;
                }
                return updated;
            }
            return field;
        });
        formDetails.default_fields = updatedDefaultFields;
    };

    const handleAddField = () => {
        const newId = String(fields.length + 1);
        const newField = {
            id: newId,
            label: "Enter Field Name",
            type: "text",
            is_required: false,
            enabled: true,
            position: fields.length + 1,
            placeholder: "",
            isNew: true, // <-- Flag to show edit mode
        };

        const updatedFields = [...fields, newField];
        setFields(updatedFields);

        // Add to formDetails.default_fields
        if (formDetails.default_fields) {
            formDetails.default_fields.push({
                field_name: newField.label,
                field_type: newField.type,
                is_required: newField.is_required,
                enabled: newField.enabled,
                position: newField.position,
                placeholder: newField.placeholder,
            });
        }
    };

    const handleRemoveField = (id) => {
        const updatedFields = fields.filter((field) => field.id !== id);
        setFields(updatedFields);

        // Also update formDetails.default_fields if needed
        if (formDetails.default_fields) {
            formDetails.default_fields = formDetails.default_fields.filter((_, index) => String(index + 1) !== id);
        }
    };

    return (
        <div className="flex w-full h-full">
            <div className="p-4 w-full">
                {isLoading ? (
                    <FormSkeleton />
                ) : (

                    <div className="h-full overflow-hidden">
                        <ScrollArea className="h-full">
                            <FormFieldList
                                fields={fields}
                                sensors={sensors}
                                onDragEnd={handleDragEnd}
                                onFieldUpdate={handleFieldUpdate}
                                onFieldRemove={handleRemoveField}
                            />
                            <div className="max-w-[900px] m-auto flex flex-col items-center justify-start overflow-y-auto overflow-x-hidden px-4 xl:px-40 lg:px-6">
                                <Button
                                    onClick={handleAddField}
                                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-800 transition"
                                >
                                    Add Field
                                </Button>
                            </div>
                        </ScrollArea>
                    </div>
                )}
            </div>
            <FormSidebar
                formDetails={formDetails}
                onFieldUpdate={onFieldUpdate}
                onFileSelect={onFileSelect}
            />
        </div>
    );
};

export default FormBuilder;