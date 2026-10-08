const apiKey = process.env.GEMINI_API_KEY || "";
async function run() {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
  const data = await res.json();
  console.log(JSON.stringify(data.models.filter(m => m.supportedGenerationMethods.includes("embedContent") || m.supportedGenerationMethods.includes("batchEmbedContents")), null, 2));
}
run();
