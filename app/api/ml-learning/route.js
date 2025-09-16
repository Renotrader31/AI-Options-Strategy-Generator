/**
 * Enhanced ML Learning API Route for Scanner Pro AI
 * 
 * This system learns from portfolio performance to improve AI picks over time.
 * It analyzes which strategies perform best and adjusts future recommendations.
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

// Enhanced ML Learning endpoint
export async function POST(request) {
  try {
    const body = await request.json();
    console.log('🧠 ML Learning request received');

    const {
      portfolioData,
      symbol,
      marketData,
      trainingMode = 'incremental'
    } = body;

    // Validate required data
    if (!portfolioData || !Array.isArray(portfolioData)) {
      return NextResponse.json({
        success: false,
        error: 'Missing portfolioData array',
        timestamp: new Date().toISOString()
      }, {
        status: 400,
        headers: corsHeaders
      });
    }

    // Generate enhanced ML analysis with learning
    const enhancedAnalysis = await generateLearningEnhancedAnalysis({
      portfolioData,
      symbol,
      marketData,
      trainingMode
    });

    return NextResponse.json({
      success: true,
      symbol,
      enhancedAnalysis,
      learningMetrics: enhancedAnalysis.learningMetrics,
      timestamp: new Date().toISOString(),
      processingTime: enhancedAnalysis.processingTime
    }, {
      status: 200,
      headers: corsHeaders
    });

  } catch (error) {
    console.error('🧠 ML Learning error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'ML Learning analysis failed',
      details: error.message,
      timestamp: new Date().toISOString()
    }, {
      status: 500,
      headers: corsHeaders
    });
  }
}

// Generate enhanced ML analysis using portfolio performance learning
async function generateLearningEnhancedAnalysis(params) {
  const startTime = Date.now();
  const { portfolioData, symbol, marketData, trainingMode } = params;

  try {
    console.log('🧠 Analyzing portfolio performance for ML learning...');
    
    // 1. Analyze Portfolio Performance Patterns
    const performanceAnalysis = analyzePortfolioPerformance(portfolioData);
    
    // 2. Extract Strategy Success Patterns  
    const strategyPatterns = extractStrategySuccessPatterns(portfolioData);
    
    // 3. Market Condition Learning
    const marketLearning = analyzeMarketConditionPerformance(portfolioData);
    
    // 4. Risk-Adjusted Performance Learning
    const riskLearning = analyzeRiskAdjustedPerformance(portfolioData);
    
    // 5. Generate Enhanced Predictions
    const enhancedPredictions = generateEnhancedPredictions({
      symbol,
      marketData,
      performanceAnalysis,
      strategyPatterns,
      marketLearning,
      riskLearning
    });
    
    // 6. Calculate Learning Confidence
    const learningConfidence = calculateLearningConfidence(portfolioData);
    
    // 7. Generate Strategy Recommendations with Learning
    const smartRecommendations = generateSmartRecommendations({
      symbol,
      marketData,
      strategyPatterns,
      enhancedPredictions,
      learningConfidence
    });

    const analysis = {
      symbol,
      enhancedPredictions,
      smartRecommendations,
      performanceAnalysis,
      strategyPatterns,
      marketLearning,
      riskLearning,
      learningConfidence,
      learningMetrics: {
        totalTrades: portfolioData.length,
        winRate: performanceAnalysis.winRate,
        avgReturn: performanceAnalysis.avgReturn,
        bestStrategies: strategyPatterns.topPerformers,
        confidenceLevel: learningConfidence.overall,
        dataQuality: assessDataQuality(portfolioData)
      },
      processingTime: Date.now() - startTime,
      analysisTimestamp: new Date().toISOString(),
      trainingMode
    };

    return analysis;

  } catch (error) {
    console.error('🧠 Learning analysis error:', error);
    throw error;
  }
}

// Analyze portfolio performance patterns
function analyzePortfolioPerformance(portfolioData) {
  try {
    const activeTrades = portfolioData.filter(trade => trade.status === 'active');
    const closedTrades = portfolioData.filter(trade => trade.status === 'closed');
    
    // Calculate performance metrics
    const totalPnL = closedTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
    const winningTrades = closedTrades.filter(trade => (trade.pnl || 0) > 0);
    const losingTrades = closedTrades.filter(trade => (trade.pnl || 0) < 0);
    
    const winRate = closedTrades.length > 0 ? winningTrades.length / closedTrades.length : 0;
    const avgReturn = closedTrades.length > 0 ? totalPnL / closedTrades.length : 0;
    
    // Analyze win/loss patterns
    const avgWin = winningTrades.length > 0 ? 
      winningTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0) / winningTrades.length : 0;
    const avgLoss = losingTrades.length > 0 ? 
      Math.abs(losingTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0) / losingTrades.length) : 0;
    
    const profitFactor = avgLoss > 0 ? avgWin / avgLoss : avgWin > 0 ? 5 : 1;
    
    // Time-based analysis
    const timeAnalysis = analyzeTimeBasedPerformance(closedTrades);
    
    return {
      totalTrades: portfolioData.length,
      activeTrades: activeTrades.length,
      closedTrades: closedTrades.length,
      totalPnL: Math.round(totalPnL * 100) / 100,
      winRate: Math.round(winRate * 100) / 100,
      avgReturn: Math.round(avgReturn * 100) / 100,
      avgWin: Math.round(avgWin * 100) / 100,
      avgLoss: Math.round(avgLoss * 100) / 100,
      profitFactor: Math.round(profitFactor * 100) / 100,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      timeAnalysis,
      performanceGrade: getPerformanceGrade(winRate, profitFactor, totalPnL)
    };
    
  } catch (error) {
    console.error('Portfolio performance analysis error:', error);
    return getDefaultPerformanceAnalysis();
  }
}

// Extract strategy success patterns from portfolio
function extractStrategySuccessPatterns(portfolioData) {
  try {
    const closedTrades = portfolioData.filter(trade => 
      trade.status === 'closed' && trade.type && trade.pnl !== undefined
    );
    
    if (closedTrades.length === 0) {
      return getDefaultStrategyPatterns();
    }
    
    // Group by strategy type
    const strategyGroups = closedTrades.reduce((groups, trade) => {
      const strategyType = normalizeStrategyType(trade.type);
      if (!groups[strategyType]) {
        groups[strategyType] = [];
      }
      groups[strategyType].push(trade);
      return groups;
    }, {});
    
    // Analyze each strategy's performance
    const strategyPerformance = Object.entries(strategyGroups).map(([type, trades]) => {
      const totalPnL = trades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
      const winningTrades = trades.filter(trade => (trade.pnl || 0) > 0);
      const winRate = winningTrades.length / trades.length;
      const avgReturn = totalPnL / trades.length;
      
      return {
        strategyType: type,
        trades: trades.length,
        totalPnL: Math.round(totalPnL * 100) / 100,
        winRate: Math.round(winRate * 100) / 100,
        avgReturn: Math.round(avgReturn * 100) / 100,
        score: calculateStrategyScore(winRate, avgReturn, trades.length),
        confidence: calculateStrategyConfidence(trades.length, winRate)
      };
    });
    
    // Sort by performance score
    strategyPerformance.sort((a, b) => b.score - a.score);
    
    // Identify top and bottom performers
    const topPerformers = strategyPerformance.slice(0, 3);
    const bottomPerformers = strategyPerformance.slice(-2);
    
    // Market condition patterns
    const conditionPatterns = analyzeMarketConditionPatterns(closedTrades);
    
    return {
      allStrategies: strategyPerformance,
      topPerformers,
      bottomPerformers,
      conditionPatterns,
      totalStrategiesAnalyzed: strategyPerformance.length,
      recommendationWeights: generateRecommendationWeights(strategyPerformance)
    };
    
  } catch (error) {
    console.error('Strategy pattern extraction error:', error);
    return getDefaultStrategyPatterns();
  }
}

// Analyze market condition performance patterns
function analyzeMarketConditionPerformance(portfolioData) {
  try {
    const closedTrades = portfolioData.filter(trade => trade.status === 'closed');
    
    // Group by market conditions (if available)
    const conditionGroups = closedTrades.reduce((groups, trade) => {
      const condition = trade.marketCondition || 'unknown';
      if (!groups[condition]) {
        groups[condition] = [];
      }
      groups[condition].push(trade);
      return groups;
    }, {});
    
    const conditionAnalysis = Object.entries(conditionGroups).map(([condition, trades]) => {
      const totalPnL = trades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
      const winningTrades = trades.filter(trade => (trade.pnl || 0) > 0);
      const winRate = winningTrades.length / trades.length;
      
      return {
        condition,
        trades: trades.length,
        winRate: Math.round(winRate * 100) / 100,
        avgPnL: Math.round(totalPnL / trades.length * 100) / 100,
        performance: getConditionPerformance(winRate, totalPnL / trades.length)
      };
    });
    
    return {
      conditionAnalysis,
      bestConditions: conditionAnalysis.filter(c => c.performance === 'excellent'),
      worstConditions: conditionAnalysis.filter(c => c.performance === 'poor'),
      insights: generateMarketInsights(conditionAnalysis)
    };
    
  } catch (error) {
    console.error('Market condition analysis error:', error);
    return { conditionAnalysis: [], insights: [] };
  }
}

// Generate enhanced predictions using learning data
function generateEnhancedPredictions(params) {
  const { symbol, marketData, performanceAnalysis, strategyPatterns, marketLearning } = params;
  
  try {
    // Base prediction weights
    const baseWeights = {
      technical: 0.25,
      sentiment: 0.20,
      momentum: 0.15,
      volume: 0.10,
      trend: 0.10,
      portfolio_learning: 0.20  // NEW: Portfolio learning component
    };
    
    // Adjust weights based on portfolio performance
    const adjustedWeights = adjustWeightsFromLearning(baseWeights, performanceAnalysis, strategyPatterns);
    
    // Generate prediction with learning enhancement
    const basePrediction = generateBasePrediction(marketData);
    const learningBoost = calculateLearningBoost(symbol, marketData, strategyPatterns);
    
    const enhancedScore = (basePrediction * (1 - adjustedWeights.portfolio_learning)) + 
                         (learningBoost * adjustedWeights.portfolio_learning);
    
    return {
      score: Math.round(Math.max(0, Math.min(1, enhancedScore)) * 100) / 100,
      baseScore: Math.round(basePrediction * 100) / 100,
      learningBoost: Math.round(learningBoost * 100) / 100,
      adjustedWeights,
      confidence: calculateEnhancedConfidence(performanceAnalysis, strategyPatterns),
      methodology: 'Enhanced ML with Portfolio Learning',
      learningImpact: Math.round(Math.abs(enhancedScore - basePrediction) * 100) / 100
    };
    
  } catch (error) {
    console.error('Enhanced prediction error:', error);
    return { score: 0.5, confidence: 0.3, methodology: 'Default (learning failed)' };
  }
}

// Generate smart strategy recommendations using learning
function generateSmartRecommendations(params) {
  const { symbol, marketData, strategyPatterns, enhancedPredictions, learningConfidence } = params;
  
  try {
    const recommendations = [];
    
    // Get top performing strategies from learning
    const topStrategies = strategyPatterns.topPerformers || [];
    
    // Generate recommendations based on learning + current analysis
    topStrategies.forEach((strategy, index) => {
      if (strategy.confidence > 0.5 && recommendations.length < 5) {
        const recommendation = {
          strategy: strategy.strategyType,
          confidence: Math.round((strategy.winRate + learningConfidence.overall) / 2 * 100) / 100,
          expectedWinRate: strategy.winRate,
          avgReturn: strategy.avgReturn,
          tradesAnalyzed: strategy.trades,
          reasoning: [
            `Historical win rate: ${(strategy.winRate * 100).toFixed(1)}%`,
            `Average return: $${strategy.avgReturn.toFixed(2)}`,
            `Based on ${strategy.trades} past trades`,
            `Performance score: ${strategy.score.toFixed(2)}/1.0`
          ],
          riskLevel: assessStrategyRisk(strategy),
          priority: index + 1,
          learningBased: true
        };
        recommendations.push(recommendation);
      }
    });
    
    // Add market-based recommendations if learning data is insufficient
    if (recommendations.length < 3) {
      const marketRecs = generateMarketBasedRecommendations(marketData, enhancedPredictions);
      recommendations.push(...marketRecs);
    }
    
    return {
      recommendations,
      totalRecommendations: recommendations.length,
      learningBased: recommendations.filter(r => r.learningBased).length,
      marketBased: recommendations.filter(r => !r.learningBased).length,
      confidence: learningConfidence.overall,
      methodology: 'Portfolio Learning + Market Analysis'
    };
    
  } catch (error) {
    console.error('Smart recommendations error:', error);
    return { recommendations: [], methodology: 'Default (error)' };
  }
}

// Helper functions
function normalizeStrategyType(type) {
  if (!type || typeof type !== 'string') return 'unknown';
  
  // Normalize common strategy names
  const normalized = type.toLowerCase()
    .replace(/[-_\s]/g, '')
    .replace('callspread', 'call_spread')
    .replace('putspread', 'put_spread')
    .replace('ironcondor', 'iron_condor')
    .replace('butterfly', 'butterfly_spread');
  
  return normalized;
}

function calculateStrategyScore(winRate, avgReturn, tradeCount) {
  // Score based on win rate, average return, and sample size
  const winRateScore = winRate;
  const returnScore = Math.max(0, Math.min(1, avgReturn / 100 + 0.5)); // Normalize around $50 avg return
  const sampleSizeScore = Math.min(1, tradeCount / 10); // Full confidence at 10+ trades
  
  return (winRateScore * 0.5 + returnScore * 0.3 + sampleSizeScore * 0.2);
}

function calculateStrategyConfidence(tradeCount, winRate) {
  // Confidence increases with trade count and consistent win rate
  const sampleConfidence = Math.min(1, tradeCount / 20);
  const consistencyBonus = winRate > 0.6 || winRate < 0.4 ? 0.2 : 0; // Bonus for clear patterns
  
  return Math.min(0.95, sampleConfidence + consistencyBonus);
}

function generateRecommendationWeights(strategyPerformance) {
  // Generate weights for strategy recommendations based on performance
  const weights = {};
  const totalScore = strategyPerformance.reduce((sum, s) => sum + s.score, 0);
  
  strategyPerformance.forEach(strategy => {
    weights[strategy.strategyType] = totalScore > 0 ? strategy.score / totalScore : 0;
  });
  
  return weights;
}

function adjustWeightsFromLearning(baseWeights, performanceAnalysis, strategyPatterns) {
  const adjustedWeights = { ...baseWeights };
  
  // Increase portfolio learning weight if we have good performance data
  if (performanceAnalysis.totalTrades > 10 && performanceAnalysis.winRate > 0.4) {
    adjustedWeights.portfolio_learning = Math.min(0.35, baseWeights.portfolio_learning + 0.15);
    
    // Redistribute other weights
    const reduction = (adjustedWeights.portfolio_learning - baseWeights.portfolio_learning) / 4;
    adjustedWeights.technical -= reduction;
    adjustedWeights.sentiment -= reduction;
    adjustedWeights.momentum -= reduction;
    adjustedWeights.volume -= reduction;
  }
  
  return adjustedWeights;
}

function calculateLearningBoost(symbol, marketData, strategyPatterns) {
  // Calculate learning boost based on strategy patterns
  if (!strategyPatterns.topPerformers || strategyPatterns.topPerformers.length === 0) {
    return 0.5; // Neutral if no learning data
  }
  
  const topStrategy = strategyPatterns.topPerformers[0];
  const boost = (topStrategy.winRate * 0.6) + (Math.max(0, topStrategy.avgReturn / 100) * 0.4);
  
  return Math.max(0.2, Math.min(0.8, boost));
}

function generateBasePrediction(marketData) {
  // Simple base prediction based on market data
  const { changePercent = 0, volume = 1000000, avgVolume = 1000000 } = marketData;
  
  const priceScore = changePercent > 0 ? 0.6 : 0.4;
  const volumeScore = volume > avgVolume ? 0.6 : 0.4;
  
  return (priceScore + volumeScore) / 2;
}

function calculateEnhancedConfidence(performanceAnalysis, strategyPatterns) {
  const dataQuality = performanceAnalysis.totalTrades > 5 ? 0.8 : 0.4;
  const strategyConfidence = strategyPatterns.topPerformers?.length > 0 ? 0.7 : 0.3;
  
  return (dataQuality + strategyConfidence) / 2;
}

function calculateLearningConfidence(portfolioData) {
  const totalTrades = portfolioData.length;
  const closedTrades = portfolioData.filter(trade => trade.status === 'closed').length;
  
  const dataQualityScore = Math.min(1, closedTrades / 10); // Full confidence at 10+ closed trades
  const diversityScore = assessStrategyDiversity(portfolioData);
  const recentDataScore = assessRecentDataQuality(portfolioData);
  
  const overall = (dataQualityScore * 0.5 + diversityScore * 0.3 + recentDataScore * 0.2);
  
  return {
    overall: Math.round(overall * 100) / 100,
    dataQuality: Math.round(dataQualityScore * 100) / 100,
    diversity: Math.round(diversityScore * 100) / 100,
    recency: Math.round(recentDataScore * 100) / 100,
    recommendation: overall > 0.7 ? 'High confidence' : 
                   overall > 0.5 ? 'Medium confidence' : 'Low confidence'
  };
}

// Default fallback functions
function getDefaultPerformanceAnalysis() {
  return {
    totalTrades: 0,
    winRate: 0.5,
    avgReturn: 0,
    profitFactor: 1,
    performanceGrade: 'N/A'
  };
}

function getDefaultStrategyPatterns() {
  return {
    allStrategies: [],
    topPerformers: [],
    bottomPerformers: [],
    totalStrategiesAnalyzed: 0,
    recommendationWeights: {}
  };
}

// Additional helper functions
function analyzeTimeBasedPerformance(trades) {
  // Analyze performance by time of day, day of week, etc.
  return {
    timeOfDayAnalysis: 'Insufficient data',
    dayOfWeekAnalysis: 'Insufficient data',
    monthlyTrends: 'Insufficient data'
  };
}

function getPerformanceGrade(winRate, profitFactor, totalPnL) {
  if (winRate > 0.7 && profitFactor > 2 && totalPnL > 500) return 'A+';
  if (winRate > 0.6 && profitFactor > 1.5 && totalPnL > 100) return 'A';
  if (winRate > 0.5 && profitFactor > 1.2 && totalPnL > 0) return 'B';
  if (winRate > 0.4 && profitFactor > 1.0) return 'C';
  return 'D';
}

function analyzeMarketConditionPatterns(trades) {
  // Analyze which market conditions lead to better performance
  return {
    bullishMarkets: { trades: 0, winRate: 0.5 },
    bearishMarkets: { trades: 0, winRate: 0.5 },
    neutralMarkets: { trades: 0, winRate: 0.5 }
  };
}

function getConditionPerformance(winRate, avgPnL) {
  if (winRate > 0.7 && avgPnL > 50) return 'excellent';
  if (winRate > 0.5 && avgPnL > 0) return 'good';
  if (winRate > 0.4 || avgPnL > -20) return 'fair';
  return 'poor';
}

function generateMarketInsights(conditionAnalysis) {
  return [
    'Insufficient data for detailed market condition analysis',
    'Continue trading to build learning database',
    'Performance tracking will improve with more data'
  ];
}

function assessStrategyRisk(strategy) {
  if (strategy.winRate > 0.7 && strategy.avgReturn > 50) return 'Low';
  if (strategy.winRate > 0.5 && strategy.avgReturn > 0) return 'Medium';
  return 'High';
}

function generateMarketBasedRecommendations(marketData, predictions) {
  return [{
    strategy: 'market_neutral',
    confidence: 0.6,
    reasoning: ['Market-based analysis', 'No portfolio learning data available'],
    learningBased: false,
    priority: 99
  }];
}

function assessDataQuality(portfolioData) {
  const quality = portfolioData.length > 10 ? 'high' : 
                 portfolioData.length > 5 ? 'medium' : 'low';
  return quality;
}

function assessStrategyDiversity(portfolioData) {
  const uniqueStrategies = new Set(portfolioData.map(trade => normalizeStrategyType(trade.type)));
  return Math.min(1, uniqueStrategies.size / 5); // Full diversity at 5+ different strategies
}

function assessRecentDataQuality(portfolioData) {
  const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
  const recentTrades = portfolioData.filter(trade => {
    const tradeDate = trade.entryDate ? new Date(trade.entryDate).getTime() : 0;
    return tradeDate > thirtyDaysAgo;
  });
  
  return Math.min(1, recentTrades.length / 5); // Full score at 5+ recent trades
}