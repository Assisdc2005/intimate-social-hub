import { useEffect, useRef, useState, type RefObject } from "react";
import Video, { 
  Room, 
  RemoteParticipant, 
  LocalTrackPublication, 
  RemoteTrackPublication,
  LocalVideoTrack,
  LocalAudioTrack,
  RemoteVideoTrack,
  RemoteAudioTrack
} from "twilio-video";

type AttachableTrack = LocalVideoTrack | LocalAudioTrack | RemoteVideoTrack | RemoteAudioTrack;

interface TwilioLiveState {
  room: Room | null;
  connecting: boolean;
  error: string | null;
  connect: (token: string, roomName: string, role: "host" | "viewer") => Promise<void>;
  disconnect: () => void;
  videoContainerRef: RefObject<HTMLDivElement>;
}

function isAttachableTrack(track: unknown): track is AttachableTrack {
  return (
    track !== null &&
    typeof track === 'object' &&
    'attach' in track &&
    typeof (track as AttachableTrack).attach === 'function'
  );
}

function attachTrack(track: unknown, container: HTMLDivElement | null) {
  if (!container || !isAttachableTrack(track)) return;
  const element = track.attach();
  element.style.maxWidth = "100%";
  element.style.maxHeight = "100%";
  container.appendChild(element);
}

function attachParticipantTracks(
  participant: RemoteParticipant | Room["localParticipant"], 
  container: HTMLDivElement | null
) {
  participant.tracks.forEach((publication: LocalTrackPublication | RemoteTrackPublication) => {
    // Check if it's a remote publication and is subscribed, or local publication
    const isRemote = 'isSubscribed' in publication;
    const isSubscribed = isRemote ? (publication as RemoteTrackPublication).isSubscribed : true;
    
    if (isSubscribed && publication.track) {
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
    } catch (e: unknown) {
      const err = e as Error;
      console.error("Erro ao conectar na sala Twilio:", err);
      setError(err.message || "Erro ao conectar na sala de live");
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
