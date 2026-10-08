const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
async function run() {
  const model = genAI.getGenerativeModel({ model: "gemini-embedding-2" });
  try {
    await model.batchEmbedContents({ requests: [{ content: { role: "user", parts: [{ text: "hi" }] } }] });
    console.log("batchEmbedContents works");
  } catch (e) {
    console.log("batchEmbedContents error", e.message);
  }
}
run();
