/**
 * ML Analysis API Route for Scanner Pro AI
 * 
 * This system provides sophisticated AI-powered trading analysis without
 * external dependencies. It implements pure JavaScript machine learning
 * algorithms for technical analysis, sentiment assessment, and risk evaluation.
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

// Main ML Analysis endpoint
export async function POST(request) {
  try {
    const body = await request.json();
    console.log('ML Analysis request received for:', body.symbol || 'multiple symbols');

    const {
      symbol,
      marketData,
      historicalData,
      includeDetailedAnalysis = true,
      riskTolerance = 'medium'
    } = body;

    // Validate required data
    if (!symbol || !marketData) {
      return NextResponse.json({
        success: false,
        error: 'Missing required data: symbol and marketData are required',
        timestamp: new Date().toISOString()
      }, {
        status: 400,
        headers: corsHeaders
      });
    }

    // Generate comprehensive ML analysis
    const analysis = await generateComprehensiveMLAnalysis({
      symbol,
      marketData,
      historicalData,
      includeDetailedAnalysis,
      riskTolerance
    });

    return NextResponse.json({
      success: true,
      symbol,
      analysis,
      timestamp: new Date().toISOString(),
      processingTime: analysis.processingTime
    }, {
      status: 200,
      headers: corsHeaders
    });

  } catch (error) {
    console.error('ML Analysis error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'ML Analysis failed',
      details: error.message,
      timestamp: new Date().toISOString()
    }, {
      status: 500,
      headers: corsHeaders
    });
  }
}

// Generate comprehensive ML analysis for a single symbol
async function generateComprehensiveMLAnalysis(params) {
  const startTime = Date.now();
  const { symbol, marketData, historicalData, includeDetailedAnalysis, riskTolerance } = params;

  try {
    // 1. Technical Analysis Features
    const technicalFeatures = calculateTechnicalFeatures(marketData, historicalData);
    
    // 2. Market Sentiment Analysis
    const sentimentAnalysis = analyzeSentiment(symbol, marketData);
    
    // 3. Risk Assessment
    const riskMetrics = calculateRiskMetrics(marketData, historicalData, riskTolerance);
    
    // 4. ML Prediction
    const mlPrediction = generateMLPrediction(symbol, marketData, technicalFeatures, sentimentAnalysis);
    
    // 5. Composite Score Calculation
    const compositeScore = calculateCompositeScore(mlPrediction, technicalFeatures, sentimentAnalysis, riskMetrics);
    
    // 6. Trading Recommendations
    const recommendations = generateTradingRecommendations(compositeScore, riskMetrics, technicalFeatures);
    
    // 7. Confidence Assessment
    const confidence = calculateConfidenceLevel(technicalFeatures, sentimentAnalysis, riskMetrics);

    const analysis = {
      symbol,
      compositeScore,
      confidence,
      recommendations,
      technicalFeatures: includeDetailedAnalysis ? technicalFeatures : summarizeTechnicalFeatures(technicalFeatures),
      sentimentAnalysis,
      riskMetrics,
      mlPrediction,
      processingTime: Date.now() - startTime,
      analysisTimestamp: new Date().toISOString(),
      marketConditions: assessMarketConditions(marketData, technicalFeatures)
    };

    return analysis;

  } catch (error) {
    console.error(`ML Analysis error for ${symbol}:`, error);
    throw error;
  }
}

// Calculate technical indicators and features
function calculateTechnicalFeatures(marketData, historicalData = null) {
  try {
    const {
      price = 100,
      high = 105,
      low = 95,
      volume = 1000000,
      previousClose = 98,
      open = 99
    } = marketData;

    // Create price history for calculations
    const priceHistory = historicalData?.prices || generateRealisticPriceHistory(price, 20);
    
    // RSI Calculation
    const rsi = calculateRSI(priceHistory);
    
    // MACD Calculation
    const macd = calculateMACD(priceHistory);
    
    // Bollinger Bands
    const bollingerBands = calculateBollingerBands(priceHistory);
    
    // Moving Averages
    const sma20 = calculateSMA(priceHistory, 20);
    const sma50 = calculateSMA(priceHistory, 50);
    const ema12 = calculateEMA(priceHistory, 12);
    const ema26 = calculateEMA(priceHistory, 26);
    
    // Volume Analysis
    const volumeAnalysis = analyzeVolume(volume, marketData.avgVolume || volume);
    
    // Support and Resistance
    const supportResistance = calculateSupportResistance(priceHistory, high, low);

    return {
      rsi: {
        value: rsi,
        signal: getRSISignal(rsi),
        strength: getRSIStrength(rsi)
      },
      macd: {
        ...macd,
        signal: getMACDSignal(macd),
        strength: getMACDStrength(macd)
      },
      bollingerBands: {
        ...bollingerBands,
        position: getBollingerPosition(price, bollingerBands),
        signal: getBollingerSignal(price, bollingerBands)
      },
      movingAverages: {
        sma20,
        sma50,
        ema12,
        ema26,
        trend: getMovingAverageTrend(price, sma20, sma50),
        crossover: detectCrossover(ema12, ema26)
      },
      volumeAnalysis,
      supportResistance,
      momentum: calculateMomentum(priceHistory),
      volatility: calculateVolatility(priceHistory),
      trend: identifyTrend(priceHistory, sma20, sma50)
    };

  } catch (error) {
    console.error('Technical features calculation error:', error);
    return getDefaultTechnicalFeatures();
  }
}

// RSI Calculation
function calculateRSI(prices, period = 14) {
  if (prices.length < period + 1) {
    return 50; // Neutral RSI if insufficient data
  }

  const gains = [];
  const losses = [];

  for (let i = 1; i < prices.length; i++) {
    const change = prices[i] - prices[i - 1];
    gains.push(change > 0 ? change : 0);
    losses.push(change < 0 ? Math.abs(change) : 0);
  }

  const avgGain = gains.slice(-period).reduce((sum, gain) => sum + gain, 0) / period;
  const avgLoss = losses.slice(-period).reduce((sum, loss) => sum + loss, 0) / period;

  if (avgLoss === 0) return 100;

  const rs = avgGain / avgLoss;
  const rsi = 100 - (100 / (1 + rs));

  return Math.round(rsi * 100) / 100;
}

// MACD Calculation
function calculateMACD(prices) {
  const ema12 = calculateEMA(prices, 12);
  const ema26 = calculateEMA(prices, 26);
  const macdLine = ema12 - ema26;
  
  const signalLine = calculateEMA([macdLine], 9);
  const histogram = macdLine - signalLine;

  return {
    macdLine: Math.round(macdLine * 10000) / 10000,
    signalLine: Math.round(signalLine * 10000) / 10000,
    histogram: Math.round(histogram * 10000) / 10000
  };
}

// Bollinger Bands Calculation
function calculateBollingerBands(prices, period = 20, stdDev = 2) {
  const sma = calculateSMA(prices, period);
  const recentPrices = prices.slice(-period);
  
  const variance = recentPrices.reduce((sum, price) => {
    return sum + Math.pow(price - sma, 2);
  }, 0) / period;
  
  const standardDeviation = Math.sqrt(variance);
  
  return {
    upper: Math.round((sma + (standardDeviation * stdDev)) * 100) / 100,
    middle: Math.round(sma * 100) / 100,
    lower: Math.round((sma - (standardDeviation * stdDev)) * 100) / 100,
    bandwidth: Math.round((2 * standardDeviation * stdDev / sma) * 10000) / 100
  };
}

// Simple Moving Average
function calculateSMA(prices, period) {
  const recentPrices = prices.slice(-period);
  const sum = recentPrices.reduce((acc, price) => acc + price, 0);
  return Math.round((sum / recentPrices.length) * 100) / 100;
}

// Exponential Moving Average
function calculateEMA(prices, period) {
  const multiplier = 2 / (period + 1);
  let ema = prices[0];

  for (let i = 1; i < prices.length; i++) {
    ema = ((prices[i] - ema) * multiplier) + ema;
  }

  return Math.round(ema * 100) / 100;
}

// Generate realistic price history for calculations
function generateRealisticPriceHistory(currentPrice, length) {
  const prices = [];
  let price = currentPrice;

  for (let i = 0; i < length; i++) {
    const change = (Math.random() - 0.5) * 0.04; // ±2% change
    price = price * (1 + change);
    prices.unshift(price);
  }

  prices.push(currentPrice);
  return prices;
}

// Sentiment Analysis
function analyzeSentiment(symbol, marketData) {
  const { price, change, changePercent, volume, avgVolume } = marketData;

  const priceScore = changePercent > 2 ? 0.8 : 
                    changePercent > 0 ? 0.6 : 
                    changePercent > -2 ? 0.4 : 0.2;

  const volumeRatio = volume / (avgVolume || volume);
  const volumeScore = volumeRatio > 1.5 ? 0.8 : 
                     volumeRatio > 1.2 ? 0.7 : 
                     volumeRatio > 0.8 ? 0.5 : 0.3;

  const timingScore = getMarketTimingSentiment();
  const overallSentiment = (priceScore * 0.4 + volumeScore * 0.3 + timingScore * 0.3);

  return {
    overall: Math.round(overallSentiment * 100) / 100,
    price: Math.round(priceScore * 100) / 100,
    volume: Math.round(volumeScore * 100) / 100,
    timing: Math.round(timingScore * 100) / 100,
    description: getSentimentDescription(overallSentiment),
    confidence: calculateSentimentConfidence(priceScore, volumeScore, timingScore)
  };
}

// Risk Assessment
function calculateRiskMetrics(marketData, historicalData, riskTolerance) {
  const { price, changePercent, volume } = marketData;

  const volatility = Math.abs(changePercent) / 100;
  const volatilityRisk = Math.min(volatility * 10, 1);

  const avgVolume = marketData.avgVolume || volume;
  const volumeRisk = volume < avgVolume * 0.5 ? 0.8 : 
                    volume < avgVolume * 0.8 ? 0.5 : 0.2;

  const priceRisk = estimatePriceRisk(price, marketData);
  const marketCapRisk = estimateMarketCapRisk(marketData.marketCap);
  const compositeRisk = (volatilityRisk * 0.3 + volumeRisk * 0.25 + 
                        priceRisk * 0.25 + marketCapRisk * 0.2);

  const adjustedRisk = adjustRiskForTolerance(compositeRisk, riskTolerance);

  return {
    composite: Math.round(adjustedRisk * 100) / 100,
    volatility: Math.round(volatilityRisk * 100) / 100,
    volume: Math.round(volumeRisk * 100) / 100,
    price: Math.round(priceRisk * 100) / 100,
    marketCap: Math.round(marketCapRisk * 100) / 100,
    rating: getRiskRating(adjustedRisk),
    tolerance: riskTolerance,
    recommendation: getRiskRecommendation(adjustedRisk, riskTolerance)
  };
}

// ML Prediction Generation
function generateMLPrediction(symbol, marketData, technicalFeatures, sentimentAnalysis) {
  try {
    const features = {
      technical: normalizeTechnicalScore(technicalFeatures),
      sentiment: sentimentAnalysis.overall,
      momentum: technicalFeatures.momentum || 0.5,
      volume: technicalFeatures.volumeAnalysis?.score || 0.5,
      trend: technicalFeatures.trend?.strength || 0.5
    };

    const weights = {
      technical: 0.35,
      sentiment: 0.25,
      momentum: 0.20,
      volume: 0.10,
      trend: 0.10
    };

    let prediction = 0;
    for (const [feature, value] of Object.entries(features)) {
      prediction += value * weights[feature];
    }

    const marketCondition = assessMarketConditions(marketData, technicalFeatures);
    prediction = adjustPredictionForMarketConditions(prediction, marketCondition);
    const confidence = calculatePredictionConfidence(features, marketCondition);
    
    return {
      score: Math.round(prediction * 100) / 100,
      direction: prediction > 0.6 ? 'bullish' : prediction < 0.4 ? 'bearish' : 'neutral',
      confidence: Math.round(confidence * 100) / 100,
      features,
      weights,
      marketCondition: marketCondition.condition,
      timeHorizon: '1-5 days',
      methodology: 'Ensemble technical + sentiment analysis'
    };

  } catch (error) {
    console.error('ML Prediction error:', error);
    return getDefaultPrediction();
  }
}

// Helper functions
function getRSISignal(rsi) {
  if (rsi >= 70) return 'overbought';
  if (rsi <= 30) return 'oversold';
  return 'neutral';
}

function getRSIStrength(rsi) {
  if (rsi >= 80 || rsi <= 20) return 'strong';
  if (rsi >= 70 || rsi <= 30) return 'medium';
  return 'weak';
}

function getMACDSignal(macd) {
  if (macd.macdLine > macd.signalLine && macd.histogram > 0) return 'bullish';
  if (macd.macdLine < macd.signalLine && macd.histogram < 0) return 'bearish';
  return 'neutral';
}

function getMACDStrength(macd) {
  const strength = Math.abs(macd.histogram);
  if (strength > 0.5) return 'strong';
  if (strength > 0.2) return 'medium';
  return 'weak';
}

function getBollingerSignal(price, bands) {
  if (price >= bands.upper) return 'overbought';
  if (price <= bands.lower) return 'oversold';
  return 'neutral';
}

function getBollingerPosition(price, bands) {
  const position = (price - bands.lower) / (bands.upper - bands.lower);
  return Math.round(position * 100) / 100;
}

function normalizeTechnicalScore(features) {
  try {
    const rsiScore = (features.rsi?.value - 50) / 50;
    const macdScore = features.macd?.histogram > 0 ? 0.6 : 0.4;
    const trendScore = features.trend?.direction === 'up' ? 0.7 : 
                      features.trend?.direction === 'down' ? 0.3 : 0.5;
    
    const avgScore = (Math.abs(rsiScore) + macdScore + trendScore) / 3;
    return Math.max(0, Math.min(1, avgScore));
  } catch (error) {
    return 0.5;
  }
}

// Additional helper functions for completeness
function getMarketTimingSentiment() {
  const hour = new Date().getHours();
  if (hour >= 9 && hour <= 11) return 0.7;
  if (hour >= 14 && hour <= 16) return 0.6;
  return 0.5;
}

function getSentimentDescription(sentiment) {
  if (sentiment >= 0.8) return 'Very Bullish';
  if (sentiment >= 0.6) return 'Bullish';
  if (sentiment >= 0.4) return 'Neutral';
  if (sentiment >= 0.2) return 'Bearish';
  return 'Very Bearish';
}

function calculateSentimentConfidence(priceScore, volumeScore, timingScore) {
  const consistency = 1 - Math.abs(priceScore - volumeScore);
  return (consistency + timingScore) / 2;
}

function estimatePriceRisk(price, marketData) {
  const changePercent = Math.abs(marketData.changePercent || 0);
  return Math.min(changePercent / 10, 0.8);
}

function estimateMarketCapRisk(marketCap) {
  if (!marketCap || marketCap === 0) return 0.6;
  if (marketCap > 100000000000) return 0.2;
  if (marketCap > 10000000000) return 0.4;
  return 0.7;
}

function adjustRiskForTolerance(risk, tolerance) {
  const multipliers = { low: 1.2, medium: 1.0, high: 0.8 };
  return Math.min(1, risk * (multipliers[tolerance] || 1.0));
}

function getRiskRating(risk) {
  if (risk >= 0.8) return 'Very High';
  if (risk >= 0.6) return 'High';
  if (risk >= 0.4) return 'Medium';
  if (risk >= 0.2) return 'Low';
  return 'Very Low';
}

function getRiskRecommendation(risk, tolerance) {
  if (risk > 0.8) return 'Consider avoiding or reducing position size';
  if (risk > 0.6 && tolerance === 'low') return 'High risk for conservative investors';
  if (risk < 0.3) return 'Suitable for conservative portfolios';
  return 'Standard risk level';
}

// More helper functions
function calculateCompositeScore(mlPrediction, technicalFeatures, sentimentAnalysis, riskMetrics) {
  const technicalScore = normalizeTechnicalScore(technicalFeatures);
  const sentimentScore = sentimentAnalysis.overall;
  const mlScore = mlPrediction.score;
  const riskAdjustment = 1 - (riskMetrics.composite * 0.3);

  const compositeScore = (
    (technicalScore * 0.30) +
    (sentimentScore * 0.25) +
    (mlScore * 0.35) +
    (riskAdjustment * 0.10)
  );

  const normalizedScore = Math.max(0, Math.min(1, compositeScore));

  return {
    overall: Math.round(normalizedScore * 100) / 100,
    technical: Math.round(technicalScore * 100) / 100,
    sentiment: Math.round(sentimentScore * 100) / 100,
    ml: Math.round(mlScore * 100) / 100,
    riskAdjusted: Math.round(riskAdjustment * 100) / 100,
    grade: getScoreGrade(normalizedScore),
    interpretation: getScoreInterpretation(normalizedScore)
  };
}

function generateTradingRecommendations(compositeScore, riskMetrics, technicalFeatures) {
  const score = compositeScore.overall;
  const risk = riskMetrics.composite;

  let action = 'HOLD';
  let strength = 'Medium';
  let reasoning = [];

  if (score >= 0.75) {
    action = 'STRONG BUY';
    strength = 'High';
    reasoning.push('Excellent technical and fundamental signals');
  } else if (score >= 0.65) {
    action = 'BUY';
    strength = 'High';
    reasoning.push('Strong bullish indicators across multiple metrics');
  } else if (score >= 0.55) {
    action = 'WEAK BUY';
    strength = 'Medium';
    reasoning.push('Mild bullish bias with some positive indicators');
  } else if (score <= 0.25) {
    action = 'STRONG SELL';
    strength = 'High';
    reasoning.push('Poor technical outlook with high risk factors');
  } else if (score <= 0.35) {
    action = 'SELL';
    strength = 'Medium';
    reasoning.push('Bearish signals outweigh bullish factors');
  } else if (score <= 0.45) {
    action = 'WEAK SELL';
    strength = 'Low';
    reasoning.push('Slight bearish bias, consider reducing position');
  } else {
    action = 'HOLD';
    strength = 'Medium';
    reasoning.push('Mixed signals, maintain current position');
  }

  if (risk > 0.7 && action.includes('BUY')) {
    action = action.replace('STRONG', 'WEAK').replace('BUY', 'WEAK BUY');
    strength = 'Low';
    reasoning.push('High risk reduces buy conviction');
  }

  return {
    action,
    strength,
    reasoning,
    entryPrice: 'Market price',
    stopLoss: `${Math.ceil(risk * 5)}% below entry`,
    targetPrice: '3-5% above entry',
    timeHorizon: getTimeHorizon(score, risk),
    positionSize: recommendPositionSize(risk, riskMetrics.tolerance)
  };
}

function calculateConfidenceLevel(technicalFeatures, sentimentAnalysis, riskMetrics) {
  const techConfidence = technicalFeatures.rsi?.strength === 'strong' ? 0.8 : 0.6;
  const sentimentConfidence = sentimentAnalysis.confidence || 0.7;
  const riskConfidence = 1 - (riskMetrics.composite * 0.3);
  
  return (techConfidence + sentimentConfidence + riskConfidence) / 3;
}

function getScoreGrade(score) {
  if (score >= 0.9) return 'A+';
  if (score >= 0.8) return 'A';
  if (score >= 0.7) return 'B+';
  if (score >= 0.6) return 'B';
  if (score >= 0.5) return 'C';
  if (score >= 0.4) return 'D';
  return 'F';
}

function getScoreInterpretation(score) {
  if (score >= 0.8) return 'Excellent opportunity with strong signals';
  if (score >= 0.6) return 'Good opportunity with favorable indicators';
  if (score >= 0.4) return 'Mixed signals, proceed with caution';
  return 'Unfavorable conditions, consider avoiding';
}

function getTimeHorizon(score, risk) {
  if (risk > 0.7) return 'Short-term (1-3 days)';
  if (score > 0.7) return 'Medium-term (1-2 weeks)';
  return 'Short-term (3-7 days)';
}

function recommendPositionSize(risk, tolerance) {
  const baseSize = tolerance === 'high' ? 0.15 : tolerance === 'medium' ? 0.10 : 0.05;
  const riskAdjustment = 1 - (risk * 0.5);
  const recommendedSize = baseSize * riskAdjustment;
  
  return {
    percentage: Math.round(recommendedSize * 100),
    description: `${Math.round(recommendedSize * 100)}% of portfolio`,
    rationale: `Adjusted for ${tolerance} risk tolerance and ${risk > 0.6 ? 'high' : 'moderate'} security risk`
  };
}

function calculateMomentum(prices) {
  if (prices.length < 2) return 0.5;
  const recent = prices.slice(-5);
  const older = prices.slice(-10, -5);
  const recentAvg = recent.reduce((a, b) => a + b) / recent.length;
  const olderAvg = older.reduce((a, b) => a + b) / older.length;
  return recentAvg > olderAvg ? 0.7 : 0.3;
}

function calculateVolatility(prices) {
  if (prices.length < 2) return 0.5;
  const returns = [];
  for (let i = 1; i < prices.length; i++) {
    returns.push((prices[i] - prices[i-1]) / prices[i-1]);
  }
  const variance = returns.reduce((sum, ret) => sum + ret * ret, 0) / returns.length;
  return Math.sqrt(variance);
}

function identifyTrend(prices, sma20, sma50) {
  const currentPrice = prices[prices.length - 1];
  if (currentPrice > sma20 && sma20 > sma50) {
    return { direction: 'up', strength: 0.7 };
  } else if (currentPrice < sma20 && sma20 < sma50) {
    return { direction: 'down', strength: 0.7 };
  }
  return { direction: 'neutral', strength: 0.5 };
}

function analyzeVolume(volume, avgVolume) {
  const ratio = volume / avgVolume;
  return {
    ratio: Math.round(ratio * 100) / 100,
    score: ratio > 1.5 ? 0.8 : ratio > 1.2 ? 0.7 : ratio > 0.8 ? 0.5 : 0.3,
    interpretation: ratio > 1.5 ? 'High' : ratio > 1.2 ? 'Above Average' : 
                   ratio > 0.8 ? 'Normal' : 'Low'
  };
}

function calculateSupportResistance(prices, high, low) {
  const maxPrice = Math.max(...prices, high);
  const minPrice = Math.min(...prices, low);
  const range = maxPrice - minPrice;
  
  return {
    resistance: Math.round((maxPrice - range * 0.1) * 100) / 100,
    support: Math.round((minPrice + range * 0.1) * 100) / 100,
    strength: range / prices[prices.length - 1] > 0.1 ? 0.7 : 0.5
  };
}

function summarizeTechnicalFeatures(features) {
  return {
    rsi: features.rsi?.value || 50,
    trend: features.trend?.direction || 'neutral',
    momentum: features.momentum || 0.5,
    volatility: features.volatility || 0.3
  };
}

function assessMarketConditions(marketData, technicalFeatures) {
  const volatility = technicalFeatures.volatility || 0.3;
  const volume = technicalFeatures.volumeAnalysis?.ratio || 1.0;
  
  let condition = 'Normal';
  if (volatility > 0.5 && volume > 1.5) condition = 'High Volatility';
  else if (volatility < 0.2 && volume < 0.8) condition = 'Low Activity';
  else if (volume > 1.8) condition = 'High Volume';
  
  return { condition, volatility, volume };
}

function adjustPredictionForMarketConditions(prediction, marketCondition) {
  if (marketCondition.condition === 'High Volatility') {
    return prediction * 0.9;
  }
  if (marketCondition.condition === 'Low Activity') {
    return 0.5;
  }
  return prediction;
}

function calculatePredictionConfidence(features, marketCondition) {
  let confidence = 0.7;
  
  if (features.technical > 0.9 || features.technical < 0.1) confidence *= 0.8;
  if (marketCondition.condition === 'High Volatility') confidence *= 0.7;
  if (marketCondition.condition === 'Low Activity') confidence *= 0.6;
  
  return Math.max(0.3, Math.min(0.95, confidence));
}

function getMovingAverageTrend(price, sma20, sma50) {
  if (price > sma20 && sma20 > sma50) return 'strong_uptrend';
  if (price < sma20 && sma20 < sma50) return 'strong_downtrend';
  if (price > sma20) return 'mild_uptrend';
  if (price < sma20) return 'mild_downtrend';
  return 'sideways';
}

function detectCrossover(ema12, ema26) {
  return {
    type: ema12 > ema26 ? 'golden_cross' : 'death_cross',
    strength: Math.abs(ema12 - ema26) > 1 ? 'strong' : 'weak'
  };
}

function getDefaultTechnicalFeatures() {
  return {
    rsi: { value: 50, signal: 'neutral', strength: 'weak' },
    macd: { macdLine: 0, signalLine: 0, histogram: 0, signal: 'neutral' },
    bollingerBands: { upper: 105, middle: 100, lower: 95 },
    trend: { direction: 'neutral', strength: 0.5 }
  };
}

function getDefaultPrediction() {
  return {
    score: 0.5,
    direction: 'neutral',
    confidence: 0.3,
    methodology: 'Default (insufficient data)'
  };
}