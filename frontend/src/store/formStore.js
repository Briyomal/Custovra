import { create } from "zustand";
import axios from "axios";

const API_URL = import.meta.env.MODE === "development" 
    ? `${import.meta.env.VITE_SERVER_URL}/api/forms` 
    : `${import.meta.env.VITE_SERVER_URL}/api/forms`;

axios.defaults.withCredentials = true;

const useFormStore = create((set) => ({
    forms: [], // State to store forms
    loading: false,
    error: null,

    // Fetch all forms for a user
    fetchForms: async (userId) => {
        set({ loading: true, error: null });
        try {
            console.log("Fetching forms for userId:", userId);
            const response = await axios.get(`${API_URL}/${userId}`);
            console.log("Response received:", response);
            set({ forms: response.data.forms || response.data || [], loading: false });
        } catch (error) {
            console.error("Error fetching forms:", error.response?.data || error.message);
            set({ error: error.response?.data?.message || "Failed to fetch forms", loading: false });
        }
    },

    fetchFormsNew: async (userId) => {
        set({ loading: true, error: null });
        try {
            console.log("Fetching forms for userId:", userId);
            const response = await axios.get(`${API_URL}/all/${userId}`);
            console.log("Response received:", response);
            set({ forms: response.data.forms || response.data || [], loading: false });
        } catch (error) {
            console.error("Error fetching forms:", error.response?.data || error.message);
            set({ error: error.response?.data?.message || "Failed to fetch forms", loading: false });
        }
    },

    fetchFormsByUser: async (userId) => {
        set({ loading: true, error: null });
        try {
            console.log("Fetching forms for userId:", userId);
            const response = await axios.get(`${API_URL}/user/${userId}`);
            console.log("Response received:", response);
            set({ forms: response.data.forms || response.data || [], loading: false });
        } catch (error) {
            console.error("Error fetching forms:", error.response?.data || error.message);
            set({ error: error.response?.data?.message || "Failed to fetch forms", loading: false });
        }
    },

    // Create a new form
    createForm: async (formData) => {
        set({ loading: true, error: null });
        try {
            const response = await axios.post(`${API_URL}/create-form`, formData);
            set((state) => ({
                forms: [...state.forms, response.data.form], // Append the new form to the list
                loading: false,
            }));
            return response.data.form;
        } catch (error) {
            console.error("Error creating form:", error.response?.data || error.message);
            
            // Store the full error details for better error handling
            const errorMessage = error.response?.data?.error || 
                               error.response?.data?.message || 
                               "Failed to create form";
            
            set({ error: errorMessage, loading: false });
            
            // Re-throw the original error with all details intact
            throw error;
        }
    },

    updateForm: async (formId, formData) => {
        set({ isLoading: true, error: null });
        try {
            // Log FormData for debugging
            console.log("FormData keys:", [...formData.keys()]);
            console.log("FormData values:", [...formData.entries()]);
            for (let [key, value] of formData.entries()) {
                if (key === "custom_fields") {
                  try {
                    console.log("🛠 Custom Fields Received in updateForm:", JSON.parse(value));
                  } catch (err) {
                    console.log("❌ Could not parse custom_fields", err);
                  }
                }
              }
              
    
            // Make the request with FormData
            const response = await axios.put(`${API_URL}/update-form/${formId}`, formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });
    
            return response.data;
        } catch (error) {
            console.error("Error updating form:", error.response?.data || error.message);
            return error.response?.data;
        } finally {
            set({ isLoading: false });
        }
    },

    viewForm: async (formId) => {
        set({ isLoading: true, error: null });
        try {
            const response = await axios.get(`${API_URL}/view/${formId}`);
            console.log("Response data:", response.data);
            return response.data;
        } catch (error) {
            console.error("Error viewing form:", error.response?.data || error.message);
            return error.response?.data;
        } finally {
            set({ isLoading: false });
        }
    },

    deleteForm: async (formId, callback) => {
        try {
            const response = await axios.delete(`${API_URL}/${formId}`, {
                withCredentials: true, // Ensure cookies are sent with the request
            });
            // Update the state to reflect that the form has been deleted
            set((state) => ({
                forms: state.forms.filter((form) => form._id !== formId),
            }));
            if (callback) callback(); // Call the callback function if provided
            return response.data; // Return successful response data
        } catch (error) {
            console.error("Error deleting form", error);
            throw error; // Throw error to handle it in the component
        }
    },

    addFieldsToForm: async (formId, fields) => {
        set({ loadingForm: true, error: null });
        try {
            await axios.post(`${API_URL}/${formId}/add-fields`, { fields });
            set({ loadingForm: false });
        } catch (error) {
            console.error("Error adding fields:", error.response?.data || error.message);
            set({ error: error.response?.data?.message || "Failed to add fields", loadingForm: false });
            throw error;
        }
    },

    // Reset the store state
    resetFormState: () => {
        set({ forms: [], loading: false, error: null });
    },
}));

export default useFormStore;
