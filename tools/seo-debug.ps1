$file = "c:\Site Manon\opanoma-fresh\index.html"
$content = [System.IO.File]::ReadAllText($file, [System.Text.Encoding]::UTF8)
$apo = [char]0x2019
$oe = [char]0x0152
$dash = [char]0x2014
$eac = [char]0x00E9
$egr = [char]0x00E8
$Eac = [char]0x00C9
$eur = [char]0x20AC
$crlf = "`r`n"

# Build old block with explicit CRLF
$oldLines = @(
    "  <title>Accueil - l${apo}${oe}il d${apo}Opanoma</title>",
    "  <meta name=`"description`" content=`"L${apo}${oe}il d${apo}Opanoma ${dash} Guidance spirituelle personnalis${eac}e. Consultations de tarot, pendule et alignement ${eac}nerg${eac}tique. Tirage en ligne gratuit avec interpr${eac}tation.`">",
    "  <meta property=`"og:title`" content=`"L${apo}${oe}il d${apo}Opanoma ${dash} Guidance Spirituelle`">",
    "  <meta property=`"og:description`" content=`"Consultations de tarot, pendule et alignement ${eac}nerg${eac}tique. Tirage en ligne gratuit avec interpr${eac}tation par intelligence artificielle.`">",
    "  <meta property=`"og:type`" content=`"website`">",
    "  <meta property=`"og:url`" content=`"https://opanoma.fr/`">",
    "  <meta property=`"og:image`" content=`"https://opanoma.fr/img/opalogo.png`">",
    "  <meta property=`"og:locale`" content=`"fr_FR`">",
    "  <meta name=`"twitter:card`" content=`"summary`">",
    "  <script type=`"module`" src=`"/src/main.js`"></script>"
)
$oldBlock = $oldLines -join $crlf

Write-Host "=== Searching for old block ==="
$found = $content.Contains($oldBlock)
Write-Host "Found: $found"

if (-not $found) {
    # Debug: check each line
    foreach ($line in $oldLines) {
        $lineFound = $content.Contains($line)
        if (-not $lineFound) {
            Write-Host "NOT FOUND: $line"
            # Show chars
            $shortLine = if ($line.Length -gt 60) { $line.Substring(0, 60) } else { $line }
            Write-Host "  (first 60 chars shown)"
        }
    }
    
    # Check line endings
    $titleIdx = $content.IndexOf("<title>")
    if ($titleIdx -ge 0) {
        $after = $content.Substring($titleIdx + 44, 4)  # after </title>
        Write-Host "After </title>: $(($after.ToCharArray() | ForEach-Object { 'U+{0:X4}' -f [int]$_ }) -join ' ')"
    }
    exit 1
}
