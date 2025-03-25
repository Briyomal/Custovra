import { useEffect, useState } from "react";
import { useSensor, useSensors, MouseSensor, TouchSensor, KeyboardSensor } from "@dnd-kit/core";
import FormSidebar from "./FormSidebar";
import FormSkeleton from "./FormSkelton";
import FormFieldList from "./FormFields";
import { arrayMove } from "@dnd-kit/sortable";

// Component for each sortable field

const FormBuilder = ({ formDetails, onFieldUpdate, onFileSelect }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [fields, setFields] = useState([]);

/* OLD CODE FOR SHOW FIELDS
    useEffect(() => {
        if (formDetails?.default_fields) {
            // Map formDetails to the format needed for rendering and sort by position
            const mappedFields = formDetails.default_fields
                .map((field, index) => ({
                    id: String(field.position || index + 1), // Use `position` from the database or fallback to index
                    label: field.field_name,
                    type: field.field_type,
                    is_required: field.is_required,
                    enabled: field.enabled,
                    position: field.position || index + 1, // Ensure position is included for rendering
                    placeholder: field.placeholder || "",
                }))
                .sort((a, b) => a.position - b.position); // Sort by position (ascending)
    
            setFields(mappedFields);
        }
        setTimeout(() => setIsLoading(false), 800);
    }, [formDetails]);
    */

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

    return (
        <div className="flex w-full h-full">
            <div className="p-4 w-full">
                {isLoading ? (
                    <FormSkeleton />
                ) : (
                    <FormFieldList
                        fields={fields}
                        sensors={sensors}
                        onDragEnd={handleDragEnd}
                        onFieldUpdate={handleFieldUpdate}
                    />
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