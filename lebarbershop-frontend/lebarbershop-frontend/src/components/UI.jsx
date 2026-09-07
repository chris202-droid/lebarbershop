import React from "react";
import { T } from "../lib/tokens";

export function NavItem({ icon: Icon, label, active, onClick, badge }) {
  return (
    <button onClick={onClick}
      className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-md transition-colors text-left"
      style={{ background: active ? "rgba(201,147,42,0.12)" : "transparent", color: active ? T.gold : "rgba(18,42,32,0.65)" }}>
      <Icon size={17} strokeWidth={2} />
      <span className="text-[13.5px] font-medium flex-1" style={{ fontFamily: "Manrope, sans-serif" }}>{label}</span>
      {badge ? (
        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full" style={{ background: T.coral, color: T.clair }}>{badge}</span>
      ) : null}
    </button>
  );
}

export function StatCard({ label, value, sub, trend, icon: Icon }) {
  return (
    <div className="rounded-lg p-4 flex flex-col gap-2" style={{ background: "rgba(18,42,32,0.04)", border: `1px solid ${T.line}` }}>
      <div className="flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-widest" style={{ color: "rgba(18,42,32,0.45)" }}>{label}</span>
        {Icon && <Icon size={15} style={{ color: T.gold }} />}
      </div>
      <p className="font-mono" style={{ fontSize: 24, color: T.ivory }}>{value}</p>
      {sub && <div className="text-xs" style={{ color: trend >= 0 ? T.mint : T.coral }}>{sub}</div>}
    </div>
  );
}

export function TicketStub({ ticket, onValider, onAnnuler }) {
  const valide = ticket.statut === "valide";
  const annule = ticket.statut === "annule";
  return (
    <div className="relative flex items-stretch rounded-[2px] overflow-hidden" style={{ background: "rgba(18,42,32,0.05)", border: `1px solid ${T.line}`, opacity: annule ? 0.5 : 1 }}>
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
              style={{
                background: valide ? "rgba(30,158,100,0.15)" : annule ? "rgba(217,80,60,0.15)" : "rgba(201,147,42,0.15)",
                color: valide ? T.mint : annule ? T.coral : T.gold,
              }}>
              {valide ? "Validé" : annule ? "Annulé" : "En attente"}
            </span>
          </div>
          <p className="mt-1 truncate" style={{ fontFamily: "Fraunces, serif", fontSize: 16, color: T.ivory }}>
            {ticket.client_nom || ticket.nom_client_temporaire || "Client"}
          </p>
          <p className="text-xs mt-0.5" style={{ color: "rgba(18,42,32,0.55)" }}>
            {(ticket.lignes || []).map((l) => l.soin_nom || l.soin).join(" · ")}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="font-mono text-lg" style={{ color: T.ivory }}>{Number(ticket.montant_net || 0).toLocaleString()}</p>
          <p className="text-[10px] tracking-wide" style={{ color: "rgba(18,42,32,0.4)" }}>FCFA</p>
          {!valide && !annule && (
            <div className="flex items-center gap-1.5 mt-1 justify-end">
              {onValider && (
                <button onClick={() => onValider(ticket)} className="text-[11px] px-2 py-1 rounded-full" style={{ background: T.gold, color: T.inkDeep }}>
                  Valider
                </button>
              )}
              {onAnnuler && (
                <button onClick={() => onAnnuler(ticket)} className="text-[11px] px-2 py-1 rounded-full" style={{ background: "rgba(217,80,60,0.15)", color: T.coral }}>
                  Annuler
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function Erreur({ message }) {
  if (!message) return null;
  return (
    <div className="rounded-md px-3 py-2 text-xs" style={{ background: "rgba(217,80,60,0.12)", color: T.coral, border: `1px solid rgba(217,80,60,0.3)` }}>
      {message}
    </div>
  );
}
