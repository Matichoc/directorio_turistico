import type { JsonLd as JsonLdData } from "@/lib/seo-json-ld";

/**
 * `<script type="application/ld+json">` con los datos estructurados de una
 * ficha (ver `lib/seo-json-ld.ts`). Es el patrón que indica la guía de Next
 * (`guides/json-ld`): el `<` se escapa para que un texto de la base nunca
 * pueda cerrar el `<script>` e inyectar HTML.
 */
export function JsonLd({ data }: { data: JsonLdData }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
