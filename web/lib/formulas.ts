/**
 * HR System Formulas and Functions
 * This file contains business logic for calculations related to Payroll, Leave, and Attendance.
 */

// --- Payroll Formulas ---

/**
 * Calculate Net Salary
 * Formula: Gross Salary + Allowances - Deductions - Tax
 */
export function calculateNetSalary(
    grossSalary: number,
    allowances: number = 0,
    deductions: number = 0,
    taxRate: number = 0.1 // Default 10%
): number {
    const taxableIncome = grossSalary + allowances - deductions;
    const taxAmount = taxableIncome * taxRate;
    return taxableIncome - taxAmount;
}

/**
 * Calculate Hourly Rate
 * Formula: Monthly Salary / (Working Days * Hours Per Day)
 */
export function calculateHourlyRate(
    monthlySalary: number,
    workingDays: number = 22,
    hoursPerDay: number = 8
): number {
    return monthlySalary / (workingDays * hoursPerDay);
}

// --- Leave Formulas ---

/**
 * Calculate Pro-rata Leave Balance
 * Formula: (Annual Entitlement / 12) * Months Worked
 */
export function calculateProRataLeave(
    annualEntitlement: number,
    monthsWorked: number
): number {
    return (annualEntitlement / 12) * monthsWorked;
}

// --- Attendance Formulas ---

/**
 * Calculate Late Penalty
 * Formula: (Hourly Rate / 60) * Late Minutes * Penalty Multiplier
 */
export function calculateLatePenalty(
    hourlyRate: number,
    lateMinutes: number,
    multiplier: number = 1.5
): number {
    if (lateMinutes <= 0) return 0;
    return (hourlyRate / 60) * lateMinutes * multiplier;
}

// --- Dynamic Formula Evaluator (Concept) ---

/**
 * This "function" can evaluate simple string-based formulas
 * used in the UI or configuration.
 */
export function evaluateFormula(formula: string, context: Record<string, number>): number {
    // Simple implementation using replace and eval (safe enough if controlled)
    let processedFormula = formula;
    for (const [key, value] of Object.entries(context)) {
        processedFormula = processedFormula.replace(new RegExp(`\\b${key}\\b`, 'g'), value.toString());
    }

    try {
         
        return eval(processedFormula);
    } catch (e) {
        console.error("Formula evaluation failed:", e);
        return 0;
    }
}
