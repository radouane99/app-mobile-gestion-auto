$ErrorActionPreference='Stop'
Set-Location $PSScriptRoot
& node tests-v29.cjs
if($LASTEXITCODE -ne 0){throw "Tests finance échoués"}
& node tests-v28.cjs
if($LASTEXITCODE -ne 0){throw "Tests budget échoués"}
& node tests-v23.cjs
if($LASTEXITCODE -ne 0){throw "Tests workflow échoués"}
& node tests-v22.cjs
if($LASTEXITCODE -ne 0){throw "Tests facilité échoués"}
& node tests-v15.cjs
if($LASTEXITCODE -ne 0){throw 'Tests coach JS échoués'}
$jdk='C:\Program Files\Android\openjdk\jdk-21.0.8'
New-Item -ItemType Directory -Force build\native-test | Out-Null
$sources=Get-ChildItem tests-native -Filter *.java -Recurse | ForEach-Object { $_.FullName }
& "$jdk\bin\javac.exe" -encoding UTF-8 -cp tools\json-test.jar -d build\native-test $sources app\src\main\java\ma\autocarnet\Store.java app\src\main\java\ma\autocarnet\ReminderRules.java app\src\main\java\ma\autocarnet\ReportPdf.java app\src\main\java\ma\autocarnet\ResalePdf.java app\src\main\java\ma\autocarnet\RoadReport.java app\src\main\java\ma\autocarnet\WidgetSummary.java app\src\main\java\ma\autocarnet\FuelTrend.java app\src\main\java\ma\autocarnet\EngineCoach.java app\src\main\java\ma\autocarnet\ParkingRules.java app\src\main\java\ma\autocarnet\OilBudget.java app\src\main\java\ma\autocarnet\FinanceReport.java app\src\main\java\ma\autocarnet\MonthClosing.java
if($LASTEXITCODE -ne 0){throw 'Compilation tests échouée'}
& "$jdk\bin\java.exe" -cp 'build\native-test;tools\json-test.jar' ma.autocarnet.StoreTest
if($LASTEXITCODE -ne 0){throw 'Tests échoués'}
& "$jdk\bin\java.exe" '-Djava.awt.headless=true' -cp 'build\native-test;tools\json-test.jar' ma.autocarnet.ReportTest
if($LASTEXITCODE -ne 0){throw 'Tests rapport échoués'}
& "$jdk\bin\java.exe" '-Djava.awt.headless=true' -cp 'build\native-test;tools\json-test.jar' ma.autocarnet.ResaleTest
if($LASTEXITCODE -ne 0){throw 'Tests dossier échoués'}
& "$jdk\bin\java.exe" -cp 'build\native-test;tools\json-test.jar' ma.autocarnet.FuelTrendTest
if($LASTEXITCODE -ne 0){throw 'Tests consommation échoués'}
& "$jdk\bin\java.exe" '-Djava.awt.headless=true' -cp 'build\native-test;tools\json-test.jar' ma.autocarnet.EngineCoachTest
if($LASTEXITCODE -ne 0){throw 'Tests coach natif échoués'}

& "$jdk\bin\java.exe" '-Djava.awt.headless=true' -cp 'build\native-test;tools\json-test.jar' ma.autocarnet.EaseTest
if($LASTEXITCODE -ne 0){throw "Tests litres inconnus/corbeille échoués"}

& "$jdk\bin\java.exe" '-Djava.awt.headless=true' -cp 'build\native-test;tools\json-test.jar' ma.autocarnet.WorkflowTest
if($LASTEXITCODE -ne 0){throw "Tests workflow natif échoués"}

& "$jdk\bin\java.exe" -cp 'build\native-test;tools\json-test.jar' ma.autocarnet.ParkingTest
if($LASTEXITCODE -ne 0){throw "Tests parking échoués"}

& "$jdk\bin\java.exe" -cp "build\native-test;tools\json-test.jar" ma.autocarnet.OilBudgetTest
if($LASTEXITCODE -ne 0){throw "Tests budget natif échoués"}

& "$jdk\bin\java.exe" -cp "build\native-test;tools\json-test.jar" ma.autocarnet.FinanceTest
if($LASTEXITCODE -ne 0){throw "Tests finance native échoués"}

& node tests-v30.cjs
if($LASTEXITCODE -ne 0){throw "Tests clôture échoués"}
& "$jdk\bin\java.exe" -cp "build\native-test;tools\json-test.jar" ma.autocarnet.MonthClosingTest
if($LASTEXITCODE -ne 0){throw "Tests rappel clôture échoués"}

& "$jdk\bin\java.exe" '-Djava.awt.headless=true' -cp "build\native-test;tools\json-test.jar" ma.autocarnet.RoadTest
if($LASTEXITCODE -ne 0){throw "Tests dossiers et état échoués"}

& "$jdk\bin\java.exe" -cp "build\native-test;tools\json-test.jar" ma.autocarnet.WidgetSummaryTest
if($LASTEXITCODE -ne 0){throw "Tests widget échoués"}
