import express from "express";
import axios from "axios";

const app = express();
const router = express.Router();
const port = process.env.PORT || 3333;

app.use(express.json());
app.use(express.raw({ type: "application/vnd.custom-type" }));
app.use(express.text({ type: "text/html" }));

/**
 * @description - This is a function for capitalize
 * @param {string} str - This is a string
 * @returns {string} - This is a string
 * @example
 * capitalize('hello') // returns 'Hello'
 * capitalize('hello world') // returns 'Hello World'
 */

function capitalize(str: string) {
  return str.toLowerCase().split(" ").map(word => word[0].toUpperCase() + word.slice(1)).join(" ");
}

router.post("/webhook", async (req, res) => {
  const data = req.body;

  const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL || "";

  if (!DISCORD_WEBHOOK_URL || DISCORD_WEBHOOK_URL === "") res.status(500).send("No Discord Webhook URL");

  if (!data.status || !data.service) res.status(500).send("No status or service");

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
    title: `${data.project.name}`,
    description: `${data.project.description}`,
    fields: [
      {
        name: "Status",
        value: `${capitalize(data.status)}`,
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

  await axios.post(DISCORD_WEBHOOK_URL, payload).catch(err => {
    console.log(err);
  });

  res.status(200).send("OK");

})

router.get("/", (req, res) => {
  res.send("Hello World!");
})

app.use("/", router);

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
