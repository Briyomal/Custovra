import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import CustomerLayoutPage from "./LayoutPage"
import { useState, useEffect } from "react";
import useProfileStore from "@/store/profileStore";
import { useAuthStore } from "@/store/authStore";
//import LoadingSpinner from "@/components/LoadingSpinner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import { Loader } from "lucide-react";
import PasswordStrengthMeter from "@/components/PasswordStrengthMeter";
import { formatDate } from "../../utils/date";

function ProfilePage() {
    const { user, isAuthenticated } = useAuthStore();
    const userId = user?._id;
    const {
        fetchProfile,
        profile,
        handlePasswordChange,
        updateProfile,
        error,
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
            toast.error(error.message); // Display the correct error message
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
    if (Object.keys(validationErrors).length > 0) {
        setFormErrors(validationErrors);
        return;
    }

        setLoadingForm(true);
        try {
            await updateProfile(name, company, email, phone);
            toast.success("Profile updated successfully!");
            setFormErrors([]); // Clear errors on success
        } catch (error) {
            console.error("Error updating profile:", error.message);
            toast.error(error.message); // Display the correct error message
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
    
        if (phone) {
            if (!/^\+?[0-9]\d{9,14}$/.test(phone)) {
                errors.push("Phone number must be at least 10 digits and in valid format.");
            }
        }
    
        return errors;
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
    }, [profile]);

    console.log("Profile Data Fetched:", profile);
    /*
        if (isLoading) {
            return <LoadingSpinner />;
        }
    */
    return (
        <CustomerLayoutPage>

            <div className="p-4">
            <h2 className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                Welcome, <span className="text-slate-800 dark:text-slate-200">{name}!</span> 
            </h2>

            <div className="mt-4">
                <h3 className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                    Profile Information
                </h3>
                <div className="text-gray-800 dark:text-gray-200 space-y-1">
                    <p><span className="font-semibold text-slate-800 dark:text-slate-300">Name:</span> {name}</p>
                    {company && (
                        <p><span className="font-semibold text-slate-800 dark:text-slate-300">Company:</span> {company}</p>
                    )}
                    <p><span className="font-semibold text-slate-800 dark:text-slate-300">Email:</span> {email}</p>
                    {phone && (
                        <p><span className="font-semibold text-slate-800 dark:text-slate-300">Phone:</span> {phone}</p>
                    )}
                </div>
            </div>

            <div className="mt-6">
                <h3 className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                    Account Activity
                </h3>
                <div className="text-gray-800 dark:text-gray-200 space-y-1">
                    <p>
                        <span className="font-semibold text-slate-800 dark:text-slate-300">Joined:</span>{" "}
                        {new Date(user?.createdAt).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                        })}
                    </p>
                    <p>
                        <span className="font-semibold text-slate-800 dark:text-slate-300">Last Login:</span>{" "}
                        {user?.lastLogin ? formatDate(user.lastLogin) : "N/A"}
                    </p>
                </div>
            </div>
        </div>
            <div className="flex flex-row gap-6 p-4 pt-0">
                <Card className="flex-grow">
                    <CardHeader className="border-b py-4">
                        <CardTitle className="text-xl font-semibold">Update Profile</CardTitle>
                    </CardHeader>

                    <CardContent>
                    <form onSubmit={handleProfileSubmit}>
                        <div className="grid grid-cols-2 gap-4 py-4">
                            <div>
                                <Label htmlFor="full_name">
                                    Full Name
                                </Label>
                                <Input
                                    className="mt-2"
                                    type='text'
                                    placeholder='Full Name'
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                />
                            </div>
                            <div>
                                <Label htmlFor="company">
                                    Company
                                </Label>
                                <Input
                                    className="mt-2"
                                    type='text'
                                    placeholder='Company/Organization'
                                    value={company}
                                    onChange={(e) => setCompany(e.target.value)}
                                />
                            </div>
                            <div>
                                <Label htmlFor="email">
                                    Email
                                </Label>
                                <Input
                                    className="mt-2"
                                    type='email'
                                    placeholder=''
                                    disabled
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                            <div>
                                <Label htmlFor="phone">
                                    Phone
                                </Label>
                                <Input
                                    className="mt-2"
                                    type='tel'
                                    placeholder=''
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                />
                            </div>

                        </div>
                        
                        {formErrors.length > 0 && (
                            <div className="error-list">
                                <ul>
                                    {formErrors.map((error, index) => (
                                        <li key={index} className="text-red-500 mb-2">{error}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        

                            <Button
                                    type="submit"
                                    className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-800"
                                    disabled={loadingForm}>

                                    {loadingForm ? (
                                        <>
                                            <Loader className="animate-spin mx-auto mr-1" size={28} /> Updating...
                                        </>
                                    ) : (
                                        <>
                                            Update Profile
                                        </>
                                    )}
                                </Button>
                                </form>

                    </CardContent>

                </Card>

                <Card className="flex-grow">
                    <CardHeader className="border-b py-4">
                        <CardTitle className="text-xl font-semibold">Change Password</CardTitle>
                    </CardHeader>

                    <form onSubmit={handleSubmit}>
                        <CardContent>

                            <div className="grid grid-cols-1 gap-4 py-4">
                                <div>
                                    <Label htmlFor="current_password">Current Password</Label>
                                    <Input
                                        className="mt-2"
                                        type="password"
                                        placeholder="Current Password"
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="new_password">New Password</Label>
                                    <Input
                                        className="mt-2"
                                        type="password"
                                        placeholder="New Password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        required
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="confirm_password">Confirm New Password</Label>
                                    <Input
                                        className="mt-2"
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
                            
                                
                            <div className="flex flex-col">
                                {error && <p className="text-red-500">Error: {error}</p>}
                            </div>
                            <Button
                                    type="submit"
                                    className="mt-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-800"
                                    disabled={loadingPWForm}>

                                    {loadingPWForm ? (
                                        <>
                                            <Loader className="animate-spin mx-auto mr-1" size={28} /> Updating...
                                        </>
                                    ) : (
                                        <>
                                            Update Password
                                        </>
                                    )}
                                </Button>
                        </CardContent>
                    </form>

                </Card>

            </div>
        </CustomerLayoutPage>
    )
}

export default ProfilePage
