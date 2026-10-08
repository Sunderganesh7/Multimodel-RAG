const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
async function run() {
  const modelsToTest = ["text-embedding-004", "embedding-001", "text-embedding-005", "text-embedding-004-batch"];
  for (const m of modelsToTest) {
    try {
      const model = genAI.getGenerativeModel({ model: m });
      await model.embedContent({ content: { role: "user", parts: [{ text: "hi" }] } });
      console.log(m, "embedContent works");
    } catch (e) {
      console.log(m, "embedContent error", e.message);
    }
    
    try {
      const model = genAI.getGenerativeModel({ model: m });
      await model.batchEmbedContents({ requests: [{ content: { role: "user", parts: [{ text: "hi" }] } }] });
      console.log(m, "batchEmbedContents works");
    } catch (e) {
      console.log(m, "batchEmbedContents error", e.message);
    }
  }
}
run();
