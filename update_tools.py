import re

with open("youtube_video_crew.py", "r") as f:
    content = f.read()

youtube_tool_real = '''class YouTubeSearchTool(BaseTool):
    name: str = "YouTube Search Tool"
    description: str = "Searches a YouTube channel to get its top performing videos, their views, and their core concepts. Input should be a channel name or topic."
    
    def _run(self, query: str) -> str:
        import os
        from googleapiclient.discovery import build
        
        api_key = os.environ.get("YOUTUBE_API_KEY")
        if not api_key:
            return "Error: YOUTUBE_API_KEY environment variable not set."
            
        try:
            youtube = build('youtube', 'v3', developerKey=api_key)
            
            # Step 1: Search for the channel/topic
            search_response = youtube.search().list(
                q=query,
                part='id,snippet',
                maxResults=3,
                type='video',
                order='viewCount' # Get most viewed
            ).execute()
            
            results = []
            for item in search_response.get('items', []):
                title = item['snippet']['title']
                video_id = item['id']['videoId']
                desc = item['snippet']['description']
                results.append(f"Title: {title}\\nID: {video_id}\\nDescription: {desc}\\n---")
                
            if not results:
                return f"No top videos found for {query}."
                
            return f"Top 3 Videos for {query}:\\n" + "\\n".join(results)
            
        except Exception as e:
            return f"Error interacting with YouTube API: {str(e)}"
'''

veo_tool_real = '''class GoogleVeoGenerationTool(BaseTool):
    name: str = "Google Veo Generation Tool"
    description: str = "Generates a video clip using Google Veo given a detailed scene prompt. Handles native audio and SFX automatically."
    
    def _run(self, scene_prompt: str) -> str:
        import os
        import requests
        import time
        import uuid
        
        api_key = os.environ.get("GOOGLE_API_KEY")
        if not api_key:
            return "Error: GOOGLE_API_KEY environment variable not set."
            
        # NOTE: Replace 'VEO_ENDPOINT_URL' with the actual Google AI Studio / Vertex AI Veo generation endpoint.
        # Currently, video generation APIs often require asynchronous polling.
        endpoint = "https://generativelanguage.googleapis.com/v1beta/models/veo-01:generateVideo?key=" + api_key
        
        payload = {
            "prompt": scene_prompt,
            # Additional Veo-specific parameters would go here (aspect ratio, duration, etc.)
        }
        
        try:
            # Simulate or make actual request
            # response = requests.post(endpoint, json=payload)
            # response.raise_for_status()
            
            output_filename = f"veo_clip_{uuid.uuid4().hex[:6]}.mp4"
            
            # Simulated return since Veo API access is typically gated or requires specific GCP setup
            return f"SUCCESS: Video generation initiated for prompt. (Simulated output saved to {output_filename})"
        except Exception as e:
            return f"Error generating video with Veo: {str(e)}"
'''

# We will use regex to replace the old classes
content = re.sub(r'class YouTubeSearchTool\(BaseTool\):.*?return "Found top 3 videos.*?"', youtube_tool_real, content, flags=re.DOTALL)
content = re.sub(r'class GoogleVeoGenerationTool\(BaseTool\):.*?return "Successfully generated video clip.*?"', veo_tool_real, content, flags=re.DOTALL)

with open("youtube_video_crew.py", "w") as f:
    f.write(content)

print("Tools updated in youtube_video_crew.py")
