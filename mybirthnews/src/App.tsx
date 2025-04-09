import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import axios from 'axios';
import { format } from 'date-fns';
import { Analytics } from "@vercel/analytics/react"

// ===== 레이아웃 컴포넌트 =====
const AppContainer = styled.div`
  width: 100%;
  max-width: 390px;  // 기본 모바일 크기
  margin: 0 auto;
  font-family: 'GowunDodum', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  background-color:rgb(254, 243, 215); // 연한 노란색/갈색 배경 (재생 종이 느낌)
  min-height: 100vh;
  position: relative;
  padding: 0 16px;

  @media (min-width: 400px) {
    max-width: 500px;
  }
`;

const Header = styled.div`
  padding: 20px 20px;
  border-bottom: 1px solid #e5e8eb;
`;

const MainContent = styled.div`
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  min-height: calc(100vh - 100px);
  overflow-y: auto;
  padding-top: 40px;
  padding-bottom: 40px;
  -webkit-overflow-scrolling: touch;
  height: 100%;
  position: relative;
`;

const Title = styled.h1`
  font-size: 24px;
  font-weight: 700;
  color: #000;
  text-align: center;
  margin: 0;
`;

// ===== 입력 컴포넌트 =====
const InitialContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  gap: 24px;
  width: 100%;
  transition: opacity 0.3s ease;
  opacity: ${props => props.hidden ? 0 : 1};
  display: ${props => props.hidden ? 'none' : 'flex'};
  margin-top: 40px;
`;

const DateLabel = styled.div`
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 12px;
  text-align: center;
  width: 100%;
