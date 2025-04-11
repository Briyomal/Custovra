import { useEffect, useState } from "react";
import { useSensor, useSensors, MouseSensor, TouchSensor, KeyboardSensor } from "@dnd-kit/core";
import FormSidebar from "./FormSidebar";
import FormSkeleton from "./FormSkelton";
import FormFieldList from "./FormFields";
import { arrayMove } from "@dnd-kit/sortable";
import { Button } from "@/components/ui/button";

// Component for each sortable field

const FormBuilder = ({ formDetails, onFieldUpdate, onFileSelect }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [fields, setFields] = useState([]);

    useEffect(() => {
        if (formDetails?.default_fields) {
            // Map formDetails to the format needed for rendering and sort by position
            const mappedFields = formDetails.default_fields
                .map((field, index) => {
                    // Skip the "Rating" field if form_type is "Complaint"
                    if (formDetails.form_type === "Complaint" && field.field_name === "Rating") {
                        return null; // Return null to exclude the field
                    }

                    return {
                        id: String(field.position || index + 1), // Use `position` from the database or fallback to index
                        label: field.field_name,
                        type: field.field_type,
                        is_required: field.is_required,
                        enabled: field.enabled,
                        position: field.position || index + 1, // Ensure position is included for rendering
                        placeholder: field.placeholder || "",
                    };
                })
                .filter(field => field !== null) // Filter out null values (those that were excluded)
                .sort((a, b) => a.position - b.position); // Sort by position (ascending)

            setFields(mappedFields);
        }

        setTimeout(() => setIsLoading(false), 800);
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
        const updatedDefaultFields = formDetails.default_fields.map((field, index) =>
            String(index + 1) === id ? { ...field, ...updatedField } : field
        );
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



    return (
        <div className="flex w-full h-full">
            <div className="p-4 w-full">
                {isLoading ? (
                    <FormSkeleton />
                ) : (
                    <div>
                        <div className="flex justify-end mb-4 px-6">
                            <Button
                                onClick={handleAddField}
                                className=" w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
                            >
                                Add Field
                            </Button>
                        </div>

                        <FormFieldList
                            fields={fields}
                            sensors={sensors}
                            onDragEnd={handleDragEnd}
                            onFieldUpdate={handleFieldUpdate}
                        />
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