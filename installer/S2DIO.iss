[Setup]
AppName=S2DIO
AppId={{C8E192A0-47F1-4949-A1B2-8D7F6E5A4B3C}}
AppVersion=1.0.0
AppPublisher=S2DIO
DefaultDirName={autopf}\S2DIO
DefaultGroupName=S2DIO
Compression=lzma2
SolidCompression=yes
OutputDir=..\dist
OutputBaseFilename=S2DIO-Windows-Setup-v1.0.0
ArchitecturesInstallIn64BitMode=x64
DisableProgramGroupPage=yes
PrivilegesRequired=admin
CloseApplications=yes
SetupIconFile=app.ico

[InstallDelete]
; Delete any previous flat file so Windows can create the VST3 bundle directory cleanly
Type: files; Name: "{commoncf}\VST3\S2DIO Master Bridge.vst3"

[Files]
; 1. Native Windows Desktop Control Room App
Source: "..\dist\app\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs

; 2. VST3 64-bit Plugin installed directly into Windows standard VST3 folder for FL Studio, Ableton, Cubase
Source: "..\dist\S2DIO Master Bridge.vst3\*"; DestDir: "{commoncf}\VST3\S2DIO Master Bridge.vst3"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{autoprograms}\S2DIO"; Filename: "{app}\S2DIO.exe"; IconFilename: "{app}\app.ico"
Name: "{autodesktop}\S2DIO"; Filename: "{app}\S2DIO.exe"; IconFilename: "{app}\app.ico"

[Run]
Filename: "{app}\S2DIO.exe"; Description: "Launch S2DIO"; Flags: nowait postinstall skipifsilent

[Code]
procedure CurStepChanged(CurStep: TSetupStep);
var
  OldFile: String;
begin
  if CurStep = ssInstall then
  begin
    OldFile := ExpandConstant('{commoncf}\VST3\S2DIO Master Bridge.vst3');
    if FileExists(OldFile) then
    begin
      DeleteFile(OldFile);
    end;
  end;
end;
