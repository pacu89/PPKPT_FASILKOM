import FormData from "form-data";
import fs from "fs";
import fetch from "node-fetch";

async function run() {
  const form = new FormData();
  form.append("reporter_name", "Test");
  form.append("reporter_contact", "Test");
  form.append("reporter_identity_number", "Test");
  form.append("is_anonymous", "false");
  form.append("victim_name", "Test");
  form.append("category", "Test");
  form.append("incident_date", "Test");
  form.append("incident_location", "Test");
  form.append("chronology", "Test");
  form.append("evidence", Buffer.from("test block"), { filename: "test.png", contentType: "image/png" });

  const res = await fetch("http://localhost:3000/api/reports", {
    method: "POST",
    body: form
  });

  const text = await res.text();
  console.log("STATUS:", res.status, text);
}
run();
