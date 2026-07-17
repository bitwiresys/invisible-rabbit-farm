/**
 * Serverless-функция «ИИ-агроном» (Vercel, Node 18+).
 *
 * Принципы:
 * - ключ ТОЛЬКО в env (AI_API_KEY), в клиентский бандл не попадает;
 * - LLM ничего не считает: получает готовые факты модели и пересказывает их;
 * - публичный эндпоинт = кошелёк наружу, поэтому: лимит запросов по IP,
 *   маленький max_tokens, дешёвая модель;
 * - при любой ошибке клиент деградирует до локального шаблона.
 *
 * Env (Vercel → Settings → Environment Variables):
 *   AI_API_KEY   — ключ OpenRouter (или совместимого OpenAI-API провайдера)
 *   AI_BASE_URL  — опционально, по умолчанию https://openrouter.ai/api/v1
 *   AI_MODEL     — опционально, по умолчанию anthropic/claude-haiku-4.5
 */

const WINDOW_MS = 60 * 60 * 1000;
/** Запросов с одного IP в час. Демо-лимит: щадит баланс, не мешает проверке. */
const LIMIT_PER_IP = 20;

/** In-memory лимитер: на serverless живёт в пределах тёплого инстанса — для демо достаточно. */
const hits = new Map<string, number[]>();

const SYSTEM_PROMPT = [
  'Ты — ИИ-агроном системы «ПУХ» (Пассивный Учёт Хвостатых), которая оценивает',
  'поголовье невидимых кроликов на ферме по косвенным сигналам.',
  'Тебе передают уже посчитанные факты в JSON. Напиши «отчёт смены» для фермера:',
  'сухой полевой рапорт с лёгкой иронией, 4–6 коротких предложений, без markdown,',
  'без списков и заголовков. Используй только числа и факты из JSON — ничего не',
  'выдумывай, не пересчитывай и не добавляй новых цифр.',
  'Закончи строкой «Подпись: ИИ-агроном ПУХ.»',
].join(' ');

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  const key = process.env.AI_API_KEY;
  if (!key) {
    // Ключ не настроен — клиент молча соберёт отчёт по шаблону.
    return res.status(503).json({ error: 'ai_disabled' });
  }

  const ip = String(req.headers['x-forwarded-for'] ?? 'local').split(',')[0].trim();
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= LIMIT_PER_IP) {
    return res.status(429).json({ error: 'rate_limited' });
  }
  recent.push(now);
  hits.set(ip, recent);

  const facts = req.body?.facts;
  if (!facts || typeof facts !== 'object') {
    return res.status(400).json({ error: 'bad_request' });
  }

  const baseUrl = process.env.AI_BASE_URL ?? 'https://openrouter.ai/api/v1';
  const model = process.env.AI_MODEL ?? 'anthropic/claude-haiku-4.5';

  try {
    const upstream = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model,
        max_tokens: 400,
        temperature: 0.6,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: JSON.stringify(facts) },
        ],
      }),
    });
    if (!upstream.ok) {
      return res.status(502).json({ error: 'upstream', status: upstream.status });
    }
    const data = await upstream.json();
    const text = data?.choices?.[0]?.message?.content?.trim();
    if (!text) {
      return res.status(502).json({ error: 'empty_completion' });
    }
    return res.status(200).json({ text, source: 'ai' });
  } catch {
    return res.status(502).json({ error: 'upstream_failed' });
  }
}
