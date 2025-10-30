import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Users, Loader } from "lucide-react";
import { toast } from "react-hot-toast";

const EmployeeSelectionDialog = ({ 
    isOpen, 
    onClose, 
    selectedEmployees = [], 
    onEmployeesSelect 
}) => {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [localSelectedEmployees, setLocalSelectedEmployees] = useState(selectedEmployees);

    // Fetch employees when dialog opens
    useEffect(() => {
        if (isOpen) {
            fetchEmployees();
            setLocalSelectedEmployees(selectedEmployees);
            console.log('Dialog opened with selectedEmployees:', selectedEmployees);
        }
    }, [isOpen, selectedEmployees]);

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

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            if (result.success) {
                setEmployees(result.data || []);
            } else {
                console.error('API returned error:', result.error);
                toast.error(result.error || 'Failed to fetch employees');
            }
        } catch (error) {
            console.error('Error fetching employees:', error);
            toast.error('Failed to fetch employees');
        } finally {
            setLoading(false);
        }
    };

    // Filter employees based on search query
    const filteredEmployees = employees.filter(employee =>
        employee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (employee.employee_number && employee.employee_number.toLowerCase().includes(searchQuery.toLowerCase())) ||
        employee.designation.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleEmployeeToggle = (employee) => {
        setLocalSelectedEmployees(prev => {
            // Check if employee is already selected by comparing IDs
            const isSelected = prev.find(emp => 
                (emp._id || emp) === (employee._id || employee)
            );
            
            if (isSelected) {
                return prev.filter(emp => 
                    (emp._id || emp) !== (employee._id || employee)
                );
            } else {
                return [...prev, employee];
            }
        });
    };

    // New handler to stop event propagation
    const handleCheckboxClick = (e) => {
        e.stopPropagation();
    };

    const handleSave = () => {
        onEmployeesSelect(localSelectedEmployees);
        onClose();
    };

    const getInitials = (name) => {
        return name
            .split(' ')
            .map(word => word.charAt(0))
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Select Employees for Dropdown
                    </DialogTitle>
                </DialogHeader>

                <div className="flex flex-col gap-4 flex-1 overflow-hidden">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Search employees by name, ID, or designation..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>

                    {/* Selected count */}
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                        {localSelectedEmployees.length} employee(s) selected
                    </div>

                    {/* Employee list */}
                    <div className="flex-1 overflow-y-auto border rounded-lg">
                        {loading ? (
                            <div className="flex justify-center items-center h-32">
                                <Loader className="animate-spin h-6 w-6" />
                            </div>
                        ) : filteredEmployees.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-32 text-gray-500">
                                <Users className="h-8 w-8 mb-2" />
                                <p>{searchQuery ? 'No employees found matching your search' : 'No employees available'}</p>
                                {!searchQuery && (
                                    <p className="text-sm mt-1">Add employees first to include them in forms</p>
                                )}
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-200 dark:divide-gray-700">
                                {filteredEmployees.map((employee) => {
                                    // Check if employee is selected by comparing IDs
                                    const isSelected = localSelectedEmployees.find(emp => 
                                        (emp._id || emp) === (employee._id || employee)
                                    );
                                    return (
                                        <div
                                            key={employee._id}
                                            className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                                            onClick={() => handleEmployeeToggle(employee)}
                                        >
                                            <div className="flex items-center gap-3">
                                                <Checkbox
                                                    checked={!!isSelected}
                                                    onCheckedChange={() => handleEmployeeToggle(employee)}
                                                    onClick={handleCheckboxClick}
                                                />
                                                <Avatar className="h-10 w-10">
                                                    <AvatarImage 
                                                        src={employee.profile_photo?.url} 
                                                        alt={employee.name}
                                                        className="object-cover"
                                                    />
                                                    <AvatarFallback className="text-sm bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                                                        {getInitials(employee.name)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-sm truncate">{employee.name}</p>
                                                    <p className="text-sm text-gray-500 truncate">{employee.designation}</p>
                                                    {employee.employee_number && (
                                                        <p className="text-xs text-gray-400 font-mono">ID: {employee.employee_number}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <Button variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button 
                            onClick={handleSave}
                            disabled={localSelectedEmployees.length === 0}
                        >
                            Add {localSelectedEmployees.length} Employee(s)
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default EmployeeSelectionDialog;