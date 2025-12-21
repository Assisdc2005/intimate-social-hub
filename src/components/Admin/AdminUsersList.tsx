import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Crown, Trash2, Shield, ShieldOff, Search, ImageOff, Snowflake, Flame, Eye } from 'lucide-react';
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
  account_status?: 'active' | 'frozen' | string | null;
  freeze_reason?: string | null;
}

interface AdminUsersListProps {
  onUserUpdated?: () => void;
}

type FieldType = 'text' | 'textarea' | 'number' | 'date' | 'datetime' | 'select' | 'boolean' | 'array' | 'readonly';

interface ProfileFieldConfig {
  key: string;
  label: string;
  type: FieldType;
  options?: { label: string; value: string }[];
  helperText?: string;
  colSpan?: number;
}

const profileFieldConfigs: ProfileFieldConfig[] = [
  { key: 'display_name', label: 'Nome de exibição', type: 'text' },
  { key: 'avatar_url', label: 'Avatar URL', type: 'text' },
  { key: 'bio', label: 'Bio', type: 'textarea', colSpan: 2 },
  { key: 'birth_date', label: 'Data de nascimento', type: 'date' },
  { key: 'gender', label: 'Gênero', type: 'select', options: [
    { label: 'Não definido', value: '' },
    { label: 'Masculino', value: 'masculino' },
    { label: 'Feminino', value: 'feminino' },
    { label: 'Não binário', value: 'nao_binario' },
    { label: 'Outro', value: 'outro' },
  ]},
  { key: 'sexual_orientation', label: 'Orientação sexual', type: 'text' },
  { key: 'state', label: 'Estado', type: 'text' },
  { key: 'city', label: 'Cidade', type: 'text' },
  { key: 'profession', label: 'Profissão', type: 'text' },
  { key: 'looking_for', label: 'Em busca de', type: 'text' },
  { key: 'objectives', label: 'Objetivos', type: 'text' },
  { key: 'body_type', label: 'Tipo físico', type: 'text' },
  { key: 'height', label: 'Altura (cm)', type: 'number' },
  { key: 'weight', label: 'Peso (kg)', type: 'number' },
  { key: 'ethnicity', label: 'Etnia', type: 'text' },
  { key: 'smokes', label: 'Fuma?', type: 'boolean' },
  { key: 'drinks', label: 'Bebe?', type: 'boolean' },
  { key: 'relationship_status', label: 'Status relacional', type: 'text' },
  { key: 'interests', label: 'Interesses', type: 'array', helperText: 'Separe por vírgula', colSpan: 2 },
  { key: 'profile_completed', label: 'Perfil completo', type: 'boolean' },
  { key: 'tipo_assinatura', label: 'Tipo de assinatura', type: 'select', options: [
    { label: 'Gratuito', value: 'gratuito' },
    { label: 'Premium', value: 'premium' },
  ]},
  { key: 'subscription_expires_at', label: 'Premium expira em', type: 'datetime' },
  { key: 'assinatura_id', label: 'Assinatura ID', type: 'text' },
  { key: 'account_status', label: 'Status da conta', type: 'select', options: [
    { label: 'Ativa', value: 'active' },
    { label: 'Congelada', value: 'frozen' },
  ]},
  { key: 'freeze_reason', label: 'Motivo do congelamento', type: 'textarea', colSpan: 2 },
  { key: 'created_at', label: 'Criado em', type: 'readonly' },
  { key: 'updated_at', label: 'Atualizado em', type: 'readonly' },
  { key: 'id', label: 'ID do perfil', type: 'readonly' },
  { key: 'user_id', label: 'ID do usuário', type: 'readonly' },
];

