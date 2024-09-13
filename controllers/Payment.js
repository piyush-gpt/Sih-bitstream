const { instance } = require("../config/razorpay");
const { mailSender } = require("../Utils/mailSender");
const crypto = require("crypto");

const { GoogleGenerativeAI } = require("@google/generative-ai");
const { log } = require("console");

//initiate the razorpay order
exports.capturePayment = async (req, res) => {
  try {
  const geminiApiKey = process.env.API_KEY;

  const genAI = new GoogleGenerativeAI(process.env.API_KEY);
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    systemInstruction:
      'You are a museum helper chatbot called Museum Sathi, you shall only talk about Indian museums & the related topics and if encountered with a situation any different try to bring back the topic to Indian museums. Keep the answers mid length not too short not too long such that the user does not feel that they are being held of information or fetched too much. If asked about a specific Museum you can have a bigegr response in this case, give them a good amount of interesting information about the museum and it would be helpful if you can provide the musuem timings and the its location. Help and hold the conversation till they are able to select a Museum they like, once they are sure ask them if they want to proceed to book tickets, if they say no you can keep on continue helping them about museums and try again, if said yes you have to ask series of questions do not divert from these question at all until and unless the the user explicitally states that they do not want to continue with the booking process. The Booking process question that you will ask 1. How many tickets are they trying to book 2. State the information of visitors for the booking which is going to be the names and age of the visitos, do not proceed until all the names and ages are given from the user. Remember all the information given and after this ask it for a confirmation on the booking information. While or before confirming the booking information, do not write "BOOKING PROCEDURE COMPLETE". After the confirmation When this is completed tell them that they are going to be forwarded to a payment gateway shortly and at the end of this response you have to write \\"BOOKING PROCEDURE COMPLETE\\". If the user asks \\"RETURN BOOKING INFORMATION\\", you have to return the information in the format of key value pairs mus_name : name of the museum in the next line visitor_num : number of visitors and  in the following lines the names and ages given, the ages should be in brackets. Do not add anything else to this text only the above mentioned would do the work.  Return in json format, ,  the age should also be surround by circular brackets , Both key value pairs should be surrounded by double quotes, even the value for number of visitors should also have double quotes',
  });

  const generationConfig = {
    temperature: 1,
    topP: 0.95,
    topK: 64,
    maxOutputTokens: 8192,
    responseMimeType: "text/plain",
  };

  let history = req.body.allMessages;
  const convertMessagesToHistory = (messages) => {
    return messages.map((message) => ({
      role: message.sender === "user" ? "user" : "model",
      parts: [{ text: message.text }],
    }));
  };

  history = convertMessagesToHistory(history);
  const chatSession = model.startChat({
    generationConfig,
    history,
  });

  function extractBookingDetailsFromString(data) {
    const result = {
      museumName: null,
      visitorNum: null,
      visitors: [],
    };

    // Regular expressions to match museum name, visitor number, and visitor details
    const museumNameRegex = /"mus_name"\s*:\s*"([^"]+)"/;
    const visitorNumRegex = /"visitor_num"\s*:\s*"(\d+)"/;
    const visitorRegex = /"([^"]+)"\s*:\s*"\((\d+)\)"/g;

    // Extract museum name
    const museumNameMatch = data.match(museumNameRegex);
    if (museumNameMatch) {
      result.museumName = museumNameMatch[1].trim();
    }

    // Extract number of visitors
    const visitorNumMatch = data.match(visitorNumRegex);
    if (visitorNumMatch) {
      result.visitorNum = parseInt(visitorNumMatch[1], 10);
    }

    // Extract visitor names and ages
    let match;
    while ((match = visitorRegex.exec(data)) !== null) {
      const name = match[1].trim();
      const age = parseInt(match[2], 10);
      result.visitors.push({ name, age });
    }

    return result;
  }

  const result = await chatSession.sendMessage(req.body.text);
  let museumName;
  let visitorNum;
  let visitors;
  let mailContent;
  if (req.body.text === "RETURN BOOKING INFORMATION") {
    mailContent = extractBookingDetailsFromString(result.response.text());
    museumName = mailContent.museumName;
    visitorNum = mailContent.visitorNum;
    visitors = mailContent.visitors;
  }
  let totalAmount = 100 * visitorNum;

  const currency = "INR";
  const options = {
    amount: totalAmount * 100,
    currency,
    receipt: Math.random(Date.now()).toString(),
  };

 
    const paymentResponse = await instance.orders.create(options);
    res.json({
      success: true,
      data: paymentResponse,
      message: result.response.text(),
      mailContent: mailContent,
    });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ success: false, mesage: "Could not Initiate Order" });
  }
};

//verify the payment
exports.verifyPayment = async (req, res) => {
  const razorpay_order_id = req.body?.razorpay_order_id;
  const razorpay_payment_id = req.body?.razorpay_payment_id;
  const razorpay_signature = req.body?.razorpay_signature;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(200).json({ success: false, message: "Payment Failed" });
  }

  let body = razorpay_order_id + "|" + razorpay_payment_id;
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_SECRET)
    .update(body.toString())
    .digest("hex");

  if (expectedSignature === razorpay_signature) {
    return res.status(200).json({ success: true, message: "Payment Verified" });
  }
  return res.status(200).json({ success: "false", message: "Payment Failed" });
};

exports.sendPaymentSuccessEmail = async (req, res) => {
  try {
    const { orderId, paymentId, amount, mailContent } = req.body;

    console.log("here in mail 1");
    if (!orderId || !paymentId || !amount || !mailContent) {
      return res
        .status(400)
        .json({ success: false, message: "Please provide all the fields" });
    }
  

    let museumName = mailContent.museumName;
    let visitorNum = mailContent.visitorNum;
    let visitors = mailContent.visitors;

    const visitorDetails = visitors
      .map((visitor) => `${visitor.name} (age ${visitor.age})`)
      .join("\n");
    let text = `
      Hello,
  
      Your ticket booking for the ${museumName} has been confirmed.
  
      Number of Tickets: ${visitorNum}
  
      Visitor Information:
      ${visitorDetails}
  
      Thank you for your booking. Enjoy your visit!
  
      Best regards,
      Museum Ticketing Service
      `;

    mailSender(
      "piyushthegreat1@gmail.com",
      `Your Ticket Booking for ${museumName}`,
      text
    );

  } catch (error) {
    console.log("error in sending mail", error);
    return res
      .status(500)
      .json({ success: false, message: "Could not send email" });
  }
};
