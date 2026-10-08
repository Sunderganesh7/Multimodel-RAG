const http = require("http");

async function run() {
  console.log("1. Ingesting text...");
  const ingestPayload = JSON.stringify({
    text: "The main topic of this document is advanced machine learning.",
    sourceType: "doc",
    sourceName: "test.txt"
  });

  const ingestReq = http.request({
    hostname: "localhost",
    port: 3000,
    path: "/ingestText",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(ingestPayload)
    }
  }, (res) => {
    let data = "";
    res.on("data", chunk => data += chunk);
    res.on("end", async () => {
      console.log("Ingest Response Status:", res.statusCode);

      console.log("\n2. Chatting...");
      const chatPayload = JSON.stringify({
        message: "What is the main topic of this document?"
      });

      const startTime = Date.now();
      const chatReq = http.request({
        hostname: "localhost",
        port: 3000,
        path: "/chatRag",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(chatPayload)
        }
      }, (res2) => {
        let data2 = "";
        res2.on("data", chunk => data2 += chunk);
        res2.on("end", () => {
          const duration = (Date.now() - startTime) / 1000;
          console.log(`Chat Response Status: ${res2.statusCode} (took ${duration.toFixed(2)}s)`);
          console.log("Chat Response Body:", data2.slice(0, 200) + "...");
        });
      });
      
      chatReq.on("error", (e) => console.error("Chat Error:", e.message));
      chatReq.write(chatPayload);
      chatReq.end();
    });
  });

  ingestReq.on("error", (e) => console.error("Ingest Error:", e.message));
  ingestReq.write(ingestPayload);
  ingestReq.end();
}

run();
