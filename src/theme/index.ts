export const theme = {
  colors: {
    primary: '#1E293B',
    primaryBlue: '#2563EB',
    background: '#F8FAFC',
    card: '#FFFFFF',
    text: '#0F172A',
    textMuted: '#64748B',
    textLight: '#94A3B8',
    border: '#E2E8F0',
    borderDark: '#CBD5E1',

    // Financial colors
    income: '#059669',
    incomeBg: '#D1FAE5',
    expense: '#DC2626',
    expenseBg: '#FEE2E2',
    transfer: '#7C3AED',
    transferBg: '#EDE9FE',
    negative: '#DC2626',
    negativeBg: '#FEF2F2',
    warning: '#D97706',
    warningBg: '#FEF3C7',

    // Progress bar colors
    progressBg: '#E2E8F0',
    progressFill: '#2563EB',
    progressDanger: '#DC2626',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  borderRadius: {
    sm: 6,
    md: 10,
    lg: 16,
    full: 9999,
  },
  fontSize: {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 18,
    xl: 22,
    xxl: 28,
  },
  fontWeight: {
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
};
