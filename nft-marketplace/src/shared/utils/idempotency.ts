/**
 * Utilitário de Chave de Idempotência
 * Garante que requisições repetidas ou reenvios após timeout
 * recuperem a mesma transação sem duplicidade.
 */

export function generateIdempotencyKey(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'idemp_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
}

/**
 * Gera uma assinatura estável (hash simples ou string canonicalizada)
 * dos itens e dados de um pedido para detectar reuso da mesma chave
 * com conteúdo diferente (o que deve gerar HTTP 409 Conflict).
 */
export function createPayloadFingerprint(payload: unknown): string {
  try {
    const canonical = JSON.stringify(payload, Object.keys(payload as object).sort());
    let hash = 0;
    for (let i = 0; i < canonical.length; i++) {
      const char = canonical.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0; // Converte para inteiro de 32 bits
    }
    return Math.abs(hash).toString(16);
  } catch {
    return String(Date.now());
  }
}
