#!/usr/bin/env node
/**
 * Repack the .tgz so the root folder inside the archive is the module id (e.g. zoom-rooms),
 * not "pkg". Companion's "Import module package" expects to find the module folder at the
 * tarball root; it may match by folder name or by presence of companion/manifest.json.
 */
const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

const manifestPath = path.join(__dirname, '..', 'companion', 'manifest.json')
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
const moduleId = manifest.id
const pkgJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'))
const version = pkgJson.version
const tgzName = `${moduleId}-${version}.tgz`
const tgzPath = path.join(__dirname, '..', tgzName)

if (!fs.existsSync(tgzPath)) {
  console.error('Expected tgz not found:', tgzPath)
  process.exit(1)
}

const tempDir = path.join(__dirname, '..', '.repack-temp')
const pkgDir = path.join(tempDir, 'pkg')
const moduleDir = path.join(tempDir, moduleId)

try {
  if (fs.existsSync(tempDir)) fs.rmSync(tempDir, { recursive: true })
  fs.mkdirSync(tempDir, { recursive: true })

  execSync(`tar -xzf "${tgzPath}" -C "${tempDir}"`, { stdio: 'inherit' })

  if (!fs.existsSync(pkgDir)) {
    console.error('Expected pkg/ folder not found inside tgz')
    process.exit(1)
  }

  fs.renameSync(pkgDir, moduleDir)

  fs.unlinkSync(tgzPath)
  execSync(`tar -czf "${tgzPath}" -C "${tempDir}" "${moduleId}"`, { stdio: 'inherit' })
  console.log('Repacked', tgzName, 'with root folder', moduleId)
} finally {
  if (fs.existsSync(tempDir)) fs.rmSync(tempDir, { recursive: true })
}
