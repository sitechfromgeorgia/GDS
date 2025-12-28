@echo off
echo Replacing Supabase Cloud URLs with self-hosted URLs...
echo.

powershell -Command "$files = Get-ChildItem -Path .claude,.kilocode,docs,project-documentation,frontend\supabase-test.html,comprehensive_system_diagnostics.sh -Recurse -Include *.md,*.txt,*.html,*.sh -ErrorAction SilentlyContinue; foreach ($file in $files) { try { $content = Get-Content $file.FullName -Raw -ErrorAction SilentlyContinue; if ($content) { $newContent = $content -replace 'https://akxmacfsltzhbnunoepb\.supabase\.co', 'https://data.greenland77.ge' -replace 'akxmacfsltzhbnunoepb\.supabase\.co', 'data.greenland77.ge'; if ($content -ne $newContent) { Set-Content -Path $file.FullName -Value $newContent -NoNewline; Write-Host \"Updated: $($file.FullName)\"; } } } catch { Write-Host \"Error processing: $($file.FullName)\" } }"

echo.
echo Done!
pause
