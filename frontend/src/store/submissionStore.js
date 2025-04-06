import { create } from "zustand";
import axios from "axios";

const API_URL = import.meta.env.MODE === "development" 
    ? `${import.meta.env.VITE_SERVER_URL}/api/submissions` 
    : `${import.meta.env.VITE_SERVER_URL}/api/submissions`;

    
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

        
    fetchSubmissionsByForm: async (formId) => {
      try {
        console.log("Fetching submissions for formId:", formId);
        set({ isLoading: true, error: null });
        const response = await axios.get(`${API_URL}/form/${formId}`);
        set({ 
          submissions: response.data,
          isLoading: false 
        });
        return response.data;
      } catch (error) {
        set({ 
          error: error.message, 
          isLoading: false 
        });
        throw error;
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

    deleteSubmission: async (submissionId, callback) => {
        try {
            const response = await axios.delete(`${API_URL}/${submissionId}`, {
                withCredentials: true, // Ensure cookies are sent with the request
            });
            // Update the state to reflect that the form has been deleted
            set((state) => ({
                submissions: state.submissions.filter((submission) => submission._id !== submissionId),
            }));
            if (callback) callback(); // Call the callback function if provided
            return response.data; // Return successful response data
        } catch (error) {
            console.error("Error deleting submission", error);
            throw error; // Throw error to handle it in the component
        }
    },

    // Clear error state
    clearError: () => set({ error: null }),
}));

export default useSubmissionStore;
