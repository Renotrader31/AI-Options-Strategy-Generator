/**
 * Live Data API Route for Scanner Pro AI
 * Multi-source financial data API integration with intelligent caching
 */

import { NextResponse } from 'next/server';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Handle OPTIONS requests for CORS
export async function OPTIONS(request) {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}

// Cache for storing live data with TTL
const dataCache = new Map();
const CACHE_TTL = 30000; // 30 seconds

// API Keys (in production, use environment variables)
const API_KEYS = {
  FMP: process.env.FMP_API_KEY || 'demo',
  TWELVE_DATA: process.env.TWELVE_DATA_KEY || 'demo',
  ALPHA_VANTAGE: process.env.ALPHA_VANTAGE_KEY || 'demo',
  POLYGON: process.env.POLYGON_KEY || 'demo'
};

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const symbolsParam = searchParams.get('symbols') || 'AAPL,MSFT,GOOGL,AMZN,TSLA,NVDA,META,SPY';
    const limit = parseInt(searchParams.get('limit')) || 10;
    
    const symbols = symbolsParam.split(',').map(s => s.trim().toUpperCase());
    
    console.log(`Fetching data for symbols: ${symbols.join(', ')}`);
    
    // Check cache first
    const cacheKey = symbols.sort().join(',');
    const cached = dataCache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
      console.log('✅ Returning cached data');
      return NextResponse.json({
        ...cached.data,
        cached: true
      }, {
        status: 200,
        headers: corsHeaders
      });
    }
    
    // Fetch fresh data
    const liveData = await fetchLiveDataFromSources(symbols);
    
    if (liveData.success) {
      // Cache the successful result
      dataCache.set(cacheKey, {
        data: liveData,
        timestamp: Date.now()
      });
    }
    
    // Apply limit
    if (liveData.data && liveData.data.length > limit) {
      liveData.data = liveData.data.slice(0, limit);
    }
    
    return NextResponse.json(liveData, {
      status: 200,
      headers: corsHeaders
    });
    
  } catch (error) {
    console.error('Live data API error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch live data',
      details: error.message,
      timestamp: new Date().toISOString()
    }, {
      status: 500,
      headers: corsHeaders
    });
  }
}

// Multi-source data fetching with fallbacks - PAID SOURCES FIRST
async function fetchLiveDataFromSources(symbols) {
  const sources = [
    { name: 'POLYGON', fetch: fetchFromPolygon }, // PAID: Premium real-time data (1st priority)
    { name: 'FMP', fetch: fetchFromFMP }, // PAID: Real-time financial data (2nd priority)
    { name: 'FINNHUB', fetch: fetchFromFinnhub }, // Free tier backup
    { name: 'YAHOO_FINANCE', fetch: fetchFromYahooFinance }, // Free backup
    { name: 'TWELVE_DATA', fetch: fetchFromTwelveData },
    { name: 'ALPHA_VANTAGE', fetch: fetchFromAlphaVantage },
    { name: 'MOCK', fetch: generateMockData }
  ];
  
  console.log('\n--- Trying PAID API Sources First ---');
  
  for (const source of sources) {
    try {
      console.log(`Fetching fresh data from ${source.name} for: ${symbols.join(',')}`);
      
      const data = await source.fetch(symbols);
      
      if (data && data.length > 0) {
        console.log(`✅ Success: Got ${data.length} records from ${source.name}`);
        console.log('\n=== Data Fetch Complete ===');
        console.log(`Source: ${source.name}${source.name !== 'MOCK' ? ' (Real-time)' : ' (Fallback)'}`);
        console.log(`Records: ${data.length}`);
        console.log(`Market Open: ${isMarketOpen()}`);
        console.log('');
        
        return {
          success: true,
          data,
          source: source.name,
          timestamp: new Date().toISOString(),
          cached: false,
          marketOpen: isMarketOpen()
        };
      }
      
      console.log(`❌ ${source.name} returned no data, trying next source...`);
      
    } catch (error) {
      console.error(`❌ ${source.name} failed:`, error.message);
      console.log(`   Trying next source...`);
    }
  }
  
  // If all sources fail, return error
  return {
    success: false,
    error: 'All data sources failed',
    timestamp: new Date().toISOString()
  };
}

