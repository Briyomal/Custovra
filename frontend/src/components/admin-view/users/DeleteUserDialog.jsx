import { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";
import { AlertTriangle } from "lucide-react";

export function DeleteUserDialog({ user, open, onOpenChange, onUserDeleted }) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  const handleDelete = async () => {
    if (confirmText !== "Delete") {
      toast({
        title: "Error",
        description: "Please type 'Delete' to confirm",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.delete(
        `${import.meta.env.VITE_SERVER_URL}/api/users/user-delete/${user._id}`,
        { withCredentials: true }
      );

      if (response.data) {
        toast({
          title: "Success",
          description: "User deleted successfully",
        });
        onUserDeleted(user._id);
        onOpenChange(false);
        setConfirmText(""); // Reset the confirmation text
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete user",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setConfirmText(""); // Reset the confirmation text
    onOpenChange(false);
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Delete User
          </DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete the user account and all associated data.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <h4 className="font-medium text-red-800">User to be deleted:</h4>
            <p className="text-sm text-red-700 mt-1">{user.name || user.email}</p>
            <p className="text-xs text-red-600 mt-1">ID: {user._id}</p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="confirmText">
              To confirm, type <span className="font-bold">Delete</span> in the box below
            </Label>
            <Input
              id="confirmText"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Type 'Delete' to confirm"
              disabled={isLoading}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isLoading || confirmText !== "Delete"}
          >
            {isLoading ? "Deleting..." : "Delete User"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}