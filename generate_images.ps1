$imageDir = "d:\GDG_birthday_web\Image"
$outputFile = "d:\GDG_birthday_web\src\image_data.js"

$years = @(2013..2026)
$yearPhotos = @{}
$allPhotos = @()

foreach ($year in $years) {
    $yearDir = Join-Path $imageDir $year
    $photos = @()
    if (Test-Path $yearDir) {
        $files = Get-ChildItem -Path "$yearDir\*" -File -Include "*.jpg", "*.jpeg", "*.png", "*.gif"
        foreach ($file in $files) {
            # Fix path separators for web URL (forward slashes)
            $relativePath = "Image/$year/" + $file.Name
            $photos += "'$relativePath'"
            $allPhotos += "'$relativePath'"
        }
    }
    $yearPhotos[$year] = $photos
}

# Generate JS content
$jsContent = "// Tự động tạo bởi script generate_images.ps1`n"
$jsContent += "export const YEAR_PHOTOS = {`n"
foreach ($year in $years) {
    $photosArray = $yearPhotos[$year] -join ", "
    $jsContent += "  ${year}: [$photosArray],`n"
}
$jsContent += "};`n`n"

$allPhotosStr = $allPhotos -join ", "
$jsContent += "export const ALL_PHOTOS = [$allPhotosStr];`n"

Set-Content -Path $outputFile -Value $jsContent -Encoding UTF8
Write-Output "Đã tạo thành công src/image_data.js với $($allPhotos.Count) tấm ảnh!"
