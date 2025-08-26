// Real-time Market Data Fetcher
// Integrates Polygon, FMP, Ortex, and Unusual Whales APIs

class MarketDataFetcher {
    constructor(apiConfig) {
        this.config = apiConfig;
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    }

    // Main function to get comprehensive stock data
    async getComprehensiveStockData(ticker) {
        try {
            console.log(`🔍 Fetching comprehensive data for ${ticker}...`);
            
            const cacheKey = `comprehensive_${ticker}`;
            const cached = this.getFromCache(cacheKey);
            if (cached) return cached;

            // Fetch data from multiple sources in parallel
            const [
                polygonData,
                fmpData,
                ortexData,
                uwData
            ] = await Promise.allSettled([
                this.getPolygonData(ticker),
                this.getFMPData(ticker),
                this.getOrtexData(ticker),
                this.getUnusualWhalesData(ticker)
            ]);

            // Combine all data sources
            const comprehensiveData = this.combineDataSources(
                ticker,
                polygonData,
                fmpData,
                ortexData,
                uwData
            );

            this.setCache(cacheKey, comprehensiveData);
            return comprehensiveData;

        } catch (error) {
            console.error(`❌ Error fetching data for ${ticker}:`, error);
            // Return mock data as fallback
            return this.generateFallbackData(ticker);
        }
    }

    // Polygon.io data (primary market data)
    async getPolygonData(ticker) {
        if (!this.config.POLYGON_API_KEY || this.config.POLYGON_API_KEY === 'YOUR_POLYGON_API_KEY_HERE') {
            throw new Error('Polygon API key not configured');
        }

        try {
            // Get previous day's data (most reliable for after-hours)
            const quoteResponse = await fetch(
                `https://api.polygon.io/v2/aggs/ticker/${ticker}/prev?adjusted=true&apikey=${this.config.POLYGON_API_KEY}`
            );
            
            if (!quoteResponse.ok) throw new Error(`Polygon API error: ${quoteResponse.status}`);
            
            const quoteData = await quoteResponse.json();
            
            if (!quoteData.results || quoteData.results.length === 0) {
                throw new Error('No Polygon data available');
            }

            const result = quoteData.results[0];
            
            return {
                symbol: ticker,
                currentPrice: result.c, // Close price
                open: result.o,
                high: result.h,
                low: result.l,
                volume: result.v,
                change: result.c - result.o,
                changePercent: ((result.c - result.o) / result.o) * 100,
                timestamp: new Date(result.t).toISOString(),
                source: 'Polygon'
            };

        } catch (error) {
            console.warn('⚠️ Polygon API failed:', error.message);
            throw error;
        }
    }

    // Financial Modeling Prep data
    async getFMPData(ticker) {
        if (!this.config.FMP_API_KEY || this.config.FMP_API_KEY === 'YOUR_FMP_API_KEY_HERE') {
            throw new Error('FMP API key not configured');
        }

        try {
            const response = await fetch(
                `https://financialmodelingprep.com/api/v3/quote/${ticker}?apikey=${this.config.FMP_API_KEY}`
            );
            
            if (!response.ok) throw new Error(`FMP API error: ${response.status}`);
            
            const data = await response.json();
            
            if (!data || data.length === 0) {
                throw new Error('No FMP data available');
            }

            const quote = data[0];
            
            return {
                marketCap: quote.marketCap,
                pe: quote.pe,
                eps: quote.eps,
                beta: quote.beta,
                avgVolume: quote.avgVolume,
                fiftyTwoWeekHigh: quote.yearHigh,
                fiftyTwoWeekLow: quote.yearLow,
                source: 'FMP'
            };

        } catch (error) {
            console.warn('⚠️ FMP API failed:', error.message);
            return { source: 'FMP', error: error.message };
        }
    }

