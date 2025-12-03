import React, { useState, useEffect, useRef } from 'react';
import {
    useTheme,
  } from "@/lib/store"; 
import './TradingViewChart.css';

const TradingViewChart = ({ symbol = "BINANCE:RUNEUSDT" }) => {
  const [scriptAdded, setScriptAdded] = useState(false);
  const chartContainerRef = useRef(null);
  
  const theme = useTheme();

  const chartColors = React.useMemo(() => {
    switch (theme) {
      case 'dark':
        return {
          background: 'rgba(0, 0, 0, 0)',
          textColor: '#ffffff',
          gridColor: '#444',
          lineColor: '#2962FF',
        };
      case 'BlueElectra':
        return {
          background: 'rgba(0, 0, 0, 0)',
          textColor: '#00d4ff',
          gridColor: '#142850',
          lineColor: '#00d4ff',
        };
      default:
        return {
          background: 'rgba(0, 0, 0, 0)',
          textColor: '#000000',
          gridColor: '#ddd',
          lineColor: '#2962FF',
        };
    }
  }, [theme]);

  const loadChart = React.useCallback(() => {
    if (!chartContainerRef.current) return;

    if (scriptAdded && chartContainerRef.current) {
      chartContainerRef.current.innerHTML = '';
    }

    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.async = true;
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-symbol-overview.js';
    
    script.innerHTML = JSON.stringify({
      symbols: [
        [`${symbol}|1M`],
        [symbol.includes('USDT') ? `${symbol.replace('USDT', 'BTC')}|1M` : `${symbol}BTC|1M`]
      ],
      chartOnly: false,
      width: '100%',
      height: '100%',
      locale: 'en',
      colorTheme: theme === 'light' ? 'light' : 'dark',
      autosize: true,
      showVolume: false,
      showMA: false,
      hideDateRanges: false,
      hideMarketStatus: false,
      hideSymbolLogo: false,
      scalePosition: 'right',
      scaleMode: 'Normal',
      fontFamily: `-apple-system, BlinkMacSystemFont, Trebuchet MS, Roboto, Ubuntu, sans-serif`,
      fontSize: '10',
      noTimeScale: false,
      valuesTracking: '1',
      changeMode: 'price-and-percent',
      chartType: 'area',
      backgroundColor: chartColors.background,
      textColor: chartColors.textColor,
      gridColor: chartColors.gridColor,
      maLineColor: chartColors.lineColor,
      maLineWidth: 1,
      maLength: 9,
      headerFontSize: 'medium',
      lineWidth: 2,
      lineType: 0,
      dateRanges: ['1w|60', '1m|30', '3m|60', '12m|1D', '60m|1W', 'all|1M'],
    });

    chartContainerRef.current.appendChild(script);
    setScriptAdded(true);
  }, [symbol, theme, chartColors, scriptAdded]);

  useEffect(() => {
    loadChart();
  }, [loadChart]);

  useEffect(() => {
    if (scriptAdded) {
      const timer = setTimeout(() => {
        loadChart();
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [theme, loadChart, scriptAdded]);

  return (
    <div className="tradingview-widget-container">
      <div 
        id="tradingview-chart" 
        ref={chartContainerRef}
      />
    </div>
  );
};

export default TradingViewChart;