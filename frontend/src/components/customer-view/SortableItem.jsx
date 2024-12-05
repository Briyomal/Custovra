
import {  useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
//import { restrictToParentElement } from "@dnd-kit/modifiers";
import { Input } from "@/components/ui/input";
import { Textarea } from "../ui/textarea";
import { Star } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";

const SortableItem = ({ field, onFieldUpdate  }) => {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
        id: field.id,
    });

    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
        touchAction: "none",
    };

    const handleCheckedChange = (value) => {
        onFieldUpdate(field.id, { is_required: value });
    };

    const handleEnabledChange = (value) => {
        onFieldUpdate(field.id, { enabled: value });
    };

    // Ensure that the rendering properly checks if field exists

    return (
        
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={`items-center justify-between rounded-md border px-6 py-2 mb-4 w-full  backdrop-blur-md backdrop-filter"
            ${field.enabled ? "text-black dark:text-white bg-slate-100/20 dark:bg-slate-900/20" : "text-gray-500 bg-blue-400/10 dark:bg-slate-400/10"}`}>
            <p className="font-semibold hidden ">Position: {field.position}</p>
            <Label className="capitalize">{field.label}</Label>
            {field.type === "textarea" ? (
                <Textarea 
                    className="mt-2" 
                    type={field.type} 
                    placeholder={field.placeholder} 
                    disabled={!field.enabled}
                />
            ) : field.type === "rating" ? (
                <div className="flex space-x-1">
                    {Array.from({ length: 5 }).map((_, index) => (
                        <Star 
                            fill={`${field.enabled ? "yellow" : "gray"}`}
                            key={index} 
                            className={`mt-3 w-5 h-5 ${field.enabled ? "text-yellow-500" : "text-gray-400"}`}
                        />
                    ))}
                </div>
            ) : (
                <Input 
                    className="mt-2" 
                    type={field.type} 
                    placeholder={field.placeholder} 
                    disabled={!field.enabled}
                />
            )}

            <div className="flex flex-row justify-between items-center mt-2">
                <Label className="flex items-center space-x-2 capitalize" >
                    <Checkbox
                        checked={field.is_required}
                        onCheckedChange={handleCheckedChange}
                        disabled={!field.enabled}
                    />
                    <div className={`${field.enabled ? "dark:text-white" : "text-gray-500"}`}>Required</div>
                </Label>
                <Switch id="field-enabled"
                    checked={field.enabled}
                    onCheckedChange={handleEnabledChange}
                />
            </div>
        </div>
        
    );
};

export default SortableItem;