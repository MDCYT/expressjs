import bodyParser from "body-parser";
import express from "express";
import fetch from "node-fetch";

if(process.env.ENV !== "production") {
  require("dotenv").config();
}

const app = express();
const router = express.Router();
const port = process.env.PORT || 3333;

app.use(bodyParser.json());
app.use(bodyParser.raw({ type: "application/vnd.custom-type" }));
app.use(bodyParser.text({ type: "text/html" }));

router.post("/webhook", async (req, res) => {
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
      inline?: boolean;
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
    description: `\`\`\`json\n${JSON.stringify(data, null, 2)}\`\`\``,
    fields: [
      {
        name: "Status",
        value: `${data.status}`,
        inline: true
      },
      {
        name: "Service",
        value: `${data.service.name}`,
        inline: true
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
    embeds: [embed],
    avatar_url: data.deployment.creator.avatar,
  }

  await fetch(DISCORD_WEBHOOK_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  }).then(res => console.log(res.json()))

  res.status(200).send("OK");

})

router.get("/", (req, res) => {
  res.send("Hello World!");
})

app.use("/", router);

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
