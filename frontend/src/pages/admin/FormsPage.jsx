import { useEffect, useState, useMemo, useCallback } from "react";
import axios from "axios";
import AdminLayoutPage from "../admin/LayoutPage";
import DataTable from "@/components/admin-view/forms/DataTable";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { ExternalLink, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";

const FormsPage = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [forms, setForms] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchForms = useCallback(async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_SERVER_URL}/api/forms/admin/all`, {
        withCredentials: true
      });
      setForms(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching forms:", error);
      toast({
        title: "Error",
        description: "Failed to fetch forms",
        variant: "destructive",
      });
      setLoading(false);
    }
  }, [toast]);

  const fetchUsers = useCallback(async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_SERVER_URL}/api/forms/admin/users`, {
        withCredentials: true
      });
      setUsers(response.data);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({
        title: "Error",
        description: "Failed to fetch users for filter",
        variant: "destructive",
      });
    }
  }, [toast]);

  useEffect(() => {
    fetchForms();
    fetchUsers();
  }, [fetchForms, fetchUsers]);

  const handleViewForm = (formLink) => {
    const fullUrl = `${import.meta.env.VITE_CLIENT_URL}${formLink}`;
    window.open(fullUrl, '_blank');
  };

  const handleViewSubmissions = (formId) => {
    navigate(`/admin/submissions/${formId}`);
  };

  const columns = useMemo(() => [
    {
      id: "form_name",
      header: "Form Name",
      accessorKey: "form_name",
    },
    {
      id: "form_type",
      header: "Form Type",
      accessorKey: "form_type",
    },
    {
      id: "form_note",
      header: "Note",
      accessorKey: "form_note",
      cell: ({ row }) => {
        const note = row.original.form_note;
        return note || "N/A";
      }
    },
    {
      id: "status",
      header: "Status",
      accessorKey: "is_active",
      cell: ({ row }) => {
        const isActive = row.original.is_active;
        return (
          <Badge variant={isActive ? "default" : "secondary"}>
            {isActive ? "Published" : "Draft"}
          </Badge>
        );
      }
    },
    {
      id: "created_at",
      header: "Created Date",
      accessorKey: "created_at",
      cell: ({ row }) => {
        // Support both createdAt (new format) and created_at (old format)
        const dateValue = row.original.createdAt || row.original.created_at;
        return dateValue ? format(new Date(dateValue), "MMM dd, yyyy") : "N/A";
      }
    },
    {
      id: "user",
      header: "User",
      accessorKey: "user",
      cell: ({ row }) => {
        const user = row.original.user;
        return user ? `${user.name} (${user.email})` : "N/A";
      }
    },
    {
      id: "actions",
      header: "Actions",
      accessorKey: "actions",
      cell: ({ row }) => {
        const form = row.original;
        return (
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handleViewForm(form.form_link)}
              disabled={!form.form_link}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              View Form
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handleViewSubmissions(form._id)}
            >
              <Eye className="h-4 w-4 mr-2" />
              View Submissions
            </Button>
          </div>
        );
      }
    }
  ], []);

  const memoizedForms = useMemo(() => forms, [forms]);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <AdminLayoutPage>
      <h1 className="text-2xl font-semibold mb-4">Forms</h1>
      <DataTable data={memoizedForms} columns={columns} users={users} />
    </AdminLayoutPage>
  );
};

export default FormsPage;