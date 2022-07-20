import bodyParser from "body-parser";
import express from "express";
import axios from "axios";

if(process.env.ENV !== "production") {
  require("dotenv").config();
}

const app = express();
const port = process.env.PORT || 3333;

app.use(bodyParser.json());
app.use(bodyParser.raw({ type: "application/vnd.custom-type" }));
app.use(bodyParser.text({ type: "text/html" }));

app.post("/weebhook", async (req, res) => {
  const data = req.body;
  const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL || "";

  if(!DISCORD_WEBHOOK_URL || DISCORD_WEBHOOK_URL === "") res.status(500).send("No Discord Webhook URL");

  if(!data.status || !data.service) res.status(500).send("No status or service");


  interface embed {
    title: string;
    description?: string;
    fields?: Array<{
      name: string;
      value: string;
    }>;
    timestamp?: string;
    author?: {
      name: string;
      icon_url?: string;
      url?: string;
    };
    color?: number;
  }

  let embed = <embed>{
    title: `${data.name}`,
    fields: [
      {
        name: "Status",
        value: `${data.status}`,
      },
      {
        name: "Service",
        value: `${data.service.name}`,
      }
    ],
    timestamp: data.timestamp,
    author: {
      name: data.deployment.creator.name,
      icon_url: data.deployment.creator.avatar
    }
  }

  if (data.status === "SUCCESS") embed = { ...embed, color: 0x00ff00 };
  if (data.status === "BUILDING") embed = { ...embed, color: 0xffff00 };
  if (data.status === "DEPLOYING") embed = { ...embed, color: 0xffff00 };
  if (data.status === "CRASHED") embed = { ...embed, color: 0xff0000 };

  const payload = {
    embeds: [embed]
  }

  await axios.post(DISCORD_WEBHOOK_URL, payload);

  res.status(200).send("OK");

})

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
