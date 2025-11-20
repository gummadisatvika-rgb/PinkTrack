const express = require("express");
const fs = require("fs");
const cors = require("cors");
const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

const DATA_FILE = "entries.json";


function loadEntries() {
  if (!fs.existsSync(DATA_FILE)) return [];
  const data = fs.readFileSync(DATA_FILE);
  return JSON.parse(data);
}

function saveEntries(entries) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(entries, null, 2));
}
app.get("/entries", (req, res) => {
  const entries = loadEntries();
  res.json(entries);
});

app.post("/entry", (req, res) => {
  const newEntry = req.body;
  const entries = loadEntries();

  const isDuplicate = entries.some(e => e.startDate === newEntry.startDate);
  if (isDuplicate) {
    return res.status(400).json({ message: "Duplicate entry" });
  }

  entries.push(newEntry);
  saveEntries(entries);
  res.status(201).json({ message: "Entry saved" });
});

app.listen(PORT, () => {
  console.log(`🎀 PinkTrack backend running on http://localhost:${PORT}`);
});
