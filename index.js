const express = require("express");
const body_parser = require("body-parser");
const axios = require("axios");
const aam = require("./mango");
require('dotenv').config();

const app = express().use(body_parser.json());
const token = process.env.TOKEN;
const mytoken = process.env.MYTOKEN;
const userStates = {};

app.listen(2120 || process.env.PORT, () => {
    console.log("webhook is listening");
});

app.get("/webhook", (req, res) => {
    let mode = req.query["hub.mode"];
    let challange = req.query["hub.challenge"];
    let token = req.query["hub.verify_token"];

    if (mode && token) {
        if (mode === "subscribe" && token === mytoken) {
            res.status(200).send(challange);
        } else {
            res.status(403);
        }
    }
});

app.post("/webhook", async (req, res) => {
    let body_param = req.body;

    console.log(JSON.stringify(body_param, null, 2));

    if (body_param.object) {
        if (body_param.entry &&
            body_param.entry[0].changes &&
            body_param.entry[0].changes[0].value.messages &&
            body_param.entry[0].changes[0].value.messages[0]
        ) {
            let phon_no_id = body_param.entry[0].changes[0].value.metadata.phone_number_id;
            let from = body_param.entry[0].changes[0].value.messages[0].from;
            let msg_body = body_param.entry[0].changes[0].value.messages[0].text.body;
            console.log("phone number " + phon_no_id);
            console.log("from " + from);
            console.log("body param " + msg_body);
            let userState = userStates[from] || { inProgress: false };

            try {
                // Get credit based on phone number
                const credit = await aam(parseInt(from)); // assuming 'from' is a phone number

                // Handle user's response based on the conversation state
                let responseMessage;

                if (!userState.inProgress) {
                    // Initial state: Provide options
                    responseMessage = "Welcome! How can I assist you today? Choose an option:\n1. Book a ticket\n2. Upcoming offers\n3. My purchases";
                    userState.inProgress = true;
                } else {
                    // User has responded, handle based on the chosen option
                    if (msg_body === "1") {
                        // Option 1: Send an image
                        responseMessage = "show this qr code";
                        // Add logic to send an image through WhatsApp
                        await sendImageThroughWhatsApp(from);
                    } else {
                        // Handle other options as before
                        switch (msg_body) {
                            case "2":
                                responseMessage = "Upcoming offers information";
                                break;
                            case "3":
                                responseMessage = "Your purchase history";
                                break;
                            default:
                                responseMessage = "Invalid option. Please choose a valid option.";
                                break;
                        }
                    }

                    // Reset the conversation state after handling the user's response
                    userState.inProgress = false;
                }

                // Update user's state
                userStates[from] = userState;

                axios({
                    method: "POST",
                    url: "https://graph.facebook.com/v13.0/" + phon_no_id + "/messages?access_token=" + token,
                    data: {
                        messaging_product: "whatsapp",
                        to: from,
                        text: {
                            body: responseMessage
                        }
                    },
                    headers: {
                        "Content-Type": "application/json"
                    }
                });

                res.sendStatus(200);
            } catch (error) {
                console.error('Error:', error);
                res.sendStatus(500);
            }
        } else {
            res.sendStatus(404);
        }
    }
});

app.get("/", (req, res) => {
    res.status(200).send("hello this is webhook setup");
});

// Function to send an image through WhatsApp
async function sendImageThroughWhatsApp(to) {
    let data = JSON.stringify({
        "messaging_product": "whatsapp",
        "recipient_type": "individual",
        "to": to,
        "type": "image",
        "image": {
            "link": "https://images.ctfassets.net/hrltx12pl8hq/28ECAQiPJZ78hxatLTa7Ts/2f695d869736ae3b0de3e56ceaca3958/free-nature-images.jpg?fit=fill&w=1200&h=630"
        }
    });

    let config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: 'https://graph.facebook.com/v18.0/193943017132708/messages',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer EAASgYEdNn8wBOwkvR3zdETU42VZBM0VsYbf4JxxTgBy13FpIcCydmZCCIl8YOwLgMli8PZBZAQK7ZBltmkuH83edTlSWrwZAUWaZAFfugFIKfyB4eIoZAUOuy3aOegdGtRgvewOUEj6uOTfa83mNCVVTVOf6rIrVmT0NCZBxHaZAzPNGvgBby0HTHjZC22JvpaWZAgfQzyTpS2wnansfXpygP4l3GhEZB9acZD'
        },
        data: data
    };

    try {
        const response = await axios.request(config);
        console.log(JSON.stringify(response.data));
    } catch (error) {
        console.log(error);
    }
}
