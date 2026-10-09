Add-Type -AssemblyName PresentationCore, PresentationFramework, WindowsBase, System.Drawing

$sGeomStr = "M176.35,58.81c.37,6.08-66.64,7.51-72.03,2.87-4.36-3.69-2.69-6.16-5.39-8.95-4.4-4.55-17.54-4.29-18.33,2.46-.74,6.35,4.31,8.68,9.38,9.93,9.93,2.45,51.63,4.08,60.95,8.12,37.55,16.31,32.77,55.11,25.21,74.31-6.87,17.43-21.83,26.46-39.24,33.17-22.1,8.51-65.06,10.08-88.38,4.47C-4.89,172.34,3.14,125.7,3.55,123.27c1.47-8.9,50.55-6.07,77.06-2.29,1.93,6.11,6.79,10.84,12.94,12.62,8.56,2.26,18.99-9.57,5.91-16.74-9.49-5.19-73.59,3.21-91.15-19.34C-4.63,80.91-2.03,49.14,13.12,25.34,31.36-3.35,77.21.01,107.47.22c83.34.59,68.43,51.16,68.88,58.58h0Z"
$twoGeomStr = "M193.1,117.43c5.52-10.46,12.56-20.06,20.87-28.47,21.68-22.88,64.96-7.39,63.74-31.4-.34-6.81-12.69-7.05-16.7-2.48-2.46,2.8,1.67,12.14-3.42,12.71-1.33.15-63.98,5.78-67.9-.6-1.28-2.07-.84-9.18-.42-14.25.95-11.78,4.38-50.83,63.96-50.58,27.57.11,69.34-3.59,85.97,25.22,6.48,14.78,8.09,31.25,4.59,47-2.7,11.37-9.45,21.38-18.98,28.15-12.8,9.15-40.5,5.01-49.74,17.7,4.35,1.57,38.22.27,38.5.31,10.82,1.35,11.86-.05,24.06-.38,2-.05.83,11.46.83,12.94,0,9.43.73,22.36,1.21,31.77.3,6.07.69,15.86.35,21.62-4.29.48-8.6.68-12.91.59-8.33,1.22-16.76,1.61-25.17,1.16-26.32-2.74-55.15.48-81.6-.38-6.97-.23-18.85,1.72-26.89-.39-5.29-1.39-5.09-31.77-4.59-37.01.71-7.55-1.22-21.95,4.25-33.23Z"

$sizes = @(256, 128, 64, 48, 32, 16)
$pngBytesList = @()

foreach ($size in $sizes) {
    $visual = New-Object System.Windows.Media.DrawingVisual
    $dc = $visual.RenderOpen()

    # Dark rounded background tile
    $bgBrush = New-Object System.Windows.Media.SolidColorBrush([System.Windows.Media.Color]::FromArgb(255, 11, 15, 23))
    $borderPen = New-Object System.Windows.Media.Pen(
        (New-Object System.Windows.Media.SolidColorBrush([System.Windows.Media.Color]::FromArgb(180, 56, 189, 248))),
        ($size * 0.03)
    )
    $radius = $size * 0.22
    $rect = New-Object System.Windows.Rect(0, 0, $size, $size)
    $dc.DrawRoundedRectangle($bgBrush, $borderPen, $rect, $radius, $radius)

    # Monogram S2 path
    # Original SVG viewBox is 345.59 x 188.67
    $scaleX = ($size * 0.72) / 345.59
    $scaleY = ($size * 0.72) / (345.59 * (188.67 / 345.59))
    $scale = [Math]::Min($scaleX, $scaleY)
    
    $offsetX = ($size - (345.59 * $scale)) / 2.0
    $offsetY = ($size - (188.67 * $scale)) / 2.0

    $transformGroup = New-Object System.Windows.Media.TransformGroup
    $transformGroup.Children.Add((New-Object System.Windows.Media.ScaleTransform($scale, $scale)))
    $transformGroup.Children.Add((New-Object System.Windows.Media.TranslateTransform($offsetX, $offsetY)))

    $dc.PushTransform($transformGroup)

    $sGeom = [System.Windows.Media.Geometry]::Parse($sGeomStr)
    $twoGeom = [System.Windows.Media.Geometry]::Parse($twoGeomStr)

    $fgBrush = New-Object System.Windows.Media.LinearGradientBrush(
        [System.Windows.Media.Color]::FromArgb(255, 56, 189, 248),
        [System.Windows.Media.Color]::FromArgb(255, 255, 255, 255),
        (New-Object System.Windows.Point(0, 0)),
        (New-Object System.Windows.Point(1, 1))
    )

    $dc.DrawGeometry($fgBrush, $null, $sGeom)
    $dc.DrawGeometry($fgBrush, $null, $twoGeom)
    $dc.Pop()

    $dc.Close()

    $rtb = New-Object System.Windows.Media.Imaging.RenderTargetBitmap($size, $size, 96, 96, [System.Windows.Media.PixelFormats]::Pbgra32)
    $rtb.Render($visual)

    $encoder = New-Object System.Windows.Media.Imaging.PngBitmapEncoder
    $encoder.Frames.Add([System.Windows.Media.Imaging.BitmapFrame]::Create($rtb))

    $ms = New-Object System.IO.MemoryStream
    $encoder.Save($ms)
    $pngBytesList += ,$ms.ToArray()
    $ms.Close()
}

# Write multi-resolution .ico file
function Write-IcoFile($outputPath, $bytesArray, $sizesArray) {
    $fs = [System.IO.File]::Create($outputPath)
    $bw = New-Object System.IO.BinaryWriter($fs)

    # ICONDIR header
    $bw.Write([uint16]0) # Reserved
    $bw.Write([uint16]1) # Type (1 = icon)
    $bw.Write([uint16]$sizesArray.Length) # Count

    $offset = 6 + (16 * $sizesArray.Length)
    for ($i = 0; $i -lt $sizesArray.Length; $i++) {
        $w = if ($sizesArray[$i] -ge 256) { 0 } else { [byte]$sizesArray[$i] }
        $h = if ($sizesArray[$i] -ge 256) { 0 } else { [byte]$sizesArray[$i] }
        $bw.Write([byte]$w)
        $bw.Write([byte]$h)
        $bw.Write([byte]0) # Colors
        $bw.Write([byte]0) # Reserved
        $bw.Write([uint16]1) # Planes
        $bw.Write([uint16]32) # Bit count
        $bw.Write([uint32]$bytesArray[$i].Length) # Size in bytes
        $bw.Write([uint32]$offset) # Offset
        $offset += $bytesArray[$i].Length
    }

    # Write PNG payloads
    for ($i = 0; $i -lt $sizesArray.Length; $i++) {
        $bw.Write($bytesArray[$i])
    }

    $bw.Flush()
    $fs.Close()
}

Write-IcoFile "H:\OPENCODE\desktop-app\app.ico" $pngBytesList $sizes
Write-IcoFile "H:\OPENCODE\installer\app.ico" $pngBytesList $sizes
Write-Host "Generated H:\OPENCODE\desktop-app\app.ico and installer\app.ico successfully!"
