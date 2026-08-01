import express from "express";
import { chatWithAI } from "../controllers/chat.controller.js";
import auth from "../middleware/auth.js";

const router = express.Router();

// Protected route
router.post("/", auth, chatWithAI);

// Test route to list available models
router.get('/test-models', async (req, res) => {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`
    );
    const data = await response.json();
    
    console.log("Full API Response:", JSON.stringify(data, null, 2));
    
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;