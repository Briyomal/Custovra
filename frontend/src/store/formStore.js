import { create } from "zustand";
import axios from "axios";

const API_URL = import.meta.env.MODE === "development" 
    ? "http://localhost:5000/api/forms" 
    : "/api/forms";

axios.defaults.withCredentials = true;

const useFormStore = create((set) => ({
    forms: [], // State to store forms
    loading: false,
    error: null,

    // Fetch all forms for a user
    fetchForms: async (userId) => {
        set({ loading: true, error: null });
        try {
            const response = await axios.get(`${API_URL}/${userId}`);
            set({ forms: response.data.forms, loading: false });
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
            set({ error: error.response?.data?.message || "Failed to create form", loading: false });
            throw error; // Re-throw the error for further handling if needed
        }
    },

    updateForm: async (formId, formData) => {
        set({ isLoading: true, error: null });
        try {
            // Log FormData for debugging
            console.log("FormData keys:", [...formData.keys()]);
            console.log("FormData values:", [...formData.entries()]);
    
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
    
     /*  
   
    updateForm: async (formId, formData) => {
		set({ isLoading: true, error: null });
        console.log("logo:  ", formData.logo);
        try {
            if (!Array.isArray(formData.fields)) {
                throw new Error("Fields data is missing or not an array.");
            }
    
            const response = await axios.put(`${API_URL}/update-form/${formId}`, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                  },
                form_name: formData.formName, // Convert camelCase back to snake_case for API
                form_note: formData.formNote,
                form_type: formData.formType,
                fields: formData.fields ? formData.fields.map(field => ({
                    label: field.label,
                    type: field.type,
                    is_required: field.isRequired,
                    enabled: field.enabled,
                    position: field.position,
                    placeholder: field.placeholder,
                })) : [],
                logo: formData.logo,
                form_description: formData.formDescription,
                is_active: formData.isActive,
            });
            
            return response.data;   
        } catch (error) {
            console.error("Error updating form:", error.response?.data || error.message);
            return error.response?.data;
        }
    },
  */
    
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
