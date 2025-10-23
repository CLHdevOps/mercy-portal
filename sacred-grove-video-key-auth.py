import os
import requests
import json
import time

# You will need to set these environment variables or edit the following values
endpoint = os.getenv("ENDPOINT_URL", "https://devopsaifoundry.openai.azure.com/")  
deployment = os.getenv("DEPLOYMENT_NAME", "sora-2")
subscription_key = os.getenv("AZURE_OPENAI_API_KEY", "<AZURE_OPENAI_API_KEY>")

api_version = "preview"
path = f'openai/v1/video/generations/jobs'
params = f'?api-version={api_version}'
constructed_url = endpoint + path + params

headers = {
  'Api-Key': subscription_key,
  'Content-Type': 'application/json',
}

body = {
  "prompt": "<VIDEO_PROMPT>",
  "n_variants": "1",
  "n_seconds": "12",
  "height": "1280",
  "width": "720",
  "model": deployment,
}

job_response = requests.post(constructed_url, headers=headers, json=body)
if not job_response.ok:
    print("❌ Video generation failed.")
    print(json.dumps(job_response.json(), sort_keys=True, indent=4, separators=(',', ': ')))
else:
    print(json.dumps(job_response.json(), sort_keys=True, indent=4, separators=(',', ': ')))
    job_response = job_response.json()
    job_id = job_response.get("id")
    status = job_response.get("status")
    status_url = f"{endpoint}openai/v1/video/generations/jobs/{job_id}?api-version={api_version}"

    print(f"⏳ Polling job status for ID: {job_id}")
    while status not in ["succeeded", "failed"]:
        time.sleep(5)
        job_response = requests.get(status_url, headers=headers).json()
        status = job_response.get("status")
        print(f"Status: {status}")

    if status == "succeeded":
        generations = job_response.get("generations", [])
        if generations:
            print(f"✅ Video generation succeeded.")

            generation_id = generations[0].get("id")
            video_url = f'{endpoint}openai/v1/video/generations/{generation_id}/content/video{params}'
            video_response = requests.get(video_url, headers=headers)
            if video_response.ok:
                output_filename = "output.mp4"
                with open(output_filename, "wb") as file:
                    file.write(video_response.content)
                print(f'Generated video saved as "{output_filename}"')
        else:
            print("⚠️ Status is succeeded, but no generations were returned.")
    elif status == "failed":
        print("❌ Video generation failed.")
        print(json.dumps(job_response, sort_keys=True, indent=4, separators=(',', ': ')))