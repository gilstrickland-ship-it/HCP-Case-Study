"use client";

import { useState } from "react";
import type { AutonomyLevel, ProSettings, Segment } from "../lib/types";

interface CustomerLite {
  id: string;
  name: string;
  autoVip: boolean;
}

const SEGMENTS: { key: Segment; label: string }[] = [
  { key: "forgot", label: "Forgot" },
  { key: "cant_pay", label: "Can't pay" },
  { key: "wont_pay", label: "Won't pay" },
  { key: "disputes", label: "Disputes" },
];

const LEVELS: AutonomyLevel[] = ["L0", "L1", "L2"];
const LEVEL_LABEL: Record<AutonomyLevel, string> = {
  L0: "Off",
  L1: "Draft-only",
  L2: "Auto-send easy",
};

export default function SettingsForm({
  initial,
  customers,
}: {
  initial: ProSettings;
  customers: CustomerLite[];
}) {
  const [s, setS] = useState<ProSettings>(initial);
  const [saved, setSaved] = useState(false);
  const [newVip, setNewVip] = useState("");

  function patch(p: Partial<ProSettings>) {
    setS((prev) => ({ ...prev, ...p }));
    setSaved(false);
  }

  async function save() {
    await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(s),
    });
    setSaved(true);
  }

  const vipCustomers = customers.filter(
    (c) => c.autoVip || s.vipIds.includes(c.id),
  );

  return (
    <div>
      <div className="page-head">
        <h2>Agent settings</h2>
        <p className="muted">
          Tune the agent with a few dials — no menus, no prompt-engineering. You&apos;re
          always in control.
        </p>
      </div>

      <div className="detail-grid">
        <div className="hcp-card">
          <h3 className="hcp-card__title">Dials</h3>

          <div className="slider">
            <div className="slider__head">
              <strong>Persistence</strong>
              <span className="muted small">{s.persistence < 33 ? "gentle" : s.persistence < 66 ? "steady" : "keep at it"}</span>
            </div>
            <input type="range" min={0} max={100} value={s.persistence} onChange={(e) => patch({ persistence: +e.target.value })} />
            <div className="slider__ends"><span>gentle nudge</span><span>keep at it</span></div>
          </div>

          <div className="slider">
            <div className="slider__head">
              <strong>Tone</strong>
              <span className="muted small">{s.tone < 33 ? "warm / neighborly" : s.tone < 66 ? "balanced" : "firm / businesslike"}</span>
            </div>
            <input type="range" min={0} max={100} value={s.tone} onChange={(e) => patch({ tone: +e.target.value })} />
            <div className="slider__ends"><span>warm</span><span>firm</span></div>
          </div>

          <div className="slider">
            <div className="slider__head">
              <strong>Loop-me-in threshold</strong>
              <span className="mono">${s.loopMeInThreshold.toLocaleString()}</span>
            </div>
            <input type="range" min={0} max={10000} step={250} value={s.loopMeInThreshold} onChange={(e) => patch({ loopMeInThreshold: +e.target.value })} />
            <div className="slider__ends"><span>everything to me</span><span>$10,000+</span></div>
          </div>

          <p className="small muted">
            Any invoice over this amount always comes to you, regardless of the
            agent&apos;s autonomy on that segment.
          </p>
        </div>

        <div className="col" style={{ gap: 16 }}>
          {/* Leash per segment */}
          <div className="hcp-card">
            <h3 className="hcp-card__title">Leash — per segment</h3>
            <p className="muted small" style={{ marginTop: -6 }}>
              Autonomy is earned per segment. Disputes stay Off; the agent still
              escalates VIPs, big balances, and low-confidence reads at every level.
            </p>
            <div className="stack" style={{ marginTop: 12 }}>
              {SEGMENTS.map(({ key, label }) => (
                <div key={key} className="row row--between">
                  <strong className="small">{label}</strong>
                  <div className="row" style={{ gap: 6 }}>
                    {LEVELS.map((lvl) => {
                      const active = s.segmentAutonomy[key] === lvl;
                      return (
                        <button
                          key={lvl}
                          className={"hcp-btn " + (active ? "hcp-btn--primary" : "hcp-btn--outline")}
                          style={{ height: 32, padding: "4px 12px", textTransform: "none" }}
                          onClick={() => patch({ segmentAutonomy: { ...s.segmentAutonomy, [key]: lvl } })}
                          title={LEVEL_LABEL[lvl]}
                        >
                          {lvl}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            <p className="small muted" style={{ marginTop: 10 }}>
              L0 Off · L1 Draft-only · L2 Auto-send the easy ones
            </p>
          </div>

          {/* VIP list */}
          <div className="hcp-card">
            <h3 className="hcp-card__title">VIP list</h3>
            <p className="muted small" style={{ marginTop: -6 }}>
              VIPs get kid gloves and always route to you. Auto-populated from
              relationship signals; add anyone.
            </p>
            <div style={{ marginTop: 10 }}>
              {vipCustomers.map((c) => (
                <div key={c.id} className="vip-item">
                  <span>★ {c.name} {c.autoVip ? <span className="muted small">(auto)</span> : null}</span>
                  {!c.autoVip && (
                    <button className="link-btn small" onClick={() => patch({ vipIds: s.vipIds.filter((x) => x !== c.id) })}>remove</button>
                  )}
                </div>
              ))}
              {vipCustomers.length === 0 && <p className="muted small">No VIPs yet.</p>}
            </div>
            <div className="row" style={{ gap: 8, marginTop: 12 }}>
              <select className="reply-input" value={newVip} onChange={(e) => setNewVip(e.target.value)}>
                <option value="">Add a customer…</option>
                {customers
                  .filter((c) => !c.autoVip && !s.vipIds.includes(c.id))
                  .map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
              </select>
              <button
                className="hcp-btn hcp-btn--outline"
                onClick={() => { if (newVip) { patch({ vipIds: [...s.vipIds, newVip] }); setNewVip(""); } }}
              >
                add
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="row" style={{ gap: 12, marginTop: 20 }}>
        <button className="hcp-btn hcp-btn--primary" onClick={save}>save settings</button>
        {saved && <span className="small" style={{ color: "var(--hcp-success)" }}>✓ saved — the agent will use these on the next read.</span>}
      </div>
    </div>
  );
}
