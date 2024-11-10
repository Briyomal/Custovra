import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import AdminLayoutPage from "../admin/LayoutPage";
import DataTable from "@/components/admin-view/users/DataTable";
import { columns } from "@/components/admin-view/users/columns"; // Ensure the correct path
import LoadingSpinner from "@/components/LoadingSpinner";

const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/users/all-users");
        setUsers(response.data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching users:", error);
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const memoizedUsers = useMemo(() => users, [users]);
  const memoizedColumns = useMemo(() => columns, []);

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
