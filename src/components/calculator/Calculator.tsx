import React, { memo, useCallback, useEffect, useReducer, useRef, useState } from 'react';
import type { FC, Dispatch, DragEvent } from 'react';

// External Libraries
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import { jsPDF } from 'jspdf';
import Tesseract from 'tesseract.js';
import * as pdfjsLib from 'pdfjs-dist';
import { saveAs } from 'file-saver';
import { renderAsync } from 'docx-preview';

// IMPORTANT: Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

// Augment the global Window interface for non-standard APIs
declare global {
    interface Window {
        webkitSpeechRecognition: any;
    }
}

// ==============================================================================
// === 1. TYPE DEFINITIONS ======================================================
// ==============================================================================

type JobStatus = 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
type Theme = 'dark' | 'light';
type ConversionOutput = 'video.mp4' | 'audio.mp3' | 'image.gif' | 'image.jpg' | 'image.webp' | 'audio.ogg' | 'text';

interface ImageOptions { bgColor: string; textColor: string; fontSize: number; }
interface AudioOptions { voiceName: string; rate: number; pitch: number; }
interface VideoOptions { duration: number; kenBurns: boolean; watermark: { enabled: boolean; text: string; }; }
interface GenerationTasks { image: boolean; pdf: boolean; audio: boolean; video: boolean; animVideo: boolean; subtitles: boolean; }
interface CreateOptions { tasks: GenerationTasks; image: ImageOptions; audio: AudioOptions; video: VideoOptions; text: string; }
interface ConvertOptions { outputType: ConversionOutput; trim: { enabled: boolean; start: number; end: number; }; resize: { enabled: boolean; width: number; height: number; }; quality: { videoBitrate: number; audioBitrate: number; imageQuality: number; }; watermark: { enabled: boolean; text: string; }; }
interface FileResult { blob: Blob; filename: string; url: string; }
interface TextResult { text: string; }
interface GenerationResult { assets: { [key: string]: FileResult }; }
interface BaseJob { id: number; name: string; status: JobStatus; log: string; progress: number; error?: string; }
interface GenerateJob extends BaseJob { type: 'generate'; options: CreateOptions; result?: GenerationResult; }
interface ConvertJob extends BaseJob { type: 'convert'; file: File; previewUrl: string; options: ConvertOptions; result?: FileResult | TextResult; }
type Job = GenerateJob | ConvertJob;
type JobAction = | { type: 'ADD_JOB'; payload: Omit<Job, 'id' | 'status' | 'log' | 'progress'> } | { type: 'UPDATE_JOB'; payload: { id: number; updates: Partial<Job> } } | { type: 'APPEND_LOG'; payload: { id: number; message: string } } | { type: 'CANCEL_JOB'; payload: { id: number } } | { type: 'CLEAR_COMPLETED' };
type Callbacks = { onLog: (message: string) => void; onProgress: (progress: number) => void; };

// ==============================================================================
// === 2. UTILITIES & CORE MEDIA LOGIC ==========================================
// ==============================================================================

const analyzeText = (text: string) => { if (!text || text.trim() === '') return { wordCount: 0, characterCount: 0, sentenceCount: 0, readingTime: 0 }; const words = text.trim().split(/\s+/).filter(Boolean); const sentences = text.match(/[^.!?]+[.!?]+/g) || []; return { wordCount: words.length, characterCount: text.length, sentenceCount: sentences.length, readingTime: Math.ceil(words.length / 225) }; };
const readFileAsArrayBuffer = (file: File): Promise<ArrayBuffer> => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result as ArrayBuffer); r.onerror = rej; r.readAsArrayBuffer(file); });
const readFileAsText = (file: File): Promise<string> => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result as string); r.onerror = rej; r.readAsText(file); });
const getFileExtension = (filename: string): string => filename.slice((filename.lastIndexOf(".") - 1 >>> 0) + 2).toLowerCase();
const formatTime = (s: number): string => new Date(s * 1000).toISOString().substr(11, 12);
const createObjectURL = (blob: Blob) => URL.createObjectURL(blob);
const revokeObjectURL = (url: string) => URL.revokeObjectURL(url);

