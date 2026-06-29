export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const fs = require('fs');
  const path = require('path');

  let nodeModulesExists = false;
  let vercelPostgresExists = false;
  let nodeModulesContents = [];
  let cwd = process.cwd();
  let dirListing = [];

  try {
    dirListing = fs.readdirSync(cwd);
  } catch (e) {
    dirListing = ['ERROR: ' + e.message];
  }

  try {
    const nmPath = path.join(cwd, 'node_modules');
    nodeModulesExists = fs.existsSync(nmPath);
    if (nodeModulesExists) {
      nodeModulesContents = fs.readdirSync(nmPath).slice(0, 30);
      vercelPostgresExists = fs.existsSync(path.join(nmPath, '@vercel', 'postgres'));
    }
  } catch (e) {
    nodeModulesContents = ['ERROR: ' + e.message];
  }

  return res.status(200).json({
    cwd,
    dirListing,
    nodeModulesExists,
    vercelPostgresExists,
    nodeModulesContents,
    nodeVersion: process.version,
  });
}
