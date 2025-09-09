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

// Multi-source data fetching with fallbacks
async function fetchLiveDataFromSources(symbols) {
  const sources = [
    { name: 'FMP', fetch: fetchFromFMP },
    { name: 'TWELVE_DATA', fetch: fetchFromTwelveData },
    { name: 'ALPHA_VANTAGE', fetch: fetchFromAlphaVantage },
    { name: 'MOCK', fetch: generateMockData }
  ];
  
  console.log('\n--- Trying FMP (Primary Source) ---');
  
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

// FMP API implementation
async function fetchFromFMP(symbols) {
  if (API_KEYS.FMP === 'demo') {
    throw new Error('Demo key - skipping FMP');
  }
  
  const symbolList = symbols.join(',');
  const url = `https://financialmodelingprep.com/api/v3/quote/${symbolList}?apikey=${API_KEYS.FMP}`;
  
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

// Generate mock data as fallback
function generateMockData(symbols) {
  return symbols.map(symbol => {
    // Generate realistic price based on current market levels (Sept 2024)
    const basePrice = symbol === 'AAPL' ? 178 : 
                     symbol === 'GOOGL' ? 132 :
                     symbol === 'MSFT' ? 342 :
                     symbol === 'AMZN' ? 148 :
                     symbol === 'TSLA' ? 258 :
                     symbol === 'NVDA' ? 465 :
                     symbol === 'META' ? 315 :
                     symbol === 'SPY' ? 445 :
                     symbol === 'QQQ' ? 385 :
                     symbol === 'AMD' ? 165 :
                     symbol === 'NFLX' ? 445 :
                     symbol === 'PLTR' ? 28 :
                     symbol === 'SOFI' ? 8.5 :
                     symbol === 'RIVN' ? 12.5 :
                     symbol === 'NIO' ? 6.8 : 100;
    
    const variation = (Math.random() - 0.5) * 0.06; // ±3% more realistic
    const price = basePrice * (1 + variation);
    const changePercent = (Math.random() - 0.5) * 5; // ±2.5%
    const change = price * (changePercent / 100);
    
    return {
      symbol,
      price: Math.round(price * 100) / 100,
      change: Math.round(change * 100) / 100,
      changePercent: Math.round(changePercent * 100) / 100,
      volume: Math.floor(Math.random() * 50000000) + 5000000,
      avgVolume: Math.floor(Math.random() * 40000000) + 10000000,
      marketCap: Math.floor(Math.random() * 2000000000000) + 100000000000,
      high: Math.round((price * 1.02) * 100) / 100,
      low: Math.round((price * 0.98) * 100) / 100,
      open: Math.round((price * (0.99 + Math.random() * 0.02)) * 100) / 100,
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