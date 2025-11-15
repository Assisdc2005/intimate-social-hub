import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '@/hooks/useAdmin';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Crown, Activity, TrendingUp, Calendar, Mail, Trash2, Shield, ShieldOff } from 'lucide-react';
import { toast } from 'sonner';
import { AdminUsersList } from '@/components/Admin/AdminUsersList';
import { AdminMetricsCards } from '@/components/Admin/AdminMetricsCards';
import { AdminCharts } from '@/components/Admin/AdminCharts';
import { AdminMessagePanel } from '@/components/Admin/AdminMessagePanel';

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

export default function AdminDashboard() {
  const { isAdmin, loading: adminLoading } = useAdmin();
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [ageDistribution, setAgeDistribution] = useState<Array<{ age_group: string; count: number }>>([]);
  const [usersHistory, setUsersHistory] = useState<Array<{ date: string; count: number }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      navigate('/');
      toast.error('Acesso negado. Área restrita a administradores.');
    }
  }, [isAdmin, adminLoading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      loadDashboardData();
    }
  }, [isAdmin]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Carregar métricas gerais
      const { data: metricsData, error: metricsError } = await supabase.rpc('get_admin_metrics');
      if (metricsError) throw metricsError;
      if (metricsData && typeof metricsData === 'object') {
        setMetrics(metricsData as unknown as AdminMetrics);
      }

      // Carregar distribuição de idade
      const { data: ageData, error: ageError } = await supabase.rpc('get_age_distribution');
      if (ageError) throw ageError;
      setAgeDistribution(ageData || []);

      // Carregar histórico de usuários
      const { data: historyData, error: historyError } = await supabase.rpc('get_users_history');
      if (historyError) throw historyError;
      setUsersHistory(historyData || []);

    } catch (error: any) {
      console.error('Error loading dashboard data:', error);
      toast.error('Erro ao carregar dados do dashboard: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (adminLoading || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verificando permissões...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
              Painel Administrativo
            </h1>
            <p className="text-muted-foreground mt-2">
              Sensual Nexus Connect - Dashboard Completo
            </p>
          </div>
          <Button onClick={() => navigate('/home')} variant="outline">
            Voltar ao Site
          </Button>
        </div>

        {/* Métricas Cards */}
        <AdminMetricsCards metrics={metrics} loading={loading} />

        {/* Tabs principais */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="users">Gerenciar Usuários</TabsTrigger>
            <TabsTrigger value="messages">Mensagens</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <AdminCharts 
              ageDistribution={ageDistribution}
              usersHistory={usersHistory}
              metrics={metrics}
              loading={loading}
            />
          </TabsContent>

          <TabsContent value="users">
            <AdminUsersList onUserUpdated={loadDashboardData} />
          </TabsContent>

          <TabsContent value="messages">
            <AdminMessagePanel />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
