const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
async function run() {
  try {
    const models = await genAI.getGenerativeModel({ model: "gemini-3.8-flash" });
    console.log("chat works");
  } catch (e) {
    console.log(e);
  }
}
run();
