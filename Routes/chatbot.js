const express = require("express")
const router = express.Router()

const { sendMessage } = require("../controllers/chatbot")

router.post("/chatbotMessage", sendMessage)

module.exports = router