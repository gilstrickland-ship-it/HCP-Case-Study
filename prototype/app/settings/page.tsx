import { getSettings, getCustomers } from "../../lib/data";
import SettingsForm from "../../components/SettingsForm";

export const dynamic = "force-dynamic";

export default function SettingsPage() {
  const settings = getSettings();
  const customers = getCustomers().map((c) => ({
    id: c.id,
    name: c.name,
    autoVip: c.isVip,
  }));
  return <SettingsForm initial={settings} customers={customers} />;
}
