<?php
/* uploads (ssm cert). sent as base64 in json, saved in api/storage/uploads (blocked from web), emailed to sales */
declare(strict_types=1);

const UPLOAD_MAX_BYTES = 5 * 1024 * 1024;

/** null = no file, ['error'] = bad file, else the file */
function upload_from_json($v): ?array
{
    if (!is_array($v) || !isset($v['data']) || $v['data'] === '') return null;
    if (!is_string($v['data']) || strlen($v['data']) > (int) ceil(UPLOAD_MAX_BYTES * 4 / 3) + 16) return ['error' => 'This file is larger than 5 MB. Please upload a smaller copy.'];
    $bytes = base64_decode($v['data'], true);
    if ($bytes === false || $bytes === '') return ['error' => 'The file could not be read. Please choose it again.'];
    if (strlen($bytes) > UPLOAD_MAX_BYTES) return ['error' => 'This file is larger than 5 MB. Please upload a smaller copy.'];
    // check real type from bytes
    if (strncmp($bytes, '%PDF-', 5) === 0) { $ext = 'pdf'; $type = 'application/pdf'; }
    elseif (strncmp($bytes, "\x89PNG\r\n\x1a\n", 8) === 0) { $ext = 'png'; $type = 'image/png'; }
    elseif (strncmp($bytes, "\xFF\xD8\xFF", 3) === 0) { $ext = 'jpg'; $type = 'image/jpeg'; }
    else return ['error' => 'Upload a PDF, JPG or PNG file.'];
    $name = is_string($v['name'] ?? null) ? $v['name'] : '';
    $name = trim(preg_replace('/[\x00-\x1F\x7F\/\\\\]+/u', '', basename(str_replace('\\', '/', $name))));
    $name = mb_substr($name !== '' ? $name : 'certificate.' . $ext, 0, 120);
    return ['bytes' => $bytes, 'ext' => $ext, 'type' => $type, 'name' => $name];
}

function upload_dir(string $folder): string
{
    $dir = API_ROOT . '/storage/uploads/' . preg_replace('/[^a-z0-9_-]/i', '', $folder);
    if (!is_dir($dir) && !@mkdir($dir, 0775, true) && !is_dir($dir)) throw new RuntimeException('Cannot create the upload folder.');
    return $dir;
}

function upload_save(array $u, string $folder, string $prefix): array
{
    $file = preg_replace('/[^A-Za-z0-9_-]/', '', $prefix) . '-' . bin2hex(random_bytes(8)) . '.' . $u['ext'];
    if (@file_put_contents(upload_dir($folder) . '/' . $file, $u['bytes'], LOCK_EX) === false) throw new RuntimeException('Cannot save the uploaded file.');
    return ['name' => $u['name'], 'file' => $file, 'folder' => $folder, 'type' => $u['type'], 'size' => strlen($u['bytes']), 'uploadedAt' => date('c')];
}

function upload_path(?array $meta): ?string
{
    if (!$meta || empty($meta['file']) || empty($meta['folder'])) return null;
    $p = API_ROOT . '/storage/uploads/' . preg_replace('/[^a-z0-9_-]/i', '', $meta['folder']) . '/' . basename($meta['file']);
    return is_file($p) ? $p : null;
}

function upload_delete(?array $meta): void
{
    $p = upload_path($meta);
    if ($p) @unlink($p);
}

function upload_attachment(?array $meta): array
{
    $p = upload_path($meta);
    return $p ? [['path' => $p, 'name' => $meta['name'], 'type' => $meta['type']]] : [];
}
