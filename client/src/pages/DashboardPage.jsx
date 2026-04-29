import { dashboardData } from "../mock/dashboardData";

export default function DashboardPage() {
  const { stats } = dashboardData;

  return (
    <div>
      <h2 className="text-3xl font-bold">Dashboard</h2>

      <div className="grid grid-cols-2 gap-4 mt-6">
        <Card title="Images Today" value={stats.today} />
        <Card title="Last 7 Days" value={stats.last7Days} />
      </div>
    </div>
  );
}

function Card({ title, value }) {
  return (
    <div className="p-5 border rounded-xl">
      <p>{title}</p>
      <h3 className="text-2xl font-bold">{value}</h3>
    </div>
  );
}