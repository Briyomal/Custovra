import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Input } from "@/components/ui/input";
import { Textarea } from "../ui/textarea";
import { Star, MoreVertical } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
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

const SortableItem = ({ field, onFieldUpdate }) => {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
        id: field.id,
    });

    const [open, setOpen] = useState(false);
    const [editValues, setEditValues] = useState({
        label: field.label,
        type: field.type,
        placeholder: field.placeholder || "",
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
        const updates = { enabled: value };
        if (!value) updates.is_required = false;
        onFieldUpdate(field.id, updates);
    };

    const handleDialogSave = () => {
        onFieldUpdate(field.id, {
            label: editValues.label,
            type: editValues.type,
            placeholder: editValues.placeholder,
        });
        setOpen(false);
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

                            <DialogFooter>
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
        </div>
    );
};

export default SortableItem;
