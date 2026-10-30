<?php
/**
 * Mara Survivor — ranking online sin base de datos.
 *
 * Instalación en OVH (hosting compartido):
 *   1. Sube la carpeta del juego completa por FTP.
 *   2. Comprueba que api/data/ tiene permisos de escritura (755/775).
 *   3. Listo. El juego detecta el API solo; si falla, sigue en modo local.
 *
 * GET  api/ranking.php?limit=20
 *      -> {"ok":true,"scores":[...],"total":N}
 * POST api/ranking.php  {"name":"...","time":123.4,"kills":50,"level":12,"win":false}
 *      -> {"ok":true,"rank":3,"total":40,"name":"...","time":123.4,"scores":[...]}
 *
 * Los datos se guardan en api/data/*.php con un guardia PHP al principio,
 * así que una petición directa al archivo no filtra nada (funciona incluso
 * si el servidor ignora .htaccess).
 */

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, max-age=0');
header('X-Content-Type-Options: nosniff');

const MAX_SCORES   = 500;
const MAX_NAME_LEN = 16;
const MAX_TIME     = 960.0;   // la partida termina a los 15:00 (+1,4s de margen de victoria)
const MAX_KILLS    = 20000;
const MAX_LEVEL    = 200;
const MAX_TIER     = 999;
const MIN_INTERVAL = 6;       // segundos entre envíos por IP
const RATE_TTL     = 3600;
const TOP_DEFAULT  = 20;

$DATA_DIR    = __DIR__ . '/data';
$SCORES_FILE = $DATA_DIR . '/scores.php';
$RATE_FILE   = $DATA_DIR . '/rate.php';
$LOCK_FILE   = $DATA_DIR . '/.lock';
$GUARD       = '<?php http_response_code(403); exit; ?>';

