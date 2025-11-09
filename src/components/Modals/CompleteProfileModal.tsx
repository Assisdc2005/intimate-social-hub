import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";

interface CompleteProfileModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onCompleted?: () => void;
}

export const CompleteProfileModal = ({ isOpen, onOpenChange, onCompleted }: CompleteProfileModalProps) => {
  const { profile, updateProfile } = useProfile();
  const { toast } = useToast();

  const [gender, setGender] = useState<string>(profile?.gender || "");
  const [birthDate, setBirthDate] = useState<string>(profile?.birth_date || "");
  const [city, setCity] = useState<string>(profile?.city || "");
  const [stateUF, setStateUF] = useState<string>(profile?.state || "");
  const [cities, setCities] = useState<string[]>([]);
  const [otherCity, setOtherCity] = useState<string>("");
  // Normalize sexual orientation to DB enum (EN): heterosexual, homosexual, bisexual, asexual, pansexual, other
  const normalizeOrientation = (val: string | undefined | null): string => {
    const v = (val || '').toLowerCase();
    const map: Record<string, string> = {
      'heterossexual': 'heterosexual', 'heterosexual': 'heterosexual',
      'homossexual': 'homosexual', 'homosexual': 'homosexual', 'gay': 'homosexual', 'lésbica': 'homosexual', 'lesbica': 'homosexual',
      'bissexual': 'bisexual', 'bisexual': 'bisexual',
      'assexual': 'asexual', 'asexual': 'asexual',
      'pansexual': 'pansexual',
      'outro': 'other', 'outros': 'other', 'other': 'other'
    };
    return map[v] || (v || '');
  };
  const [orientation, setOrientation] = useState<string>(normalizeOrientation(profile?.sexual_orientation));
  // Normalize relationship to DB enum (pt-BR): solteiro, namorando, casado, divorciado, viuvo, relacionamento_aberto
  const normalizeRelationship = (val: string | undefined | null): string => {
    const v = (val || '').toLowerCase();
    const map: Record<string, string> = {
      'solteiro': 'solteiro', 'solteira': 'solteiro', 'solteiro(a)': 'solteiro', 'single': 'solteiro',
      'namorando': 'namorando', 'relacionamento': 'namorando', 'in_relationship': 'namorando', 'dating': 'namorando',
      'casado': 'casado', 'casada': 'casado', 'casado(a)': 'casado', 'married': 'casado',
      'divorciado': 'divorciado', 'divorciada': 'divorciado', 'divorciado(a)': 'divorciado', 'divorced': 'divorciado',
      'viuvo': 'viuvo', 'viúva': 'viuvo', 'viuvo(a)': 'viuvo', 'viúvo(a)': 'viuvo', 'widowed': 'viuvo',
      'relacionamento aberto': 'relacionamento_aberto', 'relacionamento_aberto': 'relacionamento_aberto', 'open_relationship': 'relacionamento_aberto'
    };
    return map[v] || (v || '');
  };
  const [relationshipStatus, setRelationshipStatus] = useState<string>(normalizeRelationship(profile?.relationship_status));

  // Normalize gender to DB enum (pt-BR): feminino, masculino, nao_binario, outro
  const normalizeGender = (val: string | undefined | null): string => {
    const v = (val || '').toLowerCase();
    const map: Record<string, string> = {
      'feminino': 'feminino', 'feminina': 'feminino', 'female': 'feminino',
      'masculino': 'masculino', 'masculina': 'masculino', 'male': 'masculino',
      'nao-binario': 'nao_binario', 'não-binário': 'nao_binario', 'non-binary': 'nao_binario', 'non_binary': 'nao_binario', 'nao_binario': 'nao_binario',
      'outro': 'outro', 'other': 'outro'
    };
    return map[v] || (v || '');
  };
  // Initialize gender to normalized value
  const [genderNorm, setGenderNorm] = useState<string>(normalizeGender(profile?.gender));
  const [bio, setBio] = useState<string>(profile?.bio || "");
  const [interestsText, setInterestsText] = useState<string>(Array.isArray(profile?.interests) ? (profile!.interests as string[]).join(", ") : "");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const brazilUFs = [
    "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"
  ];

  // IBGE UF code mapping to numeric IDs required by the municipios endpoint
  const UF_ID_MAP: Record<string, number> = {
    AC: 12, AL: 27, AP: 16, AM: 13, BA: 29, CE: 23, DF: 53, ES: 32, GO: 52,
    MA: 21, MT: 51, MS: 50, MG: 31, PA: 15, PB: 25, PR: 41, PE: 26, PI: 22,
    RJ: 33, RN: 24, RS: 43, RO: 11, RR: 14, SC: 42, SP: 35, SE: 28, TO: 17
  };

  useEffect(() => {
    const fetchCities = async () => {
      if (!stateUF) {
        setCities([]);
        return;
      }
      try {
        const ufId = UF_ID_MAP[stateUF];
        const res = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${ufId}/municipios`);
        if (!res.ok) throw new Error('Falha ao carregar cidades');
        const data = await res.json();
        const names = (data || []).map((m: any) => m.nome).sort();
        setCities(names);
      } catch (e) {
        console.error('Erro ao buscar cidades do IBGE:', e);
        setCities([]);
      }
    };
    fetchCities();
  }, [stateUF]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setAvatarFile(file);
  };

  const uploadAvatar = async (): Promise<string | null> => {
    if (!avatarFile || !profile?.user_id) return null;
    try {
      const ext = avatarFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const filePath = `avatars/${profile.user_id}/${fileName}`;
      const { error } = await supabase.storage.from('avatars').upload(filePath, avatarFile);
      if (error) {
        // Falha no upload do avatar não deve bloquear o salvamento do restante
        console.warn('Falha no upload do avatar, prosseguindo sem avatar:', error);
        return null;
      }
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
      return publicUrl;
    } catch (err) {
      console.error('Erro no upload do avatar:', err);
      return null;
    }
  };

  const handleSave = async () => {
    const finalCity = (city === 'outra' || (stateUF && cities.length === 0)) ? otherCity.trim() : city;
    const parsedInterests = interestsText
      .split(',')
      .map(i => i.trim())
      .filter(Boolean);
    if (!genderNorm || !relationshipStatus || !bio.trim() || parsedInterests.length === 0) {
      const missing: string[] = [];
      if (!genderNorm) missing.push('gênero');
      if (!relationshipStatus) missing.push('status de relacionamento');
      if (!bio.trim()) missing.push('sobre (bio)');
      if (parsedInterests.length === 0) missing.push('interesses');
      toast({ 
        title: 'Preencha todos os campos obrigatórios', 
        description: `Faltando: ${missing.join(', ')}`,
        variant: 'destructive' 
      });
      return;
    }

    setSaving(true);
    try {
      let avatar_url = profile?.avatar_url;
      if (avatarFile) {
        const uploaded = await uploadAvatar();
        if (uploaded) avatar_url = uploaded;
      }

      const updates: any = {
        gender: normalizeGender(genderNorm),
        sexual_orientation: orientation,
        relationship_status: normalizeRelationship(relationshipStatus),
        bio: bio.trim(),
        interests: parsedInterests,
        profile_completed: true,
      };
      // Optional fields if provided
      if (birthDate) updates.birth_date = birthDate;
      if (stateUF) updates.state = stateUF;
      if (finalCity) updates.city = finalCity;
      if (avatar_url) updates.avatar_url = avatar_url;

      let res = await updateProfile(updates);
      if ((res as any)?.error) {
        const errMsg = String((res as any).error?.message || '');
        // Retry without sexual_orientation if enum mismatch occurs
        if (orientation && /invalid\s+input\s+value\s+for\s+enum/i.test(errMsg) && /sexual|orient/i.test(errMsg)) {
          const { sexual_orientation, ...retryUpdates } = updates as any;
          const resRetry = await updateProfile(retryUpdates);
          if ((resRetry as any)?.error) {
            throw (resRetry as any).error;
          }
          toast({ title: 'Perfil atualizado (parcial)', description: 'Orientação não foi salva por incompatibilidade. Selecione outra opção compatível ou tente novamente mais tarde.' });
        } else {
          throw (res as any).error;
        }
      }

      toast({ title: 'Perfil atualizado com sucesso!' });
      onOpenChange(false);
      onCompleted?.();
    } catch (err) {
      console.error('Erro ao salvar perfil:', err);
      const message = (err as any)?.message || 'Erro ao salvar perfil';
      toast({ title: 'Erro ao salvar perfil', description: String(message), variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md glass border border-primary/30 max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-gradient">Complete seu perfil</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-2">
            <Label>Gênero</Label>
            <Select value={genderNorm} onValueChange={setGenderNorm}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="feminino">Feminino</SelectItem>
                <SelectItem value="masculino">Masculino</SelectItem>
                <SelectItem value="nao_binario">Não-binário</SelectItem>
                <SelectItem value="outro">Outro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>Data de nascimento</Label>
            <Input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label>Estado</Label>
              <Select value={stateUF} onValueChange={(v) => { setStateUF(v); setCity(""); setOtherCity(""); }}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o estado" />
                </SelectTrigger>
                <SelectContent>
                  {brazilUFs.map((uf) => (
                    <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Cidade</Label>
              {!stateUF ? (
                <Input disabled placeholder="Selecione o estado primeiro" />
              ) : cities.length > 0 ? (
                <>
                  <Select value={city} onValueChange={(v) => setCity(v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a cidade" />
                    </SelectTrigger>
                    <SelectContent>
                      {cities.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                      <SelectItem value="outra">Outra</SelectItem>
                    </SelectContent>
                  </Select>
                  {city === 'outra' && (
                    <Input className="mt-2" placeholder="Digite sua cidade" value={otherCity} onChange={(e) => setOtherCity(e.target.value)} />
                  )}
                </>
              ) : (
                <Input placeholder="Digite sua cidade" value={otherCity} onChange={(e) => { setOtherCity(e.target.value); setCity('outra'); }} />
              )}
            </div>
          </div>

          {/* Relationship Status */}
          <div className="grid gap-2">
            <Label>Status de relacionamento</Label>
            <Select value={relationshipStatus} onValueChange={setRelationshipStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="solteiro">Solteiro(a)</SelectItem>
                <SelectItem value="namorando">Namorando</SelectItem>
                <SelectItem value="casado">Casado(a)</SelectItem>
                <SelectItem value="divorciado">Divorciado(a)</SelectItem>
                <SelectItem value="viuvo">Viúvo(a)</SelectItem>
                <SelectItem value="relacionamento_aberto">Relacionamento aberto</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Bio */}
          <div className="grid gap-2">
            <Label>Sobre você</Label>
            <Textarea rows={4} value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Fale um pouco sobre você" />
          </div>

          {/* Interests */}
          <div className="grid gap-2">
            <Label>Interesses (separe por vírgula)</Label>
            <Input value={interestsText} onChange={(e) => setInterestsText(e.target.value)} placeholder="Ex.: cinema, viagens, música" />
          </div>

          <div className="grid gap-2">
            <Label>Orientação</Label>
            <Select value={orientation} onValueChange={(v) => setOrientation(normalizeOrientation(v))}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="heterosexual">Heterossexual</SelectItem>
                <SelectItem value="homosexual">Homossexual</SelectItem>
                <SelectItem value="bisexual">Bissexual</SelectItem>
                <SelectItem value="asexual">Assexual</SelectItem>
                <SelectItem value="pansexual">Pansexual</SelectItem>
                <SelectItem value="other">Outro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>Foto de perfil</Label>
            <Input type="file" accept="image/*" onChange={handleAvatarChange} />
          </div>

          <Button onClick={handleSave} disabled={saving} className="w-full bg-gradient-primary text-white">
            {saving ? 'Salvando...' : 'Salvar e continuar'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