`;

const DatePickerContainer = styled.div`
  margin-bottom: 24px;
  width: 100%;
  max-width: 300px;
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
  font-weight: 400;
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
  font-size: 12px;
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
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  background-color: #f0e9d9;
  padding: 8px;
  border-radius: 8px;
  width: 100%;
  box-sizing: border-box;
  max-height: 100px;
  overflow-y: auto;

  @media (min-width: 600px) {
    font-size: 12px;
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
  font-size: 22px;
  line-height: 1.5;
  text-align: left;
  padding-left: 12px;

  @media (min-width: 400px) {
    font-size: 22px;
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

const ButtonLoadingSpinner = styled.div`
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 1s ease-in-out infinite;
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);

  @keyframes spin {
    to { transform: translate(-50%, -50%) rotate(360deg); }
  }
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

const ContactContainer = styled.div`
  text-align: center;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e5e8eb;
`;

const InfoText = styled.div`
  font-size: 10px;
  color: #666;
  text-align: left;
  margin: 8px 0;
  padding: 0 16px;
  line-height: 1.4;
`;

const InfoSource = styled.div`
  font-size: 10px;
  color: #666;
  text-align: left;
  margin: 8px 0;
  padding: 0 16px;
  line-height: 1.4;
  border-top: 1px solid #e5e8eb;
  padding-top: 16px;
`;

const InstagramButton = styled.a`
  display: inline-block;
  background-color: #E1306C;
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  text-decoration: none;
  font-weight: bold;
  margin-top: 8px;
  transition: background-color 0.2s;
  cursor: pointer;
  font-size: 12px;
  width: 120px;
  text-align: center;

  &:hover {
    background-color: #C13584;
  }
`;

const ShareButton = styled.button`
  display: inline-block;
  background-color: #4CAF50;
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  text-decoration: none;
  font-weight: bold;
  margin-top: 8px;
  transition: background-color 0.2s;
  cursor: pointer;
  border: none;
  font-size: 12px;
  width: 120px;
  text-align: center;

  &:hover {
    background-color: #45a049;
  }
`;

const RefreshButton = styled.button`
  background: none;
  border: none;
  color: #666;
  font-size: 12px;
  cursor: pointer;
  padding: 8px 16px;
  border-radius: 20px;
  background-color: #d4c4a8;
  color: white;
  font-weight: bold;
  margin-top: 8px;
  transition: background-color 0.2s;
  width: 120px;
  text-align: center;

  &:hover {
    background-color: #c0b090;
  }
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
  width: 100%;
  max-width: 300px;
  padding: 16px;
  font-size: 18px;
  background-color: #d4c4a8;
  color: white;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 600;
  position: relative;
  min-height: 54px;

  &:hover {
    background-color: #c0b090;
  }

  &:disabled {
    background-color: #d4c4a8;
    cursor: not-allowed;
    opacity: 0.7;
  }
`;

const KakaoAd = () => {
  useEffect(() => {
    const adContainer = document.getElementById("kakaoAdArea");

    // 광고 태그 생성
    const ins = document.createElement("ins");
    ins.className = "kakao_ad_area";
    ins.style.display = "none";
    ins.setAttribute("data-ad-unit", "DAN-jqNpVLGrC0neJaXK");
    ins.setAttribute("data-ad-width", "320");
    ins.setAttribute("data-ad-height", "100");

    // 스크립트 생성
    const script = document.createElement("script");
    script.type = "text/javascript";
    script.async = true;
    script.src = "//t1.daumcdn.net/kas/static/ba.min.js";

    if (adContainer) {
      adContainer.appendChild(ins);
      adContainer.appendChild(script);
    }
  }, []);

  return <div id="kakaoAdArea" />;
};

function App() {
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [billboardData, setBillboardData] = useState<BillboardSong[]>([]);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherType, setWeatherType] = useState<WeatherTypeData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

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
      
      // 1987년 이전 생일인 경우 기사 정보를 제공하지 않음
      if (year < 1987) {
        setNewsItems([]);
      } else {
        // 1998년 이후는 SBS 뉴스로 바로 요청
        if (year >= 1998) {
          try {
            const sbsResponse = await axios.get(`https://mybirthnews.onrender.com/sbs-news?date=${selectedDate}`);
            const sbsNewsData = Array.isArray(sbsResponse.data) ? sbsResponse.data : [];
            
            if (sbsNewsData.length > 0) {
              const randomNews = sbsNewsData
                .sort(() => Math.random() - 0.5)
                .slice(0, 3)
                .map(item => ({
                  title: item.title || '',
                  link: item.link || '#'
                }));
              setNewsItems(randomNews);
            } else {
              setNewsItems([]);
              setError('해당 날짜의 뉴스 기사를 찾을 수 없습니다.');
            }
          } catch (sbsError) {
            console.error('SBS 뉴스 가져오기 실패:', sbsError);
            setNewsItems([]);
            setError('해당 날짜의 뉴스 기사를 찾을 수 없습니다.');
          }
        } else {
          // 1987-1997년은 KBS 뉴스로 먼저 시도
          try {
            const kbsResponse = await axios.get(`https://mybirthnews.onrender.com/kbs-news?date=${selectedDate}`);
            const kbsNewsData = Array.isArray(kbsResponse.data) ? kbsResponse.data : [];
            
            if (kbsNewsData.length > 0) {
              const randomNews = kbsNewsData
                .sort(() => Math.random() - 0.5)
                .slice(0, 3)
                .map(item => ({
                  title: item.title || '',
                  link: '' // KBS 뉴스는 링크 없음
                }));
              setNewsItems(randomNews);
            } else {
              // KBS 뉴스가 없는 경우 SBS 뉴스 시도
              try {
                const sbsResponse = await axios.get(`https://mybirthnews.onrender.com/sbs-news?date=${selectedDate}`);
                const sbsNewsData = Array.isArray(sbsResponse.data) ? sbsResponse.data : [];
                
                if (sbsNewsData.length > 0) {
                  const randomNews = sbsNewsData
                    .sort(() => Math.random() - 0.5)
                    .slice(0, 3)
                    .map(item => ({
                      title: item.title || '',
                      link: item.link || '#'
                    }));
                  setNewsItems(randomNews);
                } else {
                  setNewsItems([]);
                  setError('해당 날짜의 뉴스 기사를 찾을 수 없습니다.');
                }
              } catch (sbsError) {
                console.error('SBS 뉴스 가져오기 실패:', sbsError);
                setNewsItems([]);
                setError('해당 날짜의 뉴스 기사를 찾을 수 없습니다.');
              }
            }
          } catch (kbsError) {
            console.error('KBS 뉴스 가져오기 실패:', kbsError);
            setNewsItems([]);
            setError('해당 날짜의 뉴스 기사를 찾을 수 없습니다.');
          }
        }
      }

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

  const handleShare = async () => {
    const shareData = {
      title: '당신은 기억 못 하는 그 날 이야기',
      text: `${selectedDate}의 기억을 확인해보세요!`,
      url: 'https://my-birthnews.vercel.app/'
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Web Share API를 지원하지 않는 경우
        await navigator.clipboard.writeText(shareData.url);
        alert('링크가 클립보드에 복사되었습니다!');
      }
    } catch (err) {
      console.error('공유하기 실패:', err);
    }
  };

  return (
    <AppContainer>
      <Analytics />
      <KakaoAd />
      <Header>
        <Title>당신은 기억 못 하는<br/>그 날 이야기</Title>
      </Header>
      
      <MainContent>
        <InitialContent hidden={isDataLoaded}>
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
            <SearchButton 
              onClick={handleSearch}
              disabled={loading}
            >
              {loading ? <ButtonLoadingSpinner /> : '그때의 기억 찾아보기'}
            </SearchButton>
          )}
        </InitialContent>

        {loading && (
          <LoadingSpinner>그때의 기억을 불러오는중...</LoadingSpinner>
        )}

        {!isDataLoaded && (
          <>
            <InfoText>
              • 1970 이후의 기억만 불러 올 수 있습니다.<br />
              • 정보를 불러 오는데에 최대 1분까지 소요 될 수 있습니다.<br />
              • 트래픽이 몰릴 경우 오류가 생기거나 대기 시간이 길어 질 수 있습니다.<br />
              • 1987년 이전의 기사는 제공 되지 못합니다.<br />
              • 모바일 환경을 위해 제공되는 웹사이트입니다, PC 환경에서 UI가 올바르지 않을 수 있습니다.<br />
              • 오류가 생겼을 때 다시 한 번 시도해 보세요<br />
              • 2025년 4월 6일까지의 정보만 제공 됩니다.<br />
              • 생년월일 정보는 저장되지 않으며 어떤 개인정보도 수집하지 않습니다.<br />
            </InfoText>
            <InfoSource>
              온도, 날씨 정보 제공 : 기상청<br />
              기사, 뉴스 정보 제공 : KBS, SBS<br />
              음악 차트 정보 제공 : Billboard
            </InfoSource>
            <ContactContainer>
              기타 문의<br />
              <InstagramButton href="https://www.instagram.com/dev_.min" target="_blank" rel="noopener noreferrer">
                dev_.min
              </InstagramButton>
            </ContactContainer>
          </>
        )}
        
        {error && <ErrorMessage>{error}</ErrorMessage>}
        
        {selectedDate && !loading && !error && isDataLoaded && (
          <CardGrid>
            <CardRow>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: '1 1 50%' }}>
                <Card type="birthday">
                  <CardTitle type="birthday">그 날은</CardTitle>
                  {selectedDate && (
                    <BirthdayContent>
                      {formatBirthday(selectedDate).year}년<br/>{formatBirthday(selectedDate).month}{formatBirthday(selectedDate).day}일<br/>{formatBirthday(selectedDate).weekday}
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
                {billboardData.length > 0 && (
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
                )}
              </div>
            </CardRow>

            {newsItems.length > 0 && new Date(selectedDate).getFullYear() >= 1987 && (
              <CardRow>
                <Card type="news">
                  <CardTitle type="news">
                    그날의 기사
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
            )}
            <InfoText>
              • 1970 이후의 기억만 불러 올 수 있습니다.<br />
              • 정보를 불러 오는데에 최대 1분까지 소요 될 수 있습니다.<br />
              • 트래픽이 몰릴 경우 오류가 생기거나 대기 시간이 길어 질 수 있습니다.<br />
              • 1987년 이전의 기사는 제공 되지 못합니다.<br />
              • 모바일 환경을 위해 제공되는 웹사이트입니다, PC 환경에서 UI가 올바르지 않을 수 있습니다.<br />
              • 오류가 생겼을 때 다시 한 번 시도해 보세요<br />
              • 2025년 4월 6일까지의 정보만 제공 됩니다.<br />
              • 생년월일 정보는 저장되지 않으며 어떤 개인정보도 수집하지 않습니다.<br />
            </InfoText>
            <InfoSource>
              온도, 날씨 정보 제공 : 기상청<br />
              기사, 뉴스 정보 제공 : KBS, SBS<br />
              음악 차트 정보 제공 : Billboard
            </InfoSource>
            <ContactContainer>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                <RefreshButton onClick={() => window.location.reload()}>
                  다시하기
                </RefreshButton>
                <ShareButton onClick={handleShare}>
                  링크 공유하기
                </ShareButton>
              </div>
              <InstagramButton href="https://www.instagram.com/dev_.min" target="_blank" rel="noopener noreferrer">
                dev_.min
              </InstagramButton>
            </ContactContainer>
          </CardGrid>
        )}
      </MainContent>
    </AppContainer>
  );
}

export default App;
