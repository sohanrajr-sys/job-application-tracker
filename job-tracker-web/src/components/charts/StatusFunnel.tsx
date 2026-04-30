'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

const STATUS_COLORS: Record<string, string> = {
  saved: '#94a3b8',
  applied: '#3b82f6',
  screening: '#f59e0b',
  interview: '#8b5cf6',
  offer: '#10b981',
  rejected: '#ef4444',
  withdrawn: '#6b7280',
}

const STATUS_ORDER = ['saved', 'applied', 'screening', 'interview', 'offer', 'rejected', 'withdrawn']

interface Props {
  data: { status: string; count: number }[]
}

export function StatusFunnel({ data }: Props) {
  const sorted = [...data].sort(
    (a, b) => STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status)
  )

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={sorted} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
        <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
        <YAxis type="category" dataKey="status" tick={{ fontSize: 11 }} width={70} />
        <Tooltip formatter={(v) => [Number(v ?? 0), 'Applications']} />
        <Bar dataKey="count" radius={[0, 4, 4, 0]}>
          {sorted.map((entry, i) => (
            <Cell key={i} fill={STATUS_COLORS[entry.status] ?? '#94a3b8'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
