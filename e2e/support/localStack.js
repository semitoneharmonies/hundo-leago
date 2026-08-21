import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const SUPPORT_DIRECTORY = path.dirname(fileURLToPath(import.meta.url))
const FRONTEND_DIRECTORY = path.resolve(SUPPORT_DIRECTORY, '..', '..')
const BACKEND_DIRECTORY = path.resolve(
  FRONTEND_DIRECTORY,
  '..',
  'hundo-leago-backend'
)
const FRONTEND_ORIGIN = 'http://127.0.0.1:5173'
const VITE_ENTRY = path.join(
  FRONTEND_DIRECTORY,
  'node_modules',
  'vite',
  'bin',
  'vite.js'
)
const RELEASE_RUNTIME_MODULE = path.join(
  BACKEND_DIRECTORY,
  'src',
  'operations',
  'release',
  'createReleaseQaRuntime.js'
)
const FAD_FIXTURE_MODULE = path.join(
  BACKEND_DIRECTORY,
  'src',
  'operations',
  'release',
  'createFreeAgentDraftBrowserFixture.js'
)
const PLAYER_CATALOG_REPOSITORY_MODULE = path.join(
  BACKEND_DIRECTORY,
  'src',
  'infrastructure',
  'persistence',
  'sqlite',
  'SqlitePlayerCatalogRepository.js'
)
const PLAYER_CATALOG_PATH = path.join(BACKEND_DIRECTORY, 'players.json')
const MIGRATIONS_DIRECTORY = path.join(
  BACKEND_DIRECTORY,
  'database',
  'migrations'
)
const MANIFEST_ENVIRONMENT_KEY = 'HUNDO_E2E_FAD_MANIFEST'
const PASSWORD_ENVIRONMENT_KEY = 'HUNDO_E2E_FIXTURE_PASSWORD'
const FRONTEND_OS_ENVIRONMENT_KEYS = Object.freeze([
  'APPDATA',
  'COMSPEC',
  'ComSpec',
  'HOMEDRIVE',
  'HOMEPATH',
  'LOCALAPPDATA',
  'NUMBER_OF_PROCESSORS',
  'OS',
  'Path',
  'PATH',
  'PATHEXT',
  'SystemDrive',
  'SystemRoot',
  'TEMP',
  'TMP',
  'USERPROFILE',
  'windir',
])

class LocalFadStackError extends Error {
  constructor(code, message, options = {}) {
    super(message, options)
    this.name = 'LocalFadStackError'
    this.code = code
  }
}

function fail(code, message, cause) {
  throw new LocalFadStackError(
    code,
    message,
    cause === undefined ? {} : { cause }
  )
}

function assertLocalFiles() {
  const required = [
    path.join(FRONTEND_DIRECTORY, 'package.json'),
    path.join(BACKEND_DIRECTORY, 'package.json'),
    VITE_ENTRY,
    RELEASE_RUNTIME_MODULE,
    FAD_FIXTURE_MODULE,
    PLAYER_CATALOG_REPOSITORY_MODULE,
    PLAYER_CATALOG_PATH,
    MIGRATIONS_DIRECTORY,
  ]
  const missing = required.filter((candidate) => !fs.existsSync(candidate))
  if (missing.length > 0) {
    fail(
      'FAD_E2E_LOCAL_SEAM_MISSING',
      `The connected local FAD test seam is incomplete: ${missing.join(', ')}`
    )
  }
}

