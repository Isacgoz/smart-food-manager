import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const FROM_EMAIL = Deno.env.get('FROM_EMAIL') || 'Smart Food <noreply@smartfood.app>';

interface PinResetPayload {
  email: string;
  userName: string;
  newPin: string;
  restaurantName: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    const { email, userName, newPin, restaurantName } = await req.json() as PinResetPayload;

    if (!email || !newPin || !userName) {
      return new Response(JSON.stringify({ error: 'Missing fields' }), { status: 400 });
    }

    if (!RESEND_API_KEY) {
      return new Response(JSON.stringify({ error: 'Email service not configured' }), { status: 503 });
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [email],
        subject: `Nouveau code PIN - ${restaurantName}`,
        html: `
          <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
            <h2 style="color: #0f172a;">Réinitialisation de votre code PIN</h2>
            <p>Bonjour <strong>${userName}</strong>,</p>
            <p>Votre gérant a approuvé votre demande de réinitialisation de code PIN pour <strong>${restaurantName}</strong>.</p>
            <div style="background: #f0fdf4; border: 2px solid #22c55e; border-radius: 16px; padding: 24px; text-align: center; margin: 24px 0;">
              <p style="margin: 0 0 8px; color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 2px; font-weight: 700;">Votre nouveau code PIN</p>
              <p style="margin: 0; font-size: 40px; font-weight: 900; letter-spacing: 12px; color: #0f172a;">${newPin}</p>
            </div>
            <p style="color: #ef4444; font-weight: 700; font-size: 13px;">Changez ce PIN dès votre prochaine connexion pour plus de sécurité.</p>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
            <p style="color: #94a3b8; font-size: 11px;">Smart Food Manager - ${restaurantName}</p>
          </div>
        `,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      return new Response(JSON.stringify({ error: 'Email send failed', details: err }), { status: 500 });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
