# Waha Backend Messaging System

This project sets up a simple backend messaging system using [Waha](https://github.com/devlikeapro/waha) — an open-source WhatsApp client infrastructure — to send WhatsApp messages via REST API.

## 📦 Requirements

* Docker
* Internet access

## 🚀 Getting Started

### 1. Run Waha in Docker

```bash
docker run -it -p 3000:3000 devlikeapro/waha
```

This command will pull and run the Waha service, exposing port `3000`.

### 2. Access Waha Web UI

Once the container is running, open:

```
http://127.0.0.1:3000
```

Scan the QR code with your WhatsApp account to connect.

---

## 📨 Sending a Message

Use the following REST API to send messages via WhatsApp:

### Endpoint

```
POST http://127.0.0.1:8888/api/send-message
```

### Headers

```http
Content-Type: application/json
```

### Sample Request Body

```json
{
  "message": "siz siz 28 may Heydər əliyev sarayında keçiriləcək uşaqların qorunma tədbirinə dəvəlisiz.",
  "recipients": [
    {
      "send": "xxxxxxxxxx",
      "display_name": "Zahid"
    },
    {
      "send": "xxxxxxxxxx",
      "display_name": "Adil"
    }
  ]
}
```

Replace `xxxxxxxxxx` with the recipients' phone numbers in international format (e.g., `+994xxxxxxxxx`).

---

## 🛠️ Development & Customization

You can extend this project by integrating it into your Node.js backend or automating message flows based on event triggers.

Some ideas:

* Integrate with MongoDB to store message logs
* Add scheduled messaging with cron jobs
* Build a frontend to manage message templates and contacts

---

## 📚 Resources

* [Waha GitHub Repository](https://github.com/devlikeapro/waha)
* [Docker](https://docs.docker.com/)

---

## 📃 License

MIT License

---

## ✍️ Author

Created by \Photomanai. Contributions and suggestions welcome!
