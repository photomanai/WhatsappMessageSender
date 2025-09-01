app.post("/api/send-message", async (req, res) => {
  const {
    message,
    recipients,
    eventId,
    eventName,
    organizerName,
    eventType,
    eventTime,
    eventLocation,
  } = req.body;

  if (!message || !Array.isArray(recipients) || recipients.length === 0) {
    return res
      .status(400)
      .json({ error: "Invalid input format or empty recipients" });
  }

  const results = await Promise.all(
    recipients.map(async (recipient) => {
      // Eksik alan kontrolü
      if (!recipient.send || !recipient.display_name) {
        return {
          recipient: recipient.send || "unknown",
          status: "error",
          error: "Recipient data missing",
        };
      }

      // Telefon numarasından boşlukları ve özel karakterleri temizle
      const cleanPhoneNumber = recipient.send
        .toString()
        .replace(/[\s\-\+\(\)]/g, "");
      const chatId = `${cleanPhoneNumber}@c.us`;

      const text = `*Salam ${recipient.display_name || "Qonaq"}*,\n${message}

*Tədbirin Detalları:*
*Tədbirin adı*: _${eventName || ""}_
*Tədbiri keçirən*: _${organizerName || ""}_
*Məkan*: _${eventLocation || ""}_
*Vaxt*: _${eventTime || ""}_${
        recipient.comeWith != null
          ? `\n*Gələcəksiz*: _${recipient.comeWith}_`
          : ""
      }${
        recipient.qrHash != null
          ? `\n*Biletiniz*: _${Back_Url}/info/${recipient.qrHash}_`
          : ""
      }
Type: ${eventType || ""}
Id: ${eventId || ""}

Tədbirə qoşulacaqsınızsa sadəcə mesajı sağa sürüşdürərək *hə* və ya *yox* yazaraq cavab verin.

©Devetly`;

      try {
        console.log(`Sending message to: ${chatId}`);

        const response = await axios.post(
          `${Url}/api/sendText`,
          {
            chatId,
            text,
            session: "devetly",
          },
          {
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
              "X-Api-Key": `${process.env.API_KEY}`,
            },
            timeout: 5000,
          }
        );

        return {
          recipient: recipient.send,
          status: "success",
          response: response.data,
        };
      } catch (error) {
        console.error(
          `Error sending to ${chatId}:`,
          error.response?.data || error.message
        );
        return {
          recipient: recipient.send,
          status: "error",
          error: error.response ? error.response.data : error.message,
        };
      }
    })
  );

  res.json({ results });
});
