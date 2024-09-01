const express = require('express');
const axios = require('axios');
require("dotenv").config();
const app = express();
app.use(express.json());

const { GoogleGenerativeAI } = require("@google/generative-ai");
const geminiApiKey = process.env.API_KEY;

const genAI = new GoogleGenerativeAI(process.env.API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Handle webhook requests from Dialogflow
app.post('/webhook', async (req, res) => {
    const intentName = req.body.queryResult.intent.displayName;
    const queryText = req.body.queryResult.queryText;

    if (intentName === 'Ticket Booking') {
        // Handle ticket booking separately
        const responseText = 'Ticket booking will be handled here.';
        return res.json({ fulfillmentText: responseText });
    } else {
        // Forward the request to Gemini 1.5 Slash for general inquiries
        try {
           
            const result = await model.generateContent(queryText);
            const geminiReply = result.response.text();
            return res.json({ fulfillmentText: geminiReply });

        } catch (error) {
            console.error('Error with Gemini API:', error);
            return res.json({ fulfillmentText: 'Sorry, there was an error processing your request.' });
        }
    }
});

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
