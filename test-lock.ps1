$ErrorActionPreference='Stop'
Set-Location $PSScriptRoot
$jdk='C:\Program Files\Android\openjdk\jdk-21.0.8'
New-Item -ItemType Directory -Force build\lock-test | Out-Null
$sources=@(Get-ChildItem tests-lock -Filter *.java -Recurse | ForEach-Object { $_.FullName }) + @('tests-backup\android\content\SharedPreferences.java','app\src\main\java\ma\autocarnet\AppLock.java')
& "$jdk\bin\javac.exe" -encoding UTF-8 -d build\lock-test $sources
if($LASTEXITCODE -ne 0){throw 'Compilation tests verrouillage échouée'}
& "$jdk\bin\java.exe" -cp build\lock-test ma.autocarnet.AppLockTest
if($LASTEXITCODE -ne 0){throw 'Tests verrouillage échoués'}
