export type BangladeshBank = {
  name: string
  branches: string[]
}

/** Common Bangladesh banks and branch names for HR bank account selects. */
export const BANGLADESH_BANKS: BangladeshBank[] = [
  {
    name: "Dutch-Bangla Bank",
    branches: ["Gulshan", "Motijheel", "Uttara", "Mirpur", "Chittagong"],
  },
  {
    name: "BRAC Bank",
    branches: ["Gulshan", "Banani", "Motijheel", "Uttara", "Khulna"],
  },
  {
    name: "City Bank",
    branches: ["Gulshan", "Motijheel", "Dhanmondi", "Chittagong", "Sylhet"],
  },
  {
    name: "Eastern Bank",
    branches: ["Gulshan", "Motijheel", "Uttara", "Narayanganj"],
  },
  {
    name: "Islami Bank Bangladesh",
    branches: ["Local Office", "Motijheel", "Gulshan", "Uttara", "Rajshahi"],
  },
  {
    name: "Sonali Bank",
    branches: ["Motijheel", "Gulshan", "Uttara", "Chittagong", "Khulna"],
  },
  {
    name: "Janata Bank",
    branches: ["Motijheel", "Gulshan", "Uttara", "Barishal"],
  },
  {
    name: "Pubali Bank",
    branches: ["Motijheel", "Gulshan", "Uttara", "Chittagong"],
  },
  {
    name: "Prime Bank",
    branches: ["Gulshan", "Motijheel", "Uttara", "Mirpur"],
  },
  {
    name: "Mutual Trust Bank",
    branches: ["Gulshan", "Motijheel", "Uttara"],
  },
  {
    name: "Standard Chartered Bank",
    branches: ["Gulshan", "Motijheel", "Chittagong"],
  },
  {
    name: "HSBC",
    branches: ["Gulshan", "Motijheel"],
  },
  {
    name: "bKash",
    branches: ["Mobile Banking"],
  },
  {
    name: "Nagad",
    branches: ["Mobile Banking"],
  },
]

export function getBankBranches(bankName: string): string[] {
  return BANGLADESH_BANKS.find((b) => b.name === bankName)?.branches ?? []
}
