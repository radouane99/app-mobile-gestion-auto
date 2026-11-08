$ErrorActionPreference='Stop'
Set-Location $PSScriptRoot
$jdk='C:\Program Files\Android\openjdk\jdk-21.0.8'
New-Item -ItemType Directory -Force build\backup-test | Out-Null
$sources=@(Get-ChildItem tests-backup -Filter *.java -Recurse | ForEach-Object { $_.FullName }) + @(Get-ChildItem tests-native\android\graphics -Filter *.java -Recurse | ForEach-Object { $_.FullName }) + @('tests-native\android\util\AtomicFile.java','app\src\main\java\ma\autocarnet\Store.java','app\src\main\java\ma\autocarnet\ReportPdf.java','app\src\main\java\ma\autocarnet\AutoBackupJob.java','app\src\main\java\ma\autocarnet\EngineCoach.java','app\src\main\java\ma\autocarnet\FinanceReport.java')
& "$jdk\bin\javac.exe" -encoding UTF-8 -cp tools\json-test.jar -d build\backup-test $sources
if($LASTEXITCODE -ne 0){throw 'Compilation tests sauvegarde échouée'}
& "$jdk\bin\java.exe" '-Djava.awt.headless=true' -cp 'build\backup-test;tools\json-test.jar' ma.autocarnet.BackupTest
if($LASTEXITCODE -ne 0){throw 'Tests sauvegarde échoués'}
