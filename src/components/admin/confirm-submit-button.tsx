"use client";

/**
 * Botón de submit con confirmación nativa antes de disparar la acción del
 * `<form>` que lo envuelve — usado para acciones destructivas (eliminar
 * lugar/ruta/tag) en el panel admin, donde un click accidental sí importa.
 */
export function ConfirmSubmitButton({
  label,
  confirmMessage,
  className,
}: {
  label: string;
  confirmMessage: string;
  className?: string;
}) {
  return (
    <button
      type="submit"
      onClick={(event) => {
        if (!window.confirm(confirmMessage)) {
          event.preventDefault();
        }
      }}
      className={
        className ??
        "rounded-full bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-700"
      }
    >
      {label}
    </button>
  );
}
