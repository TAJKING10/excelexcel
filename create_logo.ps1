$base64 = [Convert]::ToBase64String([IO.File]::ReadAllBytes('src/assets/logo_groupe.png'))
$content = "export const logoGroupe = 'data:image/png;base64,$base64';"
$content | Out-File -FilePath 'src/assets/logoGroupe.ts' -Encoding utf8
