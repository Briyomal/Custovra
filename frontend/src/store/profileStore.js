import { create } from "zustand";
import axios from "axios";

const API_URL = import.meta.env.MODE === "development" 
    ? "http://localhost:5000/api/profile" 
    : "https://www.acdreviewplatform.com/api/profile";

axios.defaults.withCredentials = true;

const useProfileStore = create((set) => ({
    profile: {},
    error: null,
    isLoading: false,

    //Fetch user profile
    fetchProfile: async (userId) => {
        set({ isLoading: true, error: null });
        try {
            const response = await axios.get(`${API_URL}/${userId}`);
            set({ profile: response.data, isLoading: false });
        } catch (error) {
            set({
                error: error.response?.data?.message || "Failed to fetch profile",
                isLoading: false,
            });
            console.error("Error fetching profile:", error);
        }
    },
    setProfile: (profileData) => set({ profile: profileData }),

        // Handle password change
        handlePasswordChange: async (currentPassword, newPassword, confirmPassword) => {
            set({ error: null, success: null, isLoading: true });
        
            if (newPassword !== confirmPassword) {
                set({ error: "New passwords do not match.", isLoading: false });
                throw new Error("New passwords do not match.");
            }
        
            try {
                const response = await axios.post(`${API_URL}/change-password`, {
                    currentPassword,
                    newPassword,
                });
        
                set({ success: response.data.message, isLoading: false });
                return response.data; // Return response to indicate success
            } catch (error) {
                const errorMessage = error.response?.data?.message || "Failed to update password.";
                set({ error: errorMessage, isLoading: false });
        
                // Throw an error so `handleSubmit` can catch it
                throw new Error(errorMessage);
            }
        },

        updateProfile: async (name, company, email, phone) => {
            set({ loading: true, error: null });
            console.log('phone number', phone);
            try {
                const response = await axios.put(`${API_URL}/update`, {
                    name,
                    company,
                    email,
                    phone,
                });
                set({ user: response.data, loading: false });
            } catch (error) {
                set({ error: error.response?.data?.message || "Failed to update profile", loading: false });
                throw error;
            }
        },


}));

export default useProfileStore;