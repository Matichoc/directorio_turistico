"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { PageHero } from "@/components/ui/page-hero";
import { PasswordForm } from "@/components/admin/password-form";

/** Mi cuenta: cambiar la clave propia y cerrar sesión. */
export default function AccountPage() {
  const router = useRouter();
  const [saved, setSaved] = useState(false);

  async function signOut() {
    await createClient().auth.signOut();
    router.replace("/admin/login");
    router.refresh();
  }

  return (
    <div className="flex max-w-sm flex-col gap-6">
      <PageHero title="Mi cuenta" />
      <section className="flex flex-col gap-3">
        <h2 className="font-medium">Cambiar mi clave</h2>
        {saved ? (
          <p role="status" className="text-sm text-emerald-400">
            Listo: tu clave nueva ya funciona.
          </p>
        ) : (
          <PasswordForm
            submitLabel="Guardar clave nueva"
            onDone={() => setSaved(true)}
          />
        )}
      </section>
      <button
        type="button"
        onClick={() => void signOut()}
        className="self-start rounded-full border border-white/15 px-4 py-2 text-sm"
      >
        Cerrar sesión
      </button>
    </div>
  );
}
