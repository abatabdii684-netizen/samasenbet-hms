const { prisma }   = require('../config/database');
const { exec }     = require('child_process');
const path         = require('path');
const fs           = require('fs');
const AppError     = require('../utils/AppError');

const BACKUP_DIR = path.join(process.cwd(), 'backups');
if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });

// Find mysqldump executable — check XAMPP common paths first
const findMysqldump = () => {
  const candidates = [
    'mysqldump',                                           // system PATH
    'C:\\xampp\\mysql\\bin\\mysqldump.exe',               // XAMPP default
    'C:\\xampp7\\mysql\\bin\\mysqldump.exe',
    'C:\\xampp8\\mysql\\bin\\mysqldump.exe',
    'C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysqldump.exe',
    'C:\\Program Files\\MySQL\\MySQL Server 5.7\\bin\\mysqldump.exe',
    'C:\\Program Files (x86)\\MySQL\\MySQL Server 8.0\\bin\\mysqldump.exe',
    'C:\\wamp64\\bin\\mysql\\mysql8.0.31\\bin\\mysqldump.exe',
    'C:\\wamp\\bin\\mysql\\mysql8.0.31\\bin\\mysqldump.exe',
  ];
  for (const p of candidates) {
    if (p === 'mysqldump') continue; // skip system PATH check here
    if (fs.existsSync(p)) return `"${p}"`;
  }
  return 'mysqldump'; // fallback to PATH
};

const MYSQLDUMP = findMysqldump();

// Parse DATABASE_URL to extract MySQL credentials
const parseDbUrl = () => {
  const url  = process.env.DATABASE_URL || '';
  const match = url.match(/mysql:\/\/([^:]+):([^@]*)@([^:]+):(\d+)\/(.+)/);
  if (!match) return null;
  return { user: match[1], password: match[2], host: match[3], port: match[4], database: match[5] };
};

class BackupService {
  async getAll() {
    if (!fs.existsSync(BACKUP_DIR)) return [];
    const files = fs.readdirSync(BACKUP_DIR)
      .filter(f => f.endsWith('.sql'))
      .map(f => {
        const stat = fs.statSync(path.join(BACKUP_DIR, f));
        return {
          id:       f,
          filename: f,
          size:     stat.size,
          sizeKB:   Math.round(stat.size / 1024),
          createdAt: stat.birthtime,
        };
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return files;
  }

  async create(label = '') {
    const db = parseDbUrl();
    if (!db) throw AppError.badRequest('Cannot parse DATABASE_URL');

    const ts       = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const name     = `backup-${label ? label + '-' : ''}${ts}.sql`;
    const filePath = path.join(BACKUP_DIR, name);

    const pwFlag = db.password ? `-p${db.password}` : '';
    const cmd    = `${MYSQLDUMP} -u ${db.user} ${pwFlag} -h ${db.host} -P ${db.port} ${db.database} > "${filePath}"`;

    return new Promise((resolve, reject) => {
      exec(cmd, (err) => {
        if (err) {
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
          reject(AppError.badRequest(`mysqldump failed: ${err.message}`));
        } else {
          const stat = fs.statSync(filePath);
          resolve({ id: name, filename: name, sizeKB: Math.round(stat.size / 1024), createdAt: new Date() });
        }
      });
    });
  }

  async download(id) {
    const filePath = path.join(BACKUP_DIR, id);
    if (!fs.existsSync(filePath)) throw AppError.notFound('Backup file not found');
    return filePath;
  }

  async remove(id) {
    const filePath = path.join(BACKUP_DIR, id);
    if (!fs.existsSync(filePath)) throw AppError.notFound('Backup file not found');
    fs.unlinkSync(filePath);
    return { deleted: true };
  }
}

module.exports = new BackupService();
