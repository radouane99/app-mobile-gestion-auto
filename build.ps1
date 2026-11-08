$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot
$jdk = 'C:\Program Files\Android\openjdk\jdk-21.0.8'
if (!(Test-Path "$jdk\bin\javac.exe")) { throw 'JDK 21 manquant. Mettez à jour le chemin dans build.ps1.' }
$bt = Join-Path $PSScriptRoot 'tools\sdk\android-15'
$android = Join-Path $PSScriptRoot 'tools\sdk\android-35\android.jar'
New-Item -ItemType Directory -Force build\classes,build\dex,dist | Out-Null
function Check { if ($LASTEXITCODE -ne 0) { throw "Échec de compilation : $LASTEXITCODE" } }
Get-ChildItem app\src\main\assets -Filter *.js | ForEach-Object { & node --check $_.FullName; Check }
$sources = Get-ChildItem app\src\main\java\ma\autocarnet\*.java | ForEach-Object { $_.FullName }
& "$jdk\bin\javac.exe" -encoding UTF-8 -source 8 -target 8 -classpath $android -d build\classes $sources
Check
& "$jdk\bin\jar.exe" "-J-Djava.io.tmpdir=$PSScriptRoot\build" cf build\classes.jar -C build\classes .
Check
& "$jdk\bin\java.exe" -cp "$bt\lib\d8.jar" com.android.tools.r8.D8 --lib $android --min-api 26 --output build\dex build\classes.jar
Check
& "$bt\aapt.exe" package -f -M app\src\main\AndroidManifest.xml -S app\src\main\res -A app\src\main\assets -I $android -F build\unsigned.apk
Check
Copy-Item build\dex\classes.dex build\classes.dex -Force
Push-Location build
& "$bt\aapt.exe" add unsigned.apk classes.dex
Check
Pop-Location
& "$bt\zipalign.exe" -f 4 build\unsigned.apk build\aligned.apk
Check
if (!(Test-Path tools\autocarnet.keystore)) {
  & "$jdk\bin\keytool.exe" -genkeypair -keystore tools\autocarnet.keystore -alias autocarnet -keyalg RSA -keysize 2048 -validity 10000 -storepass autocarnet-local -keypass autocarnet-local -dname 'CN=AutoCarnet, O=Personal, C=MA'
  Check
}
& "$jdk\bin\java.exe" -jar "$bt\lib\apksigner.jar" sign --ks tools\autocarnet.keystore --ks-key-alias autocarnet --ks-pass pass:autocarnet-local --key-pass pass:autocarnet-local --out dist\AutoCarnet.apk build\aligned.apk
Check
& "$jdk\bin\java.exe" -jar "$bt\lib\apksigner.jar" verify --verbose dist\AutoCarnet.apk
Check
Get-FileHash dist\AutoCarnet.apk -Algorithm SHA256
