const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");
const cors = require("cors");
const fs = require("fs");
const csv = require("csv-parser");


const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

app.get("/", (req, res) => {
  res.send("Hello from MyBirthNews API!");
});


// ✅ 1. SBS 뉴스 크롤링 (제목 + 링크 + 카테고리)
app.get('/sbs-news', async (req, res) => {
    const { date } = req.query;
  
    if (!date) {
      return res.status(400).json({ error: '날짜를 YYYY-MM-DD 형식으로 제공해주세요.' });
    }
  
    const formattedDate = date.replace(/-/g, ''); // ex) 2025-04-05 → 20250405
    const url = `https://news.sbs.co.kr/news/programMain.do?prog_cd=R1&broad_date=${formattedDate}`;
  
    try {
      const { data } = await axios.get(url);
      const $ = cheerio.load(data);
      const articles = [];
  
      $('p.desc').each((_, el) => {
        const category = $(el).find('em.cate').text().trim();
        const title = $(el).find('strong').text().trim();
        const link = $(el).parent().find('a').attr('href');
        if (title) {
          articles.push({ category, title, link });
        }
      });
  
      if (articles.length === 0) {
        return res.status(404).json({ message: '해당 날짜의 뉴스를 찾을 수 없습니다.' });
      }
  
      res.json(articles);
    } catch (err) {
      res.status(500).json({ error: '크롤링 실패', detail: err.message });
    }
  });


// ✅ 2. 날씨 정보 (CSV 기반)
app.get("/weather", (req, res) => {
    const { date } = req.query;
    if (!date) return res.status(400).send("date 파라미터가 필요합니다 (예: 2002-06-27)");
  
    // 날짜를 CSV 형식과 맞게 변환: 2002-06-27 → 2002.6.27
    const parts = date.split("-");
    const targetDate = `${parseInt(parts[0])}.${parseInt(parts[1])}.${parseInt(parts[2])}`;
  
    const results = [];
  
    fs.createReadStream("data/seoul_weather.csv")
      .pipe(csv())
      .on("data", (data) => {
        if (data["date"] === targetDate) {
          results.push({
            temperature: data["tem"],
          });
        }
      })
      .on("end", () => {
        if (results.length > 0) {
          res.json(results[0]); // 결과 하나만 보여주자
        } else {
          res.status(404).send("날씨 데이터 없음");
        }
      });
  });


// ✅ 3. 빌보드 차트 크롤링 (제목만)
app.get("/billboard", async (req, res) => {
  const { date } = req.query;
  if (!date) return res.status(400).send("date 파라미터가 필요합니다 (예: 2002-06-27)");

  try {
    const url = `https://www.billboard.com/charts/hot-100/${date}`;
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);
    const songs = [];

    $("li.o-chart-results-list__item h3").each((i, el) => {
      const title = $(el).text().trim();
      if (title) songs.push({ rank: i + 1, title });
    });

    res.json({ date, songs });
  } catch (err) {
    res.status(500).send("빌보드 크롤링 실패: " + err.message);
  }
});


app.listen(PORT, () => {
  console.log(`✅ API 서버 실행 중 → http://localhost:${PORT}`);
});
