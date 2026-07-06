import Link from "next/link";
import { getInvoice, getCustomer, getSettings, isVip, PRO } from "../../../lib/data";
import { relativeDso } from "../../../lib/weighting";
import InvoiceDetail from "../../../components/InvoiceDetail";

export const dynamic = "force-dynamic";

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const invoice = getInvoice(id);
  if (!invoice) {
    return (
      <div className="hcp-card">
        <p>Invoice not found. <Link href="/invoices">Back to Collections</Link></p>
      </div>
    );
  }
  const customer = getCustomer(invoice.customerId)!;
  const settings = getSettings();
  const vip = isVip(customer.id);

  return (
    <InvoiceDetail
      invoice={invoice}
      customer={customer}
      settings={settings}
      vip={vip}
      relativeDso={relativeDso(customer, settings)}
      proName={PRO.name}
    />
  );
}
