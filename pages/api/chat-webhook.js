// Simple webhook endpoint to power the chat popup.
// If OPENAI_API_KEY is provided in environment, this proxies the user's message to OpenAI's chat completions API.
// Otherwise it returns a simple fallback reply.

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method not allowed');
  }

  const { message } = req.body || {};
  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Missing message' });
  }

  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

  if (!OPENAI_API_KEY) {
    // fallback: simple canned response / echo with minimal logic
    const lower = message.toLowerCase();
    let reply = "Thanks for your message! I'm a lightweight assistant — try asking me about Semi-colonic features or how to invite friends.";

    if (lower.includes('invite') || lower.includes('share')) {
      reply = 'You can invite friends via WhatsApp, Instagram or TikTok from the Dashboard — or copy your invite code TTASOK.';
    } else if (lower.includes('hello') || lower.includes('hi')) {
      reply = "Hi there! I'm Semi-colonic assistant. How can I help?";
    } else if (lower.includes('help')) {
      reply = 'Ask me about posts, features, or inviting friends. For richer AI responses, set OPENAI_API_KEY in the server env.';
    } else {
      reply = `You said: "${message}". (Set OPENAI_API_KEY to enable richer AI replies.)`;
    }

    return res.status(200).json({ reply });
  }

  // Call OpenAI's Chat Completions API
  try {
    const payload = {
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are a helpful assistant for the Semi-colonic app. Keep answers friendly and concise.' },
        { role: 'user', content: message },
      ],
      max_tokens: 400,
      temperature: 0.7,
    };

    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    if (!r.ok) {
      const t = await r.text();
      console.error('OpenAI error', r.status, t);
      return res.status(500).json({ error: 'OpenAI API error', detail: t });
    }

    const data = await r.json();
    const reply = data?.choices?.[0]?.message?.content || 'Sorry, no reply from OpenAI';
    return res.status(200).json({ reply });
  } catch (err) {
    console.error('chat-webhook error', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
