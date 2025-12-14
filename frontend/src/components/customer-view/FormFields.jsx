import { closestCorners, DndContext } from "@dnd-kit/core";
import SortableItem, { FormTypeContext } from "./SortableItem";
import { SortableContext } from "@dnd-kit/sortable";
import { restrictToParentElement } from "@dnd-kit/modifiers";

const FormFieldList = ({ fields, sensors, onDragEnd, onFieldUpdate, onFieldRemove, formType, isEmployeeManagementEnabled, isImageUploadEnabled }) => (
    <div className="bg-background max-w-[900px] w-full h-full m-auto rounded-xl flex flex-col items-center justify-start overflow-y-auto overflow-x-hidden px-4 xl:px-40 lg:px-6 py-4">
        <DndContext  modifiers={[restrictToParentElement]} sensors={sensors} collisionDetection={closestCorners} onDragEnd={onDragEnd}>
            <FormTypeContext.Provider value={formType}>
                <SortableContext items={fields.map((field) => field.id)}>
                    {fields.map((field) => (
                        <SortableItem 
                            key={field.id} 
                            field={field} 
                            onFieldUpdate={onFieldUpdate} 
                            onFieldRemove={onFieldRemove} 
                            isEmployeeManagementEnabled={isEmployeeManagementEnabled}
                            isImageUploadEnabled={isImageUploadEnabled}
                        />
                    ))}
                </SortableContext>
            </FormTypeContext.Provider>
        </DndContext>
    </div>
);

export default FormFieldList;