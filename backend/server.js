import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
app.use(cors());

// Get __dirname in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// API route
app.get("/api/data/:hour", async (req, res) => {
  const hour = req.params.hour.padStart(2, "0");
  const url = `https://a.windbornesystems.com/treasure/${hour}.json`;
  try {
    const response = await fetch(url);
    const json = await response.json();
    res.json(json);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch data" });
  }
});

// Serve frontend build
app.use(express.static(path.join(__dirname, "dist")));

// React Router fallback
app.get("/*", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
