const express = require('express');
const cors=require("cors");
const app = express();
app.use(express.json());

app.use(
    cors({
        origin:"*",
        credentials:true,
    })
)


const chatbotRoutes=require("./Routes/chatbot");
const paymentRoutes=require("./Routes/payment");
app.use("/api",chatbotRoutes)
app.use("/api",paymentRoutes)

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
