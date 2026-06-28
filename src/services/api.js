const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

/**
 * Upload a photo for a given event.
 * @param {string} eventCode - The unique event identifier.
 * @param {File} file - The image file to upload.
 * @returns {Promise<object>} Parsed JSON response from the server.
 */
export async function uploadPhoto(eventCode, file) {
  const formData = new FormData()
  formData.append('photo', file)

  const response = await fetch(`${API_BASE_URL}/events/${eventCode}/photos`, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    let message = `Upload failed (${response.status})`
    try {
      const data = await response.json()
      if (data.message) message = data.message
    } catch {
      // ignore parse errors
    }
    throw new Error(message)
  }

  return response.json()
}
