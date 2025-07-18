const express = require("express");
const cors = require("cors");
const axios = require("axios");
require("dotenv").config();

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

app.listen(port, ip, () => {
  console.log(`Listening on ${ip}:${port}`);
});
