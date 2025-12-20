import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useProfile } from "@/hooks/useProfile";
import { useLives, Live } from "@/hooks/useLives";
import { Video, Users, Play, StopCircle } from "lucide-react";
import { getLiveToken } from "@/lib/getLiveToken";
import { useTwilioLiveRoom } from "@/hooks/useTwilioLiveRoom";

export const LiveTab = () => {
  const { profile, isPremium } = useProfile();
  const { lives, loading, error, startLive, endLive } = useLives();
  const { toast } = useToast();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [sending, setSending] = useState(false);
  const [selectedLive, setSelectedLive] = useState<Live | null>(null);

  const { room, connecting, error: twilioError, connect, disconnect, videoContainerRef } = useTwilioLiveRoom();

  const myOnlineLive = lives.find((l) => l.user_id === profile?.user_id && l.status === "online");

  const handleStartLive = async () => {
    if (!isPremium) {
      toast({
        title: "Recurso exclusivo Premium",
        description: "Assine o plano Premium para iniciar uma live.",
        variant: "destructive",
      });
      return;
    }

    if (!title.trim()) {
      toast({
        title: "Título obrigatório",
        description: "Dê um nome chamativo para sua live.",
        variant: "destructive",
      });
      return;
    }

    setSending(true);
    const result = await startLive(title.trim(), description.trim() || undefined);
    setSending(false);

    if (result.error) {
      toast({
        title: "Erro ao iniciar live",
        description: result.error,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Live iniciada",
        description: "Sua transmissão ao vivo está ativa para outros usuários.",
      });
      setTitle("");
      setDescription("");
    }
  };

  const handleEndLive = async () => {
    setSending(true);
    const result = await endLive();
    setSending(false);

    if (result.error) {
      toast({
        title: "Erro ao encerrar live",
        description: result.error,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Live encerrada",
        description: "Sua transmissão foi finalizada.",
      });
      setSelectedLive(null);
    }
  };

  const handleSelectLive = async (live: Live) => {
    if (!isPremium) {
      toast({
        title: "Recurso exclusivo Premium",
        description: "Assine o plano Premium para assistir às lives.",
        variant: "destructive",
      });
      return;
    }

    setSelectedLive(live);

    try {
      const { token, roomName } = await getLiveToken(live.id, "viewer");
      await connect(token, roomName);
      toast({
        title: "Conectado à live",
        description: `Você está assistindo a live de ${live.profiles?.display_name || "um usuário"}.`,
      });
    } catch (e: any) {
      console.error("Erro ao entrar na live:", e);
      toast({
        title: "Erro ao entrar na live",
        description: e.message || "Não foi possível conectar à transmissão.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Controles da minha live */}
      <Card className="glass backdrop-blur-xl border-primary/30">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <Video className="w-5 h-5 text-primary" />
            <h2 className="text-sm font-semibold text-white">Minha Live</h2>
          </div>

          {!profile?.user_id ? (
            <p className="text-xs text-gray-300">
              Faça login e complete seu perfil para iniciar uma live.
            </p>
          ) : myOnlineLive ? (
            <div className="space-y-2">
              <p className="text-sm text-gray-200">
                Live ativa: <span className="font-semibold">{myOnlineLive.title}</span>
              </p>
              {myOnlineLive.description && (
                <p className="text-xs text-gray-300">{myOnlineLive.description}</p>
              )}
              <div className="flex items-center justify-between text-xs text-gray-300">
                <span>
                  Espectadores: <span className="font-semibold">{myOnlineLive.viewers_count}</span>
                </span>
                <Badge className="bg-red-600/80 text-white text-[10px]">AO VIVO</Badge>
              </div>
              <Button
                type="button"
                variant="outline"
                className="w-full border-red-500 text-red-400 hover:bg-red-500/20 mt-1"
                onClick={handleEndLive}
                disabled={sending}
              >
                <StopCircle className="w-4 h-4 mr-2" />
                Encerrar live
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <Input
                placeholder="Título da sua live (obrigatório)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-white/10 border-primary/30 text-white placeholder:text-gray-400 text-sm"
              />
              <Textarea
                placeholder="Descrição (opcional): conte o clima da sua live..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="bg-white/10 border-primary/30 text-white placeholder:text-gray-400 text-xs min-h-[60px]"
              />
              <Button
                type="button"
                className="w-full bg-gradient-primary hover:opacity-90 text-white"
                onClick={handleStartLive}
                disabled={sending || !title.trim() || !isPremium}
              >
                <Play className="w-4 h-4 mr-2" />
                Iniciar live agora
              </Button>
              {!isPremium && (
                <p className="text-[11px] text-red-400">
                  Apenas assinantes <span className="font-semibold">Premium</span> podem iniciar lives. Faça o upgrade para liberar esse recurso.
                </p>
              )}
              <p className="text-[11px] text-gray-400">
                A captura de vídeo e áudio será integrada a um provedor de streaming em breve.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lista de lives ativas */}
      <Card className="glass backdrop-blur-xl border-primary/20">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              <h2 className="text-sm font-semibold text-white">Lives ativas</h2>
            </div>
            <Badge className="bg-primary/20 text-primary border-primary/40 text-[10px]">
              +20 em andamento
            </Badge>
          </div>

          {!isPremium && (
            <div className="mt-2 space-y-2 text-xs text-gray-300">
              <p>
                As lives são um benefício exclusivo para assinantes do plano <span className="font-semibold text-white">Premium</span>.
              </p>
              <Button
                type="button"
                size="sm"
                className="w-full bg-gradient-primary text-white hover:opacity-90 text-xs"
                onClick={() => (window.location.href = "/premium")}
              >
                Ir para o Premium e desbloquear lives
              </Button>
            </div>
          )}

          {loading ? (
            <p className="text-xs text-gray-300">Carregando lives...</p>
          ) : error ? (
            <p className="text-xs text-red-400">{error}</p>
          ) : lives.length === 0 ? (
            <p className="text-xs text-gray-300">+20 lives ativas no momento.</p>
          ) : isPremium ? (
            <div className="space-y-2">
              {lives.map((live) => (
                <button
                  key={live.id}
                  type="button"
                  onClick={() => handleSelectLive(live)}
                  className={`w-full flex items-center justify-between rounded-xl border px-3 py-2 text-left text-xs transition-all ${
                    selectedLive?.id === live.id
                      ? "border-primary bg-primary/20 text-white"
                      : "border-white/15 bg-white/5 text-gray-200 hover:bg-white/10"
                  }`}
                >
                  <div>
                    <p className="font-semibold text-sm">
                      {live.title}
                    </p>
                    <p className="text-[11px] text-gray-300">
                      {live.profiles?.display_name || "Anônimo"}
                    </p>
                  </div>
                  <div className="flex flex-col items-end text-[11px] text-gray-300">
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {live.viewers_count}
                    </span>
                    <span className="mt-0.5 inline-flex items-center gap-1 rounded-full bg-red-600/80 px-2 py-0.5 text-[10px] text-white">
                      AO VIVO
                    </span>
                  </div>
                </button>
              ))}
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Sala de live com player Twilio */}
      {selectedLive && (
        <Card className="glass backdrop-blur-xl border-primary/20">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white">
                Assistindo: {selectedLive.title}
              </h2>
              <Badge className="bg-red-600/80 text-white text-[10px]">AO VIVO</Badge>
            </div>
            <p className="text-xs text-gray-300">
              Host: {selectedLive.profiles?.display_name || "Anônimo"}
            </p>

            <div
              ref={videoContainerRef}
              className="w-full h-40 rounded-2xl bg-black/40 flex items-center justify-center text-white text-xs border border-primary/40 overflow-hidden"
            >
              {!room && !connecting && "Selecione uma live ou aguarde a conexão..."}
              {connecting && "Conectando à live..."}
            </div>

            {twilioError && (
              <p className="text-[11px] text-red-400">{twilioError}</p>
            )}

            <p className="text-[11px] text-gray-400">
              A transmissão de vídeo está sendo carregada via Twilio Video. O chat em tempo real poderá ser integrado em uma próxima etapa.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
