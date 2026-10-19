
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json({ limit: "20kb" }));

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
});


const sleep = (ms) =>
    new Promise((resolve) => setTimeout(resolve, ms));

async function generateWithRetry(message) {
    const maxAttempts = 3;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            const response = await ai.models.generateContent({
                model: "gemini-3.5-flash",
                contents: message,
            });

            return response.text;
        } catch (error) {
            const status = error.status;

            console.error(
                `Gemini attempt ${attempt} failed:`,
                status,
                error.message
            );

            if (
                ![429, 503].includes(status) ||
                attempt === maxAttempts
            ) {
                throw error;
            }

            const delay = 1000 * 2 ** (attempt - 1);
            await sleep(delay);
        }
    }
}



app.post("/api/chat", async (req, res) => {
    try {
        const { message } = req.body;

        if (
            typeof message !== "string" ||
            !message.trim() ||
            message.length > 2000
        ) {
            return res.status(400).json({
                error: "A valid message is required",
            });
        }

        console.log("User message:", message);

        const reply = await generateWithRetry(message);

        res.json({ reply });

    } catch (error) {
        console.error("Gemini API Error:", error);

        const status = error.status;

        if (status === 503) {
            return res.status(503).json({
                error: "Gemini is busy. Please try again later.",
            });
        }

        if (status === 429) {
            return res.status(429).json({
                error: "API rate limit reached. Try again later.",
            });
        }

        res.status(500).json({
            error: "Unable to generate an AI response.",
        });
    }
});


app.listen(process.env.PORT || 5000, () => {
    console.log("Backend server running");
});
