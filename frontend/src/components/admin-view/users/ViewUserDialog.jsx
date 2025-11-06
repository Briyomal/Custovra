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
  CalendarClock,
  Shield,
  CheckCircle,
  Key
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function ViewUserDialog({ user, open, onOpenChange }) {
  if (!user) return null;

  const formatDate = (date) => {
    if (!date) return "N/A";
    try {
      return format(new Date(date), "MMM dd, yyyy 'at' h:mm a");
    } catch {
      return "Invalid Date";
    }
  };

  const getInitials = (name) => {
    if (!name) return "U";
    const names = name.split(" ");
    if (names.length === 1) return names[0].charAt(0).toUpperCase();
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  };

  const getPlanVariant = (plan) => {
    if (!plan || plan === "Free") return "secondary";
    return "default";
  };
  console.log(user);
  const getStatusVariant = (status) => {
    switch (status) {
      case "active": return "default";
      case "past_due": return "destructive";
      case "canceled": return "secondary";
      case "incomplete": return "outline";
      case "trialing": return "secondary";
      default: return "secondary";
    }
  };

  const getRoleVariant = (role) => {
    return role === "admin" ? "default" : "secondary";
  };

  const getAccountStatusVariant = (isActive) => {
    return isActive ? "default" : "destructive";
  };

  const getVerificationVariant = (isVerified) => {
    return isVerified ? "default" : "secondary";
  };

  const get2FAVariant = (isEnabled) => {
    return isEnabled ? "default" : "secondary";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="text-left">
          <DialogTitle className="flex items-center gap-3 text-2xl">
            <Avatar className="h-12 w-12">
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback className="bg-primary/10 text-primary">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                {user.name || "Unnamed User"}
                <Badge variant={getRoleVariant(user.role)} className="ml-2">
                  {user.role || "N/A"}
                </Badge>
              </div>
              <p className="text-sm font-normal text-muted-foreground">
                {user.email || "No email provided"}
              </p>
            </div>
          </DialogTitle>
          <DialogDescription>
            Detailed information about {user.name}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-5 py-2">
          {/* User Information Card */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="h-5 w-5 text-primary" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">Full Name</span>
                </div>
                <span className="font-medium">{user.name || "N/A"}</span>
              </div>
              
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">Email</span>
                </div>
                <span className="font-medium">{user.email || "N/A"}</span>
              </div>
              
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">Phone</span>
                </div>
                <span className="font-medium">{user.phone || "N/A"}</span>
              </div>
              
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">Account Status</span>
                </div>
                <Badge variant={getAccountStatusVariant(user.is_active)} className="w-fit">
                  {user.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>
              
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">Email Verified</span>
                </div>
                <Badge variant={getVerificationVariant(user.isVerified)} className="w-fit">
                  {user.isVerified ? "Verified" : "Not Verified"}
                </Badge>
              </div>
              
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <Key className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">2FA Status</span>
                </div>
                <Badge variant={get2FAVariant(user.twoFactorEnabled)} className="w-fit">
                  {user.twoFactorEnabled ? "Enabled" : "Disabled"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Subscription Information Card */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <CreditCard className="h-5 w-5 text-primary" />
                Subscription Details
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">Current Plan</span>
                </div>
                <Badge 
                  variant={getPlanVariant(user.subscription_plan)} 
                  className={
                    user.subscription_plan === "Silver" ? "w-fit bg-gradient-to-r from-purple-400 to-purple-600 text-white" :
                    user.subscription_plan === "Gold" ? "w-fit bg-gradient-to-r from-green-400 to-green-600 text-white" :
                    user.subscription_plan === "Diamond" ? "w-fit bg-gradient-to-r from-green-400 to-green-600 text-white" :
                    user.subscription_plan === "Platimun" ? "w-fit bg-gradient-to-r from-purple-400 to-purple-600 text-white" :
                    "w-fit bg-gradient-to-r from-gray-400 to-gray-600 text-white"
                  }
                >
                  {user.subscription_plan || "Free"}
                </Badge>
              </div>
              
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <CalendarClock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">Next Due Date</span>
                </div>
                <span className="font-medium">{formatDate(user.subscription_expiry)}</span>
              </div>
              
              <div className="flex flex-col gap-1 md:col-span-2">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">Subscription Status</span>
                </div>
                <Badge 
                  variant={getStatusVariant(user.subscription_status)} 
                  className={
                    user.subscription_status === "active" ? "w-fit bg-green-500 hover:bg-green-600" :
                    user.subscription_status === "past_due" ? "w-fit bg-red-500 hover:bg-red-600" :
                    user.subscription_status === "canceled" ? "w-fit bg-gray-500 hover:bg-gray-600" :
                    user.subscription_status === "incomplete" ? "w-fit bg-yellow-500 hover:bg-yellow-600" :
                    user.subscription_status === "trialing" ? "w-fit bg-blue-400 hover:bg-blue-500" :
                    "w-fit"
                  }
                >
                  {user.subscription_status ? user.subscription_status.replace('_', ' ') : "N/A"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Usage Statistics Card */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-5 w-5 text-primary" />
                Usage Statistics
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">Forms Created</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge 
                    variant="outline" 
                    className={
                      (user.formCount || 0) > 50 ? "text-lg font-bold bg-blue-100 text-blue-800" :
                      (user.formCount || 0) > 20 ? "text-lg font-bold bg-green-100 text-green-800" :
                      (user.formCount || 0) > 5 ? "text-lg font-bold bg-yellow-100 text-yellow-800" :
                      "text-lg font-bold"
                    }
                  >
                    {user.formCount || 0}
                  </Badge>
                </div>
              </div>
              
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">Submissions</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge 
                    variant="outline" 
                    className={
                      (user.submissionCount || 0) > 500 ? "text-lg font-bold bg-purple-100 text-purple-800" :
                      (user.submissionCount || 0) > 100 ? "text-lg font-bold bg-blue-100 text-blue-800" :
                      (user.submissionCount || 0) > 20 ? "text-lg font-bold bg-green-100 text-green-800" :
                      "text-lg font-bold"
                    }
                  >
                    {user.submissionCount || 0}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Additional Information Card */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="h-5 w-5 text-primary" />
                Account Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">Account Created</span>
                </div>
                <span className="font-medium">{formatDate(user.createdAt)}</span>
              </div>
              
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <CalendarClock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">Last Login</span>
                </div>
                <span className="font-medium">{formatDate(user.lastLogin)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}