// Finnhub API implementation - Free tier with real-time data
async function fetchFromFinnhub(symbols) {
  try {
    // Finnhub offers free tier: 60 calls/minute, real-time data
    // Free public API key - no signup required for basic quotes
    const promises = symbols.map(async (symbol) => {
      const url = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=demo`;
      
      const response = await fetch(url, {
        headers: {
          'X-Finnhub-Token': 'demo'
        },
        timeout: 8000
      });
      
      if (!response.ok) {
        throw new Error(`Finnhub API error for ${symbol}: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.c || data.c === 0) {
        // Try with actual free public demo token
        const fallbackUrl = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=sandbox_c7q22r2ad3idnlgrni40`;
        const fallbackResponse = await fetch(fallbackUrl);
        
        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json();
          if (fallbackData.c && fallbackData.c > 0) {
            return mapFinnhubData(symbol, fallbackData);
          }
        }
        
        throw new Error(`No data for ${symbol} from Finnhub`);
      }
      
      return mapFinnhubData(symbol, data);
    });
    
    const results = await Promise.all(promises);
    console.log(`✅ Finnhub: Got ${results.length} real-time prices`);
    return results.filter(r => r !== null);
    
  } catch (error) {
    console.error('❌ Finnhub failed:', error.message);
    throw error;
  }
}

// Polygon.io API implementation - PAID ACCOUNT with real-time data
async function fetchFromPolygon(symbols) {
  const apiKey = API_KEYS.POLYGON;
  
  // Skip if no valid API key
  if (!apiKey || apiKey === 'demo') {
    throw new Error('Polygon API key not configured - skipping Polygon');
  }
  
  try {
    // Polygon provides grouped daily data with real-time updates for paid accounts
    const promises = symbols.map(async (symbol) => {
      // Use snapshot endpoint for real-time data
      const url = `https://api.polygon.io/v2/snapshot/locale/us/markets/stocks/tickers/${symbol}?apiKey=${apiKey}`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${apiKey}`
        },
        timeout: 10000
      });
      
      if (!response.ok) {
        throw new Error(`Polygon API error for ${symbol}: ${response.status}`);
      }
      
      const data = await response.json();
      const ticker = data.results;
      
      if (!ticker || !ticker.day) {
        throw new Error(`No Polygon data for ${symbol}`);
      }
      
      const currentPrice = ticker.day.c; // Close (most recent)
      const previousClose = ticker.prevDay?.c || ticker.day.o; // Previous day close or open
      const change = currentPrice - previousClose;
      const changePercent = (change / previousClose) * 100;
      
      return {
        symbol: symbol,
        price: Math.round(currentPrice * 100) / 100,
        change: Math.round(change * 100) / 100,
        changePercent: Math.round(changePercent * 100) / 100,
        volume: ticker.day.v || 0, // Volume
        avgVolume: ticker.prevDay?.v || 0, // Previous day volume as proxy
        marketCap: 0, // Not provided in snapshot
        high: ticker.day.h || currentPrice, // Day high
        low: ticker.day.l || currentPrice, // Day low
        open: ticker.day.o || currentPrice, // Day open
        previousClose: previousClose
      };
    });
    
    const results = await Promise.all(promises);
    console.log(`✅ Polygon (PAID): Got ${results.length} real-time prices`);
    return results.filter(r => r !== null);
    
  } catch (error) {
    console.error('❌ Polygon API failed:', error.message);
    throw error;
  }
}

function mapFinnhubData(symbol, data) {
  const currentPrice = data.c; // Current price
  const previousClose = data.pc; // Previous close
  const change = currentPrice - previousClose;
  const changePercent = (change / previousClose) * 100;
  
  return {
    symbol: symbol,
    price: Math.round(currentPrice * 100) / 100,
    change: Math.round(change * 100) / 100,
    changePercent: Math.round(changePercent * 100) / 100,
    volume: 0, // Finnhub free tier doesn't include volume in quote endpoint
    avgVolume: 0,
    marketCap: 0,
    high: data.h || currentPrice, // Day high
    low: data.l || currentPrice, // Day low
    open: data.o || currentPrice, // Open price
    previousClose: previousClose
  };
}

// FMP API implementation - with free tier support
async function fetchFromFMP(symbols) {
  // FMP offers free tier with limited requests
  const apiKey = API_KEYS.FMP;
  
  // Skip demo/invalid keys
  if (!apiKey || apiKey === 'demo') {
    throw new Error('FMP API key not configured - skipping FMP');
  }
  
  const symbolList = symbols.join(',');
  const url = `https://financialmodelingprep.com/api/v3/quote/${symbolList}?apikey=${apiKey}`;
  
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Scanner-Pro-AI/1.0'
    },
    timeout: 10000
  });
  
  if (!response.ok) {
    throw new Error(`FMP API error: ${response.status} ${response.statusText}`);
  }
  
  const data = await response.json();
  
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error('FMP returned no data');
  }
  
  return data.map(item => ({
    symbol: item.symbol,
    price: item.price || 0,
    change: item.change || 0,
    changePercent: item.changesPercentage || 0,
    volume: item.volume || 0,
    avgVolume: item.avgVolume || item.volume || 0,
    marketCap: item.marketCap || 0,
    high: item.dayHigh || item.price || 0,
    low: item.dayLow || item.price || 0,
    open: item.open || item.price || 0,
    previousClose: item.previousClose || item.price || 0
  }));
}

