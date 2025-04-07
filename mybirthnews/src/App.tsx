import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import axios from 'axios';
import { format } from 'date-fns';

// ===== 레이아웃 컴포넌트 =====
const AppContainer = styled.div`
  max-width: 500px;
  margin: 0 auto;
  font-family: 'GowunDodum', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  background-color: #f8f9fa;
  height: 100vh;
  overflow: auto;
`;

const Header = styled.div`
  background-color: #4285f4;
  padding: 40px 20px;
  border-radius: 30px 30px 0 0;
`;

const MainContent = styled.div`
  padding: 24px;
`;

const Title = styled.h1`
  font-size: 42px;
  font-weight: 700;
  color: #000;
  text-align: center;
  margin: 0;
`;

// ===== 입력 컴포넌트 =====
const DateLabel = styled.div`
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 12px;
`;

const DatePickerContainer = styled.div`
  margin-bottom: 24px;
`;

const DatePicker = styled.input`
  width: 100%;
  padding: 16px;
  font-size: 18px;
  border: 1px solid #e5e8eb;
  border-radius: 12px;
  background-color: #fff;
  color: #000;
  
  &:focus {
    outline: none;
    border-color: #000;
    background-color: #fff;
  }
`;

// ===== 카드 컴포넌트 =====
const CardGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-areas: 
    "birthday weather"
    "birthday billboard"
    "news news";
  gap: 16px;
  margin-bottom: 24px;
  
  @media (max-width: 640px) {
    gap: 12px;
  }
`;

const Card = styled.div<{ clickable?: boolean; type?: string }>`
  background: #fff;
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  cursor: ${props => props.clickable ? 'pointer' : 'default'};

  display: flex;
  flex-direction: column;
  justify-content: center;
  grid-area: ${props => {
    if (props.type === 'birthday') return 'birthday';
    if (props.type === 'weather') return 'weather';
    if (props.type === 'zodiac') return 'zodiac';
    if (props.type === 'billboard') return 'billboard';
    if (props.type === 'news') return 'news';
    return 'auto';
  }};

  @media (max-width: 640px) {
    padding: 12px;
    height: ${props => {
      if (props.type === 'weather') return '150px';
      if (props.type === 'billboard') return '250px';
      if (props.type === 'news') return '250px';
      if (props.type === 'birthday') return '220px';
      return '250px';
    }};
  }
`;

const CardTitle = styled.h3<{ type?: string }>`
  font-size: 24px;
  font-weight: 600;
  color: #000;
  margin-bottom: 16px;
  text-align: left;

  @media (max-width: 640px) {
    font-size: 20px;
    margin-bottom: 12px;
  }
`;

const CardContent = styled.p<{ type?: string; itemCount?: number }>`
  font-size: ${props => {
    const baseFontSize = props.type === 'birthday' ? 36 : 18;
    const itemCount = props.itemCount || 1;
    return `${Math.max(baseFontSize - (itemCount - 1) * 0.5, 16)}px`;
  }};
  color: #000;
  margin-bottom: 4px;
  line-height: 1.3;
  flex: 1;
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;
  text-align: left;
  flex-direction: column;
  position: relative;
  white-space: normal;
  word-break: keep-all;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  background-color: #f8f9fa;
  padding: 12px;
  border-radius: 8px;
  
  &:not(:last-child)::after {
    content: '';
    position: absolute;
    bottom: -2px;
    left: 0;
    right: 0;
    height: 1px;
    background-color: #e5e8eb;
  }
  
  &:last-child {
    margin-bottom: 0;
  }

  @media (max-width: 640px) {
    font-size: ${props => {
      const mobileBaseFontSize = props.type === 'birthday' ? 30 : 16;
      const itemCount = props.itemCount || 1;
      return `${Math.max(mobileBaseFontSize - (itemCount - 1) * 0.5, 14)}px`;
    }};
    margin-bottom: 4px;
    padding: 8px;
  }
`;

const BirthdayContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  height: 100%;
  font-weight: 700;
  font-size: 28px;
  line-height: 1.5;
  padding-left: 20px;
`;


const WeatherValue = styled.div`
  font-size: 60px;
  font-weight: 600;
  text-align: left;
  margin-top: 0;
  padding-top: 0;
`;

// ===== 상태 표시 컴포넌트 =====
const LoadingSpinner = styled.div`
  text-align: center;
  color: #000;
  margin: 16px 0;
`;

const ErrorMessage = styled.div`
  color: #000;
  text-align: center;
  margin: 16px 0;
  padding: 12px;
  border-radius: 8px;
  background-color: #fff;
  border: 1px solid #000;
`;

// ===== 인터페이스 =====
interface NewsItem {
  title: string;
  link: string;
}

interface BillboardSong {
  rank: number;
  title: string;
}

const SearchButton = styled.button`
  width: 50%;
  padding: 16px;
  font-size: 18px;
  background-color: #4285f4;
  color: white;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  margin: 0 auto 24px auto;
  font-weight: 600;
  display: block;

  &:hover {
    background-color: #3367d6;
  }
`;

