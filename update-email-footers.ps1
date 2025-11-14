# Script to update email footers to use the shared partial

$files = @(
    'comprehensive-exam-payment-rejected.blade.php',
    'comprehensive-exam-payment-approved.blade.php',
    'comprehensive-exam-approved.blade.php',
    'comprehensive-exam-results-posted.blade.php',
    'defense-rejected.blade.php',
    'defense-scheduled-student.blade.php',
    'defense-scheduled.blade.php',
    'student-invitation.blade.php',
    'student-registered-notification.blade.php',
    'student-assigned-to-adviser.blade.php',
    'student-rejected-by-adviser.blade.php',
    'student-accepted-by-adviser.blade.php',
    'WelcomeMail.blade.php'
)

$basePath = "c:\xampp\htdocs\Graduate_School_System\resources\views\emails"

foreach ($file in $files) {
    $filePath = Join-Path $basePath $file
    if (Test-Path $filePath) {
        Write-Host "Processing: $file"
        $content = Get-Content $filePath -Raw
        
        # Pattern to match various footer structures
        $patterns = @(
            # Pattern 1: Table-based footer with nested structure
            '(?s)<td\s+style="padding:\s*20px\s+30px;\s*border-top:\s*1px\s+solid\s+#e5e7eb;">.*?<img\s+src=".*?gss-uic-logo.*?</table>\s*</td>\s*</tr>\s*</table>\s*</td>\s*</tr>\s*</table>',
            # Pattern 2: Direct footer div
            '(?s)<td\s+class="footer">.*?</td>\s*</tr>\s*</table>\s*</td>\s*</tr>\s*</table>',
            # Pattern 3: Footer after button
            '(?s)</div>\s*</td>\s*</tr>\s*<tr>\s*<td\s+class="footer">.*?</td>\s*</tr>\s*</table>\s*</td>\s*</tr>\s*</table>'
        )
        
        $replacement = @'
        </td>
                        </tr>
                        <tr>
                            <td style="padding: 20px 30px; border-top: 1px solid #e5e7eb;">
                                @include('emails.partials.footer')
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </div>
</body>
</html>
'@
        
        $updated = $false
        foreach ($pattern in $patterns) {
            if ($content -match $pattern) {
                # Find where to insert the replacement
                $lastEndDiv = $content.LastIndexOf('</div>')
                $afterDiv = $content.Substring($lastEndDiv + 6)
                if ($afterDiv -match '(?s)\s*</td>\s*</tr>\s*<tr>\s*<td.*?gss-uic-logo.*?</html>') {
                    $content = $content.Substring(0, $lastEndDiv + 6) + "`n" + $replacement
                    $updated = $true
                    break
                }
            }
        }
        
        if ($updated) {
            Set-Content -Path $filePath -Value $content -NoNewline
            Write-Host "  ✓ Updated successfully" -ForegroundColor Green
        } else {
            Write-Host "  ⚠ Pattern not matched, needs manual update" -ForegroundColor Yellow
        }
    } else {
        Write-Host "File not found: $file" -ForegroundColor Red
    }
}

Write-Host "`nDone!" -ForegroundColor Cyan
