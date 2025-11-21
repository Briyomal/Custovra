import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import CustomerLayoutPage from "./LayoutPage";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, Edit, Trash2, Users, User, ArrowUpDown, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
} from "@tanstack/react-table";
import { Separator } from "@/components/ui/separator";

function EmployeePage() {
  const { user, isAuthenticated } = useAuthStore();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    employee_number: "",
    designation: ""
  });
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sorting, setSorting] = useState([]);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState(null);

  const isDeleteConfirmed = deleteConfirmationText.trim().toLowerCase() === "delete";

  // Fetch employees on component mount
  useEffect(() => {
    if (isAuthenticated && user?._id) {
      fetchEmployees();
    }
  }, [isAuthenticated, user]);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_SERVER_URL}/api/employees`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      if (!response.ok) {
        console.error(`HTTP error! status: ${response.status}`);
        if (response.status === 404) {
          toast.error('Employee API endpoint not found');
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error('Response is not JSON:', contentType);
        const textResponse = await response.text();
        console.error('Response body:', textResponse.substring(0, 200));
        toast.error('Invalid response format from server');
        return;
      }

      const result = await response.json();
      console.log('Employee fetch result:', result);

      if (result.success) {
        setEmployees(result.data || []);
      } else {
        console.error('API returned error:', result.error);
        toast.error(result.error || 'Failed to fetch employees');
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
      if (error.message.includes('Unexpected token')) {
        toast.error('Server returned invalid response. Please check if the API is running.');
      } else {
        toast.error('Failed to fetch employees');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (1MB)
      if (file.size > 1 * 1024 * 1024) {
        toast.error('Profile photo must be less than 1MB');
        return;
      }

      // Validate file type - Updated to include WebP
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Only JPEG, PNG, and WebP files are allowed');
        return;
      }

      setProfilePhoto(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      employee_number: "",
      designation: ""
    });
    setProfilePhoto(null);
    setPhotoPreview("");
    setEditingEmployee(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEditDialog = (employee) => {
    setEditingEmployee(employee);
    setFormData({
      name: employee.name || "",
      employee_number: employee.employee_number || "",
      designation: employee.designation || ""
    });
    setPhotoPreview(employee.profile_photo?.url || "");
    setProfilePhoto(null);
    setDialogOpen(true);
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      toast.error('Employee name is required');
      return false;
    }
    if (!formData.designation.trim()) {
      toast.error('Designation is required');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const submitFormData = new FormData();

      // Append form fields
      Object.keys(formData).forEach(key => {
        if (formData[key] && formData[key].toString().trim() !== '') {
          submitFormData.append(key, formData[key]);
        }
      });

      // Append profile photo if selected
      if (profilePhoto) {
        submitFormData.append('profile_photo', profilePhoto);
      }

      const url = editingEmployee ? `${import.meta.env.VITE_SERVER_URL}/api/employees/${editingEmployee._id}` : `${import.meta.env.VITE_SERVER_URL}/api/employees`;
      const method = editingEmployee ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        credentials: 'include',
        body: submitFormData
      });

      const result = await response.json();

      if (result.success) {
        toast.success(result.message || `Employee ${editingEmployee ? 'updated' : 'created'} successfully`);
        setDialogOpen(false);
        resetForm();
        fetchEmployees(); // Refresh the list
      } else {
        toast.error(result.error || `Failed to ${editingEmployee ? 'update' : 'create'} employee`);
      }
    } catch (error) {
      console.error('Error submitting employee:', error);
      toast.error(`Failed to ${editingEmployee ? 'update' : 'create'} employee`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (employeeId) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_SERVER_URL}/api/employees/${employeeId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();

      if (result.success) {
        toast.success(result.message || 'Employee deleted successfully');
        fetchEmployees(); // Refresh the list
      } else {
        toast.error(result.error || 'Failed to delete employee');
      }
    } catch (error) {
      console.error('Error deleting employee:', error);
      toast.error('Failed to delete employee');
    }
  };

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Define table columns with sorting
  const columns = [
    {
      id: "name",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="whitespace-nowrap px-4 min-w-[120px] justify-start"
          >
            Employee
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      accessorKey: "name",
      enableSorting: true,
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage
              src={row.original.profile_photo?.url}
              alt={row.original.name}
              className="object-cover"
            />
            <AvatarFallback className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
              {getInitials(row.original.name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium text-sm">{row.original.name}</p>
          </div>
        </div>
      ),
    },
    {
      id: "designation",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="whitespace-nowrap px-4 min-w-[120px] justify-start"
          >
            Designation
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      accessorKey: "designation",
      enableSorting: true,
      cell: ({ row }) => row.original.designation,
    },
    {
      id: "employee_number",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="whitespace-nowrap px-4 min-w-[120px] justify-start"
          >
            Employee ID
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      accessorKey: "employee_number",
      enableSorting: true,
      cell: ({ row }) => (
        row.original.employee_number ? (
          <div className="flex items-center gap-2">
            <span className="text-sm font-mono">{row.original.employee_number}</span>
          </div>
        ) : (
          <span className="text-gray-400 text-sm">Not assigned</span>
        )
      ),
    },
  ];

  // Create table instance with sorting
  const table = useReactTable({
    data: employees,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
    },
  });

  if (loading) {
    return (
      <CustomerLayoutPage>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </CustomerLayoutPage>
    );
  }

  return (
    <CustomerLayoutPage>
      <div className="space-y-6 pt-4 md:gap-4 md:p-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Employee Management</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">Manage your team members and their information</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreateDialog} className="w-full sm:w-fit mt-4 mb-4 left-0 rounded-md font-semibold text-black border
                                                          border-lime-500
                                                            bg-gradient-to-r from-[#16bf4c] to-lime-500
                                                            transition-all duration-200 ease-in-out 
                                                            hover:shadow-[0_0_15px_rgba(22,191,76,0.4)] hover:from-lime-400 hover:to-[#1cbf16] 
                                                            focus:outline-none focus:ring-2 focus:ring-lime-400">
                <Plus className="h-4 w-4" />
                Add Employee
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-w-[calc(100%-2rem)] rounded-md">
              <DialogHeader className="border-b py-4">
                <DialogTitle>
                  {editingEmployee ? 'Edit Employee' : 'Add New Employee'}
                </DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                {/* Profile Photo Upload */}
                <div className="flex flex-col items-center gap-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={photoPreview} alt="Preview" className="object-cover" />
                    <AvatarFallback className="text-lg bg-gray-100 dark:bg-gray-800">
                      {formData.name ? getInitials(formData.name) : <User className="h-8 w-8 text-gray-400" />}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid w-full max-w-sm items-center gap-1.5">
                    <Label htmlFor="profile_photo" className="text-sm font-medium">Profile Photo</Label>
                    <Input
                      id="profile_photo"
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="cursor-pointer"
                    />
                    <p className="text-xs text-gray-500">Max 1MB, JPEG/PNG/WebP only</p>
                  </div>
                </div>

                {/* Form Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Full Name <span className="text-red-500">*</span></Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Enter full name"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="employee_number">Employee Number</Label>
                    <Input
                      id="employee_number"
                      value={formData.employee_number}
                      onChange={(e) => handleInputChange('employee_number', e.target.value)}
                      placeholder="Enter employee number (optional)"
                    />
                  </div>
                  <div className="grid gap-2 sm:col-span-2">
                    <Label htmlFor="designation">Designation <span className="text-red-500">*</span></Label>
                    <Input
                      id="designation"
                      value={formData.designation}
                      onChange={(e) => handleInputChange('designation', e.target.value)}
                      placeholder="Enter designation"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                    disabled={submitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="rounded-md font-semibold text-black border
             border-lime-500
               bg-gradient-to-r from-theme-green to-lime-500
               transition-all duration-700 ease-in-out 
               hover:shadow-[0_0_15px_rgba(22,191,76,0.4)] 
               focus:outline-none focus:ring-2 focus:ring-lime-400"
                    onClick={handleSubmit} disabled={submitting}>
                    {submitting ? 'Saving...' : (editingEmployee ? 'Update Employee' : 'Add Employee')}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

          <Separator className="my-4" />
          <div className="grid auto-rows-min gap-4 grid-cols-1 md:grid-cols-3 xl:grid-cols-5 ">
            <Card className="border-b-4 border-b-[#16bf4c] mt-4">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-md font-regular">Total Employees</CardTitle>
                <Users className="text-[#16bf4c]" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {loading ? (
                    <Loader2 className="animate-spin" size={36} />
                  ) : (
                    <span className="text-2xl font-bold">{employees.length}</span>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>


          {/* Employees Table */}
          <Card>
            <CardHeader className="p-4">
              <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                <Users className="h-5 w-5" />
                Employees List
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              {employees.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg mb-2">No employees found</p>
                  <p className="text-gray-400 text-sm mb-4">Add your first employee to get started</p>
                  <Button onClick={openCreateDialog} className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Add Employee
                  </Button>
                </div>
              ) : (
                <div className="rounded-md border flex">
                  <ScrollArea className="w-1 flex-1" orientation="horizontal">
                    <Table className="relative w-full">
                      <TableHeader className="bg-white dark:bg-themebglight">
                        {table.getHeaderGroups().map((headerGroup) => (
                          <TableRow key={headerGroup.id}>
                            {headerGroup.headers.map((header) => (
                              <TableHead key={header.id} className="p-0">
                                {header.isPlaceholder
                                  ? null
                                  : flexRender(
                                    header.column.columnDef.header,
                                    header.getContext()
                                  )}
                              </TableHead>
                            ))}
                            <TableHead className="text-right whitespace-nowrap px-4 min-w-[120px]">Actions</TableHead>
                          </TableRow>
                        ))}
                      </TableHeader>
                      <TableBody>
                        {table.getRowModel().rows.map((row) => (
                          <TableRow key={row.id}>
                            {row.getVisibleCells().map((cell) => (
                              <TableCell key={cell.id} className="whitespace-nowrap px-4 min-w-[120px]">
                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                              </TableCell>
                            ))}
                            <TableCell className="text-right whitespace-nowrap px-4 min-w-[120px]">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openEditDialog(row.original)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="text-red-600 hover:text-red-700"
                                      onClick={() => setEmployeeToDelete(row.original._id)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent className="max-w-[calc(100%-2rem)] rounded-md">
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Delete Employee</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to delete {row.original.name}? This action cannot be undone and will permanently remove all employee data.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <div className="my-4">
                                      <label className="text-sm mb-1 block">
                                        To confirm, type <span className="font-bold text-destructive">Delete</span> below:
                                      </label>
                                      <Input
                                        type="text"
                                        placeholder="Type 'Delete' to confirm"
                                        value={deleteConfirmationText}
                                        onChange={(e) => setDeleteConfirmationText(e.target.value)}
                                      />
                                    </div>
                                    <AlertDialogFooter className="flex flex-row md:flex-none space-x-2">
                                      <Button
                                        className="w-1/2 md:w-auto mt-2"
                                        variant="outline"
                                        onClick={() => {
                                          setDeleteConfirmationText("");
                                          setDeleteDialogOpen(false);
                                        }}
                                      >
                                        Cancel
                                      </Button>

                                      <Button
                                        className="w-1/2 md:w-auto mt-2"
                                        variant="destructive"
                                        onClick={() => {
                                          handleDelete(employeeToDelete);
                                          setDeleteConfirmationText("");
                                          setDeleteDialogOpen(false);
                                        }}
                                        disabled={!isDeleteConfirmed}
                                      >
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Delete
                                      </Button>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    <ScrollBar orientation="horizontal" />
                  </ScrollArea>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
    </CustomerLayoutPage>
  );
};

export default EmployeePage;