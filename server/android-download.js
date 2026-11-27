const fs = require('node:fs/promises');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const { pipeline } = require('node:stream/promises');
const { DATA_DIR } = require('./db');
const { route, role, fail } = require('./router');

const APK = path.join(DATA_DIR, 'HUGO-KID.apk');
const MAX_APK = 40 * 1024 * 1024;

async function androidDownloadInfo() {
  const info = await fs.stat(APK).catch(error => {
    if (error.code !== 'ENOENT') throw error;
    return null;
  });
  return { available: !!info, size: info?.size || 0 };
}

function hasAndroidManifest(bytes) {
  if (bytes.length < 22 || bytes.readUInt32LE(0) !== 0x04034b50) return false;
  const end = bytes.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  if (end < 0 || end + 22 > bytes.length) return false;
  const start = bytes.readUInt32LE(end + 16);
  const size = bytes.readUInt32LE(end + 12);
  const last = start + size;
  if (last > end) return false;
  for (let offset = start; offset + 46 <= last;) {
    if (bytes.readUInt32LE(offset) !== 0x02014b50) return false;
    const nameLength = bytes.readUInt16LE(offset + 28);
    const nameEnd = offset + 46 + nameLength;
    if (nameEnd > last) return false;
    if (bytes.toString('utf8', offset + 46, nameEnd) === 'AndroidManifest.xml') return true;
    offset = nameEnd + bytes.readUInt16LE(offset + 30) + bytes.readUInt16LE(offset + 32);
  }
  return false;
}

route('GET', '/api/android-download', () => androidDownloadInfo());
route('APK_UPLOAD', '/api/admin/android-download', async (user, bytes) => {
  role(user, 'superadmin');
  if (user.must_change) fail(403, 'Change your temporary password before publishing.');
  if (!Buffer.isBuffer(bytes) || bytes.length > MAX_APK || !hasAndroidManifest(bytes)) {
    fail(400, 'Select a valid Android APK of up to 40 MB.');
  }
  const temporary = APK + '.' + randomUUID() + '.tmp';
  try {
    await fs.writeFile(temporary, bytes, { flag: 'wx' });
    await fs.rename(temporary, APK);
  } finally {
    await fs.rm(temporary, { force: true });
  }
  return { available: true, size: bytes.length };
});

async function sendAndroidApk(req, res) {
  const handle = await fs.open(APK, 'r').catch(error => {
    if (error.code !== 'ENOENT') throw error;
    return null;
  });
  if (!handle) {
    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' });
    return res.end('The Android download is not available yet.');
  }
  try {
    const { size } = await handle.stat();
    res.writeHead(200, {
      'content-type': 'application/vnd.android.package-archive',
      'content-disposition': 'attachment; filename="HUGO-KID.apk"',
      'content-length': size,
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
    });
    if (req.method === 'HEAD') return res.end();
    await pipeline(handle.createReadStream({ autoClose: false }), res);
  } finally {
    await handle.close();
  }
}

module.exports = { MAX_APK, sendAndroidApk };
