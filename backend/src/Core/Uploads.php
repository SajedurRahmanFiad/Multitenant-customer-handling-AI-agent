<?php
declare(strict_types=1);

/** File uploads into storage/uploads/{subfolder}. Returns public-ish URL path. */
final class Uploads
{
    public const MAX_BYTES = 20 * 1024 * 1024;
    public const ALLOWED = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'csv', 'txt', 'mp3', 'ogg', 'wav', 'm4a', 'mp4', 'webm'];

    public static function store(array $file, string $subfolder = 'misc'): string
    {
        if (($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK || empty($file['tmp_name']) || empty($file['name'])) {
            Response::error('Choose a file to upload', 422);
        }
        if ($file['size'] > self::MAX_BYTES) Response::error('File exceeds 20MB limit', 422);
        $ext = strtolower(pathinfo($file['name'] ?? '', PATHINFO_EXTENSION));
        if ($ext !== '' && !in_array($ext, self::ALLOWED, true)) Response::error("File type .$ext is not allowed", 422);
        if ($ext === '') $ext = 'bin';

        $dir = Config::get('APP_BASE_PATH') . '/storage/uploads/' . trim($subfolder, '/');
        if (!is_dir($dir)) @mkdir($dir, 0775, true);
        $name = Util::id('f') . '.' . $ext;
        if (!move_uploaded_file($file['tmp_name'], $dir . '/' . $name) && !@rename($file['tmp_name'], $dir . '/' . $name)) {
            Response::error('Failed to store uploaded file', 500);
        }
        return "/storage/uploads/" . trim($subfolder, '/') . '/' . $name;
    }
}
