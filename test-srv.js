const dns = require("dns").promises;

async function test() {
  try {
    const result = await dns.resolveSrv("_mongodb._tcp.cluster0.tskix.mongodb.net");
    console.log("SRV Records:", result);
  } catch (err) {
    console.error("Error:", err);
  }
}

test();
