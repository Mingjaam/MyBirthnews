import React, { useState } from 'react';
import styled from 'styled-components';
import axios from 'axios';
import { format } from 'date-fns';

// ===== 레이아웃 컴포넌트 =====
const AppContainer = styled.div`
  width: 100%;
  max-width: 390px;  // 기본 모바일 크기
  margin: 0 auto;
  font-family: 'GowunDodum', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  background-color:rgb(254, 243, 215); // 연한 노란색/갈색 배경 (재생 종이 느낌)
  height: 100vh;
  overflow: auto;
  padding: 0 16px;

  @media (min-width: 400px) {
    max-width: 600px;
  }
`;

const Header = styled.div`
  padding: 20px 20px;
  border-bottom: 1px solid #e5e8eb;
`;

const MainContent = styled.div`
  padding: 20px;
`;

const Title = styled.h1`
  font-size: 24px;
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
  }
  
  &::-webkit-datetime-edit {
    padding: 0;
  }
  
  &::-webkit-date-and-time-value {
    min-height: 1.5em;
  }
  
  &:focus {
    outline: none;
    border-color: #000;
    background-color: #fff;
  }
`;

// ===== 카드 컴포넌트 =====
const CardGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 24px;
  width: 100%;
`;

const CardRow = styled.div`
  display: flex;
  gap: 16px;
  width: 100%;
`;

const Card = styled.div<{ clickable?: boolean; type?: string }>`
  background: #faf6ed; // 연한 노란색/갈색 카드 배경 (재생 종이 느낌)
  border-radius: 16px;
  padding: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  // 클릭 가능 여부에 따라 마우스 커서를 설정합니다.
  cursor: ${props => props.clickable ? 'pointer' : 'default'};
  // 카드의 flex 속성을 설정합니다. 카드의 타입에 따라 flex 값이 다릅니다.
  flex: ${props => {
    // 뉴스 타입의 경우 flex 값을 1 1 100%로 설정합니다.
    if (props.type === 'news') return '1 1 100%'; // 뉴스 타입의 경우 flex 값을 1 1 100%로 설정합니다.
    // 날씨 타입의 경우 flex 값을 1 1 50%로 설정합니다.
    if (props.type === 'weather-type') return '1 1 50%';
    // 빌보드 타입의 경우 flex 값을 1 1 50%로 설정합니다.
    if (props.type === 'billboard') return '1 1 50%';
    // 기본적으로는 flex 값을 1 1 50%로 설정합니다.
    return '1 1 50%';
  }};
  // 카드의 높이를 설정합니다. 카드의 타입에 따라 높이 값이 다릅니다.
  height: ${props => {
    if (props.type === 'weather') return '90px';
    if (props.type === 'weather-type') return '150px';
    if (props.type === 'billboard') return '310px';
    if (props.type === 'news') return '200px';
    if (props.type === 'birthday') return '200px';
    return '250px';
  }};

  @media (min-width: 400px) {
    padding: 16px;
  }
`;

const CardTitle = styled.h3<{ type?: string }>`
  font-size: 20px;
  font-weight: 600;
  color: #000;
  margin: 0;
  text-align: left;
  display: flex;
  align-items: center;
  gap: 8px;

  @media (min-width: 400px) {
    font-size: 24px;
  }
