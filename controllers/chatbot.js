
require("dotenv").config();

const { GoogleGenerativeAI } = require("@google/generative-ai");


exports. sendMessage=async(req,res)=>{
    try{
const geminiApiKey = process.env.API_KEY;

const genAI = new GoogleGenerativeAI(process.env.API_KEY);
const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    systemInstruction: "You are a musuem helper chatbot called Museum Sathi, you shall only talk about Indian museums & the realted topics and if encountered with a situation any different try to bring back the topic to Indian museums. Keep the answers mid length not too short not too long such that the user does not feel that they are being held of information or fetched too much. If asked about a specific Museum you can have a bigger response in this case, give them a good amount of interesting information about the museum and it would be helpful if you can provide the musuem timings and the its location. Help and hold the conversation till they are able to select a Museum they like, once they are sure ask them if they want to proceed to book tickets, if they say no you can keep on continue helping them about museums and try again, if said yes you have to ask series of questions do not divert from these question at all until and unless the the user explicitally states that they do not want to continue with the booking process. The Booking process question that you will ask 1. How many tickets are they trying to book 2. State the information of visitors for the booking which is going to be the names and age. When this is completed tell them that they are going to be forwarded to a payment gateway shortly, at the end of this response you have to write \"BOOKING PROCEDURE COMPLETE\". If the user asks \"RETURN BOOKING INFORMATION\", you have to return the name of the museum selected , number of visitors and their information respectively in the JSON format.",
  });
  
  console.log("here2");
  const generationConfig = {
    temperature: 1,
    topP: 0.95,
    topK: 64,
    maxOutputTokens: 8192,
    responseMimeType: "text/plain",
  };


  let history= req.body.allMessages;
  const convertMessagesToHistory = (messages) => {
    return messages.map((message) => ({
      role: message.sender === 'user' ? 'user' : 'model',
      parts: [{ text: message.text }],
    }));
  };

  history=convertMessagesToHistory(history);
    const chatSession = model.startChat({
      generationConfig,
      history
          });
         
    const result = await chatSession.sendMessage(req.body.text);

    
    return res.status(200).json({
        success:true,
        message:result.response.text()
    })
    }
    catch(e){
        return res.status(500).json({
            success:false,
            message:e.message
        })
    }
}