import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "El diablo murió en Petorca",
    short_name: "El Diablo en Petorca",
    description:
      "Directorio turístico de la comuna de Petorca, la tierra donde murió el diablo: pueblos, rutas y leyendas.",
    start_url: "/",
    display: "standalone",
    // Mismo fondo de noche del sitio (`--background`): la pantalla de inicio
    // de la app instalada no destella en blanco.
    background_color: "#07060c",
    theme_color: "#07060c",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
