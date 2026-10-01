import React from 'react';
import {
  Box,
  Layers,
  Ship,
  CheckCircle,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Anchor,
  Navigation,
  Clock,
  ShieldCheck,
  Shield,
  Lock,
  ArrowUpRight,
  TrendingUp,
  TrendingDown
} from 'lucide-react';

const ICON_MAP = {
  Box: Box,
  Layers: Layers,
  Ship: Ship,
  CheckCircle: CheckCircle,
  CheckCircle2: CheckCircle2,
  AlertTriangle: AlertTriangle,
  XCircle: XCircle,
  Anchor: Anchor,
  Navigation: Navigation,
  Clock: Clock,
  ShieldCheck: ShieldCheck,
  Shield: Shield,
  Lock: Lock
};

export const SummaryCard = ({
  title,
  value,
  trend,
  status = 'neutral', // 'neutral', 'info', 'success', 'warning', 'danger'
  icon = 'Box',
  subtitle,
  onClick,
  isClickable = true
}) => {
  const IconComponent = ICON_MAP[icon] || Box;

  // Status-based styling
  let borderLeftColor = '#0f3460';
  let badgeBg = '#f0f5fa';
  let badgeColor = '#0f3460';

  if (status === 'info') {
    borderLeftColor = '#0284c7';
    badgeBg = '#e0f2fe';
    badgeColor = '#0284c7';
  } else if (status === 'success') {
    borderLeftColor = '#16a34a';
    badgeBg = '#dcfce7';
    badgeColor = '#16a34a';
  } else if (status === 'warning') {
    borderLeftColor = '#f59e0b';
    badgeBg = '#fef3c7';
    badgeColor = '#d97706';
  } else if (status === 'danger') {
    borderLeftColor = '#dc2626';
    badgeBg = '#fee2e2';
    badgeColor = '#dc2626';
  }

  const isPositive = trend?.startsWith('+');
  const isNegative = trend?.startsWith('-');

  return (
    <div
      onClick={isClickable ? onClick : undefined}
      className="maritime-card"
      style={{
        padding: '18px 20px',
        borderLeft: `4px solid ${borderLeftColor}`,
        cursor: isClickable ? 'pointer' : 'default',
        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between'
      }}
    >
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          {title}
        </span>
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '8px',
          background: badgeBg,
          color: badgeColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <IconComponent size={16} />
        </div>
      </div>

      {/* Main Metric Value */}
      <div style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px', marginBottom: '4px' }}>
        {value}
      </div>

      {/* Bottom Trend & Subtitle */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', marginTop: '4px' }}>
        {trend && (
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '3px',
            fontWeight: 700,
            color: isPositive ? '#16a34a' : isNegative ? '#dc2626' : '#0284c7'
          }}>
            {isPositive && <TrendingUp size={12} />}
            {isNegative && <TrendingDown size={12} />}
            <span>{trend}</span>
          </div>
        )}
        {subtitle && (
          <span style={{ color: '#64748b' }}>{subtitle}</span>
        )}
      </div>
    </div>
  );
};

export default SummaryCard;
