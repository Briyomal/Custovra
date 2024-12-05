import { closestCorners, DndContext } from "@dnd-kit/core";
import SortableItem from "./SortableItem";
import { SortableContext } from "@dnd-kit/sortable";
import { restrictToParentElement } from "@dnd-kit/modifiers";

const FormFieldList = ({ fields, sensors, onDragEnd, onFieldUpdate }) => (
    <div className="bg-background max-w-[900px] w-full h-full m-auto rounded-xl flex flex-col items-center justify-start overflow-y-auto overflow-x-hidden px-4 xl:px-40 lg:px-6 py-4">
        <DndContext  modifiers={[restrictToParentElement]} sensors={sensors} collisionDetection={closestCorners} onDragEnd={onDragEnd}>
            <SortableContext items={fields.map((field) => field.id)}>
                {fields.map((field) => (
                    <SortableItem key={field.id} field={field} onFieldUpdate={onFieldUpdate} />
                ))}
            </SortableContext>
        </DndContext>
    </div>
);

export default FormFieldList;
