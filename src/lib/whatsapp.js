/**
 * Convierte un teléfono argentino a formato internacional para wa.me
 * Ejemplos:
 *   "+54 9 11 1234-5678" → "5491112345678"
 *   "011 15-1234-5678"   → "5491112345678"
 *   "11 1234 5678"       → "5491112345678"
 *   "5491112345678"      → "5491112345678"
 */
export function phoneToWhatsApp(raw) {
	if (!raw) return "";
	let digits = String(raw).replace(/\D/g, "");
	if (!digits) return "";

	// Ya viene con 54 adelante
	if (digits.startsWith("54")) {
		// Si tiene 54 + 9 dígitos → asumimos que es móvil AR
		return digits;
	}

	// Empieza con 0 (trunk) → lo sacamos y prependemos 549
	if (digits.startsWith("0")) {
		digits = digits.slice(1);
	}

	// Si ya tiene 9 después del área (ej: 9 11 12345678), prependemos 54
	if (digits.startsWith("9") && digits.length >= 11) {
		return "54" + digits;
	}

	// Si tiene 10 dígitos → asumimos área + número, agregamos 549
	if (digits.length === 10) {
		return "549" + digits;
	}

	// Si tiene 11 dígitos (área + 8) → agregamos 549
	if (digits.length === 11) {
		return "549" + digits.slice(0, 2) + digits.slice(2);
	}

	// Fallback: devolvemos los dígitos tal cual
	return digits;
}

export function linkWhatsApp(phone, mensaje = "") {
	const numero = phoneToWhatsApp(phone);
	if (!numero) return null;
	const texto = mensaje ? `?text=${encodeURIComponent(mensaje)}` : "";
	return `https://wa.me/${numero}${texto}`;
}

export function linkTel(phone) {
	if (!phone) return null;
	return `tel:${String(phone).replace(/\s/g, "")}`;
}

export function linkMail(email, subject = "") {
	if (!email) return null;
	const s = subject ? `?subject=${encodeURIComponent(subject)}` : "";
	return `mailto:${email}${s}`;
}
