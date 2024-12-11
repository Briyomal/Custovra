import { create } from "zustand";
import axios from "axios";

const API_URL = import.meta.env.MODE === "development" 
    ? "http://localhost:5000/api/submissions" 
    : "/api/forms";

    
axios.defaults.withCredentials = true;

// Zustand store for handling submissions
const useSubmissionStore = create((set) => ({
    submissions: [],
    error: null,
    isLoading: false,

    // Fetch submissions
    fetchSubmissions: async (userId) => {
        set({ isLoading: true, error: null });
        try {
            const response = await axios.get(`${API_URL}/${userId}`);
            set({ submissions: response.data, isLoading: false });
        } catch (error) {
            set({
                error: error.response?.data?.message || "Failed to fetch submissions",
                isLoading: false,
            });
            console.error("Error fetching submissions:", error);
        }
    },

    // Submit a form
    submitForm: async (formDetails) => {
        set({ isLoading: true, error: null });
        try {
            const response = await axios.post(API_URL, formDetails);
            set((state) => ({
                submissions: [...state.submissions, response.data],
                isLoading: false,
            }));
        } catch (error) {
            set({
                error: error.response?.data?.message || "Submission failed",
                isLoading: false,
            });
        }
    },

    // Clear error state
    clearError: () => set({ error: null }),
}));

export default useSubmissionStore;
