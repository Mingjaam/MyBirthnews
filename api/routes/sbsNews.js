const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");

const router = express.Router();

router.get("/", async (req, res) => {
  const { date } = req.query; // 'YYYY-MM-DD'
  if (!date) return res.status(400).send("Missing date");

  try {
    const formattedDate = date.replace(/-/g, "");
    const url = `https://news.sbs.co.kr/news/newsSection.do?sectionCode=NEWS&date=${formattedDate}`;

    const { data } = await axios.get(url);
    const $ = cheerio.load(data);
    const articles = [];

    $(".news_list .mTit a").each((i, el) => {
      const title = $(el).text().trim();
      const link = "https://news.sbs.co.kr" + $(el).attr("href");
      articles.push({ title, link });
    });

    res.json(articles);
  } catch (err) {
    res.status(500).json({ error: "크롤링 실패", details: err.message });
  }
});

module.exports = router;
