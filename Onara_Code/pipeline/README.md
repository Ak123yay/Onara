# Onara Pipeline

FastAPI server for the Onara generation pipeline.

## Local Run

```powershell
cd C:\Users\Aarush\Downloads\Onara\Onara_Code\pipeline
python -m pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000
```

## Verify

```powershell
curl http://localhost:8000/health

$secret = (Select-String -Path .env -Pattern '^PIPELINE_API_SECRET=').Line.Split('=', 2)[1].Trim()

$body = @{
  user_id = "dev-user"
  user_plan = "pro"
  business_data = @{ name = "Demo Contractor" }
  style_preferences = @{ palette = "onara" }
} | ConvertTo-Json -Depth 5

curl -Method POST http://localhost:8000/generate `
  -Headers @{ "X-Pipeline-Secret" = $secret; "Content-Type" = "application/json" } `
  -Body $body
```
