"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { PageHero } from "@/components/ui/page-hero";
import { PasswordForm } from "@/components/admin/password-form";

const TYPES: EmailOtpType[] = ["invite", "magiclink", "recovery", "email"];

/**
 * Entrada desde un link de /admin/personas (invitación o "cambiar clave"):
 * canjea el código de un solo uso y pide crear la clave. El link apunta acá
 * y no a Supabase porque Auth es compartido con Papudo (ver
 * lib/server/team.ts). El middleware deja pasar esta página sin sesión.
 */
export default function AcceptInvitePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [state, setState] = useState<"checking" | "ready" | "invalid">(
    "checking",
  );
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const tokenHash = searchParams.get("token_hash");
    const type = searchParams.get("type") as EmailOtpType | null;
    if (!tokenHash || !type || !TYPES.includes(type)) {
      queueMicrotask(() => setState("invalid"));
      return;
    }
    void createClient()
      .auth.verifyOtp({ token_hash: tokenHash, type })
      .then(({ error }) => setState(error ? "invalid" : "ready"));
  }, [searchParams]);

  return (
    <div className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-6 px-4">
      <PageHero title="Bienvenida al panel" />
      {state === "checking" && (
        <p className="text-foreground/70 text-sm">Revisando tu link…</p>
      )}
      {state === "invalid" && (
        <p role="alert" className="text-sm text-amber-300">
          Este link ya se usó o venció (duran 1 hora). Pídele uno nuevo a quien
          te invitó.
        </p>
      )}
      {state === "ready" && (
        <>
          <p className="text-foreground/80 text-sm">
            Crea tu clave para entrar al panel de «El diablo murió en Petorca».
            Después entras con tu correo y esta clave.
          </p>
          <PasswordForm
            submitLabel="Crear clave y entrar"
            onDone={() => {
              router.replace("/admin");
              router.refresh();
            }}
          />
        </>
      )}
    </div>
  );
}
