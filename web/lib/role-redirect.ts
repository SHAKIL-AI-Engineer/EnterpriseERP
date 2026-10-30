// Role-based redirect mapping
// Maps user roles to their default dashboard/landing page

export const roleRedirectMap: Record<string, string> = {
    // Administrator module roles
    'SuperAdmin': '/administrator',
    'Admin': '/administrator',

    // Management module roles
    'HR': '/',
    'Management': '/',
    'HR Officer': '/',
    'IT Officer': '/',

    // Accounts module roles
    'Accounts': '/accounts/dashboard',
    'Accountant': '/accounts/dashboard',
    'Account Officer': '/accounts/dashboard',

    // Production module roles
    'Production': '/production/dashboard',
    'ProductionManager': '/production/dashboard',

    // Store module roles
    'Store': '/store/dashboard',
    'StoreKeeper': '/store/dashboard',

    // Cutting module roles
    'Cutting': '/cutting/dashboard',

    // Merchandising module roles
    'Merchandising': '/merchandising/dashboard',
    'Merchandiser': '/merchandising/dashboard',

    // Security module roles
    'SecurityManager': '/security/dashboard',
    'SecurityOfficer': '/security/dashboard',
    'GateOfficer': '/security/dashboard',
}

/**
 * Get the redirect URL for a user based on their roles
 * Priority: SuperAdmin/Admin > First matching role in the map
 */
export function getRedirectUrlForUser(roles: string[]): string {
    if (!roles || roles.length === 0) {
        return '/' // Default to home
    }

    // Administrators land in their dedicated module.
    if (roles.includes('SuperAdmin') || roles.includes('Admin')) {
        return '/administrator'
    }

    // Find the first matching role and return its redirect URL
    for (const role of roles) {
        if (roleRedirectMap[role]) {
            return roleRedirectMap[role]
        }
    }

    // Default to home if no matching role found
    return '/'
}

/** Safe internal path from ?returnUrl= (login redirect). */
export function resolveReturnUrl(returnUrl: string | null | undefined, roles: string[]): string {
    if (!returnUrl) return getRedirectUrlForUser(roles)
    const decoded = decodeURIComponent(returnUrl.trim())
    if (!decoded.startsWith('/') || decoded.startsWith('//') || decoded.startsWith('/login')) {
        return getRedirectUrlForUser(roles)
    }
    return decoded
}
