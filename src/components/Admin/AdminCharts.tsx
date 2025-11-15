import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

interface AdminMetrics {
  total_users: number;
  total_premium: number;
  total_free: number;
  recent_users_7d: number;
  active_users_24h: number;
  total_men: number;
  total_women: number;
  total_other: number;
  total_posts: number;
  total_messages: number;
}

interface AdminChartsProps {
  ageDistribution: Array<{ age_group: string; count: number }>;
  usersHistory: Array<{ date: string; count: number }>;
  metrics: AdminMetrics | null;
  loading: boolean;
}

const COLORS = ['#7B2CBF', '#C77DFF', '#E0AAFF', '#10B981', '#F59E0B', '#EF4444'];

export function AdminCharts({ ageDistribution, usersHistory, metrics, loading }: AdminChartsProps) {
  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-6 w-40 bg-muted rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const genderData = [
    { name: 'Homens', value: metrics?.total_men || 0 },
    { name: 'Mulheres', value: metrics?.total_women || 0 },
    { name: 'Outros', value: metrics?.total_other || 0 }
  ].filter(item => item.value > 0);

  const subscriptionData = [
    { name: 'Premium', value: metrics?.total_premium || 0 },
    { name: 'Gratuito', value: metrics?.total_free || 0 }
  ];

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Distribuição de Idade */}
      <Card>
        <CardHeader>
          <CardTitle>Distribuição por Idade</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={ageDistribution}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="age_group" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#7B2CBF" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Distribuição por Gênero */}
      <Card>
        <CardHeader>
          <CardTitle>Distribuição por Gênero</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={genderData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {genderData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Histórico de Cadastros */}
      <Card>
        <CardHeader>
          <CardTitle>Novos Cadastros (Últimos 30 Dias)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={usersHistory}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(value) => new Date(value).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
              />
              <YAxis />
              <Tooltip 
                labelFormatter={(value) => new Date(value).toLocaleDateString('pt-BR')}
              />
              <Line type="monotone" dataKey="count" stroke="#7B2CBF" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Distribuição Premium vs Gratuito */}
      <Card>
        <CardHeader>
          <CardTitle>Premium vs Gratuito</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={subscriptionData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                <Cell fill="#F59E0B" />
                <Cell fill="#6B7280" />
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
