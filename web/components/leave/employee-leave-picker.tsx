"use client";

import * as React from "react";
import { IconLoader, IconSearch } from "@tabler/icons-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { employeeService, type Employee } from "@/lib/services/employee";
import { toast } from "sonner";

export interface EmployeeLeaveSelection {
  entityId: string;
  companyEntityId?: string;
  employeeCard: number;
  employeeId: string;
  employeeName: string;
  department: string;
  designation: string;
}

interface EmployeeLeavePickerProps {
  value: EmployeeLeaveSelection | null;
  onChange: (value: EmployeeLeaveSelection | null) => void;
  companyEntityId?: string;
  disabled?: boolean;
}

export function EmployeeLeavePicker({
  value,
  onChange,
  companyEntityId,
  disabled,
}: EmployeeLeavePickerProps) {
  const [query, setQuery] = React.useState("");
  const [isSearching, setIsSearching] = React.useState(false);
  const [results, setResults] = React.useState<Employee[]>([]);

  React.useEffect(() => {
    if (value) {
      setQuery(`${value.employeeId} — ${value.employeeName}`);
    }
  }, [value]);

  const handleSearch = async () => {
    if (!query.trim()) return;
    if (!companyEntityId) {
      toast.error("Select a company in filters first");
      return;
    }
    setIsSearching(true);
    try {
      const list = await employeeService.getEmployees({
        searchTerm: query.trim(),
        companyEntityId,
        status: "Active",
      });
      setResults(list.slice(0, 8));
      if (list.length === 0) {
        toast.error("No active employees found for this company");
      }
    } catch {
      toast.error("Employee search failed");
    } finally {
      setIsSearching(false);
    }
  };

  const selectEmployee = (emp: Employee) => {
    if (!emp.entityId) {
      toast.error("Employee has no linked entity id");
      return;
    }
    onChange({
      entityId: emp.entityId,
      companyEntityId: emp.companyEntityId ?? companyEntityId,
      employeeCard: emp.id,
      employeeId: emp.employeeId,
      employeeName: emp.fullNameEn,
      department: emp.departmentName ?? "",
      designation: emp.designationName ?? "",
    });
    setQuery(`${emp.employeeId} — ${emp.fullNameEn}`);
    setResults([]);
  };

  return (
    <div className="space-y-2">
      <Label>Employee</Label>
      <div className="flex gap-2">
        <Input
          placeholder={
            companyEntityId
              ? "Search by ID or name (this company)"
              : "Select company in filters first"
          }
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (value) onChange(null);
          }}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleSearch())}
          disabled={disabled || !companyEntityId}
        />
        <button
          type="button"
          className="inline-flex h-9 w-9 items-center justify-center rounded-md border"
          onClick={handleSearch}
          disabled={disabled || isSearching || !companyEntityId}
        >
          {isSearching ? (
            <IconLoader className="size-4 animate-spin" />
          ) : (
            <IconSearch className="size-4" />
          )}
        </button>
      </div>
      {results.length > 0 && (
        <ul className="rounded-md border divide-y max-h-40 overflow-auto">
          {results.map((emp) => (
            <li key={emp.id}>
              <button
                type="button"
                className="w-full text-left px-3 py-2 text-sm hover:bg-muted"
                onClick={() => selectEmployee(emp)}
              >
                <span className="font-medium">{emp.employeeId}</span>
                <span className="text-muted-foreground"> — {emp.fullNameEn}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {value && (
        <p className="text-xs text-muted-foreground">
          {value.designation}
          {value.department ? ` · ${value.department}` : ""}
        </p>
      )}
    </div>
  );
}
