export const colors = {
  primary: '#2563eb',
  primaryDark: '#1e40af',
  bg: '#f1f5f9',
  bgSubtle: '#f8fafc',
  card: '#ffffff',
  border: '#e2e8f0',
  text: '#0f172a',
  textMuted: '#64748b',
  success: '#16a34a',
  danger: '#dc2626',
  warning: '#d97706',
  chipBg: '#eef2ff',
  chipText: '#3730a3',
  placeholder: '#94a3b8',
  // Semantic tint triads (see DESIGN.md). `text` is the 800-level shade of the
  // same hue so 10-12px bold chip/banner text keeps >=4.5:1 on its tint bg.
  amber: { bg: '#fef3c7', border: '#fde68a', text: '#92400e' },
  green: { bg: '#dcfce7', border: '#bbf7d0', text: '#166534' },
  red: { bg: '#fee2e2', border: '#fecaca', text: '#991b1b' },
  blue: { bg: '#eff6ff', border: '#bfdbfe', text: '#1e40af' },
  orange: { bg: '#fff7ed', border: '#fed7aa', text: '#9a3412' },
  pink: { bg: '#fdf2f8', border: '#fbcfe8', text: '#9d174d', solid: '#9d174d' },
  purple: { bg: '#f5f3ff', border: '#ddd6fe', text: '#5b21b6' },
  cyan: { bg: '#ecfeff', border: '#a5f3fc', text: '#155e75' },
  slate: { bg: '#f1f5f9', border: '#e2e8f0', text: '#475569' },
};

export function formatPkr(value: number | null | undefined): string {
  const n = Number(value ?? 0);
  return 'Rs ' + n.toLocaleString('en-PK', { maximumFractionDigits: 0 });
}

export function conditionLabel(condition: string): string {
  switch (condition) {
    case 'new':
      return 'New';
    case 'used':
      return 'Used';
    case 'open_box':
      return 'Open Box';
    default:
      return condition;
  }
}

export function ptaLabel(pta: string | null): string | null {
  if (!pta) return null;
  if (pta === 'pta_approved') return 'PTA Approved';
  if (pta === 'non_pta') return 'Non-PTA';
  return pta;
}
