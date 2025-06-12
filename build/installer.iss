[Setup]
AppName=Turbo
AppVersion=1.0
DefaultDirName={pf}\Turbo
DefaultGroupName=Turbo
OutputDir=../dist
OutputBaseFilename=Turbo-setup
Compression=lzma
SolidCompression=yes

[Files]
Source: "Turbo.exe"; DestDir: "{app}"; Flags: ignoreversion

[Icons]
Name: "{group}\Turbo"; Filename: "{app}\Turbo.exe"
