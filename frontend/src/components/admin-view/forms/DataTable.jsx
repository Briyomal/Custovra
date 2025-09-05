import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableRow, TableHeader, TableBody, TableCell, TableHead } from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useState, useEffect } from "react";

const DataTable = ({ data, columns, users }) => {
  const [sorting, setSorting] = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);
  const [rowSelection, setRowSelection] = useState({});
  const [userFilter, setUserFilter] = useState("all-users");
  const [dateRange, setDateRange] = useState({ from: "", to: "" });
  const [formNameFilter, setFormNameFilter] = useState("");
  const [filteredData, setFilteredData] = useState(data);

  // Update filtered data when base data changes
  useEffect(() => {
    setFilteredData(data);
  }, [data]);

  // Apply form name filter
  useEffect(() => {
    if (!formNameFilter) {
      // If no form name filter, reset to original data (but keep other filters)
      applyAllFilters(data, userFilter, dateRange);
      return;
    }
    
    const filtered = data.filter(item => {
      const formName = item.form_name?.toLowerCase() || "";
      const filterValue = formNameFilter.toLowerCase();
      return formName.includes(filterValue);
    });
    
    // Apply other filters on top of form name filter
    applyAllFilters(filtered, userFilter, dateRange);
  }, [formNameFilter, data, userFilter, dateRange]);

  // Apply user filter
  useEffect(() => {
    if (!userFilter || userFilter === "all-users") {
      // If no user filter or "all-users" selected, reset to original data (but keep other filters)
      applyAllFilters(data, formNameFilter, dateRange);
      return;
    }
    
    const filtered = data.filter(item => {
      const userName = item.user?.name?.toLowerCase() || "";
      const userEmail = item.user?.email?.toLowerCase() || "";
      // userFilter now contains the email for exact matching
      return userName.includes(userFilter.toLowerCase()) || userEmail.includes(userFilter.toLowerCase());
    });
    
    // Apply other filters on top of user filter
    applyAllFilters(filtered, formNameFilter, dateRange);
  }, [userFilter, data, formNameFilter, dateRange]);

  // Apply date range filter
  useEffect(() => {
    applyAllFilters(data, formNameFilter, userFilter, dateRange);
  }, [dateRange, data, formNameFilter, userFilter]);

  // Function to apply all filters together
  const applyAllFilters = (baseData, formNameFilterValue, userFilterValue, dateRangeValue) => {
    let filtered = [...baseData];
    
    // Apply form name filter
    if (formNameFilterValue) {
      filtered = filtered.filter(item => {
        const formName = item.form_name?.toLowerCase() || "";
        const filterValue = formNameFilterValue.toLowerCase();
        return formName.includes(filterValue);
      });
    }
    
    // Apply user filter
    if (userFilterValue && userFilterValue !== "all-users") {
      // Ensure userFilterValue is a string before calling toLowerCase
      const filterValue = typeof userFilterValue === 'string' ? userFilterValue.toLowerCase() : "";
      if (filterValue) {
        filtered = filtered.filter(item => {
          const userName = item.user?.name?.toLowerCase() || "";
          const userEmail = item.user?.email?.toLowerCase() || "";
          return userName.includes(filterValue) || userEmail.includes(filterValue);
        });
      }
    }
    
    // Apply date range filter
    if (dateRangeValue?.from || dateRangeValue?.to) {
      filtered = filtered.filter(item => {
        const itemDate = new Date(item.created_at);
        const fromDate = dateRangeValue.from ? new Date(dateRangeValue.from) : null;
        const toDate = dateRangeValue.to ? new Date(dateRangeValue.to) : null;
        
        if (fromDate && toDate) {
          return itemDate >= fromDate && itemDate <= toDate;
        } else if (fromDate) {
          return itemDate >= fromDate;
        } else if (toDate) {
          return itemDate <= toDate;
        }
        return true;
      });
    }
    
    setFilteredData(filtered);
  };

  const table = useReactTable({
    data: filteredData,
    columns,
    state: {
      sorting,
      columnFilters,
      rowSelection,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    manualPagination: false,
  });

  const resetFilters = () => {
    setUserFilter("all-users");
    setFormNameFilter("");
    setDateRange({ from: "", to: "" });
    setColumnFilters([]);
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-end">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 w-full">
          {/* Form Name Filter */}
          <div>
            <label className="text-sm font-medium mb-1 block">Filter by Form Name</label>
            <Input
              placeholder="Search by form name..."
              value={formNameFilter}
              onChange={(e) => setFormNameFilter(e.target.value)}
            />
          </div>
          
          {/* User Filter Dropdown */}
          <div>
            <label className="text-sm font-medium mb-1 block">Filter by User</label>
            <Select value={userFilter} onValueChange={setUserFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Select a user" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-users">All Users</SelectItem>
                {users?.map((user, index) => (
                  <SelectItem key={index} value={user.email}>
                    {user.name} ({user.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Date From */}
          <div>
            <label className="text-sm font-medium mb-1 block">From Date</label>
            <Input
              type="date"
              value={dateRange.from}
              onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
            />
          </div>
          
          {/* Date To */}
          <div>
            <label className="text-sm font-medium mb-1 block">To Date</label>
            <Input
              type="date"
              value={dateRange.to}
              onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
            />
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={resetFilters}>
            Reset Filters
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-2">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className="flex items-center space-x-6 lg:space-x-8">
          <div className="flex items-center space-x-2">
            <p className="text-sm font-medium">Rows per page</p>
            <Select
              value={`${table.getState().pagination.pageSize}`}
              onValueChange={(value) => {
                table.setPageSize(Number(value));
              }}
            >
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue placeholder={table.getState().pagination.pageSize} />
              </SelectTrigger>
              <SelectContent side="top">
                {[10, 25, 50, 100].map((pageSize) => (
                  <SelectItem key={pageSize} value={`${pageSize}`}>
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex w-[100px] items-center justify-center text-sm font-medium">
            Page {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount()}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Go to first page</span>
              <span>{"<<"}</span>
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Go to previous page</span>
              <span>{"<"}</span>
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Go to next page</span>
              <span>{">"}</span>
            </Button>
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Go to last page</span>
              <span>{">>"}</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataTable;