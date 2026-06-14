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

## Mini PC PM2 Run

Stop any manual `uvicorn` window first, then run:

```powershell
cd "C:\Users\Aarush Katam\Downloads\Onara\Onara_Code\pipeline"
pm2 start ecosystem.config.cjs
pm2 status
curl http://localhost:8000/health -UseBasicParsing
```

Cloudflare Tunnel is handled separately by the named Cloudflare Tunnel service for
`https://pipeline.onara.tech`. Do not run the temporary `trycloudflare.com` tunnel
under PM2.

Persist the PM2 process list:

```powershell
pm2 save
```

Useful commands:

```powershell
pm2 logs onara-pipeline --lines 50
pm2 restart onara-pipeline
pm2 stop onara-pipeline
pm2 delete onara-pipeline
```
