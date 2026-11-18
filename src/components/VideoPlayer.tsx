import React from 'react';
import { ExternalLink, Video, PlayCircle, Sparkles, HardDrive } from 'lucide-react';
import { VideoExplicativo } from '../types';

interface VideoPlayerProps {
  video: VideoExplicativo;
  compact?: boolean;
  className?: string;
}

function getEmbedInfo(video: VideoExplicativo): {
  kind: 'native' | 'iframe' | 'external';
  src: string;
  provider?: string;
} {
  const url = (video.url || '').trim();

  if (video.tipo === 'archivo') {
    return { kind: 'native', src: url };
  }

  const lower = url.toLowerCase();

  // Direct video file extensions or Firebase Storage / local uploads
  if (
    /\.(mp4|webm|mov|m4v|ogv)(\?.*)?$/i.test(lower) ||
    lower.startsWith('/uploads/videos/') ||
    (lower.includes('firebasestorage.googleapis.com') && !lower.includes('youtube'))
  ) {
    return { kind: 'native', src: url };
  }

  // YouTube
  const ytMatch = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{6,})/
  );
  if (ytMatch && ytMatch[1]) {
    return {
      kind: 'iframe',
      src: `https://www.youtube.com/embed/${ytMatch[1]}?rel=0`,
      provider: 'YouTube',
    };
  }

  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeoMatch && vimeoMatch[1]) {
    return {
      kind: 'iframe',
      src: `https://player.vimeo.com/video/${vimeoMatch[1]}`,
      provider: 'Vimeo',
    };
  }

  // Google Drive
  const driveMatch = url.match(/drive\.google\.com\/(?:file\/d\/|open\?id=)([a-zA-Z0-9_-]+)/);
  if (driveMatch && driveMatch[1]) {
    return {
      kind: 'iframe',
      src: `https://drive.google.com/file/d/${driveMatch[1]}/preview`,
      provider: 'Google Drive',
    };
  }

  // Loom
  const loomMatch = url.match(/loom\.com\/(?:share|embed)\/([a-zA-Z0-9]+)/);
  if (loomMatch && loomMatch[1]) {
    return {
      kind: 'iframe',
      src: `https://www.loom.com/embed/${loomMatch[1]}`,
      provider: 'Loom',
    };
  }

  // HeyGen
  const heygenMatch = url.match(/app\.heygen\.com\/(?:share|embeds)\/([a-zA-Z0-9_-]+)/);
  if (heygenMatch && heygenMatch[1]) {
    return {
      kind: 'iframe',
      src: `https://app.heygen.com/embeds/${heygenMatch[1]}`,
      provider: 'HeyGen',
    };
  }

  // Generic /embed/ URL
  if (lower.includes('/embed/')) {
    return {
      kind: 'iframe',
      src: url,
      provider: 'Video Embebido',
    };
  }

  return { kind: 'external', src: url };
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  video,
  compact = false,
  className = '',
}) => {
  const info = getEmbedInfo(video);

  return (
    <div className={`rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-950 ${className}`}>
      {info.kind === 'native' && (
        <div className={`relative w-full bg-black ${compact ? 'aspect-video max-h-60' : 'aspect-video'}`}>
          <video
            src={info.src}
            controls
            playsInline
            preload="metadata"
            className="w-full h-full object-contain"
          >
            Tu navegador no soporta la reproducción directa de este video.
          </video>
        </div>
      )}

      {info.kind === 'iframe' && (
        <div className={`relative w-full bg-black ${compact ? 'aspect-video max-h-60' : 'aspect-video'}`}>
          <iframe
            src={info.src}
            title={video.titulo || 'Video explicativo con IA'}
            className="w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            allowFullScreen
          />
        </div>
      )}

      {info.kind === 'external' && (
        <div className="p-6 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white flex flex-col items-center justify-center text-center gap-3 min-h-[170px]">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center">
            <PlayCircle className="w-7 h-7 text-indigo-300" />
          </div>
          <div className="space-y-1 max-w-md">
            <p className="text-xs font-bold text-white">
              Video / Avatar Explicativo Externo
            </p>
            <p className="text-[11px] text-slate-300 truncate max-w-xs sm:max-w-sm mx-auto">
              {video.url}
            </p>
          </div>
          <a
            href={video.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition shadow-sm"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Reproducir video en nueva pestaña</span>
          </a>
        </div>
      )}

      {/* Subtle footer metadata bar */}
      <div className="px-3.5 py-2 bg-slate-900 text-slate-300 text-[11px] flex flex-wrap items-center justify-between gap-2 border-t border-slate-800">
        <div className="flex flex-wrap items-center gap-2 min-w-0">
          <span className="inline-flex items-center gap-1 text-indigo-300 font-semibold">
            <Video className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span>{video.tipo === 'archivo' ? video.nombre_archivo || 'Video cargado' : info.provider || 'Enlace de video'}</span>
          </span>

          {video.herramienta_avatar && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-200 border border-indigo-400/30 text-[10px] font-bold">
              <Sparkles className="w-2.5 h-2.5 text-amber-300" />
              {video.herramienta_avatar}
            </span>
          )}

          {video.almacenamiento === 'firebase_storage' && (
            <span className="inline-flex items-center gap-1 text-[10px] text-amber-300 font-medium">
              <HardDrive className="w-3 h-3 text-amber-400" />
              Firebase Storage
            </span>
          )}
        </div>

        <a
          href={video.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-300 hover:text-blue-200 hover:underline shrink-0"
        >
          <span>Abrir aparte</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
};
