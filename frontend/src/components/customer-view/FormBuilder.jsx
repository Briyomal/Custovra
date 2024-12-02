import { closestCorners, DndContext, useSensor, useSensors, MouseSensor, TouchSensor, KeyboardSensor } from "@dnd-kit/core";
import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch"
import { SortableContext, useSortable, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Textarea } from "../ui/textarea";
import { Star } from "lucide-react";
import FormSidebar from "./FormSidebar";

// Component for each sortable field
const SortableItem = ({ field }) => {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
        id: field.id,
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const [isChecked, setIsChecked] = useState(field.is_required);
    const [isEnabled, setIsEnabled] = useState(true);

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={`items-center justify-between rounded-md border px-6 py-2 mb-4 w-full  backdrop-blur-md backdrop-filter"
            ${isEnabled ? "text-black dark:text-white bg-slate-100/20 dark:bg-slate-900/20" : "text-gray-500 bg-blue-400/10 dark:bg-slate-400/10"}`}>
            
            <Label>{field.label}</Label>
            {field.type === "textarea" ? (
                <Textarea 
                    className="mt-2" 
                    type={field.type} 
                    placeholder={field.placeholder} 
                    disabled={!isEnabled}
                />
            ) : field.type === "rating" ? (
                <div className="flex space-x-1">
                    {Array.from({ length: 5 }).map((_, index) => (
                        <Star 
                            fill={`${isEnabled ? "yellow" : "gray"}`}
                            key={index} 
                            className={`mt-3 w-5 h-5 ${isEnabled ? "text-yellow-500" : "text-gray-400"}`}
                        />
                    ))}
                </div>
            ) : (
                <Input 
                    className="mt-2" 
                    type={field.type} 
                    placeholder={field.placeholder} 
                    disabled={!isEnabled}
                />
            )}

            <div className="flex flex-row justify-between items-center mt-2">
                <Label className="flex items-center space-x-2 " >
                    <Checkbox
                        checked={isChecked}
                        onCheckedChange={(value) => setIsChecked(value)}
                        disabled={!isEnabled}
                    />
                    <div className={`${isEnabled ? "dark:text-white" : "text-gray-500"}`}>Required</div>
                </Label>
                <Switch id="field-enabled"
                    checked={isEnabled}
                    onCheckedChange={(value) => setIsEnabled(value)}
                />
            </div>
        </div>
    );
};

const FormBuilder = ( { formDetails } ) => {
    const [fields, setFields] = useState([
        { id: "1", label: "Name", type: "text", is_required: false, enabled: true, placeholder: "John Doe" },
        { id: "2", label: "Email", type: "email", is_required: true, enabled: true, placeholder: "mail@example.com" },
        { id: "3", label: "Phone", type: "phone", is_required: false, enabled: true, placeholder: "+123456789" },
        { id: "4", label: "Rating", type: "rating", is_required: false, enabled: true, placeholder: "" },
        { id: "5", label: "Comment", type: "textarea", is_required: false, enabled: true, placeholder: "Write your review" },
    ]);

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
                const oldIndex = prevFields.findIndex((item) => item.id === active.id);
                const newIndex = prevFields.findIndex((item) => item.id === over?.id);
                return arrayMove(prevFields, oldIndex, newIndex);
            });
        }
    };

    return (
        <div className="flex w-full h-full">
            <div className="p-4 w-full">
                <div className="bg-background max-w-[800px] w-full h-full m-auto rounded-xl flex flex-col items-center justify-start overflow-y-auto overflow-x-hidden md:px-4 px-20 py-4">
                    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
                        <SortableContext items={fields.map((field) => field.id)}>
                            {fields.map((field) => (
                                <SortableItem key={field.id} field={field} />
                            ))}
                        </SortableContext>
                    </DndContext>
                </div>
            </div>
            <FormSidebar formDetails={formDetails} />
        </div>
    );
};

export default FormBuilder;
