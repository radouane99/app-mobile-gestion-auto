param()
$ErrorActionPreference='Stop'
Set-Location $PSScriptRoot
$stage=Join-Path $PSScriptRoot 'build\personal-radouane'
New-Item -ItemType Directory -Force "$stage\java","$stage\assets","$stage\res","$stage\classes","$stage\dex" | Out-Null
Copy-Item app\src\main\assets\* "$stage\assets" -Recurse -Force
Copy-Item app\src\main\res\* "$stage\res" -Recurse -Force
Copy-Item personal\overlay\personal.js "$stage\assets\personal.js" -Force
$utf8=[System.Text.UTF8Encoding]::new($false)
foreach($file in Get-ChildItem app\src\main\java\ma\autocarnet -Filter *.java){$source=[IO.File]::ReadAllText($file.FullName).Replace('ma.autocarnet','ma.autocarnet.radouane');[IO.File]::WriteAllText((Join-Path "$stage\java" $file.Name),$source,$utf8)}
$manifest=[IO.File]::ReadAllText("$PSScriptRoot\app\src\main\AndroidManifest.xml").Replace('ma.autocarnet','ma.autocarnet.radouane').Replace('versionCode="35"','versionCode="15"').Replace('versionName="3.13"','versionName="3.13-Radouane.15"')
[IO.File]::WriteAllText("$stage\AndroidManifest.xml",$manifest,$utf8)
& node personal\prepare-personal.cjs
if($LASTEXITCODE -ne 0){throw 'Préparation personnelle échouée'}
$jdk='C:\Program Files\Android\openjdk\jdk-21.0.8'
$bt=Join-Path $PSScriptRoot 'tools\sdk\android-15'
$android=Join-Path $PSScriptRoot 'tools\sdk\android-35\android.jar'
function CheckPersonal {if($LASTEXITCODE -ne 0){throw "Compilation personnelle échouée : $LASTEXITCODE"}}
& node --check "$stage\assets\personal.js";CheckPersonal
$sources=Get-ChildItem "$stage\java" -Filter *.java | ForEach-Object {$_.FullName}
& "$jdk\bin\javac.exe" -encoding UTF-8 -source 8 -target 8 -classpath $android -d "$stage\classes" $sources;CheckPersonal
& "$jdk\bin\jar.exe" "-J-Djava.io.tmpdir=$stage" cf "$stage\classes.jar" -C "$stage\classes" .;CheckPersonal
& "$jdk\bin\java.exe" -cp "$bt\lib\d8.jar" com.android.tools.r8.D8 --lib $android --min-api 26 --output "$stage\dex" "$stage\classes.jar";CheckPersonal
& "$bt\aapt.exe" package -f -M "$stage\AndroidManifest.xml" -S "$stage\res" -A "$stage\assets" -I $android -F "$stage\unsigned.apk";CheckPersonal
Copy-Item "$stage\dex\classes.dex" "$stage\classes.dex" -Force
Push-Location $stage
try{& "$bt\aapt.exe" add unsigned.apk classes.dex;CheckPersonal}finally{Pop-Location}
& "$bt\zipalign.exe" -f 4 "$stage\unsigned.apk" "$stage\aligned.apk";CheckPersonal
& "$jdk\bin\java.exe" -jar "$bt\lib\apksigner.jar" sign --ks tools\autocarnet.keystore --ks-key-alias autocarnet --ks-pass pass:autocarnet-local --key-pass pass:autocarnet-local --out dist\AutoCarnet-Radouane.apk "$stage\aligned.apk";CheckPersonal
& "$jdk\bin\java.exe" -jar "$bt\lib\apksigner.jar" verify --verbose dist\AutoCarnet-Radouane.apk;CheckPersonal
Get-FileHash dist\AutoCarnet-Radouane.apk -Algorithm SHA256
