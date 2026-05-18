import fetch from "node-fetch";

async function run() {
  const res = await fetch("http://localhost:3000/api/admin/reports/7e5092b8-209a-4625-ab37-40006a7a3198/export", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password: "password", username: "admin" })
  });

  const text = await res.text();
  console.log("STATUS:", res.status, text);
}
run();
