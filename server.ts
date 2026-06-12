import express from "express";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());

// Initialize Gemini Client
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// REST API Endpoints FIRST
app.post("/api/ai-desk", async (req, res) => {
  const { message, history, productsList } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Message is required" });
  }

  if (!ai) {
    return res.status(503).json({
      error: "Gemini API Client is not configured. Please supply a GEMINI_API_KEY in Settings."
    });
  }

  try {
    const productsContext = Array.isArray(productsList) && productsList.length > 0
      ? `Here is our exact real-time catalog of electronic devices and solar bundles in our Warri showroom, including their real prices and stock status:\n${JSON.stringify(productsList, null, 2)}`
      : "No products currently loaded in our catalog.";

    const systemInstruction = `You are the friendly and highly intelligent AI Desk Assistant for Ugomenz Electronics, located at Deco Road, Warri (just after Robinson Plaza). 
Your goal is to assist customers with product inquiries, solar power inquiries, bank payment transfers (Ugomenz Electronics, GTB, 9006163631), store hours (Monday - Saturday: 8:00 AM - 6:00 PM), and warranties.

Guidelines:
1. Always be professional, helpful, polite, and representative of the Warm, hospitable Warri spirit.
2. Provide precise device details, specs, and pricing based on the provided list of products.
3. If a customer is looking to buy, explain they can pay into our GTBank Account (9006163631, Name: Ugomenz Electronics), generate client-side receipts, and schedule store pickup at Deco Road plaza.
4. Keep the responses concise, accurate, and easy to read. Use bullet points or simple highlights.
5. If someone asks about managers or team experts, we have our Manager (+2349060672127), our Financial Advisor (+2347068767180), and our Lead Tech Expert (+2349060672127) ready to support them.

${productsContext}`;

    // Format history structure for Gemini chats SDK
    // The history parameter is an array of structural contents parts
    const chatHistory = Array.isArray(history) ? history.map((h: any) => ({
      role: h.role === "model" ? "model" : h.role === "user" ? "user" : "user",
      parts: Array.isArray(h.parts) ? h.parts.map((p: any) => ({ text: p.text || "" })) : [{ text: String(h) }]
    })) : [];

    // Create a chats instance
    const chat = ai.chats.create({
      model: "gemini-3.5-flash",
      config: {
        systemInstruction,
        temperature: 0.7,
      },
      history: chatHistory
    });

    const response = await chat.sendMessage({ message: message });

    return res.json({ text: response.text });
  } catch (error: any) {
    console.error("AI Desk Endpoint Error:", error);
    return res.status(500).json({ error: error.message || "Failed to generate AI response" });
  }
});

// Implement Vite middleware or static serving
async function setupServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Ugomenz Server] Server listening on http://0.0.0.0:${PORT} in ${process.env.NODE_ENV || "development"} mode`);
  });
}

setupServer().catch((err) => {
  console.error("Failed to start server:", err);
});
