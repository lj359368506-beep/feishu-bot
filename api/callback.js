const https = require('https');

const APP_ID = process.env.FEISHU_APP_ID;
const APP_SECRET = process.env.FEISHU_APP_SECRET;

function getToken() {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ app_id: APP_ID, app_secret: APP_SECRET });
    const req = https.request({
      hostname: 'open.feishu.cn',
      path: '/open-apis/auth/v3/tenant_access_token/internal',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, res => {
      let body = '';
      res.on('data', d => body += d);
      res.on('end', () => {
        try { resolve(JSON.parse(body).tenant_access_token); }
        catch(e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function sendMessage(token, openId, text) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      receive_id: openId,
      msg_type: 'text',
      content: JSON.stringify({ text: text })
    });
    const req = https.request({
      hostname: 'open.feishu.cn',
      path: '/open-apis/im/v1/messages?receive_id_type=open_id',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      }
    }, res => { res.on('end', resolve); });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

module.exports = async function handler(req, res) {
  const body = req.body || {};

  if (body.type === 'url_verification') {
    return res.status(200).json({ challenge: body.challenge });
  }

  if (body.header && body.header.event_type === 'im.message.receive_v1') {
    const event = body.event || {};
    const msg = event.message || {};
    const senderId = event.sender ? event.sender.sender_id.open_id : null;
    let text = '';
    try { text = JSON.parse(msg.content || '{}').text || ''; } catch (e) {}

    if (senderId && text) {
      getToken()
        .then(token => sendMessage(token, senderId, '收到你的消息：' + text))
        .catch(e => console.error(e));
    }
  }

  res.status(200).json({ code: 0 });
};