    // Ortex data (short interest)
    async getOrtexData(ticker) {
        if (!this.config.ORTEX_API_KEY || this.config.ORTEX_API_KEY === 'YOUR_ORTEX_API_KEY_HERE') {
            console.warn('⚠️ Ortex API key not configured');
            return { source: 'Ortex', error: 'API key not configured' };
        }

        try {
            // Note: Ortex API structure may vary - adjust endpoint as needed
            const response = await fetch(
                `https://api.ortex.com/v1/equities/${ticker}/short-interest`,
                {
                    headers: {
                        'Authorization': `Bearer ${this.config.ORTEX_API_KEY}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            if (!response.ok) throw new Error(`Ortex API error: ${response.status}`);
            
            const data = await response.json();
            
            return {
                shortInterest: data.shortInterest || null,
                shortRatio: data.shortRatio || null,
                shortInterestPercent: data.shortInterestPercent || null,
                source: 'Ortex'
            };

        } catch (error) {
            console.warn('⚠️ Ortex API failed:', error.message);
            return { source: 'Ortex', error: error.message };
        }
    }

    // Unusual Whales data (options flow)
    async getUnusualWhalesData(ticker) {
        if (!this.config.UNUSUAL_WHALES_API_KEY || this.config.UNUSUAL_WHALES_API_KEY === 'YOUR_UNUSUAL_WHALES_API_KEY_HERE') {
            console.warn('⚠️ Unusual Whales API key not configured');
            return { source: 'UnusualWhales', error: 'API key not configured' };
        }

        try {
            const response = await fetch(
                `https://api.unusualwhales.com/api/options_flows/${ticker}`,
                {
                    headers: {
                        'Authorization': `Bearer ${this.config.UNUSUAL_WHALES_API_KEY}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            if (!response.ok) throw new Error(`Unusual Whales API error: ${response.status}`);
            
            const data = await response.json();
            
            return {
                optionsFlow: data.optionsFlow || null,
                unusualActivity: data.unusualActivity || null,
                darkPoolData: data.darkPool || null,
                source: 'UnusualWhales'
            };

        } catch (error) {
            console.warn('⚠️ Unusual Whales API failed:', error.message);
            return { source: 'UnusualWhales', error: error.message };
        }
    }

    // Combine data from all sources
    combineDataSources(ticker, polygonResult, fmpResult, ortexResult, uwResult) {
        const polygonData = polygonResult.status === 'fulfilled' ? polygonResult.value : null;
        const fmpData = fmpResult.status === 'fulfilled' ? fmpResult.value : null;
        const ortexData = ortexResult.status === 'fulfilled' ? ortexResult.value : null;
        const uwData = uwResult.status === 'fulfilled' ? uwResult.value : null;

        // Calculate implied volatility estimate
        const impliedVolatility = this.calculateImpliedVolatility(polygonData, fmpData, uwData);

        return {
            symbol: ticker.toUpperCase(),
            currentPrice: polygonData?.currentPrice || (150 + Math.random() * 100),
            change: polygonData?.change || ((Math.random() - 0.5) * 10),
            changePercent: polygonData?.changePercent || ((Math.random() - 0.5) * 5),
            volume: polygonData?.volume || Math.floor(Math.random() * 10000000),
            avgVolume: fmpData?.avgVolume || Math.floor(Math.random() * 5000000),
            
            // Market data
            open: polygonData?.open || null,
            high: polygonData?.high || null,
            low: polygonData?.low || null,
            
            // Financial metrics
            marketCap: fmpData?.marketCap || null,
            pe: fmpData?.pe || null,
            eps: fmpData?.eps || null,
            beta: fmpData?.beta || null,
            
            // Options data
            impliedVolatility: impliedVolatility,
            optionsExpiry: "30-45 DTE",
            
            // Advanced metrics
            shortInterest: ortexData?.shortInterest || null,
            shortRatio: ortexData?.shortRatio || null,
            optionsFlow: uwData?.optionsFlow || null,
            unusualActivity: uwData?.unusualActivity || null,
            
            // Metadata
            lastUpdated: new Date().toISOString(),
            dataSources: [
                polygonData ? 'Polygon' : null,
                fmpData ? 'FMP' : null,
                ortexData?.shortInterest ? 'Ortex' : null,
                uwData?.optionsFlow ? 'UnusualWhales' : null
            ].filter(Boolean),
            
            // Real data indicator
            isRealData: Boolean(polygonData?.currentPrice)
        };
    }

    // Calculate implied volatility estimate
    calculateImpliedVolatility(polygonData, fmpData, uwData) {
        let baseIV = 25; // Default base IV
        
        // Adjust based on beta (higher beta = higher volatility)
        if (fmpData?.beta) {
            baseIV += (fmpData.beta - 1) * 5;
        }
        
        // Adjust based on recent price movement
        if (polygonData?.changePercent) {
            baseIV += Math.abs(polygonData.changePercent) * 2;
        }
        
        // Adjust based on unusual options activity
        if (uwData?.unusualActivity && uwData.unusualActivity > 1.5) {
            baseIV += 10;
        }
        
        // Keep within reasonable bounds
        return Math.max(15, Math.min(baseIV, 80));
    }

    // Cache management
    getFromCache(key) {
        const cached = this.cache.get(key);
        if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
            console.log(`📋 Using cached data for ${key}`);
            return cached.data;
        }
        return null;
    }

    setCache(key, data) {
        this.cache.set(key, {
            data: data,
            timestamp: Date.now()
        });
    }

    // Fallback data generator
    generateFallbackData(ticker) {
        console.log(`⚠️ Using fallback data for ${ticker}`);
        return {
            symbol: ticker.toUpperCase(),
            currentPrice: 150 + Math.random() * 100,
            change: (Math.random() - 0.5) * 10,
            changePercent: (Math.random() - 0.5) * 5,
            volume: Math.floor(Math.random() * 10000000),
            avgVolume: Math.floor(Math.random() * 5000000),
            impliedVolatility: 20 + Math.random() * 30,
            optionsExpiry: "30-45 DTE",
            lastUpdated: new Date().toISOString(),
            dataSources: ['Mock'],
            isRealData: false,
            fallbackReason: 'API keys not configured or API errors'
        };
    }
}

export { MarketDataFetcher };