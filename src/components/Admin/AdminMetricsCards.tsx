import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Crown, Activity, TrendingUp, Calendar, Mail } from 'lucide-react';

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

interface AdminMetricsCardsProps {
  metrics: AdminMetrics | null;
  loading: boolean;
}

export function AdminMetricsCards({ metrics, loading }: AdminMetricsCardsProps) {
  const metricsCards = [
    {
      title: 'Total de Usuários',
      value: metrics?.total_users || 0,
      icon: Users,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10'
    },
    {
      title: 'Usuários Premium',
      value: metrics?.total_premium || 0,
      icon: Crown,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10'
    },
    {
      title: 'Usuários Gratuitos',
      value: metrics?.total_free || 0,
      icon: Users,
      color: 'text-gray-500',
      bgColor: 'bg-gray-500/10'
    },
    {
      title: 'Ativos (24h)',
      value: metrics?.active_users_24h || 0,
      icon: Activity,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10'
    },
    {
      title: 'Novos (7 dias)',
      value: metrics?.recent_users_7d || 0,
      icon: TrendingUp,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10'
    },
    {
      title: 'Total de Posts',
      value: metrics?.total_posts || 0,
      icon: Calendar,
      color: 'text-pink-500',
      bgColor: 'bg-pink-500/10'
    }
  ];

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-24 bg-muted rounded"></div>
              <div className="h-8 w-8 bg-muted rounded-full"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 w-16 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {metricsCards.map((metric, index) => {
        const Icon = metric.icon;
        return (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
              <div className={`p-2 rounded-full ${metric.bgColor}`}>
                <Icon className={`h-4 w-4 ${metric.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value.toLocaleString()}</div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