export function AdminUsersList({ onUserUpdated }: AdminUsersListProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [photoActionLoadingId, setPhotoActionLoadingId] = useState<string | null>(null);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [freezeDialogOpen, setFreezeDialogOpen] = useState(false);
  const [freezeReason, setFreezeReason] = useState('');
  const [freezeTargetUser, setFreezeTargetUser] = useState<User | null>(null);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [profileTargetUser, setProfileTargetUser] = useState<User | null>(null);
  const [profileDialogLoading, setProfileDialogLoading] = useState(false);
  const [profileDetails, setProfileDetails] = useState<any>(null);
  const [profileFormData, setProfileFormData] = useState<Record<string, any>>({});
  const [profileSaving, setProfileSaving] = useState(false);

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

  const formatDateTimeLocal = (value?: string | null) => {
    if (!value) return '';
    const date = new Date(value);
    if (isNaN(date.getTime())) return '';
    const tzOffset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
  };

  const mapProfileToForm = (profile: any) => {
    const mapped: Record<string, any> = {};
    profileFieldConfigs.forEach((field) => {
      const value = profile?.[field.key];
      switch (field.type) {
        case 'array':
          mapped[field.key] = Array.isArray(value) ? value.join(', ') : '';
          break;
        case 'boolean':
          mapped[field.key] = value ?? false;
          break;
        case 'number':
          mapped[field.key] = value ?? '';
          break;
        case 'date':
          mapped[field.key] = value ? String(value).split('T')[0] : '';
          break;
        case 'datetime':
          mapped[field.key] = formatDateTimeLocal(value);
          break;
        default:
          mapped[field.key] = value ?? '';
      }
    });
    return mapped;
  };

  const handleOpenProfileDialog = async (user: User) => {
    setProfileTargetUser(user);
    setProfileDialogOpen(true);
    setProfileDialogLoading(true);
    setProfileDetails(null);
    setProfileFormData({});
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.user_id)
        .single();

      if (error) throw error;
      setProfileDetails(data);
      setProfileFormData(mapProfileToForm(data));
    } catch (error: any) {
      console.error('Error loading profile details:', error);
      toast.error('Erro ao carregar perfil: ' + (error.message || 'Tente novamente'));
      setProfileDialogOpen(false);
    } finally {
      setProfileDialogLoading(false);
    }
  };

  const handleProfileFieldChange = (key: string, value: any) => {
    setProfileFormData((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const renderProfileFieldInput = (field: ProfileFieldConfig) => {
    const value = profileFormData[field.key];

    if (field.type === 'readonly') {
      return (
        <Input
          value={value ?? ''}
          readOnly
          className="bg-muted cursor-not-allowed"
        />
      );
    }

    switch (field.type) {
      case 'textarea':
        return (
          <Textarea
            value={value ?? ''}
            onChange={(e) => handleProfileFieldChange(field.key, e.target.value)}
          />
        );
      case 'number':
        return (
          <Input
            type="number"
            value={value ?? ''}
            onChange={(e) => handleProfileFieldChange(field.key, e.target.value)}
          />
        );
      case 'date':
        return (
          <Input
            type="date"
            value={value ?? ''}
            onChange={(e) => handleProfileFieldChange(field.key, e.target.value)}
          />
        );
      case 'datetime':
        return (
          <Input
            type="datetime-local"
            value={value ?? ''}
            onChange={(e) => handleProfileFieldChange(field.key, e.target.value)}
          />
        );
      case 'select':
        return (
          <select
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            value={value ?? ''}
            onChange={(e) => handleProfileFieldChange(field.key, e.target.value || null)}
          >
            {(field.options || []).map((option) => (
              <option key={option.value || 'empty'} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );
      case 'boolean':
        return (
          <select
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            value={value ? 'true' : 'false'}
            onChange={(e) => handleProfileFieldChange(field.key, e.target.value === 'true')}
          >
            <option value="true">Sim</option>
            <option value="false">Não</option>
          </select>
        );
      case 'array':
        return (
          <Input
            value={value ?? ''}
            onChange={(e) => handleProfileFieldChange(field.key, e.target.value)}
            placeholder="valor1, valor2, valor3"
          />
        );
      default:
        return (
          <Input
            value={value ?? ''}
            onChange={(e) => handleProfileFieldChange(field.key, e.target.value)}
          />
        );
    }
  };

  const handleSaveProfileDetails = async () => {
    if (!profileDetails) return;
    try {
      setProfileSaving(true);
      const updatePayload: Record<string, any> = {};

      profileFieldConfigs.forEach((field) => {
        if (field.type === 'readonly') return;
        const rawValue = profileFormData[field.key];
        switch (field.type) {
          case 'number':
            updatePayload[field.key] = rawValue === '' || rawValue === null ? null : Number(rawValue);
            break;
          case 'boolean':
            updatePayload[field.key] = !!rawValue;
            break;
          case 'array':
            if (typeof rawValue === 'string') {
              const parts = rawValue.split(',').map((item) => item.trim()).filter(Boolean);
              updatePayload[field.key] = parts;
            } else {
              updatePayload[field.key] = [];
            }
            break;
          case 'date':
            updatePayload[field.key] = rawValue || null;
            break;
          case 'datetime':
            updatePayload[field.key] = rawValue ? new Date(rawValue).toISOString() : null;
            break;
          default:
            updatePayload[field.key] = rawValue === '' ? null : rawValue;
        }
      });

      const { error } = await supabase
        .from('profiles')
        .update(updatePayload as any)
        .eq('id', profileDetails.id);

      if (error) throw error;

      toast.success('Perfil atualizado com sucesso!');
      setProfileDialogOpen(false);
      loadUsers();
      onUserUpdated?.();
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error('Erro ao salvar alterações: ' + (error.message || 'Tente novamente'));
    } finally {
      setProfileSaving(false);
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

  const extractStoragePath = (url: string) => {
    try {
      const parsed = new URL(url);
      const marker = '/storage/v1/object/public/';
      const idx = parsed.pathname.indexOf(marker);
      if (idx === -1) return null;
      const rest = parsed.pathname.slice(idx + marker.length);
      const [bucket, ...pathParts] = rest.split('/');
      if (!bucket || pathParts.length === 0) return null;
      const path = pathParts.join('/');
      return { bucket, path };
    } catch {
      return null;
    }
  };

  const handleClearUserPhotos = async (user: User) => {
    try {
      setPhotoActionLoadingId(user.user_id);

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('user_id', user.user_id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        throw profileError;
      }

      const { data: posts, error: postsError } = await supabase
        .from('publicacoes')
        .select('id, midia_url, tipo_midia')
        .eq('user_id', user.user_id)
        .eq('tipo_midia', 'imagem')
        .not('midia_url', 'is', null);

      if (postsError) {
        throw postsError;
      }

      const urls: string[] = [];

      if (profile?.avatar_url) {
        urls.push(profile.avatar_url);
      }

      if (posts && Array.isArray(posts)) {
        for (const p of posts as any[]) {
          if (p.midia_url) {
            urls.push(p.midia_url as string);
          }
        }
      }

      const bucketMap: Record<string, string[]> = {};
      for (const url of urls) {
        const info = extractStoragePath(url);
        if (!info) continue;
        if (!bucketMap[info.bucket]) {
          bucketMap[info.bucket] = [];
        }
        bucketMap[info.bucket].push(info.path);
      }

      for (const [bucket, paths] of Object.entries(bucketMap)) {
        if (paths.length === 0) continue;
        const { error: removeError } = await supabase.storage.from(bucket).remove(paths);
        if (removeError) {
          console.error('Error removing storage objects:', removeError);
        }
      }

      const { error: clearProfileError } = await supabase
        .from('profiles')
        .update({ avatar_url: null })
        .eq('user_id', user.user_id);

      if (clearProfileError) {
        throw clearProfileError;
      }

      const { error: clearPostsError } = await supabase
        .from('publicacoes')
        .update({ midia_url: null })
        .eq('user_id', user.user_id)
        .eq('tipo_midia', 'imagem');

      if (clearPostsError) {
        throw clearPostsError;
      }

      toast.success(`Fotos de ${user.display_name} removidas com sucesso!`);
      loadUsers();
      onUserUpdated?.();
    } catch (error: any) {
      console.error('Error clearing user photos:', error);
      toast.error('Erro ao remover fotos do usuário: ' + (error?.message || 'Erro desconhecido'));
    } finally {
      setPhotoActionLoadingId(null);
    }
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const allVisibleSelected = users.length > 0 && users.every((u) => selectedUserIds.includes(u.user_id));

  const toggleSelectAllVisible = () => {
    if (allVisibleSelected) {
      setSelectedUserIds((prev) => prev.filter((id) => !users.some((u) => u.user_id === id)));
    } else {
      const visibleIds = users.map((u) => u.user_id);
      setSelectedUserIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
    }
  };

  const handleBulkGrantPremium = async () => {
    if (selectedUserIds.length === 0) return;
    try {
      setActionLoading(true);
      for (const userId of selectedUserIds) {
        const userData = users.find((u) => u.user_id === userId);
        const displayName = userData?.display_name || 'Usuário';
        const { error } = await supabase.rpc('admin_grant_premium', {
          target_user_id: userId,
          days: 30
        });
        if (error) {
          console.error('Error granting premium in bulk:', error);
        } else {
          toast.success(`Premium concedido a ${displayName} por 30 dias!`);
        }
      }
      loadUsers();
      onUserUpdated?.();
    } catch (error: any) {
      console.error('Error in bulk grant premium:', error);
      toast.error('Erro ao conceder premium em massa: ' + (error?.message || 'Erro desconhecido'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleBulkDeleteUsers = async () => {
    if (selectedUserIds.length === 0) return;
    try {
      setActionLoading(true);
      for (const userId of selectedUserIds) {
        const userData = users.find((u) => u.user_id === userId);
        const displayName = userData?.display_name || 'Usuário';
        const { error } = await supabase.rpc('admin_delete_user', {
          target_user_id: userId
        });
        if (error) {
          console.error('Error deleting user in bulk:', error);
        } else {
          toast.success(`Usuário ${displayName} deletado com sucesso!`);
        }
      }
      setSelectedUserIds([]);
      loadUsers();
      onUserUpdated?.();
    } catch (error: any) {
      console.error('Error in bulk delete users:', error);
      toast.error('Erro ao deletar usuários em massa: ' + (error?.message || 'Erro desconhecido'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenFreezeDialog = (user: User) => {
    setFreezeTargetUser(user);
    setFreezeReason('');
    setFreezeDialogOpen(true);
  };

  const handleFreezeAccount = async () => {
    if (!freezeTargetUser) return;
    try {
      setActionLoading(true);
      const { error } = await supabase
        .from('profiles')
        .update({ account_status: 'frozen', freeze_reason: freezeReason || null } as any)
        .eq('user_id', freezeTargetUser.user_id);

      if (error) throw error;
      toast.success(`Conta de ${freezeTargetUser.display_name} congelada.`);
      setFreezeDialogOpen(false);
      setFreezeTargetUser(null);
      loadUsers();
      onUserUpdated?.();
    } catch (error: any) {
      console.error('Error freezing account:', error);
      toast.error('Erro ao congelar conta: ' + (error?.message || 'Erro desconhecido'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnfreezeAccount = async (user: User) => {
    try {
      setActionLoading(true);
      const { error } = await supabase
        .from('profiles')
        .update({ account_status: 'active', freeze_reason: null } as any)
        .eq('user_id', user.user_id);

      if (error) throw error;
      toast.success(`Conta de ${user.display_name} reativada.`);
      loadUsers();
      onUserUpdated?.();
    } catch (error: any) {
      console.error('Error unfreezing account:', error);
      toast.error('Erro ao reativar conta: ' + (error?.message || 'Erro desconhecido'));
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
        <div className="flex items-center justify-between mt-4 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={allVisibleSelected}
              onChange={toggleSelectAllVisible}
            />
            <span className="text-muted-foreground">
              Selecionar todos desta página ({selectedUserIds.length} selecionado(s))
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleBulkGrantPremium}
              disabled={selectedUserIds.length === 0 || actionLoading}
            >
              Conceder Premium (selecionados)
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={handleBulkDeleteUsers}
              disabled={selectedUserIds.length === 0 || actionLoading}
            >
              Excluir contas (selecionados)
            </Button>
          </div>
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
                <input
                  type="checkbox"
                  className="h-4 w-4"
                  checked={selectedUserIds.includes(user.user_id)}
                  onChange={() => toggleUserSelection(user.user_id)}
                />
                <Avatar className="h-12 w-12">
                  <AvatarImage src={user.avatar_url || undefined} />
                  <AvatarFallback>{user.display_name[0]?.toUpperCase()}</AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="font-semibold truncate">{user.display_name}</h4>
                    {user.tipo_assinatura === 'premium' && (
                      <Badge variant="default" className="bg-yellow-500">
                        <Crown className="h-3 w-3 mr-1" />
                        Premium
                      </Badge>
                    )}
                    {user.account_status === 'frozen' && (
                      <Badge variant="destructive" className="bg-red-600">
                        Conta congelada
                      </Badge>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenFreezeDialog(user)}
                      disabled={actionLoading}
                      className="gap-1"
                    >
                      <Snowflake className="h-4 w-4" />
                      Congelar
                    </Button>
                    <Button
                      size="sm"
                      variant={user.account_status === 'frozen' ? 'default' : 'ghost'}
                      onClick={() => handleUnfreezeAccount(user)}
                      disabled={actionLoading}
                      className="gap-1"
                    >
                      <Flame className="h-4 w-4" />
                      Descongelar
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleOpenProfileDialog(user)}
                      className="gap-1"
                    >
                      <Eye className="h-4 w-4" />
                      Ver/Editar Perfil
                    </Button>
                    {user.account_status === 'frozen' && (
                      <Badge variant="outline" className="border-red-600 text-red-600">
                        {user.freeze_reason || 'Sem motivo informado'}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                  <p className="text-xs text-muted-foreground">
                    {user.city && user.state ? `${user.city}, ${user.state}` : 'Localização não informada'}
                  </p>
                  {user.account_status === 'frozen' && user.freeze_reason && (
                    <p className="text-xs text-red-500 mt-1">
                      Motivo: {user.freeze_reason}
                    </p>
                  )}
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
                    variant="outline"
                    onClick={() => handleClearUserPhotos(user)}
                    disabled={photoActionLoadingId === user.user_id}
                  >
                    <ImageOff className="h-4 w-4 mr-1" />
                    {photoActionLoadingId === user.user_id ? 'Removendo fotos...' : 'Remover Fotos'}
                  </Button>
                  
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

      <AlertDialog open={freezeDialogOpen} onOpenChange={setFreezeDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Congelar conta</AlertDialogTitle>
            <AlertDialogDescription>
              Informe o motivo para congelar a conta de <strong>{freezeTargetUser?.display_name}</strong>. Esse motivo será exibido para o usuário ao tentar acessar o site.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2 mt-2">
            <textarea
              className="w-full min-h-[80px] rounded-md border bg-background px-3 py-2 text-sm"
              placeholder="Descreva brevemente o motivo do congelamento..."
              value={freezeReason}
              onChange={(e) => setFreezeReason(e.target.value)}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleFreezeAccount}
              disabled={actionLoading}
              className="bg-destructive"
            >
              {actionLoading ? 'Congelando...' : 'Congelar conta'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={profileDialogOpen} onOpenChange={setProfileDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Visualizar / Editar perfil</DialogTitle>
            <DialogDescription>
              Você pode alterar qualquer informação do perfil selecionado. Campos vazios serão salvos como nulos.
            </DialogDescription>
          </DialogHeader>

          {profileDialogLoading ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              Carregando informações...
            </div>
          ) : !profileDetails ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              Selecione um usuário para visualizar.
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {profileFieldConfigs.map((field) => (
                  <div
                    key={field.key}
                    className={`space-y-1 ${field.colSpan === 2 ? 'md:col-span-2' : ''}`}
                  >
                    <p className="text-sm font-medium text-foreground">{field.label}</p>
                    {renderProfileFieldInput(field)}
                    {field.helperText && (
                      <p className="text-xs text-muted-foreground">{field.helperText}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setProfileDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSaveProfileDetails}
              disabled={profileDialogLoading || profileSaving || !profileDetails}
            >
              {profileSaving ? 'Salvando...' : 'Salvar alterações'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
