const express = require('express');

const app = express();
app.use(express.json());



const chatbotRoutes=require("./Routes/chatbot");
app.use("/api",chatbotRoutes)
// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
