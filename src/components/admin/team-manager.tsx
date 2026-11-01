"use client";

import { useState, useTransition, type FormEvent } from "react";
import {
  createPasswordLink,
  inviteMember,
  removeMember,
  setMemberRole,
} from "@/lib/server/team";
import type { TeamMember } from "@/lib/data/team";
import type { TeamRole } from "@/types/database";

const ROLE_LABEL: Record<TeamRole, string> = {
  admin: "Administrador",
  editor: "Editor",
};

const dateFormatter = new Intl.DateTimeFormat("es-CL", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

const inputClass =
  "border-accent-soft focus:border-accent rounded-xl border bg-transparent px-3 py-2 text-sm outline-none dark:border-white/15";
const buttonClass =
  "bg-accent text-accent-foreground rounded-full px-4 py-2 text-sm font-medium disabled:opacity-50";

/** Link de un solo uso para mandar por WhatsApp o correo, con copiar. */
function LinkBox({ text, link }: { text: string; link: string }) {
  const [copied, setCopied] = useState(false);
  const whatsapp = `https://wa.me/?text=${encodeURIComponent(`${text} ${link}`)}`;
  return (
    <div className="surface-glass flex flex-col gap-2 rounded-2xl border border-emerald-500/40 p-4 text-sm">
      <p>{text}</p>
      <code className="block overflow-x-auto rounded-lg bg-black/30 p-2 text-xs whitespace-nowrap">
        {link}
      </code>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className={buttonClass}
          onClick={() => {
            void navigator.clipboard
              .writeText(link)
              .then(() => setCopied(true));
          }}
        >
          {copied ? "Copiado ✓" : "Copiar link"}
        </button>
        <a
          href={whatsapp}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full border border-white/15 px-4 py-2 text-sm"
        >
          Mandar por WhatsApp
        </a>
      </div>
      <p className="text-foreground/60 text-xs">
        Sirve una sola vez y vence en 1 hora. Si vence, genera otro.
      </p>
    </div>
  );
}

/**
 * Equipo del panel: invitar (correo + rol → link para crear la clave),
 * cambiar el rol, generar un link para cambiar la clave y quitar a alguien.
 * Las reglas (solo admins, al menos un admin, no quitarse a uno mismo) se
 * revisan en el servidor (`lib/server/team.ts`), no acá.
 */
export function TeamManager({
  members,
  myUserId,
}: {
  members: TeamMember[];
  myUserId: string;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [linkBox, setLinkBox] = useState<{ text: string; link: string } | null>(
    null,
  );

  function run(action: () => Promise<void>) {
    setError(null);
    startTransition(async () => {
      try {
        await action();
      } catch (actionError) {
        setError(
          actionError instanceof Error ? actionError.message : "Algo falló.",
        );
      }
    });
  }

  function handleInvite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const email = String(data.get("email") ?? "");
    const role = String(data.get("role") ?? "editor") as TeamRole;
    run(async () => {
      const { link } = await inviteMember({ email, role });
      setLinkBox({
        text: `Te invito al panel de "El diablo murió en Petorca" como ${ROLE_LABEL[role].toLowerCase()}. Entra acá y crea tu clave:`,
        link,
      });
      form.reset();
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <form
        onSubmit={handleInvite}
        className="surface-glass flex flex-col gap-3 rounded-2xl p-4 sm:flex-row sm:items-end"
      >
        <label className="flex flex-1 flex-col gap-1 text-sm">
          Correo de la persona
          <input name="email" type="email" required className={inputClass} />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Rol
          <select name="role" defaultValue="editor" className={inputClass}>
            <option value="editor">Editor (contenido)</option>
            <option value="admin">Administrador (todo)</option>
          </select>
        </label>
        <button type="submit" disabled={pending} className={buttonClass}>
          {pending ? "Creando…" : "Invitar"}
        </button>
      </form>

      {linkBox && <LinkBox text={linkBox.text} link={linkBox.link} />}
      {error && (
        <p role="alert" className="text-sm text-red-400">
          {error}
        </p>
      )}

      <ul className="flex flex-col gap-2">
        {members.map((member) => {
          const isMe = member.userId === myUserId;
          return (
            <li
              key={member.userId}
              className="flex flex-col gap-2 rounded-2xl border border-white/10 p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">
                  {member.email ?? member.userId}
                  {isMe && (
                    <span className="text-foreground/50 text-xs"> (tú)</span>
                  )}
                </p>
                <p className="text-foreground/50 text-xs">
                  Desde {dateFormatter.format(new Date(member.createdAt))}
                  {member.lastSignInAt
                    ? ` · último ingreso ${dateFormatter.format(new Date(member.lastSignInAt))}`
                    : " · todavía no entra"}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <select
                  aria-label={`Rol de ${member.email ?? member.userId}`}
                  value={member.role}
                  disabled={pending}
                  onChange={(event) => {
                    const role = event.target.value as TeamRole;
                    run(() => setMemberRole(member.userId, role));
                  }}
                  className={inputClass}
                >
                  <option value="editor">{ROLE_LABEL.editor}</option>
                  <option value="admin">{ROLE_LABEL.admin}</option>
                </select>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() =>
                    run(async () => {
                      const { link } = await createPasswordLink(member.userId);
                      setLinkBox({
                        text: `Link para crear una clave nueva en el panel de "El diablo murió en Petorca":`,
                        link,
                      });
                    })
                  }
                  className="rounded-full border border-white/15 px-3 py-1.5 text-xs"
                >
                  Link para cambiar clave
                </button>
                {!isMe && (
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => {
                      if (
                        window.confirm(
                          `¿Quitar a ${member.email ?? "esta persona"} del equipo? Su cuenta no se borra; solo deja de entrar al panel.`,
                        )
                      ) {
                        run(() => removeMember(member.userId));
                      }
                    }}
                    className="rounded-full border border-red-500/40 px-3 py-1.5 text-xs text-red-300"
                  >
                    Quitar
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