function respond(array $payload, int $code = 200): void
{
    http_response_code($code);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function fail(string $error, int $code = 400): void
{
    respond(['ok' => false, 'error' => $error], $code);
}

function ensure_dir(string $dir): bool
{
    if (!is_dir($dir) && !@mkdir($dir, 0775, true)) {
        return false;
    }
    return is_writable($dir);
}

/** Lee el JSON que va después de la línea del guardia PHP. */
function read_data(string $file): array
{
    if (!is_file($file)) {
        return [];
    }
    $raw = @file_get_contents($file);
    if ($raw === false) {
        return [];
    }
    $pos = strpos($raw, "\n");
    if ($pos === false) {
        return [];
    }
    $data = json_decode(substr($raw, $pos + 1), true);
    return is_array($data) ? $data : [];
}

/** Escritura atómica: archivo temporal + rename. */
function write_data(string $file, string $guard, array $data): bool
{
    $body = $guard . "\n" . json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    try {
        $suffix = bin2hex(random_bytes(4));
    } catch (Exception $e) {
        $suffix = (string) mt_rand();
    }
    $tmp = $file . '.tmp' . $suffix;
    if (@file_put_contents($tmp, $body, LOCK_EX) === false) {
        return false;
    }
    @chmod($tmp, 0664);
    if (!@rename($tmp, $file)) {
        @unlink($tmp);
        return false;
    }
    return true;
}

function clean_name($raw): string
{
    $name = preg_replace('/[^\p{L}\p{N} _.\-]/u', '', (string) $raw);
    if ($name === null) {
        $name = '';
    }
    $name = trim(preg_replace('/\s+/u', ' ', $name));
    if (function_exists('mb_substr')) {
        $name = mb_substr($name, 0, MAX_NAME_LEN, 'UTF-8');
    } else {
        $name = substr($name, 0, MAX_NAME_LEN);
    }
    return $name === '' ? 'ANON' : $name;
}

function sort_scores(array &$scores): void
{
    usort($scores, function (array $a, array $b): int {
        $time  = ((float) ($b['time'] ?? 0)) <=> ((float) ($a['time'] ?? 0));
        if ($time !== 0) {
            return $time;
        }
        $kills = ((int) ($b['kills'] ?? 0)) <=> ((int) ($a['kills'] ?? 0));
        if ($kills !== 0) {
            return $kills;
        }
        return ((int) ($a['at'] ?? 0)) <=> ((int) ($b['at'] ?? 0));
    });
}

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
if ($method === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if (!ensure_dir($DATA_DIR)) {
    fail('storage', 503);
}

// ---------------- GET: clasificación ----------------
if ($method === 'GET') {
    $limit = isset($_GET['limit']) ? (int) $_GET['limit'] : TOP_DEFAULT;
    $limit = max(1, min(50, $limit));

    $stored = read_data($SCORES_FILE);
    $scores = isset($stored['scores']) && is_array($stored['scores']) ? $stored['scores'] : [];
    sort_scores($scores);

    respond([
        'ok'     => true,
        'scores' => array_slice($scores, 0, $limit),
        'total'  => count($scores),
    ]);
}

if ($method !== 'POST') {
    fail('method', 405);
}

// ---------------- POST: enviar marca ----------------
$raw = file_get_contents('php://input');
if ($raw === false || strlen($raw) > 4096) {
    fail('bad_request', 413);
}

$in = json_decode($raw, true);
if (!is_array($in)) {
    fail('bad_json', 400);
}

$name  = clean_name($in['name'] ?? '');
$time  = isset($in['time']) ? (float) $in['time'] : -1.0;
$kills = isset($in['kills']) ? (int) $in['kills'] : -1;
$level = isset($in['level']) ? (int) $in['level'] : -1;
$tier  = isset($in['tier']) ? (int) $in['tier'] : 0;
$win   = !empty($in['win']);

if (!is_finite($time) || $time < 3.0 || $time > MAX_TIME) {
    fail('bad_time', 422);
}
if ($kills < 0 || $kills > MAX_KILLS) {
    fail('bad_kills', 422);
}
if ($level < 1 || $level > MAX_LEVEL) {
    fail('bad_level', 422);
}
if ($tier < 0 || $tier > MAX_TIER) {
    fail('bad_tier', 422);
}

// límite sencillo por IP (evita floods; no es seguridad fuerte)
$ip = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
$ipKey = hash('sha256', $ip . '|mara-survivor-ranking');
$now = time();

$lock = @fopen($LOCK_FILE, 'c');
if ($lock === false) {
    fail('storage', 503);
}
if (!flock($lock, LOCK_EX)) {
    fclose($lock);
    fail('storage', 503);
}

$rateStore = read_data($RATE_FILE);
$ips = isset($rateStore['ips']) && is_array($rateStore['ips']) ? $rateStore['ips'] : [];
foreach ($ips as $k => $t) {
    if ($now - (int) $t > RATE_TTL) {
        unset($ips[$k]);
    }
}
if (isset($ips[$ipKey]) && $now - (int) $ips[$ipKey] < MIN_INTERVAL) {
    flock($lock, LOCK_UN);
    fclose($lock);
    fail('rate_limited', 429);
}

$stored = read_data($SCORES_FILE);
$scores = isset($stored['scores']) && is_array($stored['scores']) ? $stored['scores'] : [];

try {
    $entryId = bin2hex(random_bytes(6));
} catch (Exception $e) {
    $entryId = uniqid('', true);
}

$entry = [
    'id'    => $entryId,
    'name'  => $name,
    'time'  => round($time, 1),
    'kills' => $kills,
    'level' => $level,
    'tier'  => $tier,
    'win'   => $win,
    'at'    => $now,
];
$scores[] = $entry;
sort_scores($scores);
if (count($scores) > MAX_SCORES) {
    $scores = array_slice($scores, 0, MAX_SCORES);
}

$okScores = write_data($SCORES_FILE, $GUARD, ['scores' => $scores]);
$ips[$ipKey] = $now;
$okRate = write_data($RATE_FILE, $GUARD, ['ips' => $ips]);

flock($lock, LOCK_UN);
fclose($lock);

if (!$okScores || !$okRate) {
    fail('storage', 503);
}

// si la marca no entra en el top MAX_SCORES, rank = 0 (el cliente lo trata como enviada)
$rank = 0;
foreach ($scores as $i => $s) {
    if (($s['id'] ?? '') === $entryId) {
        $rank = $i + 1;
        break;
    }
}

respond([
    'ok'     => true,
    'rank'   => $rank,
    'total'  => count($scores),
    'name'   => $name,
    'time'   => $entry['time'],
    'tier'   => $tier,
    'scores' => array_slice($scores, 0, TOP_DEFAULT),
]);
