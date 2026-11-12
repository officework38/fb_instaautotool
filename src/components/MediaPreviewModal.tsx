import React from 'react';
import { X, Video, Play, Film, CheckCircle2 } from 'lucide-react';
import { SAMPLE_VIDEOS } from '../data/initialData';

interface MediaPreviewModalProps {
  mediaPath: string | null;
  mediaName: string | null;
  onClose: () => void;
}

export const MediaPreviewModal: React.FC<MediaPreviewModalProps> = ({
  mediaPath,
  mediaName,
  onClose,
}) => {
  if (!mediaPath) return null;

  // Play chosen local video blob URL or sample streaming URL
  const sample = SAMPLE_VIDEOS.find(
    (v) => v.path === mediaPath || v.name === mediaName
  );
  const streamUrl =
    mediaPath.startsWith('blob:') || mediaPath.startsWith('http')
      ? mediaPath
      : sample
      ? sample.url
      : 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4';

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Video className="w-4 h-4 text-blue-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Media Reel Inspector: {mediaName || 'Video Asset'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Video Player */}
        <div className="bg-black aspect-video flex items-center justify-center relative overflow-hidden">
          <video
            src={streamUrl}
            controls
            autoPlay
            loop
            className="w-full h-full object-contain"
          />
        </div>

        {/* Video Details & Meta */}
        <div className="p-5 space-y-3">
          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Local File Path:
            </span>
            <div className="text-xs font-mono text-emerald-300 bg-slate-950 p-2.5 rounded-lg border border-slate-800 break-all select-all">
              {mediaPath}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 text-xs pt-1">
            <div className="p-2 rounded bg-slate-950 border border-slate-800">
              <span className="text-[10px] text-slate-500 block">Aspect Ratio</span>
              <span className="font-semibold text-slate-200">9:16 Vertical Reel</span>
            </div>
            <div className="p-2 rounded bg-slate-950 border border-slate-800">
              <span className="text-[10px] text-slate-500 block">Encoding</span>
              <span className="font-semibold text-slate-200">H.264 / AAC</span>
            </div>
            <div className="p-2 rounded bg-slate-950 border border-slate-800">
              <span className="text-[10px] text-slate-500 block">Verification</span>
              <span className="font-semibold text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Ready
              </span>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg cursor-pointer"
            >
              Close Preview
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
