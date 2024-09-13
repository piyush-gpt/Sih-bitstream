
const express = require("express")
const router = express.Router()

const { capturePayment, verifyPayment, sendPaymentSuccessEmail } = require("../controllers/Payment")
router.post("/capturePayment",capturePayment)
router.post("/verifyPayment", verifyPayment)
router.post("/sendPaymentSuccessEmail", sendPaymentSuccessEmail);

module.exports = router