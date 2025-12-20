import { useEffect, useRef, useState, type RefObject } from "react";
import Video, { Room, RemoteParticipant, LocalTrackPublication, RemoteTrackPublication, Track } from "twilio-video";

interface TwilioLiveState {
  room: Room | null;
  connecting: boolean;
  error: string | null;
  connect: (token: string, roomName: string, role: "host" | "viewer") => Promise<void>;
  disconnect: () => void;
  videoContainerRef: RefObject<HTMLDivElement>;
}

function attachTrack(track: Track, container: HTMLDivElement | null) {
  if (!container) return;
  const element = track.attach();
  element.style.maxWidth = "100%";
  element.style.maxHeight = "100%";
  container.appendChild(element);
}

function attachParticipantTracks(participant: RemoteParticipant | Room["localParticipant"], container: HTMLDivElement | null) {
  participant.tracks.forEach((publication: LocalTrackPublication | RemoteTrackPublication) => {
    if (publication.isSubscribed && publication.track) {
      attachTrack(publication.track, container);
    }
  });
}

export function useTwilioLiveRoom(): TwilioLiveState {
  const [room, setRoom] = useState<Room | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const videoContainerRef = useRef<HTMLDivElement | null>(null);

  const clearContainer = () => {
    if (videoContainerRef.current) {
      videoContainerRef.current.innerHTML = "";
    }
  };

  const disconnect = () => {
    room?.disconnect();
    setRoom(null);
    clearContainer();
  };

  const connect = async (token: string, roomName: string, role: "host" | "viewer") => {
    setError(null);
    setConnecting(true);

    const isHost = role === "host";

    try {
      const joinedRoom = await Video.connect(token, {
        name: roomName,
        // Apenas o host publica áudio/vídeo; viewers apenas recebem tracks remotas
        audio: isHost,
        video: isHost ? { width: 640 } : false,
      });

      setRoom(joinedRoom);
      clearContainer();

      // Tracks locais
      attachParticipantTracks(joinedRoom.localParticipant, videoContainerRef.current);

      // Participantes já conectados
      joinedRoom.participants.forEach((participant) => {
        attachParticipantTracks(participant, videoContainerRef.current);

        participant.on("trackSubscribed", (track) => {
          attachTrack(track, videoContainerRef.current);
        });
      });

      // Novos participantes
      joinedRoom.on("participantConnected", (participant) => {
        participant.on("trackSubscribed", (track) => {
          attachTrack(track, videoContainerRef.current);
        });
      });

      // Participante saiu
      joinedRoom.on("participantDisconnected", () => {
        clearContainer();
        attachParticipantTracks(joinedRoom.localParticipant, videoContainerRef.current);
        joinedRoom.participants.forEach((p) => attachParticipantTracks(p, videoContainerRef.current));
      });

      joinedRoom.on("disconnected", () => {
        clearContainer();
      });
    } catch (e: any) {
      console.error("Erro ao conectar na sala Twilio:", e);
      setError(e.message || "Erro ao conectar na sala de live");
    } finally {
      setConnecting(false);
    }
  };

  useEffect(() => {
    return () => {
      disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { room, connecting, error, connect, disconnect, videoContainerRef };
}