`;

const CardContent = styled.p<{ type?: string; itemCount?: number }>`
  font-size: ${props => {
    const baseFontSize = props.type === 'birthday' ? 8 : 8;
    const itemCount = props.itemCount || 1;
    return `${Math.max(baseFontSize - (itemCount - 1) * 0.5, 12)}px`;
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
  background-color: #f0e9d9; // 연한 노란색/갈색 배경 (재생 종이 느낌)
  padding: 8px;
  border-radius: 8px;

  @media (min-width: 600px) {
    font-size: ${props => {
      const baseFontSize = props.type === 'birthday' ? 36 : 18;
      const itemCount = props.itemCount || 1;
      return `${Math.max(baseFontSize - (itemCount - 1) * 0.5, 16)}px`;
    }};
    padding: 12px;
  }
`;

const BirthdayContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  height: 100%;
  font-weight: 700;
  font-size: 24px;
  line-height: 1.5;
  padding-left: 12px;

  @media (min-width: 400px) {
    font-size: 24px;
  }
`;

const WeatherValue = styled.div`
  font-size: 28px;
  font-weight: 600;
  text-align: left;
  margin-top: 0;
  padding-top: 0;

  @media (min-width: 400px) {
    font-size: 33px;
  }
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

interface WeatherData {
  temperature: number;
  weatherType: string;
}

interface WeatherTypeData {
  weatherType: string;
}

const SearchButton = styled.button`
  width: 50%;
  padding: 16px;
  font-size: 18px;
  background-color: #d4c4a8; // 연한 노란색/갈색 버튼 배경 (재생 종이 느낌)
  color: white;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  margin: 0 auto 24px auto;
  font-weight: 600;
  display: block;

  &:hover {
    background-color: #c0b090; // 호버 시 약간 더 진한 노란색/갈색
  }
`;


const RefreshButton = styled.button`
  background: none;
  border: none;
  color: #666;
  font-size: 12px;
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 4px;
  margin-left: auto;
  white-space: nowrap;
  
  &:hover {
    background-color: #f0f0f0;
  }
`;

function App() {
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [billboardData, setBillboardData] = useState<BillboardSong[]>([]);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherType, setWeatherType] = useState<WeatherTypeData | null>(null);
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
      // 날짜 파싱
      const dateObj = new Date(selectedDate);
      const year = dateObj.getFullYear();
      
      // 뉴스 데이터 가져오기 (1987-1997년은 KBS, 그 외는 SBS)
      let newsResponse;
      if (year >= 1987 && year <= 1997) {
        newsResponse = await axios.get(`https://mybirthnews.onrender.com/kbs-news?date=${selectedDate}`);
      } else {
        newsResponse = await axios.get(`https://mybirthnews.onrender.com/sbs-news?date=${selectedDate}`);
      }
      
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
      const weatherData = weatherResponse.data;
      setWeather(weatherData);

      // 날씨 타입 데이터 가져오기
      const weatherTypeResponse = await axios.get(`https://mybirthnews.onrender.com/weather-type?date=${selectedDate}`);
      setWeatherType(weatherTypeResponse.data);
      
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

  return (
    <AppContainer>
      <Header>
        <Title>당신은 기억 못 하는<br/>그 날 이야기</Title>
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
            <CardRow>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: '1 1 50%' }}>
                <Card type="birthday">
                  <CardTitle type="birthday">그 날은</CardTitle>
                  {selectedDate && (
                    <BirthdayContent>
                      {formatBirthday(selectedDate).year}년<br/>
                      {formatBirthday(selectedDate).month} {formatBirthday(selectedDate).day}일<br/>
                      {formatBirthday(selectedDate).weekday}
                    </BirthdayContent>
                  )}
                </Card>
                {weatherType && (
                  <Card type="weather-type">
                    <CardTitle type="weather-type">그날의 날씨는</CardTitle>
                    <WeatherValue>{weatherType.weatherType}</WeatherValue>
                  </Card>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: '1 1 50%' }}>
                {weather && (
                  <Card type="weather">
                    <CardTitle type="weather">그날의 온도는</CardTitle>
                    <WeatherValue>{weather.temperature}°C</WeatherValue>
                  </Card>
                )}
                <Card type="billboard">
                  <CardTitle type="billboard">
                    그날의 노래는
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
              </div>
            </CardRow>

            <CardRow>
              <Card type="news">
                <CardTitle type="news">
                  그날의 기사
                  <RefreshButton onClick={() => {
                    // 날짜 파싱
                    const dateObj = new Date(selectedDate);
                    const year = dateObj.getFullYear();
                    
                    // 1987-1997년은 KBS, 그 외는 SBS
                    const apiUrl = (year >= 1987 && year <= 1997) 
                      ? `https://mybirthnews.onrender.com/kbs-news?date=${selectedDate}`
                      : `https://mybirthnews.onrender.com/sbs-news?date=${selectedDate}`;
                    
                    axios.get(apiUrl)
                      .then(response => {
                        const newsData = Array.isArray(response.data) ? response.data : [];
                        const randomNews = newsData
                          .sort(() => Math.random() - 0.5)
                          .slice(0, 3)
                          .map(item => ({
                            title: item.title || '',
                            link: item.link || '#'
                          }));
                        setNewsItems(randomNews);
                      })
                      .catch(error => {
                        console.error('Error fetching news:', error);
                      });
                  }}>
                    ↻ 다른 기사
                  </RefreshButton>
                </CardTitle>
                {newsItems.map((item, index) => (
                  <CardContent 
                    key={index}
                    type="news"
                    itemCount={newsItems.length}
                  >
                    {item.title}
                  </CardContent>
                ))}
              </Card>
            </CardRow>
          </CardGrid>
        )}
      </MainContent>
    </AppContainer>
  );
}

export default App;
