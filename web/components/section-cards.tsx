import { IconTrendingDown, IconTrendingUp, IconCurrencyDollar, IconUsers, IconUserCheck, IconChartBar } from "@tabler/icons-react"
import { SummaryCard } from "@/components/summary-card"

const chartData = [
  { value: 10 }, { value: 25 }, { value: 15 }, { value: 35 },
  { value: 25 }, { value: 45 }, { value: 30 }, { value: 55 }
]

export function SectionCards() {
  return (
    <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 md:grid-cols-2 lg:grid-cols-4">
      <SummaryCard
        title="Total Revenue"
        value="$1,250.00"
        icon={IconCurrencyDollar}
        trend={{ value: "12.5%", label: "than last month", isUp: true }}
        chartData={chartData}
        status="success"
      />
      <SummaryCard
        title="New Customers"
        value="1,234"
        icon={IconUsers}
        trend={{ value: "20%", label: "than last period", isUp: false }}
        chartData={[...chartData].reverse()}
        status="error"
      />
      <SummaryCard
        title="Active Accounts"
        value="45,678"
        icon={IconUserCheck}
        trend={{ value: "12.5%", label: "retention rate", isUp: true }}
        chartData={chartData.map((d, i) => ({ value: d.value + (i + 1) * 4 }))}
        status="primary"
      />
      <SummaryCard
        title="Growth Rate"
        value="4.5%"
        icon={IconChartBar}
        trend={{ value: "4.5%", label: "steady increase", isUp: true }}
        chartData={chartData.map(d => ({ value: d.value * 0.8 }))}
        status="info"
      />
    </div>
  )
}
