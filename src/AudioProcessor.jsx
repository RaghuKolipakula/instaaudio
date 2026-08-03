"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Upload, FileAudio, FileImage, Loader } from 'lucide-react';

export function AudioProcessor({ initialHeadline, initialCopy }) {
  const [loaded, setLoaded] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [outputUrl, setOutputUrl] = useState(null);
  
  const [voiceFile, setVoiceFile] = useState(null);
  const [bgmFile, setBgmFile] = useState(null);
  const [imageFile, setImageFile] = useState(null);

  const ffmpegRef = useRef(null);
  const messageRef = useRef(null);

  useEffect(() => {
    const load = async () => {
      const { FFmpeg } = await import('@ffmpeg/ffmpeg');
      const { toBlobURL } = await import('@ffmpeg/util');
      
      ffmpegRef.current = new FFmpeg();
      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
      const ffmpeg = ffmpegRef.current;
      
      ffmpeg.on('log', ({ message }) => {
        if (messageRef.current) messageRef.current.innerText = message;
      });

      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      });
      setLoaded(true);
    };
    load();
  }, []);

  const handleProcess = async () => {
    if (!voiceFile || !bgmFile || !imageFile) {
      alert("Please upload voice, background music, and an image.");
      return;
    }
    
    setProcessing(true);
    const ffmpeg = ffmpegRef.current;
    
    try {
      const { fetchFile } = await import('@ffmpeg/util');
      await ffmpeg.writeFile('voice.mp3', await fetchFile(voiceFile));
      await ffmpeg.writeFile('bgm.mp3', await fetchFile(bgmFile));
      await ffmpeg.writeFile('image.jpg', await fetchFile(imageFile));

      // Equivalent to concat_and_render.py logic:
      // Loop image, mix voice and bgm (scaled 0.08), shortest duration
      await ffmpeg.exec([
        '-loop', '1',
        '-framerate', '1',
        '-i', 'image.jpg',
        '-i', 'voice.mp3',
        '-i', 'bgm.mp3',
        '-filter_complex', '[2:a]volume=0.08[a2];[1:a][a2]amix=inputs=2:duration=first[a]',
        '-map', '0:v',
        '-map', '[a]',
        '-c:v', 'libx264',
        '-tune', 'stillimage',
        '-c:a', 'aac',
        '-b:a', '192k',
        '-pix_fmt', 'yuv420p',
        '-shortest',
        'output.mp4'
      ]);

      const data = await ffmpeg.readFile('output.mp4');
      const url = URL.createObjectURL(new Blob([data.buffer], { type: 'video/mp4' }));
      setOutputUrl(url);
      
      // Track successful conversion
      fetch('/api/track', {
        method: 'POST',
        body: JSON.stringify({ event_type: 'conversion', page_slug: window.location.pathname.replace('/', '') || 'home' })
      }).catch(()=>null);

    } catch (e) {
      console.error(e);
      alert("Error processing audio: " + e.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div style={{ background: '#fff', padding: '2rem', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
      <h1 style={{ marginBottom: '0.5rem' }}>{initialHeadline || "Create Video from Audio & Image"}</h1>
      <p style={{ color: '#666', marginBottom: '2rem' }} dangerouslySetInnerHTML={{ __html: initialCopy || "Combine your voiceover with background music and a static image directly in your browser. No server uploads." }} />
      
      {!loaded ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#666' }}>
          <Loader className="animate-spin" /> Loading Audio Engine...
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          <div style={{ border: '2px dashed #ccc', padding: '1rem', borderRadius: '8px' }}>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem' }}>1. Voice Over (MP3)</label>
            <input type="file" accept="audio/*" onChange={(e) => setVoiceFile(e.target.files[0])} />
          </div>
          
          <div style={{ border: '2px dashed #ccc', padding: '1rem', borderRadius: '8px' }}>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem' }}>2. Background Music (MP3)</label>
            <input type="file" accept="audio/*" onChange={(e) => setBgmFile(e.target.files[0])} />
          </div>
          
          <div style={{ border: '2px dashed #ccc', padding: '1rem', borderRadius: '8px' }}>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem' }}>3. Background Image (JPG/PNG)</label>
            <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files[0])} />
          </div>
          
          <button 
            onClick={handleProcess} 
            disabled={processing}
            style={{ padding: '1rem', background: '#0070f3', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '1.1rem', cursor: processing ? 'not-allowed' : 'pointer' }}
          >
            {processing ? 'Processing... (See logs below)' : 'Generate Video'}
          </button>
          
          <p ref={messageRef} style={{ fontSize: '0.8rem', color: '#999', fontFamily: 'monospace', height: '40px', overflow: 'hidden' }}></p>
          
          {outputUrl && (
            <div style={{ marginTop: '2rem', textAlign: 'center' }}>
              <video src={outputUrl} controls style={{ maxWidth: '100%', borderRadius: '8px', marginBottom: '1rem' }} />
              <br/>
              <a href={outputUrl} download="final_video.mp4" style={{ display: 'inline-block', padding: '0.8rem 1.5rem', background: '#10b981', color: '#fff', textDecoration: 'none', borderRadius: '8px', fontWeight: 'bold' }}>
                Download Video
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
