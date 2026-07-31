export const config = { runtime: 'edge' };

const B64 = { decode: s => atob(s) };
const K = B64.decode('Y2xpX2FhZTA2M2Y5MTRiOGRjYzg=');
const S = B64.decode('NWpKRG9NOEZ3WmZhbXBsYUdqQWlCaGZ6UVJRSU4wMnY=');

async function getToken() {
  const r = await fetch('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ app_id: K, app_secret: S })
  });
  const d = await r.json();
  return d.tenant_access_token;
}

async function sendMessage(token, openId, text) {
  await fetch(`https://open.feishu.cn/open-apis/im/v1/messages?receive_id_type=open_id`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token
    },
    body: JSON.stringify({
      receive_id: openId,
      msg_type: 'text',
      content: JSON.stringify({ text: text })
    })
  });
}

export default async function handler(request) {
  const body = await request.json().catch(() => ({}));

  // URL verification - respond instantly
  if (body.type === 'url_verification') {
    return new Response(JSON.stringify({ challenge: body.challenge }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Event callback
  if (body.header && body.header.event_type === 'im.message.receive_v1') {
    const event = body.event || {};
    const msg = event.message || {};
    const senderId = event.sender ? event.sender.sender_id.open_id : null;
    let text = '';
    try { text = JSON.parse(msg.content || '{}').text || ''; } catch (e) {}

    if (senderId && text) {
      try {
        const token = await getToken();
        await sendMessage(token, senderId, '收到你的消息：' + text);
      } catch (e) {
        console.error(e);
      }
    }
  }

  return new Response(JSON.stringify({ code: 0 }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}