// Twelve Data API implementation
async function fetchFromTwelveData(symbols) {
  if (API_KEYS.TWELVE_DATA === 'demo') {
    throw new Error('Demo key - skipping Twelve Data');
  }
  
  // Twelve Data requires individual requests for each symbol
  const promises = symbols.map(async (symbol) => {
    const url = `https://api.twelvedata.com/quote?symbol=${symbol}&apikey=${API_KEYS.TWELVE_DATA}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Twelve Data API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.code && data.code !== 200) {
      throw new Error(`Twelve Data error: ${data.message}`);
    }
    
    return {
      symbol: data.symbol,
      price: parseFloat(data.close) || 0,
      change: parseFloat(data.change) || 0,
      changePercent: parseFloat(data.percent_change) || 0,
      volume: parseInt(data.volume) || 0,
      avgVolume: parseInt(data.volume) || 0, // Twelve Data doesn't provide avg volume in quote
      high: parseFloat(data.high) || 0,
      low: parseFloat(data.low) || 0,
      open: parseFloat(data.open) || 0,
      previousClose: parseFloat(data.previous_close) || 0
    };
  });
  
  return await Promise.all(promises);
}

// Alpha Vantage API implementation
async function fetchFromAlphaVantage(symbols) {
  if (API_KEYS.ALPHA_VANTAGE === 'demo') {
    throw new Error('Demo key - skipping Alpha Vantage');
  }
  
  // Alpha Vantage has rate limits, so we'll fetch a few symbols
  const limitedSymbols = symbols.slice(0, 3);
  
  const promises = limitedSymbols.map(async (symbol) => {
    const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${API_KEYS.ALPHA_VANTAGE}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Alpha Vantage API error: ${response.status}`);
    }
    
    const data = await response.json();
    const quote = data['Global Quote'];
    
    if (!quote) {
      throw new Error('Alpha Vantage returned no quote data');
    }
    
    return {
      symbol: quote['01. symbol'],
      price: parseFloat(quote['05. price']) || 0,
      change: parseFloat(quote['09. change']) || 0,
      changePercent: parseFloat(quote['10. change percent'].replace('%', '')) || 0,
      volume: parseInt(quote['06. volume']) || 0,
      avgVolume: parseInt(quote['06. volume']) || 0,
      high: parseFloat(quote['03. high']) || 0,
      low: parseFloat(quote['04. low']) || 0,
      open: parseFloat(quote['02. open']) || 0,
      previousClose: parseFloat(quote['08. previous close']) || 0
    };
  });
  
  return await Promise.all(promises);
}

