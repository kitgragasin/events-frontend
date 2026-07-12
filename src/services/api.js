const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''
const API_KEY = (import.meta.env.VITE_API_KEY || '').trim()
const PLACEHOLDER_API_KEY = 'your-api-key-here'
const HAS_API_KEY = API_KEY && API_KEY !== PLACEHOLDER_API_KEY
const SHOW_API_KEY_IN_ERRORS = import.meta.env.DEV

function maskApiKey(apiKey) {
  if (!apiKey) {
    return 'not set'
  }

  if (apiKey === PLACEHOLDER_API_KEY) {
    return 'placeholder'
  }

  if (apiKey.length <= 8) {
    return 'set'
  }

  return `${apiKey.slice(0, 4)}…${apiKey.slice(-4)}`
}

export function getApiClientStatus() {
  return {
    baseUrl: API_BASE_URL || 'not set',
    hasApiKey: Boolean(HAS_API_KEY),
    apiKeyLabel: maskApiKey(API_KEY),
    apiKey: API_KEY || 'not set',
  }
}

function buildApiUrl(path) {
  const base = API_BASE_URL.replace(/\/$/, '')
  return `${base}${path}`
}

function buildHeaders(extraHeaders = {}) {
  const headers = { ...extraHeaders }

  if (HAS_API_KEY) {
    headers['x-api-key'] = API_KEY
  }

  return headers
}

async function readErrorMessage(response, fallbackMessage) {
  try {
    const data = await response.json()
    const message = data?.message || data?.error || data?.detail

    if (message) {
      if (SHOW_API_KEY_IN_ERRORS && (response.status === 401 || response.status === 403)) {
        return `${message} | API key: ${API_KEY || 'not set'}`
      }

      return message
    }
  } catch {
    // ignore parse errors
  }

  if (SHOW_API_KEY_IN_ERRORS && (response.status === 401 || response.status === 403)) {
    return `${fallbackMessage} | API key: ${API_KEY || 'not set'}`
  }

  return fallbackMessage
}

/**
 * Upload a photo for a given event.
 * @param {string} eventID - The unique event identifier.
 * @param {File} file - The image file to upload.
 * @returns {Promise<object>} Parsed JSON response from the server.
 */
export async function uploadPhoto(eventID, file) {
  const formData = new FormData()
  formData.append('photo', file)
  formData.append('eventID', eventID)

  const response = await fetch(buildApiUrl('/photobooth/photos'), {
    method: 'POST',
    headers: buildHeaders(),
    body: formData,
  })

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, `Upload failed (${response.status})`))
  }

  return response.json()
}

/**
 * Retrieve metadata for all photos belonging to an event.
 * @param {string} eventID - The unique event identifier.
 * @returns {Promise<object>} Parsed JSON response from the server.
 */
export async function listEventPhotos(eventID) {
  const response = await fetch(buildApiUrl(`/photobooth/events/${eventID}/photos`), {
    headers: buildHeaders(),
  })

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, `Failed to load event photos (${response.status})`))
  }

  return response.json()
}

/**
 * Fetch a single photo as a blob so it can be shown in an img tag.
 * @param {string} photoID - The unique photo identifier.
 * @returns {Promise<Blob>} The image blob.
 */
export async function fetchPhotoBlob(photoID) {
  const response = await fetch(buildApiUrl(`/photobooth/photos/${photoID}`), {
    headers: buildHeaders(),
  })

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, `Failed to load photo (${response.status})`))
  }

  return response.blob()
}

/**
 * Delete a photo.
 * @param {string} photoID - The unique photo identifier.
 * @returns {Promise<object>} Parsed JSON response from the server.
 */
export async function deletePhoto(photoID) {
  const response = await fetch(buildApiUrl(`/photobooth/photos/${photoID}`), {
    method: 'DELETE',
    headers: buildHeaders(),
  })

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, `Delete failed (${response.status})`))
  }

  return response.json()
}