const BillboardTitle = styled.span`
  font-size: 14px;
  color: #666;
  margin-left: 8px;
  font-weight: normal;
`;

function App() {
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [billboardData, setBillboardData] = useState<BillboardSong[]>([]);
  const [weather, setWeather] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  const handleSearch = () => {
    if (selectedDate) {
      fetchData();
    }
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // 뉴스 데이터 가져오기
      const newsResponse = await axios.get(`https://mybirthnews.onrender.com/sbs-news?date=${selectedDate}`);
      const newsData = Array.isArray(newsResponse.data) ? newsResponse.data : [];
      const randomNews = newsData
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
        .map(item => ({
          title: item.title || '',
          link: item.link || '#'
        }));
      setNewsItems(randomNews);

      // 빌보드 데이터 가져오기
      const billboardResponse = await axios.get(`https://mybirthnews.onrender.com/billboard?date=${selectedDate}`);
      const billboardData = billboardResponse.data?.songs || [];
      setBillboardData(billboardData.slice(0, 3).map((song: any) => ({
        rank: song.rank || 0,
        title: song.title || ''
      })));

      // 날씨 데이터 가져오기
      const weatherResponse = await axios.get(`https://mybirthnews.onrender.com/weather?date=${selectedDate}`);
      const temperature = weatherResponse.data?.temperature || null;
      setWeather(temperature ? parseFloat(temperature) : null);
      
      setIsDataLoaded(true);
    } catch (error) {
      console.error('Error fetching data:', error);
      if (axios.isAxiosError(error)) {
        setError(`데이터를 가져오는 중 오류가 발생했습니다: ${error.response?.status === 404 ? '데이터를 찾을 수 없습니다.' : error.message}`);
      } else {
        setError('알 수 없는 오류가 발생했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };
  
  const formatBirthday = (dateStr: string) => {
    const date = new Date(dateStr);
    const months = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];
    const weekdays = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
    
    return {
      month: months[date.getMonth()],
      day: format(date, 'd'),
      year: format(date, 'yyyy'),
      weekday: weekdays[date.getDay()]
    };
  };

  const getZodiacSign = (dateStr: string) => {
    const date = new Date(dateStr);
    const month = date.getMonth() + 1;
    const day = date.getDate();

    if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return '♈️';
    if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return '♉️';
    if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return '♊️';
    if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return '♋️';
    if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return '♌️';
    if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return '♍️';
    if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return '♎️';
    if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return '♏️';
    if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return '♐️';
    if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return '♑️';
    if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return '♒️';
    return '♓️';
  };

  return (
    <AppContainer>
      <Header>
        <Title>내 생일에는?</Title>
      </Header>
      
      <MainContent>
        <DateLabel>나의 생일은</DateLabel>
        <DatePickerContainer>
          <DatePicker
            type="date"
            value={selectedDate}
            onChange={(e) => {
              setSelectedDate(e.target.value);
              setIsDataLoaded(false);
            }}
          />
        </DatePickerContainer>
        
        {selectedDate && !isDataLoaded && (
          <SearchButton onClick={handleSearch}>
            그때의 기억 찾아보기
          </SearchButton>
        )}
        
        {loading && <LoadingSpinner>그때의 기억을 불러오는중...</LoadingSpinner>}
        {error && <ErrorMessage>{error}</ErrorMessage>}
        
        {selectedDate && !loading && !error && isDataLoaded && (
          <CardGrid>
            <Card type="birthday">
              <CardTitle type="birthday">그 날은</CardTitle>
              {selectedDate && (
                <BirthdayContent>
                  {formatBirthday(selectedDate).year}년<br/>
                  {formatBirthday(selectedDate).month} {formatBirthday(selectedDate).day}일<br/>
                  {formatBirthday(selectedDate).weekday}
                </BirthdayContent>
              )}

              <CardContent 
                type="zodiac" 
                style={{ 
                  fontSize: '72px', 
                  textAlign: 'center', 
                  justifyContent: 'center',
                  marginTop: '0',
                  padding: '0',
                  background: 'none'
                }}
              >
                {getZodiacSign(selectedDate)}
              </CardContent>
            </Card>

            {weather && (
              <Card type="weather">
                <CardTitle type="weather">그날의 온도는</CardTitle>
                <WeatherValue>{weather}°C</WeatherValue>
              </Card>
            )}

            <Card type="billboard">
              <CardTitle type="billboard">
                그날의 노래는
                <BillboardTitle>(빌보드)</BillboardTitle>
              </CardTitle>
              {billboardData.map((song, index) => (
                <CardContent 
                  key={`billboard-${index}`}
                  type="billboard"
                  itemCount={billboardData.length}
                >
                  {song.rank}. {song.title}
                </CardContent>
              ))}
            </Card>

            <Card type="news">
              <CardTitle type="news">그날의 기사</CardTitle>
              {newsItems.map((news, index) => (
                <CardContent 
                  key={index} 
                  type="news"
                  itemCount={newsItems.length}
                >
                  {news.title}
                </CardContent>
              ))}
            </Card>
          </CardGrid>
        )}
      </MainContent>
    </AppContainer>
  );
}

export default App;