const createTextToImage = async (text: string, options: ImageOptions): Promise<Blob> => { const { bgColor, textColor, fontSize } = options; const canvas = document.createElement('canvas'); const ctx = canvas.getContext('2d')!; const dpr = window.devicePixelRatio || 1; const width = 1280, height = 720, padding = 50, lineHeight = fontSize * 1.5, maxWidth = width - padding * 2; ctx.font = `${fontSize}px sans-serif`; const words = text.split(' '), lines: string[] = []; let line = ''; for (let n = 0; n < words.length; n++) { const testLine = line + words[n] + ' '; if (ctx.measureText(testLine).width > maxWidth && n > 0) { lines.push(line); line = words[n] + ' '; } else { line = testLine; } } lines.push(line); canvas.width = width * dpr; canvas.height = height * dpr; ctx.scale(dpr, dpr); ctx.fillStyle = bgColor; ctx.fillRect(0, 0, width, height); ctx.fillStyle = textColor; ctx.font = `${fontSize}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; const totalTextHeight = lines.length * lineHeight; const startY = (height - totalTextHeight) / 2; for (let i = 0; i < lines.length; i++) ctx.fillText(lines[i].trim(), width / 2, startY + i * lineHeight); return new Promise(resolve => canvas.toBlob(blob => resolve(blob!), 'image/png')); };
const createTextToPdf = (text: string): Promise<Blob> => new Promise(res => { const d = new jsPDF(); d.text(d.splitTextToSize(text, 180), 10, 10); res(d.output('blob')); });
const createTextToAudio = (text: string, options: AudioOptions, { onLog }: Callbacks): Promise<{ blob: Blob, duration: number }> => new Promise((resolve, reject) => { if (!('speechSynthesis' in window) || !('MediaRecorder' in window)) return reject(new Error('TTS or MediaRecorder not supported')); const { voiceName, rate, pitch } = options; onLog('Preparing TTS...'); const utterance = new SpeechSynthesisUtterance(text); const voices = window.speechSynthesis.getVoices(); utterance.voice = voices.find(v => v.name === voiceName) || voices[0]; utterance.rate = rate; utterance.pitch = pitch; const audioChunks: BlobPart[] = []; const dest = new AudioContext().createMediaStreamDestination(); const mediaRecorder = new MediaRecorder(dest.stream, { mimeType: 'audio/webm' }); mediaRecorder.ondataavailable = e => audioChunks.push(e.data); mediaRecorder.onstop = async () => { const blob = new Blob(audioChunks, { type: 'audio/webm' }); try { const tempCtx = new AudioContext(); const buffer = await tempCtx.decodeAudioData(await blob.arrayBuffer()); const duration = buffer.duration; onLog(`Audio capture complete. Duration: ${duration.toFixed(2)}s`); tempCtx.close(); resolve({ blob, duration }); } catch (e) { onLog('Could not decode audio to get duration. Using estimate.'); const duration = text.split(" ").length / 2.5; resolve({ blob, duration }); } }; utterance.onend = () => { onLog('Speech finished.'); setTimeout(() => mediaRecorder.stop(), 250); }; utterance.onerror = e => reject(new Error(`Speech synthesis error: ${e.error}`)); setTimeout(() => { onLog('Starting recording and speech...'); mediaRecorder.start(); window.speechSynthesis.speak(utterance); }, 500); });
const createTextToVideo = async (imageBlob: Blob, audioBlob: Blob, videoOpts: VideoOptions, ffmpeg: FFmpeg, { onLog }: Callbacks, signal: AbortSignal): Promise<FileResult> => { onLog('Preparing files for video...'); await ffmpeg.writeFile('bg.png', await fetchFile(imageBlob)); await ffmpeg.writeFile('speech.webm', await fetchFile(audioBlob)); const vf_filters: string[] = []; if (videoOpts.kenBurns) { onLog('Applying Ken Burns effect...'); vf_filters.push("zoompan=z='min(zoom+0.0015,1.5)':d=125:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1280x720"); } if (videoOpts.watermark.enabled && videoOpts.watermark.text) { onLog('Applying watermark...'); const escapedText = videoOpts.watermark.text.replace(/'/g, "'\\''").replace(/:/g, '\\:'); vf_filters.push(`drawtext=text='${escapedText}':x=10:y=h-th-10:fontsize=24:fontcolor=white@0.8:box=1:boxcolor=black@0.5`); } const cmd = ['-loop', '1', '-i', 'bg.png', '-i', 'speech.webm', '-c:v', 'libx264', '-tune', 'stillimage', '-c:a', 'aac', '-b:a', '192k', '-pix_fmt', 'yuv420p', '-shortest']; if (vf_filters.length > 0) cmd.push('-vf', vf_filters.join(',')); cmd.push('output.mp4'); onLog(`Executing FFmpeg: ffmpeg ${cmd.join(' ')}`); await ffmpeg.exec(cmd, undefined, { signal }); onLog('Reading video file...'); const data = await ffmpeg.readFile('output.mp4'); const blob = new Blob([data.buffer], { type: 'video/mp4' }); return { blob, filename: 'video_with_audio.mp4', url: createObjectURL(blob) }; };
const createTextToAnimatedVideo = async (text: string, imageOptions: ImageOptions, duration: number, ffmpeg: FFmpeg, { onLog }: Callbacks, signal: AbortSignal): Promise<FileResult> => { onLog('Preparing background for animation...'); const canvas = document.createElement('canvas'); canvas.width = 1280; canvas.height = 720; const ctx = canvas.getContext('2d')!; ctx.fillStyle = imageOptions.bgColor; ctx.fillRect(0, 0, 1280, 720); const bgBlob = await new Promise<Blob>(res => canvas.toBlob(b => res(b!), 'image/png')); await ffmpeg.writeFile('bg_anim.png', await fetchFile(bgBlob)); const escapedText = text.replace(/'/g, "'\\''").replace(/:/g, '\\:'); const drawtextFilter = `drawtext=text='${escapedText}':fontcolor=${imageOptions.textColor}:fontsize=${imageOptions.fontSize}:x=(w-text_w)/2:y=(h-text_h)/2:alpha='if(lt(t,1),0,if(lt(t,2),(t-1),1))'`; onLog('Executing FFmpeg for animated video...'); await ffmpeg.exec(['-loop', '1', '-i', 'bg_anim.png', '-vf', drawtextFilter, '-c:v', 'libx264', '-tune', 'stillimage', '-pix_fmt', 'yuv420p', '-t', String(duration), 'output_anim.mp4'], undefined, { signal }); onLog('Reading animated video file...'); const data = await ffmpeg.readFile('output_anim.mp4'); const blob = new Blob([data.buffer], { type: 'video/mp4' }); return { blob, filename: 'animated_video.mp4', url: createObjectURL(blob) }; };
const createSubtitles = (text: string, duration: number): Promise<FileResult> => new Promise(res => { const startTime = "00:00:00,000"; const endTime = formatTime(duration - 0.1).replace('.', ','); const srtContent = `1\n${startTime} --> ${endTime}\n${text}`; const blob = new Blob([srtContent], { type: 'text/plain' }); res({ blob, filename: 'subtitles.srt', url: createObjectURL(blob) }); });
const convertFile = async (file: File, options: ConvertOptions, ffmpeg: FFmpeg, { onLog }: Callbacks, signal: AbortSignal): Promise<FileResult> => { const { outputType, trim, resize, quality, watermark } = options; const inputFilename = file.name; const ext = outputType.split('.').pop()!; const outputFilename = `converted.${ext}`; await ffmpeg.writeFile(inputFilename, await fetchFile(file)); const cmd = ['-i', inputFilename]; if (trim.enabled) { cmd.push('-ss', String(trim.start), '-to', String(trim.end)); } const vf: string[] = []; if (resize.enabled) { vf.push(`scale=${resize.width}:${resize.height}`); } if (watermark.enabled && watermark.text) { const escapedText = watermark.text.replace(/'/g, "'\\''").replace(/:/g, '\\:'); vf.push(`drawtext=text='${escapedText}':x=10:y=h-th-10:fontsize=24:fontcolor=white@0.8:box=1:boxcolor=black@0.5`); } if (outputType === 'image.gif') { vf.push(`fps=10,scale=${resize.enabled ? resize.width : 320}:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse`); } if (vf.length) { cmd.push('-vf', vf.join(',')); } if (quality.videoBitrate) { cmd.push('-b:v', `${quality.videoBitrate}k`); } if (quality.audioBitrate) { cmd.push('-b:a', `${quality.audioBitrate}k`); } if (quality.imageQuality) { cmd.push('-q:v', String(quality.imageQuality)); } if (outputType === 'audio.mp3' || outputType === 'audio.ogg') { cmd.push('-vn'); } cmd.push(outputFilename); onLog(`Executing FFmpeg: ffmpeg ${cmd.join(' ')}`); await ffmpeg.exec(cmd, undefined, { signal }); const data = await ffmpeg.readFile(outputFilename); const mimeType = { 'mp4': 'video/mp4', 'mp3': 'audio/mpeg', 'gif': 'image/gif', 'jpg': 'image/jpeg', 'webp': 'image/webp', 'ogg': 'audio/ogg' }[ext] || 'application/octet-stream'; const blob = new Blob([data.buffer], { type: mimeType }); return { blob, filename: outputFilename, url: createObjectURL(blob) }; };
const extractText = async (file: File, ffmpeg: FFmpeg, { onLog, onProgress }: Callbacks, signal: AbortSignal): Promise<TextResult> => { const ext = getFileExtension(file.name); if (ext === 'txt') { onLog('Reading plain text file...'); return { text: await readFileAsText(file) }; } if (ext === 'docx') { onLog('Reading DOCX file...'); const container = document.createElement('div'); await renderAsync(await readFileAsArrayBuffer(file), container); return { text: container.innerText }; } if (['png', 'jpg', 'jpeg', 'webp', 'bmp'].includes(ext) || ext === 'pdf') { onLog(`Initializing Tesseract for ${ext.toUpperCase()} OCR...`); const worker = await Tesseract.createWorker('eng', 1, { logger: m => { onLog(`[OCR] ${m.status}`); if (m.progress) onProgress(m.progress * 100); } }); signal.addEventListener('abort', () => worker.terminate()); if (ext === 'pdf') { const ab = await readFileAsArrayBuffer(file); const pdf = await pdfjsLib.getDocument(ab).promise; let fullText = ''; for (let i = 1; i <= pdf.numPages; i++) { onLog(`Processing page ${i}/${pdf.numPages}...`); const page = await pdf.getPage(i); const vp = page.getViewport({ scale: 2.0 }); const canvas = document.createElement('canvas'); canvas.height = vp.height; canvas.width = vp.width; await page.render({ canvasContext: canvas.getContext('2d')!, viewport: vp }).promise; const { data: { text } } = await worker.recognize(canvas); fullText += text + '\n\n'; } await worker.terminate(); onLog('PDF OCR complete.'); return { text: fullText }; } else { const { data: { text } } = await worker.recognize(file); await worker.terminate(); onLog('Image OCR complete.'); return { text }; } } if (['mp3', 'wav', 'ogg', 'm4a', 'mp4', 'webm', 'mov', 'avi'].includes(ext)) { if (!('webkitSpeechRecognition' in window)) throw new Error('Speech recognition not supported in this browser. Use Chrome.'); let audioBlob = file; if (['mp4', 'webm', 'mov', 'avi'].includes(ext)) { onLog('Extracting audio from video for transcription...'); await ffmpeg.writeFile(file.name, await fetchFile(file)); await ffmpeg.exec(['-i', file.name, '-vn', '-acodec', 'pcm_s16le', '-ar', '16000', '-ac', '1', 'audio.wav'], undefined, { signal }); const data = await ffmpeg.readFile('audio.wav'); audioBlob = new Blob([data.buffer], { type: 'audio/wav' }); } return new Promise((resolve, reject) => { onLog('Starting Speech-to-Text...'); const recognition = new window.webkitSpeechRecognition(); recognition.continuous = true; recognition.interimResults = true; let finalTranscript = ''; recognition.onresult = (event: any) => { let interimTranscript = ''; for (let i = event.resultIndex; i < event.results.length; ++i) { if (event.results[i].isFinal) { finalTranscript += event.results[i][0].transcript; } else { interimTranscript += event.results[i][0].transcript; } } onLog(`[STT] Interim: ${interimTranscript}`); }; recognition.onerror = (event: any) => reject(new Error(`Speech recognition error: ${event.error}`)); recognition.onend = () => { onLog('Speech-to-Text finished.'); resolve({ text: finalTranscript }); }; const audioUrl = createObjectURL(audioBlob); const audio = new Audio(audioUrl); audio.oncanplaythrough = () => { recognition.start(); audio.play(); }; audio.onended = () => { recognition.stop(); revokeObjectURL(audioUrl); }; signal.addEventListener('abort', () => { recognition.abort(); audio.pause(); revokeObjectURL(audioUrl); reject(new Error('Transcription cancelled.')); }); }); } throw new Error(`Unsupported file type for text extraction: .${ext}`); };

// ==============================================================================
// === 3. STATE MANAGEMENT (REDUCER & CUSTOM HOOKS) =============================
// ==============================================================================

// --- 3a. FFmpeg Loader Hook ---
const useFFmpeg = () => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const ffmpegRef = useRef<FFmpeg | null>(null);

    const load = useCallback(async () => {
        if (ffmpegRef.current || isLoading) return;
        setIsLoading(true);
        console.log("Loading FFmpeg...");
        try {
            const ffmpeg = new FFmpeg();
            await ffmpeg.load({
                coreURL: await toBlobURL('https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.js', 'text/javascript'),
                wasmURL: await toBlobURL('https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.wasm', 'application/wasm'),
            });
            ffmpegRef.current = ffmpeg;
            setIsLoaded(true);
             console.log("FFmpeg Loaded Successfully.");
        } catch (error) {
            console.error("Failed to load FFmpeg:", error);
        } finally {
            setIsLoading(false);
        }
    }, [isLoading]);

    useEffect(() => {
        load();
    }, [load]);

    return { ffmpeg: ffmpegRef.current, isLoaded, isLoading };
};


// --- 3b. Job Reducer Logic ---
const initialJobState = (): Job[] => {
    try {
        const saved = localStorage.getItem('mediaJobs');
        return saved ? JSON.parse(saved).filter((j: Job) => ['completed', 'failed', 'cancelled'].includes(j.status)) : [];
    } catch { return []; }
};
const jobReducer = (state: Job[], action: JobAction): Job[] => {
    switch (action.type) {
        case 'ADD_JOB': return [...state, { ...action.payload, id: Date.now(), status: 'queued', log: '', progress: 0 }];
        case 'UPDATE_JOB': return state.map(job => job.id === action.payload.id ? { ...job, ...action.payload.updates } : job);
        case 'APPEND_LOG': return state.map(job => job.id === action.payload.id ? { ...job, log: (job.log ? `${job.log}\n` : '') + action.payload.message.slice(-4000) } : job);
        case 'CANCEL_JOB': return state.map(job => job.id === action.payload.id && (job.status === 'queued' || job.status === 'running') ? { ...job, status: 'cancelled', error: 'Job cancelled by user.' } : job);
        case 'CLEAR_COMPLETED': return state.filter(job => job.status === 'running' || job.status === 'queued');
        default: return state;
    }
};

// --- 3c. Job Processor Hook ---
const useJobQueue = () => {
    const [jobs, dispatch] = useReducer(jobReducer, [], initialJobState);
    const { ffmpeg, isLoaded: isFFmpegLoaded } = useFFmpeg();
    const isProcessorRunning = useRef(false);
    const jobAbortController = useRef<AbortController | null>(null);

    useEffect(() => {
        const jobsToSave = jobs.filter(j => ['completed', 'failed', 'cancelled'].includes(j.status));
        localStorage.setItem('mediaJobs', JSON.stringify(jobsToSave));
    }, [jobs]);

    const dispatchUpdateJob = (id: number, updates: Partial<Job>) => dispatch({ type: 'UPDATE_JOB', payload: { id, updates } });
    const dispatchAppendLog = (id: number, message: string) => dispatch({ type: 'APPEND_LOG', payload: { id, message } });
    const addJob = (job: Omit<Job, 'id' | 'status' | 'log' | 'progress'>) => dispatch({ type: 'ADD_JOB', payload: job });
    const cancelJob = (id: number) => {
        if (jobs.find(j => j.id === id && j.status === 'running') && jobAbortController.current) {
            dispatchAppendLog(id, 'Cancellation signal sent...');
            jobAbortController.current.abort();
        }
        dispatch({ type: 'CANCEL_JOB', payload: { id } });
    };
    const clearCompleted = () => dispatch({ type: 'CLEAR_COMPLETED' });

    const processQueue = useCallback(async () => {
        if (isProcessorRunning.current || !isFFmpegLoaded || !ffmpeg) return;
        const nextJob = jobs.find(j => j.status === 'queued');
        if (!nextJob) return;

        isProcessorRunning.current = true;
        jobAbortController.current = new AbortController();
        dispatchUpdateJob(nextJob.id, { status: 'running', progress: 0, log: 'Starting job...' });

        ffmpeg.on('log', ({ message }) => dispatchAppendLog(nextJob.id, `[FFMPEG] ${message}`));
        ffmpeg.on('progress', ({ progress }) => dispatchUpdateJob(nextJob.id, { progress: Math.max(0, progress * 100) }));

        const callbacks: Callbacks = {
            onLog: (msg) => dispatchAppendLog(nextJob.id, msg),
            onProgress: (p) => dispatchUpdateJob(nextJob.id, { progress: p })
        };

        try {
            let result: Job['result'];
            if (nextJob.type === 'generate') {
                result = await runGenerationJob(nextJob, ffmpeg, callbacks, jobAbortController.current.signal);
            } else {
                result = await runConversionJob(nextJob, ffmpeg, callbacks, jobAbortController.current.signal);
            }
            if (jobAbortController.current.signal.aborted) throw new Error("Job was cancelled.");
            dispatchUpdateJob(nextJob.id, { status: 'completed', result, progress: 100 });
        } catch (error: any) {
            const isCancelled = error.name === 'AbortError' || error.message.includes('cancelled');
            dispatchUpdateJob(nextJob.id, { status: isCancelled ? 'cancelled' : 'failed', error: error.message, progress: 0 });
        } finally {
            ffmpeg.on('log', () => {});
            ffmpeg.on('progress', () => {});
            isProcessorRunning.current = false;
            jobAbortController.current = null;
        }
    }, [jobs, isFFmpegLoaded, ffmpeg]);

    useEffect(() => {
        if (jobs.some(j => j.status === 'queued') && !isProcessorRunning.current && isFFmpegLoaded) {
            processQueue();
        }
    }, [jobs, processQueue, isFFmpegLoaded]);

    return { jobs, addJob, cancelJob, clearCompleted, isProcessing: isProcessorRunning.current };
};

// --- 3d. Job Runner Functions ---
const runGenerationJob = async (job: GenerateJob, ffmpeg: FFmpeg, callbacks: Callbacks, signal: AbortSignal): Promise<GenerationResult> => {
    const { tasks, image: imageOpts, audio: audioOpts, video: videoOpts, text } = job.options;
    const results: GenerationResult['assets'] = {};
    let imageBlob: Blob | undefined, audioResult: { blob: Blob, duration: number } | undefined;
    const assetPromises = [];
    if (tasks.image || tasks.video || tasks.animVideo) { assetPromises.push((async () => { callbacks.onLog('Generating image...'); imageBlob = await createTextToImage(text, imageOpts); if (tasks.image && imageBlob) { results.image = { blob: imageBlob, filename: 'image.png', url: createObjectURL(imageBlob) }; } })()); }
    if (tasks.audio || tasks.video || tasks.subtitles) { assetPromises.push((async () => { callbacks.onLog('Generating audio...'); audioResult = await createTextToAudio(text, audioOpts, callbacks); if (tasks.audio && audioResult) { results.audio = { blob: audioResult.blob, filename: 'audio.webm', url: createObjectURL(audioResult.blob) }; } })()); }
    if (tasks.pdf) { assetPromises.push((async () => { callbacks.onLog('Generating PDF...'); const blob = await createTextToPdf(text); results.pdf = { blob, filename: 'document.pdf', url: createObjectURL(blob) }; })()); }
    await Promise.all(assetPromises);
    signal.throwIfAborted();
    if (tasks.video && imageBlob && audioResult) { callbacks.onLog('Generating video w/ audio...'); results.video = await createTextToVideo(imageBlob, audioResult.blob, videoOpts, ffmpeg, callbacks, signal); }
    signal.throwIfAborted();
    if (tasks.animVideo) { callbacks.onLog('Generating animated video...'); results.animVideo = await createTextToAnimatedVideo(text, imageOpts, videoOpts.duration, ffmpeg, callbacks, signal); }
    signal.throwIfAborted();
    if (tasks.subtitles && audioResult) { callbacks.onLog('Generating subtitles...'); results.subtitles = await createSubtitles(text, audioResult.duration); }
    return { assets: results };
};
const runConversionJob = async (job: ConvertJob, ffmpeg: FFmpeg, callbacks: Callbacks, signal: AbortSignal): Promise<FileResult | TextResult> => {
    const { file, options } = job;
    return options.outputType === 'text' ? extractText(file, ffmpeg, callbacks, signal) : convertFile(file, options, ffmpeg, callbacks, signal);
};


// ==============================================================================
// === 4. UI COMPONENTS =========================================================
// ==============================================================================

const AppStyles: FC = () => ( <style>{`:root { --primary-color: #4a90e2; --secondary-color: #16213e; --accent-color: #e94560; --light-text: #dcdcdc; --dark-text: #333; --bg-color: #0f3460; --card-bg: #1a1a2e; } .theme-light { --primary-color: #1e88e5; --secondary-color: #f5f5f5; --accent-color: #d81b60; --light-text: #212121; --dark-text: #ffffff; --bg-color: #e3f2fd; --card-bg: #ffffff; } .App { text-align: center; background-color: var(--bg-color); color: var(--light-text); min-height: 100vh; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; transition: background-color 0.3s, color 0.3s; } .app-header { display: flex; justify-content: space-between; align-items: center; background-color: var(--secondary-color); padding: 20px; color: var(--light-text); box-shadow: 0 2px 4px rgba(0,0,0,0.2); } .app-header h1 { color: var(--primary-color); } .theme-toggle { background-color: var(--primary-color); color: white; border: none; padding: 8px 16px; border-radius: 5px; cursor: pointer; } main { padding: 20px; max-width: 1200px; margin: auto; } .tabs { display: flex; justify-content: center; margin-bottom: 2rem; border-bottom: 2px solid var(--secondary-color); } .tab-button { background: none; border: none; color: var(--light-text); padding: 1rem 1.5rem; font-size: 1.2rem; cursor: pointer; position: relative; transition: color 0.3s; } .tab-button.active { color: var(--primary-color); } .tab-button.active::after { content: ''; position: absolute; bottom: -2px; left: 0; width: 100%; height: 2px; background-color: var(--primary-color); } .tab-content { background-color: var(--card-bg); padding: 2rem; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.3); margin-bottom: 2rem; text-align: left; } .action-button { background-color: var(--primary-color); color: white; border: none; padding: 12px 24px; border-radius: 5px; cursor: pointer; font-size: 1rem; font-weight: bold; transition: background-color 0.3s, transform 0.1s; display: block; margin: 1.5rem auto 0; } .action-button:hover:not(:disabled) { background-color: #357abd; transform: translateY(-1px); } .action-button:disabled { background-color: #555; cursor: not-allowed; } textarea, input, select { width: 100%; background-color: var(--secondary-color); color: var(--light-text); border: 1px solid var(--primary-color); border-radius: 5px; padding: 10px; font-size: 1rem; box-sizing: border-box; margin-bottom: 10px; } .config-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem; margin: 1rem 0; } .config-item { display: flex; flex-direction: column; } .config-item label { margin-bottom: 0.5rem; } .checkbox-item, .toggle-item { display: flex; align-items: center; gap: 8px; margin-bottom: 0.5rem; } .drop-zone { border: 2px dashed var(--primary-color); border-radius: 8px; padding: 2rem; cursor: pointer; transition: background-color 0.3s; text-align: center; } .drop-zone.active { background-color: var(--secondary-color); } .file-preview { margin-top: 1.5rem; text-align: center; } .file-preview video, .file-preview img, .file-preview audio { max-width: 100%; max-height: 300px; border-radius: 8px; } .job-queue { margin-top: 2rem; } .job-card { background-color: var(--secondary-color); border-left: 5px solid var(--primary-color); padding: 1rem; border-radius: 8px; margin-bottom: 1rem; text-align: left; } .job-card[data-status="completed"] { border-left-color: #27ae60; } .job-card[data-status="failed"] { border-left-color: var(--accent-color); } .job-card[data-status="cancelled"] { border-left-color: #f9a825; } .job-header { display: flex; justify-content: space-between; align-items: center; } .job-title { font-weight: bold; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; padding-right: 10px; } .job-status { text-transform: capitalize; padding: 4px 8px; border-radius: 4px; font-size: 0.8rem; flex-shrink: 0;} .job-status-running { background-color: var(--primary-color); } .job-status-completed { background-color: #27ae60; } .job-status-failed { background-color: var(--accent-color); } .job-status-cancelled { background-color: #f9a825; } .job-status-queued { background-color: #555; } .progress-container { background-color: #555; border-radius: 5px; overflow: hidden; margin: 10px 0; } .progress-bar { background-color: var(--primary-color); color: white; padding: 2px 5px; text-align: right; transition: width 0.3s ease-in-out; } .log-output { background-color: #000; font-family: 'Courier New', Courier, monospace; font-size: 0.8rem; max-height: 150px; overflow-y: auto; padding: 10px; border-radius: 5px; white-space: pre-wrap; word-break: break-all; margin-top: 10px; } .result-display { margin-top: 1rem; } .result-previews { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; } .preview-item { display: flex; flex-direction: column; align-items: center; gap: 0.5rem; background-color: var(--card-bg); padding: 1rem; border-radius: 8px; } .preview-item video, .preview-item img, .preview-item audio { max-width: 100%; border-radius: 4px; } .result-actions { margin-top: 1rem; display: flex; flex-wrap: wrap; gap: 10px; } .job-card button { background-color: var(--primary-color); color: white; border: none; padding: 8px 16px; border-radius: 5px; cursor: pointer; transition: background-color 0.3s; } .download-button { background-color: #27ae60 !important; } .cancel-button { background-color: var(--accent-color) !important; } .copy-button { background-color: #f9a825 !important; }`}</style> );

interface CreateTabProps { onAddJob: (job: Omit<GenerateJob, 'id' | 'status' | 'log' | 'progress'>) => void; isProcessing: boolean; }
const CreateTab: FC<CreateTabProps> = ({ onAddJob, isProcessing }) => {
    const [text, setText] = useState('This is a test of the advanced universal creator. It will generate multiple assets based on the user\'s selection, including an animated video and subtitles.');
    const [options, setOptions] = useState<Omit<CreateOptions, 'text'>>({ tasks: { image: true, pdf: false, audio: true, video: true, animVideo: false, subtitles: true }, image: { bgColor: '#16213e', textColor: '#dcdcdc', fontSize: 48 }, audio: { voiceName: '', rate: 1, pitch: 1 }, video: { duration: 10, kenBurns: true, watermark: { enabled: true, text: 'God Level' } }, });
    const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
    const textAnalysis = analyzeText(text);
    useEffect(() => { const loadVoices = () => { const v = window.speechSynthesis.getVoices(); if (v.length) { setVoices(v); if (!options.audio.voiceName) setOptions(p => ({ ...p, audio: { ...p.audio, voiceName: v[0].name } })); } }; loadVoices(); window.speechSynthesis.onvoiceschanged = loadVoices; return () => { window.speechSynthesis.onvoiceschanged = null; }; }, [options.audio.voiceName]);
    const handleChange = <T extends keyof Omit<CreateOptions, 'text'>>(group: T, name: keyof Omit<CreateOptions, 'text'>[T], value: any) => setOptions(p => ({ ...p, [group]: { ...p[group], [name]: value } }));
    const handleNestedChange = (group: 'video', subGroup: 'watermark', name: 'enabled' | 'text', value: any) => setOptions(p => ({ ...p, [group]: { ...p[group], [subGroup]: { ...p[group][subGroup], [name]: value } } }));
    const handleTaskChange = (e: React.ChangeEvent<HTMLInputElement>) => handleChange('tasks', e.target.name as keyof GenerationTasks, e.target.checked);
    const handleAddToQueue = () => { onAddJob({ type: 'generate', name: `Generate: ${text.substring(0, 20)}...`, options: { ...options, text } }); };

    return (<div> <h3>1. Enter Text</h3> <textarea value={text} onChange={e => setText(e.target.value)} rows={5} disabled={isProcessing} /> <div style={{ fontSize: '0.9rem', opacity: 0.8, marginBottom: '1rem' }}> Words: {textAnalysis.wordCount} | Sentences: {textAnalysis.sentenceCount} | Reading Time: {textAnalysis.readingTime} min </div> <h3>2. Select Assets to Generate</h3> <div className="config-grid">{Object.entries({image:'Image', pdf:'PDF', audio:'Audio', video:'Video (w/ Audio)', animVideo:'Animated Video', subtitles:'Subtitles (.srt)'}).map(([key, label]) => (<label key={key} className="checkbox-item"><input type="checkbox" id={`task-${key}`} name={key} checked={options.tasks[key as keyof GenerationTasks]} onChange={handleTaskChange} disabled={isProcessing}/>{label}</label>))}</div> <h3>3. Configure Options</h3> <div className="config-grid"> <div className="config-item"><label>Font Size:</label><input type="number" value={options.image.fontSize} onChange={e=>handleChange('image','fontSize',parseInt(e.target.value, 10))} /></div> <div className="config-item"><label>BG Color:</label><input type="color" value={options.image.bgColor} onChange={e=>handleChange('image','bgColor',e.target.value)} /></div> <div className="config-item"><label>Text Color:</label><input type="color" value={options.image.textColor} onChange={e=>handleChange('image','textColor',e.target.value)} /></div> <div className="config-item"><label>Voice:</label><select value={options.audio.voiceName} onChange={e=>handleChange('audio','voiceName',e.target.value)}>{voices.map(v=><option key={v.name} value={v.name}>{v.name}</option>)}</select></div> <div className="config-item"><label>Anim. Video Duration (s):</label><input type="number" value={options.video.duration} onChange={e=>handleChange('video','duration',parseInt(e.target.value, 10))} /></div> </div> <h4>Video Effects</h4> <div className="config-grid"> <div className="toggle-item"><label><input type="checkbox" checked={options.video.kenBurns} onChange={e => handleChange('video', 'kenBurns', e.target.checked)} /> Ken Burns Effect</label></div> <div className="toggle-item"><label><input type="checkbox" checked={options.video.watermark.enabled} onChange={e => handleNestedChange('video', 'watermark', 'enabled', e.target.checked)} /> Watermark</label></div> {options.video.watermark.enabled && <div className="config-item"><label>Watermark Text:</label><input type="text" value={options.video.watermark.text} onChange={e => handleNestedChange('video', 'watermark', 'text', e.target.value)} /></div>} </div> <button className="action-button" onClick={handleAddToQueue} disabled={!text || isProcessing}>Add Generation Job</button> </div>);
};

interface ConvertTabProps { onAddJob: (job: Omit<ConvertJob, 'id' | 'status' | 'log' | 'progress'>) => void; isProcessing: boolean; }
const ConvertTab: FC<ConvertTabProps> = ({ onAddJob, isProcessing }) => {
    const [file, setFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string>('');
    const [isDragging, setIsDragging] = useState(false);
    const [options, setOptions] = useState<ConvertOptions>({ outputType: 'video.mp4', trim: { enabled: false, start: 0, end: 10 }, resize: { enabled: false, width: 1280, height: 720 }, quality: { videoBitrate: 2000, audioBitrate: 192, imageQuality: 2 }, watermark: { enabled: false, text: 'God Level' } });
    useEffect(() => () => { if (previewUrl) revokeObjectURL(previewUrl); }, [previewUrl]);
    const handleFileChange = (selectedFile: File) => { if (previewUrl) revokeObjectURL(previewUrl); setFile(selectedFile); setPreviewUrl(createObjectURL(selectedFile)); };
    const handleDragEvent = (e: DragEvent<HTMLDivElement>, status: boolean) => { e.preventDefault(); e.stopPropagation(); setIsDragging(status); };
    const handleDrop = (e: DragEvent<HTMLDivElement>) => { handleDragEvent(e, false); if (e.dataTransfer.files && e.dataTransfer.files[0]) handleFileChange(e.dataTransfer.files[0]); };
    const handleAddToQueue = () => { if (!file) return; onAddJob({ type: 'convert', name: `Convert: ${file.name}`, file, previewUrl: createObjectURL(file), options }); setFile(null); setPreviewUrl(''); };

    return (<div><h3>1. Drop File or Click to Select</h3><div className={`drop-zone ${isDragging ? 'active' : ''}`} onDragEnter={e => handleDragEvent(e, true)} onDragLeave={e => handleDragEvent(e, false)} onDragOver={e => handleDragEvent(e, true)} onDrop={handleDrop} onClick={() => document.getElementById('file-input')?.click()}><input type="file" id="file-input" hidden onChange={e => e.target.files && handleFileChange(e.target.files[0])} /> {file ? `Selected: ${file.name}` : 'Drop file here'}</div>{previewUrl && <div className="file-preview">{file?.type.startsWith('video') ? <video src={previewUrl} controls /> : file?.type.startsWith('image') ? <img src={previewUrl} alt="preview" /> : file?.type.startsWith('audio') ? <audio src={previewUrl} controls /> : <p>Preview not available for this file type.</p>}</div>}<h3>2. Configure Conversion</h3><div className="config-grid"><div className="config-item"><label>Output Type:</label><select value={options.outputType} onChange={e => setOptions(p => ({ ...p, outputType: e.target.value as ConversionOutput }))}><option value="video.mp4">Video (MP4)</option><option value="audio.mp3">Audio (MP3)</option><option value="image.gif">Animated GIF</option><option value="image.jpg">Image (JPG)</option><option value="text">Extract Text (OCR/STT)</option></select></div></div><h4>Effects & Adjustments</h4><div className="config-grid"><div className="toggle-item"><label><input type="checkbox" checked={options.trim.enabled} onChange={e => setOptions(p => ({...p, trim: {...p.trim, enabled: e.target.checked}}))} />Trim</label></div>{options.trim.enabled && <><div className="config-item"><label>Start (s):</label><input type="number" value={options.trim.start} onChange={e => setOptions(p => ({...p, trim: {...p.trim, start: +e.target.value}}))} /></div><div className="config-item"><label>End (s):</label><input type="number" value={options.trim.end} onChange={e => setOptions(p => ({...p, trim: {...p.trim, end: +e.target.value}}))} /></div></>}<div className="toggle-item"><label><input type="checkbox" checked={options.resize.enabled} onChange={e => setOptions(p => ({...p, resize: {...p.resize, enabled: e.target.checked}}))} />Resize</label></div>{options.resize.enabled && <><div className="config-item"><label>Width:</label><input type="number" value={options.resize.width} onChange={e => setOptions(p => ({...p, resize: {...p.resize, width: +e.target.value}}))} /></div><div className="config-item"><label>Height:</label><input type="number" value={options.resize.height} onChange={e => setOptions(p => ({...p, resize: {...p.resize, height: +e.target.value}}))} /></div></>}<div className="toggle-item"><label><input type="checkbox" checked={options.watermark.enabled} onChange={e => setOptions(p => ({...p, watermark: {...p.watermark, enabled: e.target.checked}}))} />Watermark</label></div>{options.watermark.enabled && <div className="config-item"><label>Watermark Text:</label><input type="text" value={options.watermark.text} onChange={e => setOptions(p => ({...p, watermark: {...p.watermark, text: e.target.value}}))} /></div>}</div><button className="action-button" onClick={handleAddToQueue} disabled={!file || isProcessing}>Add Conversion Job</button></div>);
};

const JobResultPreview: FC<{ result: Job['result'] }> = ({ result }) => {
    if (!result) return null;
    if ('text' in result) {
        return <div className="result-display"> <textarea value={result.text} rows={8} readOnly /> <button className="copy-button" onClick={() => navigator.clipboard.writeText(result.text)}>Copy Text</button> </div>
    }
    const assets = 'assets' in result ? Object.entries(result.assets) : [['result', result as FileResult]];
    return <div className="result-previews">{assets.map(([key, fileRes]) => { const type = fileRes.blob.type.split('/')[0]; return (<div key={key} className="preview-item"> <strong>{key}</strong> {type === 'video' && <video src={fileRes.url} controls />} {type === 'image' && <img src={fileRes.url} alt={key} />} {type === 'audio' && <audio src={fileRes.url} controls />} <button className="download-button" onClick={() => saveAs(fileRes.blob, fileRes.filename)}>Download</button> </div>); })}</div>;
};

const JobCard: FC<{ job: Job; onCancelJob: (id: number) => void; }> = memo(({ job, onCancelJob }) => {
    return (
        <div className="job-card" data-status={job.status}>
            <div className="job-header"> <div className="job-title">{job.name}</div> <div className={`job-status job-status-${job.status}`}>{job.status}</div> </div>
            <div className="job-details">
                {job.status === 'running' && <div className="progress-container"><div className="progress-bar" style={{ width: `${job.progress}%` }}>{job.progress.toFixed(0)}%</div></div>}
                {job.log && <div className="log-output"><pre>{job.log}</pre></div>}
                {job.status === 'completed' && job.result && <JobResultPreview result={job.result} />}
                {job.status === 'failed' && <p style={{color: 'var(--accent-color)'}}>Error: {job.error}</p>}
                {(job.status === 'running' || job.status === 'queued') && <div className="result-actions"><button className="cancel-button" onClick={() => onCancelJob(job.id)}>Cancel Job</button></div>}
            </div>
        </div>
    );
});

const JobQueue: FC<{ jobs: Job[]; onClearAll: () => void; onCancelJob: (id: number) => void; }> = ({ jobs, onClearAll, onCancelJob }) => (<div className="job-queue"> <h2>Job Queue</h2> <button onClick={onClearAll} className="action-button" style={{backgroundColor: 'var(--accent-color)', marginBottom: '1rem', marginTop: 0}}>Clear Finished</button> {jobs.map(job => <JobCard key={job.id} job={job} onCancelJob={onCancelJob} />)} </div>);


// ==============================================================================
// === 5. MAIN APP COMPONENT (`Calculator`) =====================================
// ==============================================================================

const Calculator: FC = () => {
    const [activeTab, setActiveTab] = useState<'create' | 'convert'>('create');
    const [theme, setTheme] = useState<Theme>('dark');
    const { jobs, addJob, cancelJob, clearCompleted, isProcessing } = useJobQueue();

    return (
        <div className={`App theme-${theme}`}>
            <AppStyles />
            <header className="app-header">
                <h1>Universal Creator & Converter - God Level</h1>
                <button onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')} className="theme-toggle">
                    Switch to {theme === 'dark' ? 'Light' : 'Dark'} Mode
                </button>
            </header>
            <main>
                <div className="tabs">
                    <button className={`tab-button ${activeTab === 'create' ? 'active' : ''}`} onClick={() => setActiveTab('create')}>
                        Create from Text
                    </button>
                    <button className={`tab-button ${activeTab === 'convert' ? 'active' : ''}`} onClick={() => setActiveTab('convert')}>
                        Direct File Converter
                    </button>
                </div>
                <div className="tab-content">
                    {activeTab === 'create' ?
                        <CreateTab onAddJob={addJob} isProcessing={isProcessing} /> :
                        <ConvertTab onAddJob={addJob} isProcessing={isProcessing} />
                    }
                </div>
                <JobQueue jobs={jobs} onClearAll={clearCompleted} onCancelJob={cancelJob} />
            </main>
        </div>
    );
}

export default Calculator;