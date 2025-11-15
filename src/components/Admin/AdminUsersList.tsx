import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Crown, Trash2, Shield, ShieldOff, Search } from 'lucide-react';
import { toast } from 'sonner';

interface User {
  id: string;
  user_id: string;
  display_name: string;
  email: string;
  avatar_url: string | null;
  gender: string | null;
  tipo_assinatura: string;
  created_at: string;
  last_seen: string | null;
  birth_date: string | null;
  city: string | null;
  state: string | null;
}

interface AdminUsersListProps {
  onUserUpdated?: () => void;
}

export function AdminUsersList({ onUserUpdated }: AdminUsersListProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadUsers();
  }, [searchTerm, filterType]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('admin_get_all_users', {
        search_term: searchTerm || null,
        filter_type: filterType === 'all' ? null : filterType,
        limit_count: 50,
        offset_count: 0
      });

      if (error) throw error;
      setUsers(data || []);
    } catch (error: any) {
      console.error('Error loading users:', error);
      toast.error('Erro ao carregar usuários: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGrantPremium = async (userId: string, displayName: string) => {
    try {
      setActionLoading(true);
      const { error } = await supabase.rpc('admin_grant_premium', {
        target_user_id: userId,
        days: 30
      });

      if (error) throw error;
      toast.success(`Premium concedido a ${displayName} por 30 dias!`);
      loadUsers();
      onUserUpdated?.();
    } catch (error: any) {
      console.error('Error granting premium:', error);
      toast.error('Erro ao conceder premium: ' + error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRevokePremium = async (userId: string, displayName: string) => {
    try {
      setActionLoading(true);
      const { error } = await supabase.rpc('admin_revoke_premium', {
        target_user_id: userId
      });

      if (error) throw error;
      toast.success(`Premium removido de ${displayName}!`);
      loadUsers();
      onUserUpdated?.();
    } catch (error: any) {
      console.error('Error revoking premium:', error);
      toast.error('Erro ao remover premium: ' + error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      setActionLoading(true);
      const { error } = await supabase.rpc('admin_delete_user', {
        target_user_id: selectedUser.user_id
      });

      if (error) throw error;
      toast.success(`Usuário ${selectedUser.display_name} deletado com sucesso!`);
      setDeleteDialogOpen(false);
      setSelectedUser(null);
      loadUsers();
      onUserUpdated?.();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast.error('Erro ao deletar usuário: ' + error.message);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gerenciar Usuários</CardTitle>
        <div className="flex gap-4 mt-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filtrar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="premium">Premium</SelectItem>
              <SelectItem value="free">Gratuito</SelectItem>
              <SelectItem value="recent">Recentes (7 dias)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4 p-4 border rounded-lg animate-pulse">
                <div className="h-12 w-12 bg-muted rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 bg-muted rounded"></div>
                  <div className="h-3 w-48 bg-muted rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nenhum usuário encontrado
          </div>
        ) : (
          <div className="space-y-4">
            {users.map((user) => (
              <div key={user.id} className="flex items-center gap-4 p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={user.avatar_url || undefined} />
                  <AvatarFallback>{user.display_name[0]?.toUpperCase()}</AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold truncate">{user.display_name}</h4>
                    {user.tipo_assinatura === 'premium' && (
                      <Badge variant="default" className="bg-yellow-500">
                        <Crown className="h-3 w-3 mr-1" />
                        Premium
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                  <p className="text-xs text-muted-foreground">
                    {user.city && user.state ? `${user.city}, ${user.state}` : 'Localização não informada'}
                  </p>
                </div>

                <div className="flex gap-2">
                  {user.tipo_assinatura === 'premium' ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRevokePremium(user.user_id, user.display_name)}
                      disabled={actionLoading}
                    >
                      <ShieldOff className="h-4 w-4 mr-1" />
                      Remover Premium
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => handleGrantPremium(user.user_id, user.display_name)}
                      disabled={actionLoading}
                    >
                      <Shield className="h-4 w-4 mr-1" />
                      Conceder Premium
                    </Button>
                  )}
                  
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => {
                      setSelectedUser(user);
                      setDeleteDialogOpen(true);
                    }}
                    disabled={actionLoading}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar o usuário <strong>{selectedUser?.display_name}</strong>? 
              Esta ação é irreversível e todos os dados do usuário serão permanentemente removidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser} disabled={actionLoading} className="bg-destructive">
              {actionLoading ? 'Deletando...' : 'Deletar Usuário'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
