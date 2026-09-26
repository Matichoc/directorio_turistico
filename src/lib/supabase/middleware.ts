import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import {
  getSupabaseAnonKey,
  getSupabaseUrl,
  isSupabaseConfigured,
} from "@/lib/supabase/env";

/**
 * Refresca la sesión de Supabase Auth para el panel admin y confirma que
 * quien entra es administrador (`admin_users`) — no solo que tenga una
 * sesión válida. Antes solo se chequeaba `user` (cualquier cuenta con
 * sesión pasaba), lo cual era inofensivo mientras el único login posible
 * fuera el de `/admin/login` (usuario/clave, solo para administradores),
 * pero deja de serlo en cuanto exista login público opcional (Google/
 * Facebook para "me gusta", ver docs/PLAN.md sección 8.1): cualquier
 * visitante que inicie sesión ahí podría, sin este chequeo, llegar a
 * `/admin/*` con una sesión válida (aunque RLS igual bloquearía cualquier
 * escritura vía `is_admin()`, mejor no depender de una sola capa). Se
 * ejecuta antes de servir cualquier ruta bajo `/admin`.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  if (!isSupabaseConfigured()) {
    return response;
  }

  const supabase = createServerClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isLoginRoute = request.nextUrl.pathname === "/admin/login";
  if (!user && !isLoginRoute) {
    const loginUrl = new URL("/admin/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  if (user && !isLoginRoute) {
    const { data: adminRow } = await supabase
      .from("admin_users")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!adminRow) {
      await supabase.auth.signOut();
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("error", "not_admin");
      return NextResponse.redirect(loginUrl);
    }
  }

  return response;
}
