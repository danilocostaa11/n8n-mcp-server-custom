# Script simplificado para subir a GitHub
Write-Host "🚀 Preparando proyecto para GitHub..." -ForegroundColor Cyan

# Paso 1: Inicializar Git
Write-Host "`n📦 Paso 1: Inicializando Git..." -ForegroundColor Yellow
if (-not (Test-Path ".git")) {
    git init
    Write-Host "✅ Git inicializado" -ForegroundColor Green
}
else {
    Write-Host "✅ Git ya existe" -ForegroundColor Green
}

# Paso 2: Agregar archivos
Write-Host "`n📝 Paso 2: Agregando archivos..." -ForegroundColor Yellow
git add .
Write-Host "✅ Archivos agregados" -ForegroundColor Green

# Paso 3: Commit
Write-Host "`n💾 Paso 3: Creando commit..." -ForegroundColor Yellow
git commit -m "Initial commit: n8n MCP Server v1.1.0"
Write-Host "✅ Commit creado" -ForegroundColor Green

# Paso 4: Instrucciones
Write-Host "`n🌐 Paso 4: Ahora crea el repositorio en GitHub" -ForegroundColor Yellow
Write-Host "1. Ve a https://github.com/new" -ForegroundColor White
Write-Host "2. Nombre: n8n-mcp-server" -ForegroundColor White
Write-Host "3. NO marques README, .gitignore ni License" -ForegroundColor White
Write-Host "4. Crea el repositorio" -ForegroundColor White

Read-Host "`nPresiona Enter cuando hayas creado el repo"

# Paso 5: URL
Write-Host "`n🔗 Paso 5: Conectar con GitHub" -ForegroundColor Yellow
$repoUrl = Read-Host "Pega la URL del repo (ej: https://github.com/usuario/n8n-mcp-server.git)"

# Paso 6: Agregar remote
git remote add origin $repoUrl
Write-Host "✅ Remote agregado" -ForegroundColor Green

# Paso 7: Renombrar a main
$currentBranch = git branch --show-current
if ($currentBranch -ne "main") {
    git branch -M main
    Write-Host "✅ Rama renombrada a main" -ForegroundColor Green
}

# Paso 8: Push
Write-Host "`n🚀 Paso 8: Subiendo a GitHub..." -ForegroundColor Yellow
git push -u origin main
Write-Host "`n✅ ¡Proyecto subido exitosamente!" -ForegroundColor Green
Write-Host "📍 Tu repo: $repoUrl" -ForegroundColor Cyan
