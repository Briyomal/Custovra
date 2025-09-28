import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  CreditCard, 
  FileText, 
  MessageSquare,
  CalendarClock
} from "lucide-react";

export function ViewUserDialog({ user, open, onOpenChange }) {
  if (!user) return null;

  const formatDate = (date) => {
    return date ? format(new Date(date), "MMM dd, yyyy") : "N/A";
  };

  const getPlanVariant = (plan) => {
    if (!plan || plan === "Free") return "secondary";
    if (plan === "Basic") return "default";
    if (plan === "Standard") return "secondary";
    if (plan === "Premium") return "default";
    return "secondary";
  };

  const getRoleVariant = (role) => {
    return role === "admin" ? "default" : "secondary";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            User Details
          </DialogTitle>
          <DialogDescription>
            Detailed information about {user.name}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-6">
          {/* User Information Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="h-4 w-4" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">Name:</span>
                <span>{user.name || "N/A"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">Email:</span>
                <span>{user.email || "N/A"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">Phone:</span>
                <span>{user.phone || "N/A"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">Role:</span>
                <Badge variant={getRoleVariant(user.role)}>
                  {user.role || "N/A"}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">Status:</span>
                <Badge variant={user.is_active ? "default" : "destructive"}>
                  {user.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">Verified:</span>
                <Badge variant={user.isVerified ? "default" : "secondary"}>
                  {user.isVerified ? "Verified" : "Not Verified"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Subscription Information Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <CreditCard className="h-4 w-4" />
                Subscription Details
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">Current Plan:</span>
                <Badge variant={getPlanVariant(user.subscription_plan)}>
                  {user.subscription_plan || "Free"}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <CalendarClock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">Next Due Date:</span>
                <span>{formatDate(user.subscription_expiry)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">Subscription Status:</span>
                <Badge variant={user.subscription_status === "active" ? "default" : "secondary"}>
                  {user.subscription_status || "N/A"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Usage Statistics Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-4 w-4" />
                Usage Statistics
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">Forms Created:</span>
                <Badge variant="outline">{user.formCount || 0}</Badge>
              </div>
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">Submissions:</span>
                <Badge variant="outline">{user.submissionCount || 0}</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Additional Information Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="h-4 w-4" />
                Additional Information
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">Last Login:</span>
                <span>{formatDate(user.lastLogin)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">Account Created:</span>
                <span>{formatDate(user.createdAt)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">2FA Enabled:</span>
                <Badge variant={user.twoFactorEnabled ? "default" : "secondary"}>
                  {user.twoFactorEnabled ? "Enabled" : "Disabled"}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}