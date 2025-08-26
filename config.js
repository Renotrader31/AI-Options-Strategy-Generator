// API Configuration - Add your API keys here
const API_CONFIG = {
    // Polygon.io API (Stock data, options data, market data)
    POLYGON_API_KEY: 'YOUR_POLYGON_API_KEY_HERE',
    
    // Financial Modeling Prep API (Financial data, ratios, news)
    FMP_API_KEY: 'YOUR_FMP_API_KEY_HERE',
    
    // Ortex API (Short interest, squeeze data)
    ORTEX_API_KEY: 'YOUR_ORTEX_API_KEY_HERE',
    
    // Unusual Whales API (Options flow, dark pool data)
    UNUSUAL_WHALES_API_KEY: 'YOUR_UNUSUAL_WHALES_API_KEY_HERE'
};

// API Endpoints
const API_ENDPOINTS = {
    POLYGON: {
        BASE_URL: 'https://api.polygon.io',
        STOCK_QUOTE: '/v2/aggs/ticker/{ticker}/prev',
        OPTIONS_CHAIN: '/v3/reference/options/contracts',
        MARKET_STATUS: '/v1/marketstatus/now'
    },
    FMP: {
        BASE_URL: 'https://financialmodelingprep.com/api',
        QUOTE: '/v3/quote/{ticker}',
        PROFILE: '/v3/profile/{ticker}',
        RATIOS: '/v3/ratios/{ticker}'
    },
    ORTEX: {
        BASE_URL: 'https://api.ortex.com',
        SHORT_INTEREST: '/v1/equities/{ticker}/short-interest'
    },
    UNUSUAL_WHALES: {
        BASE_URL: 'https://api.unusualwhales.com',
        OPTIONS_FLOW: '/api/options_flows/{ticker}',
        DARK_POOLS: '/api/darkpool/{ticker}'
    }
};

// Rate limiting configuration
const RATE_LIMITS = {
    POLYGON: { requests_per_minute: 5, requests_per_day: 100 },
    FMP: { requests_per_minute: 10, requests_per_day: 250 },
    ORTEX: { requests_per_minute: 60, requests_per_day: 1000 },
    UNUSUAL_WHALES: { requests_per_minute: 30, requests_per_day: 500 }
};

export { API_CONFIG, API_ENDPOINTS, RATE_LIMITS };