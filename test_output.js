const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

async function run() {
  const model = genAI.getGenerativeModel({ model: "gemini-embedding-2" });
  try {
    const res = await model.batchEmbedContents({ requests: [{ content: { role: "user", parts: [{ text: "hi" }] } }] });
    console.log("batchEmbed:", JSON.stringify(res, null, 2));

    const res2 = await model.embedContent({ content: { role: "user", parts: [{ text: "hi" }] } });
    console.log("embed:", JSON.stringify(res2, null, 2));

  } catch(e) {
    console.error(e);
  }
}
run();
