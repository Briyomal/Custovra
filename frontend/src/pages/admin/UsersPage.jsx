import { useEffect, useState, useMemo, useCallback } from "react";
import axios from "axios";
import AdminLayoutPage from "../admin/LayoutPage";
import DataTable from "@/components/admin-view/users/DataTable";
import { columns } from "@/components/admin-view/users/columns"; // Ensure the correct path
import LoadingSpinner from "@/components/LoadingSpinner";
import { useToast } from "@/hooks/use-toast";

const UsersPage = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = useCallback(async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_SERVER_URL}/api/users/all-users`);
      setUsers(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive",
      });
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const memoizedUsers = useMemo(() => users, [users]);
  const memoizedColumns = useMemo(() => columns(fetchUsers), [fetchUsers]);

  if (loading) {
    return <LoadingSpinner/>;
  }

  return (
    <AdminLayoutPage>
      <h1 className="text-2xl font-semibold mb-4">Users</h1>
      <DataTable data={memoizedUsers} columns={memoizedColumns} />
    </AdminLayoutPage>
  );
};

export default UsersPage;