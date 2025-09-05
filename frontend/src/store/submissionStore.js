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

    // Fetch submissions for forms owned by a user (includes public submissions)
    fetchSubmissions: async (userId) => {
        set({ isLoading: true, error: null });
        try {
            const response = await axios.get(`${API_URL}/owner/${userId}`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('authToken')}`
                }
            });
            set({ submissions: response.data, isLoading: false });
        } catch (error) {
            set({
                error: error.response?.data?.message || "Failed to fetch submissions",
                isLoading: false,
            });
        }
    },

        
    fetchSubmissionsByForm: async (formId) => {
      try {
        set({ isLoading: true, error: null });
        const response = await axios.get(`${API_URL}/form/${formId}`, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem('authToken')}`
            }
        });
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
            // Determine if we're sending FormData (for file uploads) or JSON
            const isFormData = formDetails instanceof FormData;
            
            // Set appropriate headers for FormData
            const config = {
                headers: {
                    'Content-Type': isFormData ? 'multipart/form-data' : 'application/json',
                }
            };
            
            const response = await axios.post(API_URL, formDetails, config);
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
            throw error; // Throw error to handle it in the component
        }
    },

    // Clear error state
    clearError: () => set({ error: null }),
}));

export default useSubmissionStore;
