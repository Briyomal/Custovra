import {
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Star } from "lucide-react"

const FormPreview = (formPreview) => {
    const { default_fields = [], custom_fields = [] } = formPreview.formPreview || {}

    const allEnabledFields = [...default_fields, ...custom_fields].filter(field => field.enabled)

    return (
        <>
            {!allEnabledFields.length ? (
                <>
                    <h3 className="text-2xl font-semibold text-center text-red-500">🚨 Oops!</h3>
                    <p className="text-center text-gray-500">
                        Please save or publish your form first to preview it.
                    </p>
                </>
            ) : (
                <>
                    <DialogTitle className="text-center">{formPreview.formPreview.form_name}</DialogTitle>
                    <DialogHeader className="text-center flex flex-col">
                        {formPreview.formPreview.logo && (
                            <img
                                src={`${import.meta.env.VITE_SERVER_URL}${formPreview.formPreview.logo}`}
                                alt="Uploaded"
                                className="mt-1 w-48 h-auto rounded-md text-center mx-auto"
                            />
                        )}
                        <DialogDescription className="text-center">
                            {formPreview.formPreview.form_description}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-6 py-4">
                        {allEnabledFields
                            .sort((a, b) => (a.position || 0) - (b.position || 0))
                            .map((field, index) => (
                                <div key={field._id || index} className="flex flex-col space-y-2">
                                    <Label className="capitalize">
                                        {field.label || field.field_name || `Field ${index + 1}`}
                                        {field.is_required && <span className="text-red-500 ml-1">*</span>}
                                    </Label>

                                    {field.type === "textarea" || field.field_type === "textarea" ? (
                                        <Textarea
                                            name={field.label || field.field_name}
                                            placeholder={field.placeholder || ""}
                                            defaultValue={field.value || ""}
                                        />
                                    ) : field.type === "rating" || field.field_type === "rating" ? (
                                        <div className="flex space-x-1">
                                            {Array.from({ length: 5 }).map((_, i) => (
                                                <Star key={i} className="mt-3 w-5 h-5 text-gray-400" />
                                            ))}
                                        </div>
                                    ) : (
                                        <Input
                                            name={field.label || field.field_name}
                                            type={field.type || field.field_type || "text"}
                                            placeholder={field.placeholder || ""}
                                            defaultValue={field.value || ""}
                                        />
                                    )}
                                </div>
                            ))}
                    </div>

                    <DialogFooter>
                        <Button
                            variant="default"
                            className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 text-white hover:from-blue-700 hover:to-indigo-800"
                        >
                            Submit
                        </Button>
                    </DialogFooter>
                </>
            )}
        </>
    )
}

export default FormPreview
