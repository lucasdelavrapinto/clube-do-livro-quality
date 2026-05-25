const ZAPI_URL = process.env.ZAPI_API;
const ZAPI_CLIENT_TOKEN = process.env.ZAPI_CLIENT_TOKEN;

export async function sendWhatsApp(phone: string, message: string): Promise<void> {
  if (!ZAPI_URL || !ZAPI_CLIENT_TOKEN) {
    console.warn('[ZAPI] Variáveis ZAPI_API ou ZAPI_CLIENT_TOKEN não configuradas.');
    return;
  }

  const digits = phone.replace(/\D/g, '');
  if (!digits) return;

  // Adiciona código do Brasil se não tiver
  const fullPhone = digits.startsWith('55') ? digits : `55${digits}`;

  try {
    const res = await fetch(ZAPI_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Client-Token': ZAPI_CLIENT_TOKEN,
      },
      body: JSON.stringify({ phone: fullPhone, message }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error(`[ZAPI] Erro ao enviar mensagem (${res.status}): ${body}`);
    }
  } catch (err) {
    console.error('[ZAPI] Falha na requisição:', err);
  }
}
