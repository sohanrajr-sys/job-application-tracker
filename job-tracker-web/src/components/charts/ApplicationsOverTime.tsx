'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { format, parseISO } from 'date-fns'

interface Props {
  data: { date: string; count: number }[]
}

export function ApplicationsOverTime({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis
          dataKey="date"
          tickFormatter={(v) => format(parseISO(v), 'MMM d')}
          tick={{ fontSize: 11 }}
        />
        <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
        <Tooltip
          labelFormatter={(v) => format(parseISO(v as string), 'MMM d, yyyy')}
          formatter={(v) => [Number(v ?? 0), 'Applications']}
        />
        <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  )
}