function loadBackendSeams() {
  const require = createRequire(import.meta.url)
  const { createReleaseQaRuntime } = require(RELEASE_RUNTIME_MODULE)
  const { createFreeAgentDraftBrowserFixture } = require(FAD_FIXTURE_MODULE)
  const { createSqlitePlayerCatalogRepository } = require(
    PLAYER_CATALOG_REPOSITORY_MODULE
  )
  if (typeof createReleaseQaRuntime !== 'function') {
    fail(
      'FAD_E2E_RUNTIME_EXPORT_MISSING',
      'The release-QA runtime export is unavailable.'
    )
  }
  if (typeof createFreeAgentDraftBrowserFixture !== 'function') {
    fail(
      'FAD_E2E_FIXTURE_EXPORT_MISSING',
      'The Free Agent Draft browser fixture export is unavailable.'
    )
  }
  if (typeof createSqlitePlayerCatalogRepository !== 'function') {
    fail(
      'FAD_E2E_PLAYER_CATALOG_SEAM_MISSING',
      'The connected local FAD test player-catalog seam is unavailable.'
    )
  }
  return Object.freeze({
    createFreeAgentDraftBrowserFixture,
    createReleaseQaRuntime,
    createSqlitePlayerCatalogRepository,
  })
}

function seedBrowserPlayerCatalog(database, createRepository) {
  const catalog = JSON.parse(fs.readFileSync(PLAYER_CATALOG_PATH, 'utf8'))
  const selected = [
    ...catalog
      .filter(({ active, position }) => active === true && position === 'F')
      .slice(0, 500),
    ...catalog
      .filter(({ active, position }) => active === true && position === 'D')
      .slice(0, 300),
  ]
  if (selected.length < 800) {
    fail(
      'FAD_E2E_PLAYER_CATALOG_INCOMPLETE',
      'The connected local FAD test player catalog is incomplete.'
    )
  }
  const repository = createRepository({
    database,
    createId: () => crypto.randomUUID(),
    now: () => 1_700_000_000_100,
  })
  repository.applyCatalog({
    sourceOperationId: '20000000-0000-4000-8000-000000000001',
    provider: 'sportsdataio-discovery-lab',
    capturedAtMs: 1_700_000_000_000,
    rows: selected.map((player) => ({
      providerPlayerId: String(player.id),
      firstName: player.firstName,
      lastName: player.lastName,
      fullName: player.fullName,
      birthDate: player.birthDate,
      status: 'active',
      sourcePosition: player.position,
      normalizedPosition: player.position,
      nhlTeamAbbreviation: player.teamAbbrev ?? null,
      active: true,
      sourceVersion: 'players-json-2026',
      sourceUpdatedAtMs: 1_700_000_000_000,
    })),
  })
}

function createFrontendEnvironment(backendOrigin, environment = process.env) {
  const allowed = Object.fromEntries(
    FRONTEND_OS_ENVIRONMENT_KEYS
      .filter((key) => typeof environment[key] === 'string')
      .map((key) => [key, environment[key]])
  )
  return Object.freeze({
    ...allowed,
    VITE_APP_ENV: 'local',
    VITE_API_ORIGIN: backendOrigin,
    VITE_SOCKET_ORIGIN: backendOrigin,
    VITE_BUILD_ID: 'fad17-local-browser',
  })
}

function startFrontend(backendOrigin) {
  let stderr = ''
  let spawnError = null
  const child = spawn(
    process.execPath,
    [VITE_ENTRY, '--host', '127.0.0.1', '--port', '5173', '--strictPort'],
    {
      cwd: FRONTEND_DIRECTORY,
      env: createFrontendEnvironment(backendOrigin),
      stdio: ['ignore', 'ignore', 'pipe'],
      windowsHide: true,
    }
  )
  child.once('error', (error) => {
    spawnError = error
  })
  child.stderr?.on('data', (chunk) => {
    stderr = `${stderr}${chunk}`.slice(-8_000)
  })
  return Object.freeze({
    child,
    error: () => spawnError,
    stderr: () => stderr,
  })
}

