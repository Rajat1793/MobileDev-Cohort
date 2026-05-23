import express from "express";
import cors from "cors";
import { db } from "./lib/db.js";

const app = express();
app.use(cors({origin: "*"})); // Allow requests from Expo dev server
app.use(express.json());

app.get("/api/users", async (req, res) => {
  try {
    const { rows } = await db.execute("SELECT id, name, email FROM user_data");
    res.json(rows);
  } catch (err) {
    console.error("Database error:", err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
