import React, { useState } from 'react';
import {
  FileText,
  Clock,
  Video,
  Upload,
  Trash2,
  Undo2,
  Edit2,
  ArrowRight,
  Plus,
  Play,
  FileSpreadsheet,
  Check,
  Tag,
  Hash,
  RefreshCw,
  FolderOpen,
} from 'lucide-react';
import { TargetItem, TargetType } from '../types';
import { SAMPLE_VIDEOS } from '../data/initialData';

function getFutureDateTime(offsetMinutes = 3): { date: string; time: string } {
  const dt = new Date(Date.now() + offsetMinutes * 60 * 1000);
  const yyyy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, '0');
  const dd = String(dt.getDate()).padStart(2, '0');
  const hh = String(dt.getHours()).padStart(2, '0');
  const min = String(dt.getMinutes()).padStart(2, '0');
  return {
    date: `${yyyy}-${mm}-${dd}`,
    time: `${hh}:${min}`,
  };
}

interface ContentTabProps {
  targets: TargetItem[];
  setTargets: React.Dispatch<React.SetStateAction<TargetItem[]>>;
  deletedStack: TargetItem[];
  setDeletedStack: React.Dispatch<React.SetStateAction<TargetItem[]>>;
  onGoToScheduler: () => void;
  onPreviewVideo: (urlOrPath: string, name: string) => void;
  onLog: (level: 'INFO' | 'SUCCESS' | 'WARN' | 'ERROR' | 'RPA', msg: string) => void;
}

