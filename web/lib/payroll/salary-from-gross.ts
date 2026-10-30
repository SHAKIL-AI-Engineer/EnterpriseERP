/** Mirrors backend PayrollService SalaryStructureCalculator defaults (BDT policies). */
export const DEFAULT_SALARY_STRUCTURE = {
  fixedMedical: 750,
  fixedFood: 1250,
  fixedConveyance: 450,
  basicDivisor: 1.5,
} as const

export type SalaryBreakdown = {
  grossSalary: number
  basicSalary: number
  houseRent: number
  medicalAllowance: number
  foodAllowance: number
  conveyance: number
}

export function calculateSalaryFromGross(
  grossSalary: number,
  structure: typeof DEFAULT_SALARY_STRUCTURE = DEFAULT_SALARY_STRUCTURE,
): SalaryBreakdown {
  const gross = Math.max(0, grossSalary)
  const fixedTotal =
    structure.fixedMedical + structure.fixedFood + structure.fixedConveyance
  const divisor = structure.basicDivisor <= 0 ? 1.5 : structure.basicDivisor
  const basic = Math.round(((gross - fixedTotal) / divisor) * 100) / 100
  const houseRent = Math.round((gross - basic - fixedTotal) * 100) / 100

  return {
    grossSalary: gross,
    basicSalary: basic,
    houseRent,
    medicalAllowance: structure.fixedMedical,
    foodAllowance: structure.fixedFood,
    conveyance: structure.fixedConveyance,
  }
}
