import { useEffect, useState } from "react";
import { useSensor, useSensors, MouseSensor, TouchSensor, KeyboardSensor } from "@dnd-kit/core";
import FormSkeleton from "./FormSkelton";
import FormFieldList from "./FormFields";
import { arrayMove } from "@dnd-kit/sortable";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area"

// Component for each sortable field

const FormBuilder = ({ formDetails, fields, setFields }) => {
    const [isLoading, setIsLoading] = useState(true);

    console.log("FormBuilder: formDetails received:", formDetails);

    useEffect(() => {
        console.log("FormBuilder useEffect: Processing formDetails", formDetails);
        if (formDetails?.default_fields || formDetails?.custom_fields) {
            const defaultFields = (formDetails.default_fields || [])
                .map((field, index) => {
                    // Exclude "Rating" field if form_type is "Complaint"
                    if (formDetails.form_type === "Complaint" && field.field_name === "rating") {
                        return null;
                    }

                    const processedField = {
                        id: `default-${field.position || index + 1}`,
                        label: field.field_name,
                        type: field.field_type,
                        is_required: field.is_required,
                        enabled: field.enabled,
                        position: field.position || index + 1,
                        placeholder: field.placeholder || "",
                        isNew: false, // Set as false since it's not a new field
                        employees: field.employees || [], // Load existing employee data
                        // For employee fields, check if there's an associated rating field
                        hasEmployeeRating: field.hasEmployeeRating !== undefined ? field.hasEmployeeRating : false
                    };
                    
                    console.log("FormBuilder: Processed default field:", field.field_name, "hasEmployeeRating:", processedField.hasEmployeeRating);
                    return processedField;
                })
                .filter(field => field !== null);

            const customFields = (formDetails.custom_fields || []).map((field, index) => {
                const processedField = {
                    id: `custom-${field.position || index + 1}`,
                    label: field.field_name,
                    type: field.field_type,
                    is_required: field.is_required,
                    enabled: field.enabled,
                    position: field.position || index + 1,
                    placeholder: field.placeholder || "",
                    isNew: true, // Custom fields are not new
                    employees: field.employees || [], // Load existing employee data
                    // For employee fields, check if there's an associated rating field
                    hasEmployeeRating: field.hasEmployeeRating !== undefined ? field.hasEmployeeRating : false
                };
                
                console.log("FormBuilder: Processed custom field:", field.field_name, "hasEmployeeRating:", processedField.hasEmployeeRating);
                return processedField;
            });

            // Combine and sort by position
            const allFields = [...defaultFields, ...customFields].sort((a, b) => a.position - b.position);
            
            console.log("FormBuilder: All processed fields:", allFields);

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
        console.log("FormBuilder: handleDragEnd called", event);
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

                console.log("FormBuilder: Updated fields after drag:", updatedFields);
                
                // Update formDetails.default_fields and custom_fields to reflect new positions
                if (formDetails.default_fields) {
                    formDetails.default_fields = updatedFields
                        .filter(field => field.id.startsWith('default-'))
                        .map(({ label, type, is_required, enabled, position, placeholder, employees, hasEmployeeRating }) => {
                            const updatedField = {
                                field_name: label,
                                field_type: type,
                                is_required: is_required,
                                enabled: enabled,
                                position: position,
                                placeholder: placeholder,
                                employees: employees,
                                hasEmployeeRating: hasEmployeeRating
                            };
                            console.log("FormBuilder: Updated default field for formDetails:", label, updatedField);
                            return updatedField;
                        });
                }
                
                if (formDetails.custom_fields) {
                    formDetails.custom_fields = updatedFields
                        .filter(field => field.id.startsWith('custom-'))
                        .map(({ label, type, is_required, enabled, position, placeholder, employees, hasEmployeeRating, isNew }) => {
                            const updatedField = {
                                field_name: label,
                                field_type: type,
                                is_required: is_required,
                                enabled: enabled,
                                position: position,
                                placeholder: placeholder,
                                employees: employees,
                                hasEmployeeRating: hasEmployeeRating,
                                is_new: isNew
                            };
                            console.log("FormBuilder: Updated custom field for formDetails:", label, updatedField);
                            return updatedField;
                        });
                }

                return updatedFields; // Return the updated fields for rendering
            });
        }
    };

    const handleFieldUpdate = (id, updatedField) => {
        console.log("FormBuilder: handleFieldUpdate called", id, updatedField);
        setFields((prevFields) => {
            const updatedFields = prevFields.map((field) => (field.id === id ? { ...field, ...updatedField } : field));
            console.log("FormBuilder: Fields after update:", updatedFields);
            return updatedFields;
        });
        
        // Reflect changes in formDetails for both default_fields and custom_fields
        if (formDetails.default_fields) {
            const updatedDefaultFields = formDetails.default_fields.map((field, index) => {
                // Check if this is the field we're updating (for default fields)
                if (`default-${field.position || index + 1}` === id) {
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
                    // Handle employee rating toggle
                    if (updatedField.hasEmployeeRating !== undefined) {
                        updated.hasEmployeeRating = updatedField.hasEmployeeRating;
                    }
                    console.log("FormBuilder: Updated default field in formDetails:", field.field_name, "hasEmployeeRating:", updated.hasEmployeeRating);
                    return updated;
                }
                return field;
            });
            formDetails.default_fields = updatedDefaultFields;
        }
        
        // Also update custom_fields if they exist
        if (formDetails.custom_fields) {
            const updatedCustomFields = formDetails.custom_fields.map((field, index) => {
                // Check if this is the field we're updating (for custom fields)
                if (`custom-${field.position || index + 1}` === id) {
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
                    // Handle employee rating toggle
                    if (updatedField.hasEmployeeRating !== undefined) {
                        updated.hasEmployeeRating = updatedField.hasEmployeeRating;
                    }
                    console.log("FormBuilder: Updated custom field in formDetails:", field.field_name, "hasEmployeeRating:", updated.hasEmployeeRating);
                    return updated;
                }
                return field;
            });
            formDetails.custom_fields = updatedCustomFields;
        }
        
        console.log("FormBuilder: formDetails after field update:", formDetails);
    };

    const handleAddField = () => {
        console.log("FormBuilder: handleAddField called");
        const newId = `custom-${fields.length + 1}`;
        const newField = {
            id: newId,
            label: "Enter Field Name",
            type: "text",
            is_required: false,
            enabled: true,
            position: fields.length + 1,
            placeholder: "",
            isNew: true, // <-- Flag to show edit mode
            hasEmployeeRating: false // Default to no employee rating
        };

        const updatedFields = [...fields, newField];
        setFields(updatedFields);
        console.log("FormBuilder: Fields after adding new field:", updatedFields);

        // Add to formDetails.custom_fields since this is a new custom field
        if (formDetails.custom_fields) {
            formDetails.custom_fields.push({
                field_name: newField.label,
                field_type: newField.type,
                is_required: newField.is_required,
                enabled: newField.enabled,
                position: newField.position,
                placeholder: newField.placeholder,
                is_new: newField.isNew,
                hasEmployeeRating: newField.hasEmployeeRating
            });
        } else {
            // Initialize custom_fields array if it doesn't exist
            formDetails.custom_fields = [{
                field_name: newField.label,
                field_type: newField.type,
                is_required: newField.is_required,
                enabled: newField.enabled,
                position: newField.position,
                placeholder: newField.placeholder,
                is_new: newField.isNew,
                hasEmployeeRating: newField.hasEmployeeRating
            }];
        }
        
        console.log("FormBuilder: formDetails after adding field:", formDetails);
    };

    const handleRemoveField = (id) => {
        console.log("FormBuilder: handleRemoveField called", id);
        const updatedFields = fields.filter((field) => field.id !== id);
        setFields(updatedFields);
        console.log("FormBuilder: Fields after removal:", updatedFields);

        // Also update formDetails.default_fields or custom_fields based on the field id
        if (id.startsWith('default-') && formDetails.default_fields) {
            // Remove from default_fields
            const defaultFieldIndex = parseInt(id.split('-')[1]) - 1;
            if (defaultFieldIndex >= 0 && defaultFieldIndex < formDetails.default_fields.length) {
                formDetails.default_fields.splice(defaultFieldIndex, 1);
                console.log("FormBuilder: Removed default field, updated formDetails:", formDetails);
            }
        } else if (id.startsWith('custom-') && formDetails.custom_fields) {
            // Remove from custom_fields
            const customFieldIndex = parseInt(id.split('-')[1]) - 1;
            if (customFieldIndex >= 0 && customFieldIndex < formDetails.custom_fields.length) {
                formDetails.custom_fields.splice(customFieldIndex, 1);
                console.log("FormBuilder: Removed custom field, updated formDetails:", formDetails);
            }
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
                                formType={formDetails?.form_type}
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
        </div>
    );
};

export default FormBuilder;