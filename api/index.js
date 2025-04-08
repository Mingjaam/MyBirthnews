const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");
const cors = require("cors");
const fs = require("fs");
const csv = require("csv-parser");
const puppeteer = require("puppeteer");


const app = express();
const PORT = process.env.PORT || 4000;

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
            temperature: data["tem"]
          });
        }
      })
      .on("end", () => {
        if (results.length > 0) {
          res.json(results[0]);
        } else {
          res.status(404).send("날씨 데이터 없음");
        }
      });
  });

// ✅ 3. 날씨 타입 API
app.get("/weather-type", (req, res) => {
    const { date } = req.query;
    if (!date) return res.status(400).send("date 파라미터가 필요합니다 (예: 2002-06-27)");
  
    const parts = date.split("-");
    const targetDate = `${parseInt(parts[0])}.${parseInt(parts[1])}.${parseInt(parts[2])}`;
  
    const results = [];
  
    fs.createReadStream("data/weather_plus.csv")
      .pipe(csv())
      .on("data", (data) => {
        if (data["date"] === targetDate) {
          const snow = parseFloat(data["snow"] || 0);
          const rain = parseFloat(data["rain"] || 0);
          const fog = parseFloat(data["fog"] || 0);
          const wind = parseFloat(data["wind"] || 0);
          const sun = parseFloat(data["sun"] || 0);

          let weatherType = "맑음";
          if (snow > 0) weatherType = "눈";
          else if (rain > 0) weatherType = "비";
          else if (fog >= 0.2) weatherType = "안개";
          else if (wind >= 4.0) weatherType = "강풍";
          else if (sun < 2) weatherType = "흐림";

          results.push({ weatherType });
        }
      })
      .on("end", () => {
        if (results.length > 0) {
          res.json(results[0]);
        } else {
          res.status(404).send("날씨 데이터 없음");
        }
      });
  });


// ✅ 4. 빌보드 차트 크롤링 (제목만)
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

// ✅ 5. KBS 뉴스 크롤링 (1987-1997년)
app.get('/kbs-news', async (req, res) => {
  // CORS 헤더 추가
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET');
  
  const { date } = req.query;
  const currentTime = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });
  
  if (!date) {
    console.log(`[${currentTime}] ❌ KBS 뉴스 요청 실패: 날짜 미제공`);
    return res.status(400).json({ error: '날짜를 YYYY-MM-DD 형식으로 제공해주세요.' });
  }
  
  // 날짜 파싱
  const dateObj = new Date(date);
  const year = dateObj.getFullYear();
  
  // 1987년 이전 날짜 체크
  if (year < 1987) {
    console.log(`[${currentTime}] ❌ KBS 뉴스 요청 실패: ${year}년은 지원하지 않음`);
    return res.status(400).json({ error: 'KBS 뉴스는 1987년부터의 데이터만 제공합니다.' });
  }
  
  // KBS 뉴스 URL 형식에 맞게 날짜 변환 (YYYYMMDD)
  const formattedDate = date.replace(/-/g, '');
  const url = `https://news.kbs.co.kr/news/pc/program/program.do?bcd=0001&ref=pGnb#${formattedDate}`;
  
  try {
    console.log(`[${currentTime}] 🔍 KBS 뉴스 크롤링 시작: ${date}`);
    
    // Puppeteer로 브라우저 실행
    const browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-extensions',
        '--disable-software-rasterizer',
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process'
      ],
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || null,
      timeout: 60000 // 브라우저 실행 타임아웃 60초로 설정
    });
    
    const page = await browser.newPage();
    
    // 페이지 로드 타임아웃 설정
    await page.setDefaultNavigationTimeout(60000); // 60초로 설정
    
    // User-Agent 설정
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    
    // 페이지 이동
    await page.goto(url, { 
      waitUntil: 'networkidle0',
      timeout: 60000 // 페이지 로드 타임아웃 60초로 설정
    });
    
    // 페이지 내용 가져오기
    const content = await page.content();
    
    // 브라우저 종료
    await browser.close();
    
    const $ = cheerio.load(content);
    
    // 제목 추출
    const articles = [];
    const seenTitles = new Set(); // 중복 제목 체크를 위한 Set
    
    // 여러 선택자 시도
    const selectors = [
      'p.title',
      '.txt-wrapper .title',
      '.box-content .title',
      'a.box-content .title',
      '.box-contents a.box-content .title'
    ];
    
    for (const selector of selectors) {
      $(selector).each((_, el) => {
        const title = $(el).text().trim();
        // 불필요한 텍스트 필터링
        if (title && 
            !title.includes('기상정보') && 
            !title.includes('뉴스') && 
            !title.includes('재생목록') && 
            !title.includes('공유하기') &&
            !title.includes('추천 인기 키워드') &&
            !title.includes('간추린 단신') &&
            !title.startsWith('[') && // [단독], [속보] 등으로 시작하는 제목 제외
            !seenTitles.has(title)) { // 중복 제목 제외
          articles.push({ title });
          seenTitles.add(title); // 제목을 Set에 추가
        }
      });
      
      if (articles.length > 0) {
        console.log(`[${currentTime}] ✅ KBS 뉴스 크롤링 성공: ${articles.length}개 기사 발견`);
        break;
      }
    }
    
    // 최대 10개의 기사만 반환
    const limitedArticles = articles.slice(0, 10);
    
    if (limitedArticles.length === 0) {
      console.log(`[${currentTime}] ❌ KBS 뉴스 크롤링 실패: 기사 없음`);
      return res.status(404).json({ message: '해당 날짜의 KBS 뉴스를 찾을 수 없습니다.' });
    }
    
    res.json(limitedArticles);
  } catch (err) {
    console.error(`[${currentTime}] ❌ KBS 뉴스 크롤링 에러:`, err);
    
    // 에러 상세 정보 로깅
    if (err.response) {
      console.error('응답 상태:', err.response.status);
      console.error('응답 헤더:', err.response.headers);
    } else if (err.request) {
      console.error('요청 실패:', err.request);
    } else {
      console.error('에러 메시지:', err.message);
    }
    
    res.status(500).json({ error: 'KBS 뉴스 크롤링 실패', detail: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`✅ API 서버 실행 중 → http://localhost:${PORT}`);
});