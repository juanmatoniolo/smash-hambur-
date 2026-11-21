"use client";
import { WhatsAppIcon } from "@/components/BrandIcons";
import { whatsappShareUrl } from "@/lib/site";

/** Abre WhatsApp con un texto que termina en la URL, para que se vea la vista previa. */
export default function ShareButton({ text, url, label = "Compartir por WhatsApp", className = "btn btn-ghost" }) {
  return (
    <a className={className} href={whatsappShareUrl(`${text}\n${url}`)} target="_blank" rel="noopener noreferrer">
      <WhatsAppIcon size={18} />
      {label}
    </a>
  );
}
