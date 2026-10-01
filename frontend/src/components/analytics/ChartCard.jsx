import React, { useState, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar, Doughnut, Pie } from 'react-chartjs-2';
import {
  Download,
  Table as TableIcon,
  BarChart3,
  Maximize2,
  Info,
  AlertCircle,
  FileSpreadsheet
} from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export const ChartCard = ({
  title,
  subtitle,
  type = 'bar', // 'bar', 'horizontalBar', 'stackedBar', 'line', 'doughnut', 'pie'
  data,
  loading = false,
  error = null,
  height = 240,
  unit = '',
  onElementClick,
  drilldownType
}) => {
  const [showTable, setShowTable] = useState(false);
  const chartRef = useRef(null);

  // Fallback empty state
  if (loading) {
    return (
      <div className="maritime-card" style={{ padding: '20px', minHeight: `${height + 80}px`, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        <div className="spinner" style={{ width: '28px', height: '28px', borderTopColor: '#0284c7', marginBottom: '12px' }}></div>
        <div style={{ fontSize: '12px', color: '#64748b' }}>Loading analytics data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="maritime-card" style={{ padding: '20px', minHeight: `${height + 80}px`, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
        <AlertCircle size={28} color="#dc2626" style={{ marginBottom: '8px' }} />
        <div style={{ fontSize: '13px', fontWeight: 700, color: '#991b1b' }}>Failed to load chart</div>
        <div style={{ fontSize: '11px', color: '#b91c1c', marginTop: '4px' }}>{error}</div>
      </div>
    );
  }

  if (!data || !data.datasets || data.datasets.length === 0 || !data.labels || data.labels.length === 0) {
    return (
      <div className="maritime-card" style={{ padding: '20px', minHeight: `${height + 80}px`, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
        <BarChart3 size={32} color="#94a3b8" style={{ marginBottom: '8px' }} />
        <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>{title}</div>
        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>No recorded activity for the selected filters.</div>
      </div>
    );
  }

  // Export Chart Canvas as PNG image
  const handleExportPng = () => {
    if (chartRef.current) {
      const url = chartRef.current.toBase64Image();
      const link = document.createElement('a');
      link.download = `${title.toLowerCase().replace(/\s+/g, '-')}-chart.png`;
      link.href = url;
      link.click();
    }
  };

  // Export Dataset as CSV file
  const handleExportCsv = () => {
    const headers = ['Category / Label', ...data.datasets.map(d => d.label || 'Value')];
    const rows = data.labels.map((lbl, idx) => {
      return [lbl, ...data.datasets.map(d => d.data[idx] ?? '')];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${title.toLowerCase().replace(/\s+/g, '-')}-data.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Common Chart.js options
  const isHorizontal = type === 'horizontalBar';
  const isStacked = type === 'stackedBar';

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: isHorizontal ? 'y' : 'x',
    plugins: {
      legend: {
        display: type === 'doughnut' || type === 'pie' || data.datasets.length > 1,
        position: 'bottom',
        labels: {
          boxWidth: 12,
          font: { size: 11, family: 'Inter, sans-serif' },
          color: '#334155'
        }
      },
      tooltip: {
        backgroundColor: '#0f172a',
        titleFont: { size: 12, weight: 'bold' },
        bodyFont: { size: 12 },
        padding: 10,
        cornerRadius: 8,
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) label += ': ';
            if (context.parsed.y !== null && context.parsed.y !== undefined) {
              label += `${context.parsed.y} ${unit}`.trim();
            } else if (context.parsed.x !== null && context.parsed.x !== undefined && isHorizontal) {
              label += `${context.parsed.x} ${unit}`.trim();
            } else if (context.raw !== null && context.raw !== undefined) {
              label += `${context.raw} ${unit}`.trim();
            }
            return label;
          }
        }
      }
    },
    scales: (type === 'doughnut' || type === 'pie') ? {} : {
      x: {
        stacked: isStacked,
        grid: { display: false },
        ticks: { font: { size: 11 }, color: '#64748b' }
      },
      y: {
        stacked: isStacked,
        beginAtZero: true,
        grid: { color: '#f1f5f9' },
        ticks: { font: { size: 11 }, color: '#64748b' }
      }
    },
    onClick: (evt, elements) => {
      if (elements.length > 0 && onElementClick) {
        const firstElement = elements[0];
        const label = data.labels[firstElement.index];
        const dataset = data.datasets[firstElement.datasetIndex];
        const value = dataset.data[firstElement.index];
        onElementClick({ label, value, drilldownType, datasetLabel: dataset.label });
      }
    }
  };

  return (
    <div className="maritime-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px', gap: '8px' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.2px' }}>
            {title}
          </h3>
          {subtitle && (
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
              {subtitle}
            </div>
          )}
        </div>

        {/* Chart Actions */}
        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            onClick={() => setShowTable(!showTable)}
            className="btn btn-secondary btn-sm"
            style={{ padding: '4px 8px', fontSize: '11px', height: '28px' }}
            title={showTable ? 'Show Chart' : 'Show Data Table'}
          >
            <TableIcon size={12} />
            <span>{showTable ? 'Chart' : 'Table'}</span>
          </button>
          <button
            onClick={handleExportPng}
            className="btn btn-secondary btn-sm"
            style={{ padding: '4px 8px', fontSize: '11px', height: '28px' }}
            title="Download PNG Chart"
          >
            <Download size={12} />
          </button>
          <button
            onClick={handleExportCsv}
            className="btn btn-secondary btn-sm"
            style={{ padding: '4px 8px', fontSize: '11px', height: '28px' }}
            title="Export CSV Data"
          >
            <FileSpreadsheet size={12} />
          </button>
        </div>
      </div>

      {/* Main Content Area: Chart or Table Alternative */}
      <div style={{ flex: 1, minHeight: `${height}px`, position: 'relative' }}>
        {showTable ? (
          <div style={{ overflowX: 'auto', maxHeight: `${height + 40}px` }}>
            <table className="table" style={{ width: '100%', fontSize: '12px' }}>
              <thead>
                <tr>
                  <th>Category / Label</th>
                  {data.datasets.map((d, i) => (
                    <th key={i} style={{ textAlign: 'right' }}>{d.label || 'Value'}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.labels.map((lbl, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: 600, color: '#0f172a' }}>{lbl}</td>
                    {data.datasets.map((d, dIdx) => (
                      <td key={dIdx} style={{ textAlign: 'right', fontWeight: 700, color: '#0284c7' }}>
                        {d.data[idx]} {unit}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ height: `${height}px`, width: '100%' }}>
            {type === 'doughnut' && <Doughnut ref={chartRef} data={data} options={options} />}
            {type === 'pie' && <Pie ref={chartRef} data={data} options={options} />}
            {type === 'line' && <Line ref={chartRef} data={data} options={options} />}
            {(type === 'bar' || type === 'horizontalBar' || type === 'stackedBar') && (
              <Bar ref={chartRef} data={data} options={options} />
            )}
          </div>
        )}
      </div>

      {/* Accessible footnote / click tip */}
      {onElementClick && (
        <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '10px', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Info size={11} />
          <span>Click any chart bar or slice to inspect detailed matching records.</span>
        </div>
      )}
    </div>
  );
};

export default ChartCard;
