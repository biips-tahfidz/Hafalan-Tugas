import React from 'react';
import { FileText, Image as ImageIcon, Music, Video, ExternalLink, Download } from 'lucide-react';

export default function FilePreview({ fileUrl, fileType, fileName }) {
  if (!fileUrl) return null;

  return (
    <div className="bg-slate-900 rounded-xl overflow-hidden shadow-inner my-2 border border-slate-800">
      {fileType === 'video' && (
        <div className="aspect-video bg-black flex items-center justify-center">
          <video
            src={fileUrl}
            controls
            className="w-full h-full object-contain"
            preload="metadata"
          >
            Browser Anda tidak mendukung pemutaran video.
          </video>
        </div>
      )}

      {fileType === 'audio' && (
        <div className="p-4 bg-slate-800 flex flex-col items-center justify-center gap-2">
          <div className="flex items-center gap-2 text-emerald-400 font-medium text-xs">
            <Music className="w-4 h-4 animate-pulse" />
            <span>{fileName || 'Berkas Suara / Audio'}</span>
          </div>
          <audio src={fileUrl} controls className="w-full max-w-md h-10 mt-1">
            Browser Anda tidak mendukung pemutaran audio.
          </audio>
        </div>
      )}

      {fileType === 'image' && (
        <div className="bg-black p-1 flex justify-center max-h-80 overflow-hidden">
          <img
            src={fileUrl}
            alt={fileName || 'Pratinjau Foto'}
            className="max-h-72 object-contain rounded-lg"
          />
        </div>
      )}

      {fileType === 'document' && (
        <div className="p-4 bg-slate-800 flex items-center justify-between text-white">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="p-2 bg-blue-600/30 rounded-lg text-blue-400 shrink-0">
              <FileText className="w-6 h-6" />
            </div>
            <div className="truncate">
              <p className="text-xs font-semibold text-slate-200 truncate">{fileName || 'Dokumen'}</p>
              <p className="text-[10px] text-slate-400">PDF / Dokumen File</p>
            </div>
          </div>
          <a
            href={fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs bg-blue-600 hover:bg-blue-500 text-white font-medium px-3 py-1.5 rounded-lg transition-colors shrink-0"
          >
            <span>Buka</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      )}
    </div>
  );
}