export const ContentTab: React.FC<ContentTabProps> = ({
  targets,
  setTargets,
  deletedStack,
  setDeletedStack,
  onGoToScheduler,
  onPreviewVideo,
  onLog,
}) => {
  const [bulkCaption, setBulkCaption] = useState(
    '🔥 Don’t miss this trending update! Double tap if you agree ❤️ Comment your thoughts below 👇 #viral #reels #trending #fbreels'
  );
  const [applyAllCaption, setApplyAllCaption] = useState(true);

  const initialSlot = getFutureDateTime(3);
  const [bulkDate, setBulkDate] = useState(initialSlot.date);
  const [bulkTime, setBulkTime] = useState(initialSlot.time);
  const [staggerMinutes, setStaggerMinutes] = useState(0); // 0 = uniform, 2 = +2m, 5 = +5m, 10 = +10m
  const [applyAllTime, setApplyAllTime] = useState(true);
  const [timeStatusMsg, setTimeStatusMsg] = useState<string | null>(
    `Auto-set to ${initialSlot.time} (+3m from now)`
  );
  const [confirmClearTable, setConfirmClearTable] = useState(false);

  // Selected table row IDs
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modal states for row edit
  const [editingTarget, setEditingTarget] = useState<TargetItem | null>(null);

  // Refresh Start Time to Current Time + 3 Minutes
  const handleRefreshStartTime = () => {
    const next = getFutureDateTime(3);
    setBulkDate(next.date);
    setBulkTime(next.time);
    setTimeStatusMsg(`Refreshed start time to ${next.time} (+3m from current time)`);
    onLog('INFO', `Refreshed Content Start Time to ${next.date} ${next.time} (+3 mins).`);
  };

  // Quick hashtag inserter
  const insertHashtag = (tag: string) => {
    setBulkCaption((prev) => `${prev} ${tag}`);
  };

  // 1. Apply Bulk Caption to Table
  const handleApplyBulkCaption = () => {
    if (!bulkCaption.trim()) {
      setTimeStatusMsg('Please enter a caption first!');
      return;
    }
    if (targets.length === 0) {
      setTimeStatusMsg('No targets in table to apply caption to.');
      return;
    }

    setTargets((prev) =>
      prev.map((item) => {
        if (applyAllCaption || selectedIds.includes(item.id)) {
          // Replace dynamic placeholders if present
          const processedCaption = bulkCaption.replace(/\{page_name\}/gi, item.profileName);
          return { ...item, caption: processedCaption };
        }
        return item;
      })
    );

    onLog('SUCCESS', `Applied bulk caption across ${applyAllCaption ? targets.length : selectedIds.length} target(s).`);
  };

  // 2. Apply Bulk Date and Time with optional Stagger
  const handleApplyBulkTime = () => {
    if (!bulkDate || !bulkTime) {
      setTimeStatusMsg('Please enter a valid date and time!');
      return;
    }
    if (targets.length === 0) {
      setTimeStatusMsg('No targets in table!');
      return;
    }

    const [hours, minutes] = bulkTime.split(':').map((v) => parseInt(v, 10));

    setTargets((prev) =>
      prev.map((item, index) => {
        if (applyAllTime || selectedIds.includes(item.id)) {
          // If stagger is selected, add (index * staggerMinutes)
          if (staggerMinutes > 0) {
            const dateObj = new Date(`${bulkDate}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`);
            dateObj.setMinutes(dateObj.getMinutes() + index * staggerMinutes);
            const yyyy = dateObj.getFullYear();
            const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
            const dd = String(dateObj.getDate()).padStart(2, '0');
            const hh = String(dateObj.getHours()).padStart(2, '0');
            const min = String(dateObj.getMinutes()).padStart(2, '0');
            return {
              ...item,
              date: `${yyyy}-${mm}-${dd}`,
              time: `${hh}:${min}`,
            };
          }
          return { ...item, date: bulkDate, time: bulkTime };
        }
        return item;
      })
    );

    onLog(
      'SUCCESS',
      `Applied bulk date ${bulkDate} & time ${bulkTime} (Stagger: ${staggerMinutes}m) across ${
        applyAllTime ? targets.length : selectedIds.length
      } targets.`
    );
  };

  // 3. Import Video Paths from .txt
  const handleImportVideoPathsFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = (event.target?.result as string) || '';
      const lines = content
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean);

      if (lines.length === 0) {
        setTimeStatusMsg('The selected text file is empty.');
        return;
      }

      if (targets.length === 0) {
        setTimeStatusMsg('No targets in table! Please add targets or verify accounts first.');
        return;
      }

      setTargets((prev) =>
        prev.map((item, idx) => {
          const assignedPath = lines[idx % lines.length];
          const fileName = assignedPath.split(/[/\\]/).pop() || assignedPath;
          return {
            ...item,
            videoPath: assignedPath,
            videoName: fileName,
          };
        })
      );

      onLog('SUCCESS', `Assigned ${lines.length} video path(s) across table targets.`);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // 4. Quick Assign Sample High Quality Videos
  const handleAssignSampleVideos = () => {
    if (targets.length === 0) return;
    setTargets((prev) =>
      prev.map((item, idx) => {
        const sample = SAMPLE_VIDEOS[idx % SAMPLE_VIDEOS.length];
        return {
          ...item,
          videoPath: sample.path,
          videoName: sample.name,
        };
      })
    );
    onLog('SUCCESS', `Auto-assigned high-quality video reels to all ${targets.length} targets.`);
  };

  // 4b. Choose real video file(s) from device for all targets
  const handleChooseVideosForAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    if (targets.length === 0) {
      setTimeStatusMsg('No targets in table! Add a target first.');
      e.target.value = '';
      return;
    }

    const fileList: File[] = Array.from(files);
    setTargets((prev) =>
      prev.map((item, idx) => {
        const picked = fileList[idx % fileList.length];
        const objectUrl = URL.createObjectURL(picked);
        return {
          ...item,
          videoPath: objectUrl,
          videoName: picked.name,
        };
      })
    );
    setTimeStatusMsg(`Assigned ${fileList.length} chosen video(s) across ${targets.length} target(s).`);
    onLog('SUCCESS', `User chose ${fileList.length} local video file(s) and assigned across queue.`);
    e.target.value = '';
  };

  // 4c. Choose a real video file from device for a single table row
  const handleChooseRowVideo = (targetId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const objectUrl = URL.createObjectURL(file);
    setTargets((prev) =>
      prev.map((t) =>
        t.id === targetId
          ? {
              ...t,
              videoPath: objectUrl,
              videoName: file.name,
            }
          : t
      )
    );
    setTimeStatusMsg(`Selected video "${file.name}" for target.`);
    onLog('INFO', `Selected local video [${file.name}] for target ID: ${targetId}.`);
    e.target.value = '';
  };

  // 5. Delete and Undo Management
  const handleDeleteRow = (target: TargetItem) => {
    setDeletedStack((prev) => [...prev, target]);
    setTargets((prev) => prev.filter((t) => t.id !== target.id));
    onLog('INFO', `Removed target: [${target.profileName}]`);
  };

  const handleUndoDelete = () => {
    if (deletedStack.length === 0) {
      setTimeStatusMsg('No deleted items to undo.');
      return;
    }
    const lastDeleted = deletedStack[deletedStack.length - 1];
    setDeletedStack((prev) => prev.slice(0, -1));
    setTargets((prev) => [...prev, lastDeleted]);
    onLog('SUCCESS', `Restored deleted target: [${lastDeleted.profileName}]`);
  };

  const handleClearTable = () => {
    if (targets.length === 0) return;
    if (!confirmClearTable) {
      setConfirmClearTable(true);
      return;
    }
    setDeletedStack((prev) => [...prev, ...targets]);
    setTargets([]);
    setConfirmClearTable(false);
    onLog('WARN', 'Cleared all targets from table. Undo is available via Ctrl+Z.');
  };

  // Add new manual target
  const handleAddManualTarget = () => {
    const newTarget: TargetItem = {
      id: `target-${Date.now()}`,
      profileName: `New Target Page ${targets.length + 1}`,
      type: 'Page',
      videoPath: SAMPLE_VIDEOS[0].path,
      videoName: SAMPLE_VIDEOS[0].name,
      caption: bulkCaption,
      date: bulkDate,
      time: bulkTime,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    setTargets((prev) => [...prev, newTarget]);
    onLog('INFO', `Added manual target row: [${newTarget.profileName}]`);
  };

  // Save edited target
  const handleSaveEditTarget = () => {
    if (!editingTarget) return;
    setTargets((prev) =>
      prev.map((t) => (t.id === editingTarget.id ? editingTarget : t))
    );
    onLog('INFO', `Updated target details for [${editingTarget.profileName}].`);
    setEditingTarget(null);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. Global Bulk Caption / Comment Injector */}
      <section className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <FileText className="w-4 h-4 text-emerald-400" />
          <h2 className="text-sm font-bold text-white tracking-wide uppercase">
            1. Global Bulk Caption / Comment Injector
          </h2>
        </div>
        <p className="text-xs text-slate-400 mb-3">
          Inject captions, hashtags, and links across all assigned Facebook Pages or Instagram accounts. You can also use <code className="text-emerald-300 font-mono text-[11px]">{'{page_name}'}</code> to dynamically insert the target name!
        </p>

        <textarea
          rows={3}
          value={bulkCaption}
          onChange={(e) => setBulkCaption(e.target.value)}
          placeholder="Enter caption with hashtags or links here..."
          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
        />

        <div className="flex flex-wrap items-center justify-between gap-3 mt-3 pt-2 border-t border-slate-800/80">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] text-slate-400 mr-1 flex items-center gap-1">
              <Hash className="w-3 h-3 text-emerald-400" /> Quick Tags:
            </span>
            {['#viral', '#reels', '#fbreels', '#trending', '#fyp', '#business', '#shop'].map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => insertHashtag(tag)}
                className="text-[11px] px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer"
              >
                {tag}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={applyAllCaption}
                onChange={(e) => setApplyAllCaption(e.target.checked)}
                className="rounded border-slate-700 bg-slate-950 text-emerald-500 focus:ring-0"
              />
              <span>Apply to ALL Targets</span>
            </label>

            <button
              type="button"
              onClick={handleApplyBulkCaption}
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg cursor-pointer transition-colors shadow-sm"
            >
              📥 Apply Caption
            </button>
          </div>
        </div>
      </section>

      {/* 2. Global Bulk Schedule Time & Date Setter */}
      <section className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <Clock className="w-4 h-4 text-blue-400" />
          <h2 className="text-sm font-bold text-white tracking-wide uppercase">
            2. Global Bulk Schedule Time &amp; Date Setter
          </h2>
        </div>
        <p className="text-xs text-slate-400 mb-3">
          Configure publication date, start time, and optional staggered posting delays between pages to maintain human-like posting pacing.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Date (YYYY-MM-DD)
            </label>
            <input
              type="date"
              value={bulkDate}
              onChange={(e) => setBulkDate(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Start Time (HH:MM • +3m Auto)
            </label>
            <div className="flex items-center gap-1.5">
              <input
                type="time"
                value={bulkTime}
                onChange={(e) => setBulkTime(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono tabular-nums text-slate-100 focus:outline-none focus:border-blue-500"
              />
              <button
                type="button"
                onClick={handleRefreshStartTime}
                title="Refresh Start Time to Current Time + 3 Minutes"
                className="px-2.5 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 text-xs font-semibold rounded-lg cursor-pointer transition-colors flex items-center gap-1 shrink-0"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Page Delay Stagger
            </label>
            <select
              value={staggerMinutes}
              onChange={(e) => setStaggerMinutes(parseInt(e.target.value, 10))}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
            >
              <option value={0}>Same time for all (0m offset)</option>
              <option value={2}>+2 mins between each page</option>
              <option value={5}>+5 mins between each page</option>
              <option value={10}>+10 mins between each page</option>
              <option value={15}>+15 mins between each page</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleApplyBulkTime}
              className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg cursor-pointer transition-colors shadow-sm flex items-center justify-center gap-1.5"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Apply Time to All</span>
            </button>
          </div>
        </div>

        {timeStatusMsg && (
          <div className="mt-2.5 text-[11px] font-mono tabular-nums text-emerald-400">
            {timeStatusMsg}
          </div>
        )}
      </section>

      {/* 3. Assigned Targets Table */}
      <section className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-sm font-bold text-white tracking-wide uppercase flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-blue-400" />
              Assigned Targets Table ({targets.length})
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Target profiles, pages, video reels, captions, and exact schedule slots.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <label className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg cursor-pointer flex items-center gap-1.5 shadow-sm">
              <FolderOpen className="w-3.5 h-3.5" />
              <span>Choose Video(s)</span>
              <input
                type="file"
                multiple
                accept="video/*,.mp4,.mov,.mkv,.avi,.webm"
                onChange={handleChooseVideosForAll}
                className="hidden"
              />
            </label>

            <button
              type="button"
              onClick={handleAssignSampleVideos}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium rounded-lg cursor-pointer flex items-center gap-1.5"
              title="Assign preset sample MP4 video reels"
            >
              <Video className="w-3.5 h-3.5 text-blue-400" />
              <span>Assign Sample Reels</span>
            </button>

            <label className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-medium rounded-lg cursor-pointer flex items-center gap-1.5">
              <Upload className="w-3.5 h-3.5" />
              <span>Import Video .txt</span>
              <input
                type="file"
                accept=".txt"
                onChange={handleImportVideoPathsFile}
                className="hidden"
              />
            </label>

            <button
              type="button"
              onClick={handleAddManualTarget}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-lg cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Target</span>
            </button>

            {confirmClearTable ? (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleClearTable}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-lg cursor-pointer"
                >
                  Confirm Clear
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmClearTable(false)}
                  className="px-2.5 py-1.5 bg-slate-800 text-slate-300 text-xs rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleClearTable}
                className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-medium rounded-lg cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear Table</span>
              </button>
            )}
          </div>
        </div>

        {targets.length === 0 ? (
          <div className="p-10 text-center text-slate-500 border border-dashed border-slate-800 rounded-lg text-xs">
            No targets in queue. Click "Add Target" or switch to Tab 1 to auto-fetch pages from your Facebook accounts!
          </div>
        ) : (
          <div className="overflow-x-auto border border-slate-800 rounded-lg">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-950/80 text-slate-400 border-b border-slate-800 font-semibold uppercase text-[11px] tracking-wider">
                  <th className="py-2.5 px-3 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={selectedIds.length === targets.length && targets.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedIds(targets.map((t) => t.id));
                        else setSelectedIds([]);
                      }}
                      className="rounded border-slate-700 bg-slate-900"
                    />
                  </th>
                  <th className="py-2.5 px-3">Profile / Page Name</th>
                  <th className="py-2.5 px-3 text-center">Type</th>
                  <th className="py-2.5 px-3">Assigned Video / Media</th>
                  <th className="py-2.5 px-3">Caption</th>
                  <th className="py-2.5 px-3 text-center">Date</th>
                  <th className="py-2.5 px-3 text-center">Time</th>
                  <th className="py-2.5 px-3 text-center w-28">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 bg-slate-950/30">
                {targets.map((item) => {
                  const isSelected = selectedIds.includes(item.id);
                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-slate-800/40 transition-colors ${
                        isSelected ? 'bg-blue-500/5' : ''
                      }`}
                    >
                      <td className="py-2.5 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedIds((prev) => [...prev, item.id]);
                            else setSelectedIds((prev) => prev.filter((id) => id !== item.id));
                          }}
                          className="rounded border-slate-700 bg-slate-900"
                        />
                      </td>

                      <td className="py-2.5 px-3 font-semibold text-slate-200">
                        <div className="flex flex-col">
                          <span className="truncate max-w-[180px]">{item.profileName}</span>
                          {item.pageId && (
                            <span className="text-[10px] font-mono text-slate-500">
                              ID: {item.pageId}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-2.5 px-3 text-center">
                        <span className="text-[10px] font-semibold text-slate-300 font-mono">
                          {item.type}
                        </span>
                      </td>

                      <td className="py-2.5 px-3 max-w-[260px]">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => onPreviewVideo(item.videoPath, item.videoName || item.profileName)}
                            className="p-1 rounded bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 shrink-0 cursor-pointer"
                            title="Preview Video Player"
                          >
                            <Play className="w-3 h-3 fill-current" />
                          </button>
                          <span
                            className="truncate flex-1 text-[11px] font-mono text-slate-300 cursor-pointer hover:text-blue-400"
                            onClick={() => setEditingTarget(item)}
                            title={item.videoPath}
                          >
                            {item.videoName || item.videoPath}
                          </span>
                          <label
                            title="Choose video file from device"
                            className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 rounded text-[10px] font-semibold cursor-pointer flex items-center gap-1 shrink-0"
                          >
                            <FolderOpen className="w-3 h-3" />
                            <span>Choose</span>
                            <input
                              type="file"
                              accept="video/*,.mp4,.mov,.mkv,.avi,.webm"
                              onChange={(e) => handleChooseRowVideo(item.id, e)}
                              className="hidden"
                            />
                          </label>
                        </div>
                      </td>

                      <td className="py-2.5 px-3 max-w-[200px]">
                        <p
                          className="truncate text-slate-400 hover:text-slate-200 cursor-pointer"
                          onClick={() => setEditingTarget(item)}
                          title={item.caption}
                        >
                          {item.caption}
                        </p>
                      </td>

                      <td className="py-2.5 px-3 text-center font-mono tabular-nums text-slate-300">
                        {item.date}
                      </td>

                      <td className="py-2.5 px-3 text-center font-mono tabular-nums text-emerald-400 font-semibold">
                        {item.time}
                      </td>

                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => setEditingTarget(item)}
                            className="p-1 text-slate-400 hover:text-white rounded cursor-pointer"
                            title="Edit Target"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteRow(item)}
                            className="p-1 text-slate-400 hover:text-rose-400 rounded cursor-pointer"
                            title="Delete Row"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Table Bottom Action Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 pt-3 border-t border-slate-800">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleUndoDelete}
              disabled={deletedStack.length === 0}
              className="px-3 py-1.5 bg-purple-500/10 hover:bg-purple-500/20 disabled:opacity-30 text-purple-300 border border-purple-500/30 text-xs font-semibold rounded-lg cursor-pointer transition-colors flex items-center gap-1.5"
            >
              <Undo2 className="w-3.5 h-3.5" />
              <span>Undo Delete ({deletedStack.length})</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onGoToScheduler}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg cursor-pointer transition-colors flex items-center gap-2 shadow-sm"
          >
            <span>Proceed to Master Scheduler</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* Edit Target Row Modal */}
      {editingTarget && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-blue-400" />
                Edit Target: {editingTarget.profileName}
              </h3>
              <button
                type="button"
                onClick={() => setEditingTarget(null)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Profile / Page Name
                </label>
                <input
                  type="text"
                  value={editingTarget.profileName}
                  onChange={(e) =>
                    setEditingTarget({ ...editingTarget, profileName: e.target.value })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Page ID / Handle
                </label>
                <input
                  type="text"
                  value={editingTarget.pageId || ''}
                  onChange={(e) =>
                    setEditingTarget({ ...editingTarget, pageId: e.target.value })
                  }
                  placeholder="e.g. 10849201948201"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs font-mono text-slate-100 placeholder:text-slate-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Page Access Token (Optional for Graph API Direct Posting)
              </label>
              <input
                type="text"
                value={editingTarget.pageToken || ''}
                onChange={(e) =>
                  setEditingTarget({ ...editingTarget, pageToken: e.target.value })
                }
                placeholder="EAABwz... (Leave blank for automated browser RPA)"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs font-mono text-slate-100 placeholder:text-slate-600"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Assigned Video Path / Name
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={editingTarget.videoName || editingTarget.videoPath}
                  onChange={(e) =>
                    setEditingTarget({
                      ...editingTarget,
                      videoPath: e.target.value,
                      videoName: e.target.value,
                    })
                  }
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs font-mono text-slate-100"
                />
                <label className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg cursor-pointer flex items-center gap-1.5 shrink-0">
                  <FolderOpen className="w-3.5 h-3.5" />
                  <span>Choose Video</span>
                  <input
                    type="file"
                    accept="video/*,.mp4,.mov,.mkv,.avi,.webm"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const objectUrl = URL.createObjectURL(file);
                      setEditingTarget({
                        ...editingTarget,
                        videoPath: objectUrl,
                        videoName: file.name,
                      });
                      e.target.value = '';
                    }}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Post Caption
              </label>
              <textarea
                rows={3}
                value={editingTarget.caption}
                onChange={(e) =>
                  setEditingTarget({ ...editingTarget, caption: e.target.value })
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-100"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Schedule Date
                </label>
                <input
                  type="date"
                  value={editingTarget.date}
                  onChange={(e) =>
                    setEditingTarget({ ...editingTarget, date: e.target.value })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs font-mono text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Schedule Time
                </label>
                <input
                  type="time"
                  value={editingTarget.time}
                  onChange={(e) =>
                    setEditingTarget({ ...editingTarget, time: e.target.value })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs font-mono text-slate-100"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setEditingTarget(null)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEditTarget}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
