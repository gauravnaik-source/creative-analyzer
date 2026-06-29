export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  let canImportPostgres = false;
  let importError = null;

  try {
    const pg = await import('@vercel/postgres');
    canImportPostgres = typeof pg.sql === 'function';
  } catch (e) {
    importError = e.message;
  }

  const fs = await import('fs');
  const path = await import('path');
  let cwd = process.cwd();
  let nodeModulesExists = false;
  let vercelPostgresExists = false;

  try {
    const nmPath = path.join(cwd, 'node_modules');
    nodeModulesExists = fs.existsSync(nmPath);
    if (nodeModulesExists) {
      vercelPostgresExists = fs.existsSync(path.join(nmPath, '@vercel', 'postgres'));
    }
  } catch (e) {
    // ignore
  }

  return res.status(200).json({
    location: 'api/auth/debug.js',
    cwd,
    nodeModulesExists,
    vercelPostgresExists,
    canImportPostgres,
    importError,
  });
}
