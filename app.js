const express = require("express");
const cors = require("cors");
const axios = require("axios");
const mysql = require("mysql2");
require("dotenv").config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  multipleStatements: true,
});

const db = pool.promise();

const app = express();
const port = process.env.PORT || "8888";
const ip = process.env.IP || "127.0.0.1";

const Url = `https://${process.env.BASE_URL}` || "http://127.0.0.1:3000";

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.end("Hello World");
});

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

      const chatId = `${recipient.send}@c.us`;
      const text = `*Salam ${recipient.display_name || "Qonaq"}*,\n${message}

*Tədbirin Detalları:*
*Tədbirin adı*: _${eventName || ""}_
*Tədbiri keçirən*: _${organizerName || ""}_
*Məkan*: _${eventLocation || ""}_
*Vaxt*: _${eventTime || ""}_${
        recipient.comeWith != null
          ? `\n*Gələcəksiz*: _${recipient.comeWith}_`
          : ""
      }
Type: ${eventType || ""}
Id: ${eventId || ""}

Tədbirə qoşulacaqsınızsa sadəcə mesajı sağa sürüşdürərək *hə* və ya *yox* yazaraq cavab verin.

©Devetly`;

      try {
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
          }
        );

        return {
          recipient: recipient.send,
          status: "success",
          response: response.data,
        };
      } catch (error) {
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

const getContactsNumList = async () => {
  try {
    const [rows] = await db.query("SELECT * FROM contacts");
    return rows;
  } catch (error) {
    console.error("MySQL Error:", error.message);
    return [];
  }
};

app.post("/webhook", async (req, res) => {
  try {
    const message = req.body;

    const payload = message?.payload;
    if (!payload || typeof payload !== "object") {
      console.warn("Invalid payload structure.");
      return res.sendStatus(200);
    }

    const { from, body, _data, replyTo } = payload;
    // console.log("-----------------------------------------------");
    // console.log(from);
    // console.log("-----------------------------------------------");
    // console.log(body);
    // console.log("-----------------------------------------------");
    // console.log(replyTo);
    // console.log("-----------------------------------------------");
    // console.log(_data);
    // console.log("-----------------------------------------------");

    const senderRaw = _data?.Info?.Sender;
    // const senderRaw = _data?.id?.remote;
    // console.log("-----------------------------------------------");
    // console.log(senderRaw);
    // console.log("-----------------------------------------------");

    let senderNum = null;
    if (typeof senderRaw === "string") {
      const atIndex = senderRaw.indexOf("@");
      if (atIndex !== -1) {
        const beforeAt = senderRaw.slice(0, atIndex);
        const match = beforeAt.match(/^(\d+)/);
        senderNum = match ? match[1] : null;
      }
    }
    // console.log("-----------------------------------------------");
    // console.log(senderNum);
    // console.log("-----------------------------------------------");
    const fromMatch =
      typeof from === "string" ? from.match(/^(\d+)@(\w)/) : null;
    const isPersonalChat = fromMatch && fromMatch[2] === "c";

    if (isPersonalChat && replyTo && typeof replyTo.body === "string") {
      console.log(`Message Arrived: ${senderNum}: ${body}`);

      const typeMatch = replyTo.body.match(/Type:\s*(.+)/);
      const idMatch = replyTo.body.match(/Id:\s*(\d+)/);

      const result = {
        type: typeMatch ? typeMatch[1].trim() : null,
        id: idMatch ? parseInt(idMatch[1], 10) : null,
      };

      if (!result.type || !result.id) {
        console.warn("Type or ID not found");
        return res.sendStatus(200);
      }

      const userReply = body.toLowerCase().trim();
      const positiveReplies = [
        "evet",
        "evt",
        "ewe",
        "ewet",
        "he",
        "tamam",
        "geliyorum",
        "gelcem",
        "gelirem",
        "tammdr",
        "gelir",
        "tamamdır",
        "gelecem",

        "he",
        "hə",
        "gelirem",
        "gelecem",
        "bəli",
        "gelirəm",
        "həə",
        "elədi",
        "həəə",
        "tamamdi",
        "tamamdır",
        "okdi",
        "oldu",
        "gələcəm",

        "yes",
        "yep",
        "yup",
        "yeah",
        "sure",
        "ok",
        "okay",
        "okey",
        "fine",
        "coming",
        "i will come",
        "i come",
        "i’ll come",

        "1",
        "01",
        "true",
        "okeyy",

        "👍",
        "✅",
        "🆗",
        "👌",
      ];

      const isPositive = positiveReplies.some((pos) => userReply.includes(pos));

      const comeValue = isPositive ? 1 : 0;

      const contacts = await getContactsNumList();

      const normalizeNumber = (num) =>
        typeof num === "string" ? num.replace(/\D/g, "") : "";

      const matchedContact = contacts.find(
        (contact) =>
          contact.group_id == result.id &&
          contact.type == result.type &&
          normalizeNumber(contact.phone_num) === normalizeNumber(senderNum)
      );

      if (matchedContact) {
        const contactId = matchedContact.id;

        await db.query(`UPDATE contacts SET come = ? WHERE id = ?`, [
          comeValue,
          contactId,
        ]);

        console.log(
          `The 'come' status was updated to ${comeValue} for contact ID ${contactId}.`
        );
      } else {
        console.log("No matching contact found in the database.");
      }
    } else {
      console.log(
        "This is not a personal conversation or a reply to a message."
      );
    }

    res.sendStatus(200);
  } catch (error) {
    console.error("Webhook Processing Error:", error);
    res.sendStatus(500);
  }
});

app.listen(port, ip, () => {
  console.log(`Listening on ${ip}:${port}`);
});
