import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const CandidateScoreChart = ({ candidates }) => {
  // Process data for chart
  const prepareChartData = () => {
    const scoreRanges = [
      { name: '90-100', range: [90, 100], count: 0, color: '#10B981' }, // Green
      { name: '80-89', range: [80, 89], count: 0, color: '#60A5FA' },   // Blue
      { name: '70-79', range: [70, 79], count: 0, color: '#FBBF24' },   // Yellow
      { name: '60-69', range: [60, 69], count: 0, color: '#F97316' },   // Orange
      { name: 'Below 60', range: [0, 59], count: 0, color: '#EF4444' }  // Red
    ];
    
    // Count candidates in each score range
    candidates.forEach(candidate => {
      const score = candidate.score;
      const range = scoreRanges.find(
        r => score >= r.range[0] && score <= r.range[1]
      );
      
      if (range) {
        range.count += 1;
      }
    });
    
    return scoreRanges;
  };
  
  const chartData = prepareChartData();
  
  // Custom tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 border border-gray-200 shadow-sm rounded-md text-xs">
          <p className="font-medium">{payload[0].payload.name}</p>
          <p>
            <span className="font-medium">Count:</span> {payload[0].value}
          </p>
          <p>
            <span className="font-medium">Percentage:</span> {(payload[0].value / candidates.length * 100).toFixed(1)}%
          </p>
        </div>
      );
    }
    
    return null;
  };
  
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={chartData}
        margin={{
          top: 5,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis 
          allowDecimals={false} 
          label={{ 
            value: 'Number of Candidates', 
            angle: -90, 
            position: 'insideLeft',
            style: { textAnchor: 'middle' } 
          }} 
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        <Bar 
          dataKey="count" 
          name="Candidates" 
          fill="#0077B5" 
          radius={[4, 4, 0, 0]}
          barSize={40}
        />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default CandidateScoreChart;