import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import axios from "axios";
import CryptoJS from "crypto-js";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Telegram Notification API
  app.post("/api/notify", async (req, res) => {
    const { name, phone, carrier } = req.body;

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!botToken || !chatId) {
      console.warn("Telegram credentials missing. Skipping notification.");
      return res.status(200).json({ status: "skipped", message: "Credentials missing" });
    }

    try {
      const message = `🔔 *새로운 상담 신청*\n\n👤 *성함:* ${name}\n📱 *연락처:* ${phone}\n🌐 *통신사:* ${carrier}\n⏰ *시간:* ${new Date().toLocaleString('ko-KR')}`;
      
      await axios.post(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        chat_id: chatId,
        text: message,
        parse_mode: 'Markdown'
      });

      res.json({ status: "ok" });
    } catch (error: any) {
      console.error("Telegram Notification Error:", error.response?.data || error.message);
      res.status(500).json({ status: "error", message: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
