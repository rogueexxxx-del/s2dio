[Setup]
AppName=S2DIO Studio
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

[InstallDelete]
; Delete any previous flat file so Windows can create the VST3 bundle directory cleanly
Type: files; Name: "{commoncf}\VST3\S2DIO Master Bridge.vst3"

[Files]
; VST3 64-bit Plugin installed directly into Windows standard VST3 folder for FL Studio, Ableton, Cubase
Source: "..\dist\S2DIO Master Bridge.vst3\*"; DestDir: "{commoncf}\VST3\S2DIO Master Bridge.vst3"; Flags: ignoreversion recursesubdirs createallsubdirs

; Standalone Audio Engine Executable
Source: "..\dist\S2DIO Master Bridge.exe"; DestDir: "{app}"; DestName: "S2DIO Master Bridge.exe"; Flags: ignoreversion

; Desktop Launcher
Source: "..\Run-S2DIO-Desktop.bat"; DestDir: "{app}"; DestName: "S2DIO Control Room.bat"; Flags: ignoreversion

[Icons]
Name: "{autoprograms}\S2DIO Master Bridge"; Filename: "{app}\S2DIO Master Bridge.exe"
Name: "{autoprograms}\S2DIO Control Room"; Filename: "{app}\S2DIO Control Room.bat"
Name: "{autodesktop}\S2DIO Control Room"; Filename: "{app}\S2DIO Control Room.bat"

[Run]
Filename: "{app}\S2DIO Master Bridge.exe"; Description: "Launch S2DIO Master Bridge"; Flags: nowait postinstall skipifsilent

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