// Yahoo Finance API (free, no API key required) - with better rate limiting
async function fetchFromYahooFinance(symbols) {
  try {
    // Limit to prevent rate limiting - fetch one by one with delay
    const results = [];
    
    for (let i = 0; i < symbols.length; i++) {
      const symbol = symbols[i];
      
      try {
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`;
        
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'application/json',
            'Accept-Language': 'en-US,en;q=0.9'
          }
        });
        
        if (!response.ok) {
          console.warn(`Yahoo Finance rate limited for ${symbol}, using mock data`);
          break; // Stop trying more symbols if rate limited
        }
        
        const data = await response.json();
        const result = data?.chart?.result?.[0];
        
        if (!result) {
          console.warn(`No Yahoo Finance data for ${symbol}`);
          continue;
        }
        
        const meta = result.meta;
        const currentPrice = meta.regularMarketPrice || meta.previousClose;
        const previousClose = meta.previousClose;
        const change = currentPrice - previousClose;
        const changePercent = (change / previousClose) * 100;
        
        results.push({
          symbol: symbol,
          price: Math.round(currentPrice * 100) / 100,
          change: Math.round(change * 100) / 100,
          changePercent: Math.round(changePercent * 100) / 100,
          volume: meta.regularMarketVolume || 0,
          avgVolume: meta.averageDailyVolume10Day || 0,
          marketCap: meta.marketCap || 0,
          high: meta.regularMarketDayHigh || currentPrice,
          low: meta.regularMarketDayLow || currentPrice,
          open: meta.regularMarketOpen || currentPrice,
          previousClose: previousClose
        });
        
        // Add small delay to avoid rate limiting
        if (i < symbols.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
      } catch (symbolError) {
        console.warn(`Yahoo Finance error for ${symbol}:`, symbolError.message);
        continue;
      }
    }
    
    if (results.length > 0) {
      console.log(`✅ Yahoo Finance: Got ${results.length} real-time prices`);
      return results;
    } else {
      throw new Error('Yahoo Finance returned no valid data');
    }
    
  } catch (error) {
    console.error('❌ Yahoo Finance failed:', error.message);
    throw error;
  }
}

// Generate enhanced mock data as fallback - simulates realistic market data
function generateMockData(symbols) {
  console.log('📊 Generating enhanced mock market data...');
  
  return symbols.map(symbol => {
    // Generate realistic price based on actual Sept 2024 market levels
    const basePrice = symbol === 'AAPL' ? 239 : 
                     symbol === 'GOOGL' ? 248 :
                     symbol === 'MSFT' ? 508 :
                     symbol === 'AMZN' ? 188 :
                     symbol === 'TSLA' ? 258 :
                     symbol === 'NVDA' ? 465 :
                     symbol === 'META' ? 315 :
                     symbol === 'SPY' ? 573 :
                     symbol === 'QQQ' ? 485 :
                     symbol === 'AMD' ? 165 :
                     symbol === 'NFLX' ? 445 :
                     symbol === 'PLTR' ? 28 :
                     symbol === 'SOFI' ? 8.5 :
                     symbol === 'RIVN' ? 12.5 :
                     symbol === 'NIO' ? 6.8 : 100;
    
    // Market hours affect volatility
    const now = new Date();
    const isMarketHours = isMarketOpen();
    const volatilityMultiplier = isMarketHours ? 1.0 : 0.3; // Lower volatility after hours
    
    // Generate more realistic intraday movement
    const timeBasedTrend = Math.sin(Date.now() / 100000) * 0.002; // Subtle time-based trend
    const marketNoise = (Math.random() - 0.5) * 0.02 * volatilityMultiplier; // Market noise
    const variation = timeBasedTrend + marketNoise;
    
    const price = basePrice * (1 + variation);
    
    // Generate realistic percentage changes based on symbol volatility
    const symbolVolatility = symbol === 'TSLA' || symbol === 'NVDA' ? 3.5 :
                           symbol === 'AAPL' || symbol === 'MSFT' ? 1.5 :
                           symbol === 'SPY' || symbol === 'QQQ' ? 1.0 :
                           symbol.includes('SOFI') || symbol.includes('PLTR') ? 5.0 : 2.0;
    
    const changePercent = (Math.random() - 0.5) * symbolVolatility * volatilityMultiplier;
    const change = price * (changePercent / 100);
    
    // Generate realistic volume based on symbol popularity
    const baseVolume = symbol === 'AAPL' ? 45000000 :
                      symbol === 'SPY' ? 35000000 :
                      symbol === 'TSLA' ? 25000000 :
                      symbol === 'NVDA' ? 20000000 :
                      symbol === 'QQQ' ? 15000000 :
                      symbol === 'MSFT' ? 12000000 : 8000000;
    
    const volumeVariation = 0.5 + Math.random(); // 50% to 150% of base
    const volume = Math.floor(baseVolume * volumeVariation);
    
    return {
      symbol,
      price: Math.round(price * 100) / 100,
      change: Math.round(change * 100) / 100,
      changePercent: Math.round(changePercent * 100) / 100,
      volume,
      avgVolume: Math.floor(baseVolume * 0.9), // Slightly below current volume
      marketCap: Math.floor(price * 1000000000 * (1 + Math.random())), // Rough market cap estimation
      high: Math.round((price * (1 + Math.abs(changePercent) / 200)) * 100) / 100,
      low: Math.round((price * (1 - Math.abs(changePercent) / 200)) * 100) / 100,
      open: Math.round((price * (0.995 + Math.random() * 0.01)) * 100) / 100,
      previousClose: Math.round((price - change) * 100) / 100
    };
  });
}

// Helper function to check if market is open
function isMarketOpen() {
  const now = new Date();
  const marketOpen = new Date();
  const marketClose = new Date();
  
  marketOpen.setHours(9, 30, 0, 0); // 9:30 AM EST
  marketClose.setHours(16, 0, 0, 0); // 4:00 PM EST
  
  const isWeekday = now.getDay() >= 1 && now.getDay() <= 5;
  const isMarketHours = now >= marketOpen && now <= marketClose;
  
  return isWeekday && isMarketHours;
}