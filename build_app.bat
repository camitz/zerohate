cls

rem Base directory for this entire project
set BASEDIR=c:/www/zerohate
set BASEDIRw=c:\www\zerohate

rem Source directory for unbuilt code
set SRCDIR=%BASEDIR%/src
set SRCDIRw=%BASEDIRw%\src

rem Directory containing dojo build utilities
set TOOLSDIRw=%SRCDIRw%\util\buildscripts

rem Destination directory for built code
set DISTDIR=%BASEDIR%/dist
set DISTDIRw=%BASEDIRw%\dist

rem Module ID of the main application package loader configuration
set LOADERMID=app/run

rem Main application package loader configuration
set LOADERCONF=%SRCDIR%/%LOADERMID%.js

# Main application package build configuration
set PROFILE=%BASEDIR%/profiles/app.profile.js


echo Building application with %PROFILE% to %DISTDIR%.

echo -n "Cleaning old files..."
rem del %DISTDIRw% /s /q
echo " Done"

cd %TOOLSDIRw%

rem java -Xms256m -Xmx256m  -cp ../shrinksafe/js.jar;../closureCompiler/compiler.jar;../shrinksafe/shrinksafe.jar org.mozilla.javascript.tools.shell.Main  ../../dojo/dojo.js baseUrl=../../dojo load=build --require %LOADERCONF% --profile %PROFILE% --releaseDir %DISTDIR%

cd %BASEDIR%

dir dist\dojo\dojo.js

rem mkdir dist\nls
rem copy Scripts\nls\dojo_sv.js dist\nls

copy %SRCDIRw%\*.html %DISTDIRw%
copy %SRCDIRw%\dojoConfig.js %DISTDIRw%

echo "Build complete"

