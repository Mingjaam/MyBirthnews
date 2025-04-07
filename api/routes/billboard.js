const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");

const router = express.Router();

router.get("/", async (req, res) => {
  const { date } = req.query; // 'YYYY-MM-DD'
  if (!date) return res.status(400).send("Missing date");

  const url = `https://www.billboard.com/charts/hot-100/${date}`;
  try {
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);
    const results = [];

    $("li.o-chart-results-list__item h3").each((i, el) => {
      const title = $(el).text().trim();
      if (title) results.push({ rank: i + 1, title });
    });

    res.json(results.slice(0, 10)); // 상위 10개만
  } catch (err) {
    res.status(500).json({ error: "빌보드 크롤링 실패", details: err.message });
  }
});

module.exports = router;
