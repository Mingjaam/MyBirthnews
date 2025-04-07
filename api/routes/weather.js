const express = require("express");
const fs = require("fs");
const csv = require("csv-parser");

const router = express.Router();

router.get("/", (req, res) => {
  const { date } = req.query; // 'YYYY-MM-DD'
  if (!date) return res.status(400).send("Missing date");

  const results = [];
  fs.createReadStream("data/weather.csv")
    .pipe(csv())
    .on("data", (data) => results.push(data))
    .on("end", () => {
      const info = results.find((row) => row.date === date);
      if (!info) return res.status(404).send("날씨 정보 없음");
      res.json(info);
    });
});

module.exports = router;
