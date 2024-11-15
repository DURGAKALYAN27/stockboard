import React, { useState, useEffect, useRef } from 'react';
import { Line } from 'react-chartjs-2';
import Chart from 'chart.js/auto';
import 'chartjs-adapter-date-fns';
import Spinner from '../components/Spinner';
import BACKENDURL from '../constant';

const TradeChart = () => {
    const [trades, setTrades] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const chartRef = useRef(null);
    const timeoutRef = useRef(null);

    useEffect(() => {
        const eventSource = new EventSource(`${BACKENDURL}/api/finnhub/trades`);
        let hasReceivedData = false;

        // Set up 10-second timeout
        timeoutRef.current = setTimeout(() => {
            if (!hasReceivedData) {
                setError('API server is not responding. Please try again later.');
                setLoading(false);
                eventSource.close();
            }
        }, 10000);

        eventSource.onmessage = (event) => {
            try {
                hasReceivedData = true;
                // Clear timeout since we received data
                if (timeoutRef.current) {
                    clearTimeout(timeoutRef.current);
                }

                const data = JSON.parse(event.data);
                if (data.type === 'trade') {
                    const tradeData = data.data.map(trade => ({
                        price: trade.p,
                        volume: trade.v,
                        timestamp: new Date(trade.t),
                        conditions: trade.c.join(', '),
                        symbol: trade.s
                    }));
                    setTrades(prevTrades => [...prevTrades, ...tradeData]);
                    setLoading(false);
                }
            } catch (error) {
                console.error('Error parsing message:', error);
                setError('Error processing trade data');
                setLoading(false);
            }
        };

        eventSource.onerror = (event) => {
            console.error('EventSource error:', event);
            setError('Connection error occurred');
            setLoading(false);
            eventSource.close();
        };

        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
            eventSource.close();
        };
    }, []);

    useEffect(() => {
        if (chartRef.current && chartRef.current.chartInstance) {
            chartRef.current.chartInstance.destroy();
        }
    }, [trades]);

    const chartData = {
        labels: trades.map(trade => trade.timestamp),
        datasets: [
            {
                label: 'Price',
                data: trades.map(trade => trade.price),
                borderColor: '#00ADB5',
                backgroundColor: 'rgba(0, 173, 181, 0.2)',
                borderWidth: 2,
                fill: true,
                tension: 0.1,
            }
        ]
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            title: {
                display: true,
                text: trades.length > 0 ? `Symbol : ${trades[0].symbol}` : 'Trade Chart',
                color: '#EEEEEE',
                font: {
                    size: 20
                }
            },
            legend: {
                display: true,
                position: 'top',
                labels: {
                    color: '#CCCCCC',
                }
            },
            tooltip: {
                callbacks: {
                    label: function(tooltipItem) {
                        return `Price: $${tooltipItem.raw}`;
                    }
                }
            }
        },
        scales: {
            x: {
                type: 'time',
                time: {
                    unit: 'minute'
                },
                ticks: {
                    color: '#CCCCCC',
                },
                grid: {
                    color: '#555555'
                }
            },
            y: {
                ticks: {
                    color: '#CCCCCC',
                },
                grid: {
                    color: '#555555'
                }
            }
        }
    };

    if (error) return (
        <div className="px-6 bg-gray-900 shadow-md py-20 h-screen">
            <div className="text-red-500 text-center py-4 text-lg">
                {error}
            </div>
        </div>
    );
    
    if (loading) return (
        <div className="px-6 bg-gray-900 shadow-md py-20 h-screen">
            <Spinner height="300px" />
        </div>
    );

    return (
        <div className="px-6 bg-gray-900 shadow-md py-20 h-screen">
            <h1 className="text-xl font-semibold mb-4 text-white">Trade Chart</h1>
            <div className="relative w-full h-80">
                <Line ref={chartRef} data={chartData} options={chartOptions} />
            </div>
        </div>
    );
};

export default TradeChart;