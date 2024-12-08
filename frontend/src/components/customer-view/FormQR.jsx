import {
    DialogClose,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Copy } from "lucide-react"
import toast from "react-hot-toast"

const FormQR = ({formLink}) => {

    const handleCopy = () => {
        const fullUrl = `http://localhost:5173/forms${formLink?.form_link}`;
        navigator.clipboard.writeText(fullUrl) // Copy to clipboard
            .then(() => {
                toast.success("Link copied to clipboard!", {
                    style: {
                        borderRadius: "10px",
                        background: "#222",
                        color: "#fff",
                        padding: "10px",
                        textAlign: "center",
                        marginBottom: "10px",
                    },
                }); // Optional: Success toast
            })
            .catch(() => {
                toast.error("Failed to copy the link.", {
                    style: {
                        borderRadius: "10px",
                        background: "#222",
                        color: "#fff",
                        padding: "10px",
                        textAlign: "center",
                        marginBottom: "10px",
                    },
                }); // Optional: Error toast
            });
    };
  return (
    <>
        <DialogHeader>
            <DialogTitle>Share link</DialogTitle>
            <DialogDescription>
                Anyone who has this link will be able to view this form.
            </DialogDescription>
        </DialogHeader>
            {!formLink?.form_link ? (
                <p className="text-red-500"> Please publish the form first</p>
            ): (
                <div className="flex items-center space-x-2">
                    <div className="grid flex-1 gap-2">
                        <Label htmlFor="link" className="sr-only">
                            Link
                        </Label>
                        <Input
                            id="link"
                            defaultValue={`http://localhost:5173/forms${formLink?.form_link}`}
                            readOnly
                        />
                    </div>
                    <Button type="submit" size="sm" className="px-3"
                        onClick={handleCopy}
                    >
                        <span className="sr-only">Copy</span>
                        <Copy />
                    </Button>
                </div>             
            )}
        <DialogFooter className="sm:justify-start">
            <DialogClose asChild>
                <Button type="button" variant="secondary">
                    Close
                </Button>
            </DialogClose>
        </DialogFooter>
      
    </>
  )
}

export default FormQR
