import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import CustomerLayoutPage from "./LayoutPage"
import { useState, useEffect } from "react";
import useProfileStore from "@/store/profileStore";
import { useAuthStore } from "@/store/authStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import { KeyRound, Loader } from "lucide-react";
import PasswordStrengthMeter from "@/components/PasswordStrengthMeter";
import { formatDate } from "../../utils/date";
import { User, Building, Mail, Phone, Calendar, LogIn, BadgeInfo, Key, Lock, QrCode, CheckCircle, XCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle} from "@/components/ui/dialog";

function ProfilePage() {
    const { user, isAuthenticated } = useAuthStore();
    const userId = user?._id;
    const {
        fetchProfile,
        profile,
        handlePasswordChange,
        updateProfile,
        error,
        generate2FA,
        verify2FA,
        disable2FA
    } = useProfileStore();


    const [loadingPWForm, setLoadingPWForm] = useState(false);
    const [loadingForm, setLoadingForm] = useState(false);
    const [name, setName] = useState('');
    const [company, setCompany] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [formErrors, setFormErrors] = useState([]);
    
    // 2FA states
    const [is2FAEnabled, setIs2FAEnabled] = useState(false);
    const [qrCode, setQrCode] = useState("");
    const [secret, setSecret] = useState("");
    const [token, setToken] = useState("");
    const [is2FALoading, setIs2FALoading] = useState(false);
    const [showQRCode, setShowQRCode] = useState(false);


    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!userId) {
            toast.error("User not found!");
            return;
        }

        setLoadingPWForm(true);
        try {
            await handlePasswordChange(currentPassword, newPassword, confirmPassword);
            toast.success("Password changed successfully!");

            // Clear the form fields after successful submission
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
        } catch (error) {
            console.error("Error changing password:", error.message);
            toast.error(error.message);
        } finally {
            setLoadingPWForm(false);
        }
    };

    const handleProfileSubmit = async (e) => {
        e.preventDefault();

        if (!userId) {
            toast.error("User not found!");
            return;
        }
        
        const validationErrors = validateProfile(name, company, email, phone);
        if (validationErrors.length > 0) {
            setFormErrors(validationErrors);
            return;
        }

        setLoadingForm(true);
        try {
            await updateProfile(name, company, email, phone);
            toast.success("Profile updated successfully!");
            setFormErrors([]);
        } catch (error) {
            console.error("Error updating profile:", error.message);
            toast.error(error.message);
        } finally {
            setLoadingForm(false);
        }
    };

    const validateProfile = (name, company, email, phone) => {
        const errors = [];
    
        if (!name.trim()) {
            errors.push("Name is required.");
        } else if (name.length < 3) {
            errors.push("Name must be at least 3 characters long.");
        }
    
        if (!company.trim()) {
            errors.push("Company name is required.");
        }
    
        if (!email.trim()) {
            errors.push("Email is required.");
        } else if (!/\S+@\S+\.\S+/.test(email)) {
            errors.push("Invalid email format.");
        }
    
        if (phone && !/^\+?[0-9]\d{9,14}$/.test(phone)) {
            errors.push("Phone number must be at least 10 digits and in valid format.");
        }
    
        return errors;
    };
    
    // 2FA functions
    const handleEnable2FA = async () => {
        setIs2FALoading(true);
        try {
            const response = await generate2FA();
            setQrCode(response.qrCode);
            setSecret(response.secret);
            setShowQRCode(true);
        } catch (error) {
            toast.error(error.message || "Failed to generate 2FA");
        } finally {
            setIs2FALoading(false);
        }
    };

    const handleVerify2FA = async () => {
        if (!token) {
            toast.error("Please enter the token from your authenticator app");
            return;
        }
        
        setIs2FALoading(true);
        try {
            await verify2FA(token);
            setIs2FAEnabled(true);
            setShowQRCode(false);
            setToken("");
            toast.success("2FA enabled successfully!");
        } catch (error) {
            toast.error(error.message || "Failed to verify 2FA");
        } finally {
            setIs2FALoading(false);
        }
    };

    const handleDisable2FA = async () => {
        setIs2FALoading(true);
        try {
            await disable2FA();
            setIs2FAEnabled(false);
            toast.success("2FA disabled successfully!");
        } catch (error) {
            toast.error(error.message || "Failed to disable 2FA");
        } finally {
            setIs2FALoading(false);
        }
    };
    
    useEffect(() => {
        if (isAuthenticated && userId) {
            fetchProfile(userId);
        }
    }, [userId, isAuthenticated, fetchProfile]);

    useEffect(() => {
        if (profile?.name) {
            setName(profile.name);
        }
        if (profile?.company) {
            setCompany(profile.company);
        }
        if (profile?.email) {
            setEmail(profile.email);
        }
        if (profile?.phone) {
            setPhone(profile.phone);
        }
        if (profile?.twoFactorEnabled !== undefined) {
            setIs2FAEnabled(profile.twoFactorEnabled);
        }
    }, [profile]);

    return (
        <CustomerLayoutPage>
            <div className="container mx-auto py-6">
                <div className="mb-8">
                    <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
                        Profile Settings
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mt-2">
                        Manage your profile information and account settings
                    </p>
                </div>

                <Tabs defaultValue="info" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 bg-[#1d1d1d] text-[#16bf4c]">
                        <TabsTrigger value="info" className="flex items-center gap-2 col-span-1">
                            <BadgeInfo className="h-4 w-4" />
                            Profile & Activity
                        </TabsTrigger>
                        <TabsTrigger value="profile" className="flex items-center gap-2 col-span-1">
                            <User className="h-4 w-4" />
                            Update Profile
                        </TabsTrigger>
                        <TabsTrigger value="security" className="flex items-center gap-2 col-span-1">
                            <KeyRound className="h-4 w-4" />
                            Password & Security
                        </TabsTrigger>
                        <TabsTrigger value="2fa" className="flex items-center gap-2 col-span-1">
                            <Lock className="h-4 w-4" />
                            2FA
                        </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="info" className="mt-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Profile Information Card */}
                            <Card>
                                <CardHeader className="border-b dark:bg-[#161616]">
                                    <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                                        <User className="h-5 w-5" />
                                        <span>Profile Information</span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-6">
                                    <div className="space-y-4">
                                        <div className="flex items-start gap-3">
                                            <User className="h-5 w-5 text-gray-500 mt-0.5" />
                                            <div>
                                                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Name</h3>
                                                <p className="text-gray-900 dark:text-white font-medium">{name || profile?.name || "Not set"}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <Building className="h-5 w-5 text-gray-500 mt-0.5" />
                                            <div>
                                                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Company</h3>
                                                <p className="text-gray-900 dark:text-white">{company || profile?.company || "Not set"}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <Mail className="h-5 w-5 text-gray-500 mt-0.5" />
                                            <div>
                                                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Email</h3>
                                                <p className="text-gray-900 dark:text-white">{email || profile?.email || "Not set"}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <Phone className="h-5 w-5 text-gray-500 mt-0.5" />
                                            <div>
                                                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Phone</h3>
                                                <p className="text-gray-900 dark:text-white">{phone || profile?.phone || "Not set"}</p>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Account Activity Card */}
                            <Card>
                                <CardHeader className="border-b dark:bg-[#161616]">
                                    <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                                        <Calendar className="h-5 w-5" />
                                        <span>Account Activity</span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-6">
                                    <div className="space-y-4">
                                        <div className="flex items-start gap-3">
                                            <Calendar className="h-5 w-5 text-gray-500 mt-0.5" />
                                            <div>
                                                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Joined</h3>
                                                <p className="text-gray-900 dark:text-white">
                                                    {user?.createdAt ? new Date(user.createdAt).toLocaleDateString("en-US", {
                                                        year: "numeric",
                                                        month: "long",
                                                        day: "numeric",
                                                    }) : "N/A"}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <LogIn className="h-5 w-5 text-gray-500 mt-0.5" />
                                            <div>
                                                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Last Login</h3>
                                                <p className="text-gray-900 dark:text-white">
                                                    {user?.lastLogin ? formatDate(user.lastLogin) : "N/A"}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <Lock className="h-5 w-5 text-gray-500 mt-0.5" />
                                            <div>
                                                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Two-Factor Authentication</h3>
                                                <div className="flex items-center gap-2 mt-1">
                                                    {is2FAEnabled ? (
                                                        <>
                                                            <CheckCircle className="h-4 w-4 text-green-500" />
                                                            <span className="text-green-600 dark:text-green-400">Enabled</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <XCircle className="h-4 w-4 text-red-500" />
                                                            <span className="text-red-600 dark:text-red-400">Disabled</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>
                    
                    <TabsContent value="profile" className="mt-6">
                        <Card>
                            <CardHeader className="border-b dark:bg-[#161616]">
                                <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                                    <User className="h-5 w-5" />
                                    <span>Update Profile Information</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <form onSubmit={handleProfileSubmit} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="full_name">Full Name</Label>
                                            <Input
                                                id="full_name"
                                                type="text"
                                                placeholder="Full Name"
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="company">Company</Label>
                                            <Input
                                                id="company"
                                                type="text"
                                                placeholder="Company/Organization"
                                                value={company}
                                                onChange={(e) => setCompany(e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="email">Email</Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                placeholder=""
                                                disabled
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="phone">Phone</Label>
                                            <Input
                                                id="phone"
                                                type="tel"
                                                placeholder="e.g., +1234567890"
                                                value={phone}
                                                onChange={(e) => setPhone(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    
                                    {formErrors.length > 0 && (
                                        <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4 border border-red-200 dark:border-red-800">
                                            <h3 className="text-sm font-medium text-red-800 dark:text-red-200 flex items-center gap-2">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                                </svg>
                                                Please correct the following errors:
                                            </h3>
                                            <ul className="mt-2 list-disc list-inside space-y-1">
                                                {formErrors.map((error, index) => (
                                                    <li key={index} className="text-sm text-red-700 dark:text-red-300">{error}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                    
                                    <div className="flex justify-end">
                                        <Button
                                            type="submit"
                                            className="w-full md:w-auto rounded-md font-semibold text-black border
                                                          border-lime-500
                                                            bg-gradient-to-r from-[#16bf4c] to-lime-500
                                                            transition-all duration-200 ease-in-out 
                                                            hover:shadow-[0_0_15px_rgba(22,191,76,0.4)] hover:from-lime-400 hover:to-[#1cbf16] 
                                                            focus:outline-none focus:ring-2 focus:ring-lime-400"
                                            disabled={loadingForm}>
                                            {loadingForm ? (
                                                <>
                                                    <Loader className="mr-2 h-4 w-4 animate-spin" /> Updating...
                                                </>
                                            ) : (
                                                "Update Profile"
                                            )}
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </TabsContent>
                    
                    <TabsContent value="security" className="mt-6">
                        <Card>
                            <CardHeader className="border-b dark:bg-[#161616]">
                                <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                                    <Key className="h-5 w-5" />
                                    <span>Password & Security</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="current_password">Current Password</Label>
                                            <Input
                                                id="current_password"
                                                type="password"
                                                placeholder="Current Password"
                                                value={currentPassword}
                                                onChange={(e) => setCurrentPassword(e.target.value)}
                                                required
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <Label htmlFor="new_password">New Password</Label>
                                                <Input
                                                    id="new_password"
                                                    type="password"
                                                    placeholder="New Password"
                                                    value={newPassword}
                                                    onChange={(e) => setNewPassword(e.target.value)}
                                                    required
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="confirm_password">Confirm New Password</Label>
                                                <Input
                                                    id="confirm_password"
                                                    type="password"
                                                    placeholder="Confirm New Password"
                                                    value={confirmPassword}
                                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                                    required
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <PasswordStrengthMeter password={newPassword} />
                                    
                                    {error && (
                                        <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4 border border-red-200 dark:border-red-800">
                                            <p className="text-sm text-red-700 dark:text-red-300 flex items-center gap-2">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                                </svg>
                                                Error: {error}
                                            </p>
                                        </div>
                                    )}
                                    
                                    <div className="flex justify-end">
                                        <Button
                                            type="submit"
                                            className="w-full md:w-auto rounded-md font-semibold text-black border
                                                          border-lime-500
                                                            bg-gradient-to-r from-[#16bf4c] to-lime-500
                                                            transition-all duration-200 ease-in-out 
                                                            hover:shadow-[0_0_15px_rgba(22,191,76,0.4)] hover:from-lime-400 hover:to-[#1cbf16] 
                                                            focus:outline-none focus:ring-2 focus:ring-lime-400"
                                            disabled={loadingPWForm}>
                                            {loadingPWForm ? (
                                                <>
                                                    <Loader className="mr-2 h-4 w-4 animate-spin" /> Updating...
                                                </>
                                            ) : (
                                                "Update Password"
                                            )}
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </TabsContent>
                    
                    <TabsContent value="2fa" className="mt-6">
                        <Card>
                            <CardHeader className="border-b dark:bg-[#161616]">
                                <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                                    <Lock className="h-5 w-5" />
                                    <span>Two-Factor Authentication</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-[#161616] rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <QrCode className="h-6 w-6 text-[#16bf4c]" />
                                            <div>
                                                <h3 className="font-medium">Authenticator App</h3>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                                    Use an authenticator app to generate time-based codes
                                                </p>
                                            </div>
                                        </div>
                                        <Switch
                                            checked={is2FAEnabled}
                                            onCheckedChange={(checked) => {
                                                if (checked) {
                                                    handleEnable2FA();
                                                } else {
                                                    handleDisable2FA();
                                                }
                                            }}
                                            disabled={is2FALoading}
                                        />
                                    </div>
                                    
                                    {is2FAEnabled && (
                                        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                                            <div className="flex items-center gap-2">
                                                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                                                <h3 className="font-medium text-green-800 dark:text-green-200">2FA is Enabled</h3>
                                            </div>
                                            <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                                                Your account is protected with two-factor authentication.
                                            </p>
                                            <Button
                                                variant="outline"
                                                className="mt-3 text-red-600 border-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                                onClick={handleDisable2FA}
                                                disabled={is2FALoading}
                                            >
                                                {is2FALoading ? (
                                                    <>
                                                        <Loader className="mr-2 h-4 w-4 animate-spin" /> Disabling...
                                                    </>
                                                ) : (
                                                    "Disable 2FA"
                                                )}
                                            </Button>
                                        </div>
                                    )}
                                    
                                    <Dialog open={showQRCode} onOpenChange={setShowQRCode}>
                                        <DialogContent className="sm:max-w-md">
                                            <DialogHeader>
                                                <DialogTitle>Set up Authenticator App</DialogTitle>
                                                <DialogDescription>
                                                    Scan this QR code with your authenticator app and enter the code below
                                                </DialogDescription>
                                            </DialogHeader>
                                            <div className="flex flex-col items-center gap-4">
                                                {qrCode && (
                                                    <img src={qrCode} alt="QR Code" className="w-48 h-48" />
                                                )}
                                                <div className="text-center">
                                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                                        If you can&apos;t scan the QR code, enter this key manually:
                                                    </p>
                                                    <p className="font-mono text-sm mt-1 p-2 bg-gray-100 dark:bg-gray-800 rounded">
                                                        {secret}
                                                    </p>
                                                </div>
                                                <div className="w-full">
                                                    <Label htmlFor="token">Enter 6-digit code</Label>
                                                    <Input
                                                        id="token"
                                                        type="text"
                                                        placeholder="123456"
                                                        value={token}
                                                        onChange={(e) => setToken(e.target.value)}
                                                        className="mt-1"
                                                    />
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button
                                                        variant="outline"
                                                        onClick={() => setShowQRCode(false)}
                                                    >
                                                        Cancel
                                                    </Button>
                                                    <Button
                                                        className="rounded-md font-semibold text-black border
                                                          border-lime-500
                                                            bg-gradient-to-r from-[#16bf4c] to-lime-500
                                                            transition-all duration-200 ease-in-out 
                                                            hover:shadow-[0_0_15px_rgba(22,191,76,0.4)] hover:from-lime-400 hover:to-[#1cbf16] 
                                                            focus:outline-none focus:ring-2 focus:ring-lime-400"
                                                        onClick={handleVerify2FA}
                                                        disabled={is2FALoading}
                                                    >
                                                        {is2FALoading ? (
                                                            <>
                                                                <Loader className="mr-2 h-4 w-4 animate-spin" /> Verifying...
                                                            </>
                                                        ) : (
                                                            "Verify"
                                                        )}
                                                    </Button>
                                                </div>
                                            </div>
                                        </DialogContent>
                                    </Dialog>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </CustomerLayoutPage>
    )
}

export default ProfilePage