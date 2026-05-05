# Login and check API
$loginBody = @{
    username = "admin@iris.local"
    password = "admin123"
} | ConvertTo-Json

try {
    $loginResp = Invoke-RestMethod -Uri 'http://localhost:8000/api/v1/auth/login' -Method POST -Body $loginBody -ContentType 'application/json'
    $token = $loginResp.access_token
    Write-Host "Token obtained: $($token.Substring(0, 20))..."

    # Check projects
    $headers = @{Authorization = "Bearer $token"}
    $projects = Invoke-RestMethod -Uri 'http://localhost:8000/api/v1/projects' -Headers $headers
    Write-Host "Projects count: $($projects.Count)"
    $projects | ConvertTo-Json -Depth 2

    # Check documents
    $docs = Invoke-RestMethod -Uri 'http://localhost:8000/api/v1/documents' -Headers $headers
    Write-Host "Documents count: $($docs.Count)"

    # Check remarks
    $remarks = Invoke-RestMethod -Uri 'http://localhost:8000/api/v1/remarks' -Headers $headers
    Write-Host "Remarks count: $($remarks.Count)"
} catch {
    Write-Host "Error: $($_.Exception.Message)"
}
