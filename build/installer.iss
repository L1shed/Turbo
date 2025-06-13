[Setup]
AppName=Turbo
AppVersion=1.0.0
AppPublisher=Lished
AppPublisherURL=https://github.com/L1shed
DefaultDirName={pf}\Turbo
DefaultGroupName=Turbo
Compression=lzma2
SolidCompression=yes
OutputDir=../dist
OutputBaseFilename=Turbo-setup
SetupIconFile=assets/icon.ico

[Icons]
Name: "{group}\Turbo"; Filename: "{app}\Turbo.exe"
Name: "{commondesktop}\Turbo"; Filename: "{app}\Turbo.exe"; Tasks: desktopicon

[Files]
Source: "Turbo.exe"; DestDir: "{app}"; Flags: ignoreversion

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked

[Run]
Filename: "{app}\Turbo.exe"; Description: "{cm:LaunchProgram,Turbo}"; Flags: nowait postinstall skipifsilent