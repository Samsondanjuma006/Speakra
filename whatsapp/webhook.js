function verifyWebhook(req, res) {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;

  if (
    mode === "subscribe" &&
    token &&
    verifyToken &&
    token === verifyToken
  ) {
    return res.status(200).send(challenge);
  }

  return res.sendStatus(403);
}

function handleWebhook(req, res) {
  console.log("WhatsApp webhook received:");
  console.log(JSON.stringify(req.body, null, 2));

  return res.sendStatus(200);
}

module.exports = {
  verifyWebhook,
  handleWebhook
};