async function waitForFrontend(frontend, fetchImplementation = fetch) {
  const deadline = Date.now() + 20_000
  while (Date.now() < deadline) {
    if (frontend.error()) {
      fail(
        'FAD_E2E_FRONTEND_START_FAILED',
        'The local Vite frontend could not start.',
        frontend.error()
      )
    }
    if (frontend.child.exitCode !== null) {
      fail(
        'FAD_E2E_FRONTEND_EXITED',
        `The local Vite frontend exited before readiness: ${frontend.stderr()}`
      )
    }
    try {
      const response = await fetchImplementation(FRONTEND_ORIGIN)
      const document = await response.text()
      if (
        response.status === 200 &&
        document.includes('<div id="root"></div>') &&
        document.includes('src="/src/main.jsx"')
      ) {
        return
      }
    } catch {
      // Vite has not opened its loopback listener yet.
    }
    await new Promise((resolve) => setTimeout(resolve, 100))
  }
  fail(
    'FAD_E2E_FRONTEND_TIMEOUT',
    `The local Vite frontend did not become ready: ${frontend.stderr()}`
  )
}

async function stopFrontend(frontend) {
  if (!frontend || frontend.child.exitCode !== null) return
  frontend.child.kill()
  await Promise.race([
    once(frontend.child, 'exit'),
    new Promise((_, reject) =>
      setTimeout(
        () => reject(new Error('The local Vite frontend did not stop.')),
        5_000
      )
    ),
  ])
}

function encodeManifest(manifest) {
  if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest)) {
    fail(
      'FAD_E2E_FIXTURE_MANIFEST_INVALID',
      'The Free Agent Draft browser fixture returned an invalid manifest.'
    )
  }
  let serialized
  try {
    serialized = JSON.stringify(manifest)
    JSON.parse(serialized)
  } catch (error) {
    fail(
      'FAD_E2E_FIXTURE_MANIFEST_INVALID',
      'The Free Agent Draft browser fixture manifest is not JSON-safe.',
      error
    )
  }
  return Buffer.from(serialized, 'utf8').toString('base64url')
}

async function closeStack({ frontend, started }) {
  let frontendError = null
  try {
    await stopFrontend(frontend)
  } catch (error) {
    frontendError = error
  }
  if (started) await started.close()
  delete process.env[MANIFEST_ENVIRONMENT_KEY]
  delete process.env[PASSWORD_ENVIRONMENT_KEY]
  if (frontendError) throw frontendError
}

export async function startLocalFadStack() {
  assertLocalFiles()
  const {
    createFreeAgentDraftBrowserFixture,
    createReleaseQaRuntime,
    createSqlitePlayerCatalogRepository,
  } = loadBackendSeams()
  const password = crypto.randomBytes(32).toString('base64url')
  let started
  let frontend
  try {
    started = await createReleaseQaRuntime({
      frontendOrigin: FRONTEND_ORIGIN,
      leagueWriteMode: 'open',
      migrationsDirectory: MIGRATIONS_DIRECTORY,
      password,
      port: 0,
    })
    seedBrowserPlayerCatalog(
      started.runtime.database,
      createSqlitePlayerCatalogRepository
    )
    const manifest = await createFreeAgentDraftBrowserFixture({
      runtime: started.runtime,
    })
    process.env[MANIFEST_ENVIRONMENT_KEY] = encodeManifest(manifest)
    process.env[PASSWORD_ENVIRONMENT_KEY] = password
    frontend = startFrontend(started.baseUrl)
    await waitForFrontend(frontend)
  } catch (error) {
    await closeStack({ frontend, started })
    if (error instanceof LocalFadStackError) throw error
    fail(
      'FAD_E2E_LOCAL_STACK_FAILED',
      'The connected local FAD browser stack failed to start safely.',
      error
    )
  }

  let closed = false
  return Object.freeze({
    async close() {
      if (closed) return
      closed = true
      await closeStack({ frontend, started })
    },
  })
}

export const localFadEnvironmentKeys = Object.freeze({
  manifest: MANIFEST_ENVIRONMENT_KEY,
  password: PASSWORD_ENVIRONMENT_KEY,
})
