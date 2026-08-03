import sys
from moviepy import ImageClip, AudioFileClip

def create_video(image_path, audio_path, output_path):
    print(f"Loading audio from {audio_path}...")
    audio_clip = AudioFileClip(audio_path)
    
    print(f"Loading image from {image_path}...")
    image_clip = ImageClip(image_path)
    
    print(f"Setting video duration to match audio: {audio_clip.duration} seconds...")
    video_clip = image_clip.with_duration(audio_clip.duration)
    
    print("Setting audio for the video...")
    video_clip = video_clip.with_audio(audio_clip)
    
    print(f"Writing final video to {output_path}...")
    video_clip.write_videofile(
        output_path, 
        fps=1, # Very low fps since it's a static image
        codec="libx264", 
        audio_codec="aac"
    )
    
    print("Done!")

if __name__ == "__main__":
    if len(sys.argv) != 4:
        print("Usage: python create_final_video.py <image_path> <audio_path> <output_path>")
        sys.exit(1)
        
    create_video(sys.argv[1], sys.argv[2], sys.argv[3])
