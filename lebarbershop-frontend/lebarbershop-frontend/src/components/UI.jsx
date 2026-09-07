import React from "react";
import { T } from "../lib/tokens";

export function NavItem({ icon: Icon, label, active, onClick, badge }) {
  return (
    <button onClick={onClick}
      className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-md transition-colors text-left"
      style={{ background: active ? "rgba(232,184,75,0.12)" : "transparent", color: active ? T.gold : "rgba(246,239,221,0.65)" }}>
      <Icon size={17} strokeWidth={2} />
      <span className="text-[13.5px] font-medium flex-1" style={{ fontFamily: "Manrope, sans-serif" }}>{label}</span>
      {badge ? (
        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full" style={{ background: T.coral, color: T.inkDeep }}>{badge}</span>
      ) : null}
    </button>
  );
}

export function StatCard({ label, value, sub, trend, icon: Icon }) {
  return (
    <div className="rounded-lg p-4 flex flex-col gap-2" style={{ background: "rgba(246,239,221,0.04)", border: `1px solid ${T.line}` }}>
      <div className="flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-widest" style={{ color: "rgba(246,239,221,0.45)" }}>{label}</span>
        {Icon && <Icon size={15} style={{ color: T.gold }} />}
      </div>
      <p className="font-mono" style={{ fontSize: 24, color: T.ivory }}>{value}</p>
      {sub && <div className="text-xs" style={{ color: trend >= 0 ? T.mint : T.coral }}>{sub}</div>}
    </div>
  );
}

export function TicketStub({ ticket, onValider }) {
  const valide = ticket.statut === "valide";
  return (
    <div className="relative flex items-stretch rounded-[2px] overflow-hidden" style={{ background: "rgba(246,239,221,0.05)", border: `1px solid ${T.line}` }}>
      <div className="flex flex-col justify-around py-1">
        {Array.from({ length: 8 }).map((_, i) => (
          <span key={i} className="block w-1.5 h-1.5 rounded-full mx-[3px]" style={{ background: T.inkDeep }} />
        ))}
      </div>
      <div className="flex-1 flex items-center justify-between gap-4 py-3 pr-4 pl-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px]" style={{ color: T.gold }}>{String(ticket.id).slice(0, 8)}</span>
            <span className="text-[10px] uppercase tracking-widest px-1.5 py-0.5 rounded-sm"
              style={{ background: valide ? "rgba(127,214,194,0.15)" : "rgba(232,184,75,0.15)", color: valide ? T.mint : T.gold }}>
              {valide ? "Validé" : "En attente"}
            </span>
          </div>
          <p className="mt-1 truncate" style={{ fontFamily: "Fraunces, serif", fontSize: 16, color: T.ivory }}>
            {ticket.client_nom || ticket.nom_client_temporaire || "Client"}
          </p>
          <p className="text-xs mt-0.5" style={{ color: "rgba(246,239,221,0.55)" }}>
            {(ticket.lignes || []).map((l) => l.soin_nom || l.soin).join(" · ")}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="font-mono text-lg" style={{ color: T.ivory }}>{Number(ticket.montant_net || 0).toLocaleString()}</p>
          <p className="text-[10px] tracking-wide" style={{ color: "rgba(246,239,221,0.4)" }}>FCFA</p>
          {!valide && onValider && (
            <button onClick={() => onValider(ticket)} className="mt-1 text-[11px] px-2 py-1 rounded-full" style={{ background: T.gold, color: T.inkDeep }}>
              Valider
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function Erreur({ message }) {
  if (!message) return null;
  return (
    <div className="rounded-md px-3 py-2 text-xs" style={{ background: "rgba(255,122,92,0.12)", color: T.coral, border: `1px solid rgba(255,122,92,0.3)` }}>
      {message}
    </div>
  );
}
