const express = require("express")
const router = express.Router()

const { sendMessage } = require("../controllers/chatbot")

router.post("/chatbotMessage", contactUsController)

module.exports = router