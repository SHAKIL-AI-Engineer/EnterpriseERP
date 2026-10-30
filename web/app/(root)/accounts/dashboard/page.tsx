"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AccountsListShell } from "@/components/accounts/accounts-list-shell";
import { useAccountsCompany } from "@/components/accounts/accounts-company-context";
import { defaultMonthRange } from "@/components/accounts/date-range-filter";
import { accountsService } from "@/lib/services/accounts";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const PENDING = new Set(["Pending", "Submitted"]);

function countPending<T extends { status: string }>(items: T[]): number {
  return items.filter((i) => PENDING.has(i.status)).length;
}

const QUICK_LINKS = [
  { href: "/accounts/vouchers/new", label: "New voucher" },
  { href: "/accounts/receipts/cash/new", label: "Cash receipt" },
  { href: "/accounts/expenses/daily/new", label: "Daily expense" },
  { href: "/accounts/requests/money/new", label: "Money request" },
  { href: "/accounts/reports/ledger", label: "Ledger report" },
  { href: "/accounts/setup/chart-of-accounts", label: "Chart of accounts" },
];

export default function AccountsDashboardPage() {
  const { companyId } = useAccountsCompany();
  const [loading, setLoading] = useState(false);
  const [cashBalance, setCashBalance] = useState(0);
  const [bankBalance, setBankBalance] = useState(0);
  const [pendingVouchers, setPendingVouchers] = useState(0);
  const [pendingCashReceipts, setPendingCashReceipts] = useState(0);
  const [pendingExpenses, setPendingExpenses] = useState(0);
  const [pendingRequests, setPendingRequests] = useState(0);

  const load = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    const range = defaultMonthRange();
    try {
      const [cashBook, bankBook, vouchers, cashReceipts, expenses, requests] = await Promise.all([
        accountsService.getCashBook({ companyId, ...range }),
        accountsService.getBankBook({ companyId, ...range }),
        accountsService.getVouchers({ companyId }),
        accountsService.getCashReceipts({ companyId }),
        accountsService.getDailyExpenses({ companyId }),
        accountsService.getMoneyRequests({ companyId }),
      ]);
      setCashBalance(cashBook.length ? cashBook[cashBook.length - 1].balanceAmount : 0);
      setBankBalance(bankBook.length ? bankBook[bankBook.length - 1].balanceAmount : 0);
      setPendingVouchers(countPending(vouchers));
      setPendingCashReceipts(countPending(cashReceipts));
      setPendingExpenses(countPending(expenses));
      setPendingRequests(countPending(requests));
    } catch {
      setCashBalance(0);
      setBankBalance(0);
      setPendingVouchers(0);
      setPendingCashReceipts(0);
      setPendingExpenses(0);
      setPendingRequests(0);
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <AccountsListShell title="Accounts dashboard" description="Cash position and pending workflow items.">
      {loading ? (
        <p className="text-muted-foreground text-sm">Loading dashboard…</p>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Cash book balance</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{formatCurrency(cashBalance)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Bank book balance</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{formatCurrency(bankBalance)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Pending vouchers</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{pendingVouchers}</p>
                <Button variant="link" className="h-auto p-0 text-xs" asChild>
                  <Link href="/accounts/vouchers">View all</Link>
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Pending cash receipts</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{pendingCashReceipts}</p>
                <Button variant="link" className="h-auto p-0 text-xs" asChild>
                  <Link href="/accounts/receipts/cash">View all</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Pending daily expenses</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{pendingExpenses}</p>
                <Button variant="link" className="h-auto p-0 text-xs" asChild>
                  <Link href="/accounts/expenses/daily">View all</Link>
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Pending money requests</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{pendingRequests}</p>
                <Button variant="link" className="h-auto p-0 text-xs" asChild>
                  <Link href="/accounts/requests/money">View all</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick actions</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {QUICK_LINKS.map((l) => (
                <Button key={l.href} variant="outline" size="sm" asChild>
                  <Link href={l.href}>{l.label}</Link>
                </Button>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </AccountsListShell>
  );
}
