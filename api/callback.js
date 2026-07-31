const { sendMessage } = require('../lib/feishu');

module.exports = async function handler(req, res) {
  const body = req.body || {};

  // URL verification
  if (body.type === 'url_verification') {
    return res.json({ challenge: body.challenge });
  }

  // Event callback
  if (body.header && body.header.event_type === 'im.message.receive_v1') {
    const event = body.event || {};
    const msg = event.message || {};
    const chatType = msg.chat_type;
    const content = msg.content;
    const senderId = event.sender ? event.sender.sender_id.open_id : null;

    // Parse message text
    let text = '';
    try {
      const parsed = JSON.parse(content || '{}');
      text = parsed.text || '';
    } catch (e) {}

    console.log(`Message from ${senderId}: ${text}`);

    // Reply
    if (senderId && text) {
      try {
        await sendMessage(senderId, `收到你的消息：${text}`);
      } catch (e) {
        console.error('Reply failed:', e.message);
      }
    }
  }

  res.json({ code: 0 });
};
