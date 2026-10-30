"use client";

import * as React from "react";
import {
  IconFileText,
  IconRefresh,
  IconExternalLink,
} from "@tabler/icons-react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { NativeSelect } from "@/components/ui/native-select";
import {
  MerchCompanyGate,
  MerchPageShell,
  MerchPageHeader,
  MerchTableCard,
  MerchComingSoonPage,
  MerchEmptyState,
} from "@/components/merchandising";
import { merchandisingService } from "@/lib/services/merchandising";
import type { Order, OrderDocument } from "@/lib/types/merchandising";

export default function ExportDocsPage() {
  return (
    <MerchCompanyGate>
      {(companyId) => <ExportDocsPageContent companyId={companyId} />}
    </MerchCompanyGate>
  );
}

function ExportDocsPageContent({ companyId }: { companyId: string }) {
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [selectedOrderId, setSelectedOrderId] = React.useState("");
  const [documents, setDocuments] = React.useState<OrderDocument[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [docsLoading, setDocsLoading] = React.useState(false);
  const [apiUnavailable, setApiUnavailable] = React.useState(false);

  React.useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const orderRows = await merchandisingService.getOrders(companyId);
        setOrders(orderRows);
        if (orderRows.length > 0) {
          setSelectedOrderId(orderRows[0].id);
        }
      } catch (error) {
        console.error(error);
        setApiUnavailable(true);
      } finally {
        setLoading(false);
      }
    })();
  }, [companyId]);

  const loadDocuments = React.useCallback(async () => {
    if (!selectedOrderId) return;
    try {
      setDocsLoading(true);
      const docs = await merchandisingService.getOrderDocuments(selectedOrderId, companyId);
      setDocuments(docs);
      setApiUnavailable(false);
    } catch (error) {
      console.error(error);
      setApiUnavailable(true);
      toast.error("Could not load order documents");
    } finally {
      setDocsLoading(false);
    }
  }, [companyId, selectedOrderId]);

  React.useEffect(() => {
    if (selectedOrderId) loadDocuments();
  }, [selectedOrderId, loadDocuments]);

  if (apiUnavailable && !loading && orders.length === 0) {
    return (
      <MerchComingSoonPage
        icon={<IconFileText className="size-6" />}
        title="Export documentation"
        description="Order document API is not available. This module will link export docs when the service is ready."
      />
    );
  }

  const selectedOrder = orders.find((o) => o.id === selectedOrderId);

  return (
    <MerchPageShell>
      <MerchPageHeader
        icon={<IconFileText className="size-6" />}
        title="Export documentation"
        description="Order-linked shipping and commercial documents"
        actions={
          <>
            <NativeSelect
              className="h-9 w-52"
              value={selectedOrderId}
              onChange={(e) => setSelectedOrderId(e.target.value)}
            >
              {orders.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.orderNo}
                </option>
              ))}
            </NativeSelect>
            <Button variant="outline" size="icon" onClick={loadDocuments} disabled={docsLoading}>
              <IconRefresh className={docsLoading ? "size-4 animate-spin" : "size-4"} />
            </Button>
            {selectedOrderId && (
              <Button variant="outline" size="sm" asChild>
                <Link href={`/merchandising/orders/details/${selectedOrderId}`}>
                  Order details
                  <IconExternalLink className="size-4 ml-1" />
                </Link>
              </Button>
            )}
          </>
        }
      />

      <MerchTableCard isLoading={loading || docsLoading}>
        {documents.length === 0 && !docsLoading ? (
          <MerchEmptyState
            title="No documents"
            description={
              selectedOrder
                ? `No documents registered for ${selectedOrder.orderNo}. Add documents from order details or document archive.`
                : "Select an order to view documents."
            }
            action={
              selectedOrderId ? (
                <Button size="sm" asChild>
                  <Link href={`/merchandising/documents`}>Open document archive</Link>
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="rounded-xl border bg-card p-4 flex gap-3 hover:border-primary/30 transition-colors"
              >
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <IconFileText className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-sm truncate">{doc.documentType}</p>
                    <Badge variant="outline" className="text-[9px] shrink-0">
                      v{doc.version ?? "1"}
                    </Badge>
                  </div>
                  <a
                    href={doc.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-primary underline truncate block mt-1"
                  >
                    {doc.fileName}
                  </a>
                  <p className="text-[10px] text-muted-foreground mt-2">
                    Order: {selectedOrder?.orderNo}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </MerchTableCard>
    </MerchPageShell>
  );
}
