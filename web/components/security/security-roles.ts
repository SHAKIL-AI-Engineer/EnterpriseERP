export function hasAnyRole(roles: string[], allowed: string[]): boolean {
  if (roles.includes("SuperAdmin") || roles.includes("Admin")) return true;
  return allowed.some((r) => roles.includes(r));
}

export function canManageGates(roles: string[]): boolean {
  return hasAnyRole(roles, ["SecurityManager", "CompanyAdmin"]);
}

export function canGateOperations(roles: string[]): boolean {
  return hasAnyRole(roles, ["SecurityManager", "SecurityOfficer", "GateOfficer"]);
}

export function canApproveGatePass(roles: string[]): boolean {
  return hasAnyRole(roles, ["SecurityManager", "StoreManager"]);
}

export function canCreateGatePass(roles: string[]): boolean {
  return hasAnyRole(roles, ["SecurityManager", "SecurityOfficer", "StoreManager"]);
}

export function canIssueGatePass(roles: string[]): boolean {
  return hasAnyRole(roles, ["SecurityManager", "SecurityOfficer", "GateOfficer"]);
}

export function canApproveOutPass(roles: string[]): boolean {
  return hasAnyRole(roles, ["SecurityManager", "HRManager"]);
}

export function canApproveChalan(roles: string[]): boolean {
  return hasAnyRole(roles, ["SecurityManager", "StoreManager"]);
}

export function canManageBill(roles: string[]): boolean {
  return hasAnyRole(roles, ["SecurityManager", "AccountsOfficer"]);
}

export function canExportReports(roles: string[]): boolean {
  return hasAnyRole(roles, ["SecurityManager", "Auditor"]);
}

export function isViewerOnly(roles: string[]): boolean {
  if (roles.includes("SuperAdmin") || roles.includes("Admin")) return false;
  return roles.includes("Viewer") && !canGateOperations(roles);
}
