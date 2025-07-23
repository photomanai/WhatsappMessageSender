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

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.end("Hello World");
});

app.post("/api/send-message", async (req, res) => {
  const { message, recipients } = req.body;

  if (!message || !Array.isArray(recipients)) {
    return res.status(400).json({ error: "Invalid input format" });
  }

  const results = [];

  for (const recipient of recipients) {
    const chatId = `${recipient.send}@c.us`;
    const text = `*Salam ${recipient.display_name}*,\n${message}\n\nDevetly Team`;

    try {
      const response = await axios.post(
        "http://localhost:3000/api/sendText",
        {
          chatId,
          text,
          session: "default",
        },
        {
          headers: {
            "Content-Type": "application/json",
            accept: "application/json",
          },
        }
      );

      results.push({
        recipient: recipient.send,
        status: "success",
        response: response.data,
      });
    } catch (error) {
      results.push({
        recipient: recipient.send,
        status: "error",
        error: error.response ? error.response.data : error.message,
      });
    }
  }

  res.json({ results });
});

const getContactsNumList = async () => {
  try {
    const [rows] = await db.query("SELECT * FROM contacts");
    return rows;
  } catch (error) {
    console.error("MySQL Error:", error.message);
    res.status(500).json({ success: false, error: "Database error" });
  }
};

app.post("/webhook", async (req, res) => {
  const message = req.body;

  const payload = message?.payload;
  if (!payload || typeof payload !== "object") {
    console.log("Warning: Invalid payload structure.");
    return res.sendStatus(200);
  }

  const { from, body, _data } = payload;

  const senderRaw = _data?.Info?.Sender;
  const senderMatch =
    typeof senderRaw === "string" ? senderRaw.match(/^(\d+)@(\w)/) : null;
  const senderNum = senderMatch ? senderMatch[1] : "Unknown";

  const fromMatch = typeof from === "string" ? from.match(/^(\d+)@(\w)/) : null;
  const isPersonalChat = fromMatch && fromMatch[2] === "c";

  if (isPersonalChat) {
    console.log(`${senderNum}: ${body}`);
    console.log(await getContactsNumList());
  } else {
    console.log("Not a personal chat or invalid format.");
  }

  res.sendStatus(200);
});

app.listen(port, ip, () => {
  console.log(`Listening on ${ip}:${port}`);
});
