import sys
from moviepy import AudioFileClip, ImageClip, concatenate_audioclips, CompositeAudioClip

def render_final_video():
    print("Loading audio files...")
    audio_files = [
        "voice_over_9d3690.mp3"
    ]
    
    clips = [AudioFileClip(f) for f in audio_files]
    final_audio = concatenate_audioclips(clips)
    
    print("Loading background music...")
    bgm_clip = AudioFileClip("bgm_calm.mp3").with_volume_scaled(0.08)
    
    bgm_clips = []
    curr_dur = 0
    while curr_dur < final_audio.duration:
        bgm_clips.append(bgm_clip)
        curr_dur += bgm_clip.duration
    
    bgm_track = concatenate_audioclips(bgm_clips).with_duration(final_audio.duration)
    mixed_audio = CompositeAudioClip([bgm_track, final_audio])
    
    print(f"Total audio duration: {mixed_audio.duration} seconds")
    
    image_path = "background_image.jpg"
    print(f"Loading image from {image_path}...")
    image_clip = ImageClip(image_path)
    
    print("Setting duration and audio...")
    video_clip = image_clip.with_duration(mixed_audio.duration)
    video_clip = video_clip.with_audio(mixed_audio)
    
    output_filename = "final_youtube_video_v3.mp4"
    print(f"Writing video to {output_filename}...")
    video_clip.write_videofile(
        output_filename,
        fps=24,
        codec='libx264',
        audio_codec='aac',
        bitrate='5000k'
    )
    
    print("Cleanup...")
    final_audio.close()
    video_clip.close()
    for clip in clips:
        clip.close()
        
    print(f"Done! Final video is at {output_filename}")

if __name__ == "__main__":
    render_final_video()
