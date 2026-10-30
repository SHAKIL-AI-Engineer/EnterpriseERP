import { z } from "zod"

// Login Schema
export const loginSchema = z.object({
    username: z.string().min(3, "Username must be at least 3 characters"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    rememberMe: z.boolean().optional(),
})

// Company Schema
export const companySchema = z.object({
    companyName: z.string().min(2, "Company name is too short"),
    registrationNo: z.string().min(5, "Registration number is required"),
    industry: z.enum(["tech", "finance", "health", "manufacturing", "other"]),
    email: z.string().email("Invalid official email"),
    founded: z.number().int().min(1900).max(new Date().getFullYear()),
    status: z.enum(["active", "inactive", "pending"]).default("active"),
})

// Employee Schema
export const employeeSchema = z.object({
    firstName: z.string().min(2, "First name is too short"),
    lastName: z.string().min(2, "Last name is too short"),
    email: z.string().email("Invalid email"),
    department: z.string().min(1, "Department is required"),
    designation: z.string().min(1, "Designation is required"),
    joiningDate: z.date(),
    salary: z.number().positive("Salary must be positive"),
})

export type LoginInput = z.infer<typeof loginSchema>
export type CompanyInput = z.infer<typeof companySchema>
export type EmployeeInput = z.infer<typeof employeeSchema>
