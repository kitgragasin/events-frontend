import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import QRCode from 'qrcode'
import { fetchPhotoBlob, listEventPhotos, uploadPhoto } from '../../services/api'

export const MAX_FILE_SIZE_MB = 10
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/heic', 'image/heif']

function buildEventLink(eventID) {
  if (!eventID) {
    return ''
  }

  return `${window.location.origin}/e/${encodeURIComponent(eventID)}`
}

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (event) => resolve(event?.target?.result || '')
    reader.onerror = () => reject(new Error('Failed to generate image preview.'))
    reader.readAsDataURL(file)
  })
}

function validateFile(file) {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { isValid: false, message: 'Please select a valid image file.' }
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      isValid: false,
      message: `File is too large. Maximum allowed size is ${MAX_FILE_SIZE_MB} MB.`,
    }
  }

  return { isValid: true, message: '' }
}

export function formatPhotoDetail(photo) {
  if (photo.createdAt) {
    return new Date(photo.createdAt).toLocaleString()
  }

  return photo.mimeType || 'Photo'
}

export function useEventShare(eventID) {
  const [eventQrDataUrl, setEventQrDataUrl] = useState('')
  const [copyStatus, setCopyStatus] = useState('idle')

  const eventLink = useMemo(() => buildEventLink(eventID), [eventID])

  useEffect(() => {
    if (!eventLink) {
      setEventQrDataUrl('')
      return
    }

    let isCancelled = false

    QRCode.toDataURL(eventLink, {
      width: 280,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    })
      .then((dataUrl) => {
        if (!isCancelled) {
          setEventQrDataUrl(dataUrl)
        }
      })
      .catch(() => {
        if (!isCancelled) {
          setEventQrDataUrl('')
        }
      })

    return () => {
      isCancelled = true
    }
  }, [eventLink])

  const handleCopyEventLink = useCallback(async () => {
    if (!eventLink || !navigator.clipboard) {
      setCopyStatus('error')
      return
    }

    try {
      await navigator.clipboard.writeText(eventLink)
      setCopyStatus('copied')
    } catch {
      setCopyStatus('error')
    }
  }, [eventLink])

  return {
    eventLink,
    eventQrDataUrl,
    copyStatus,
    handleCopyEventLink,
  }
}

export function useEventGallery(eventID) {
  const [galleryStatus, setGalleryStatus] = useState('idle')
  const [galleryError, setGalleryError] = useState('')
  const [galleryPhotos, setGalleryPhotos] = useState([])
  const [galleryCount, setGalleryCount] = useState(0)
  const galleryBlobUrlsRef = useRef([])

  const revokeGalleryBlobUrls = useCallback(() => {
    galleryBlobUrlsRef.current.forEach((blobUrl) => URL.revokeObjectURL(blobUrl))
    galleryBlobUrlsRef.current = []
  }, [])

  const loadGallery = useCallback(async () => {
    if (!eventID) {
      setGalleryStatus('error')
      setGalleryError('Missing event identifier in the URL.')
      return
    }

    setGalleryStatus('loading')
    setGalleryError('')

    try {
      const data = await listEventPhotos(eventID)
      const photos = Array.isArray(data.photos) ? data.photos : []

      const photosWithBlobUrls = await Promise.all(
        photos.map(async (photo) => {
          const blob = await fetchPhotoBlob(photo.photoID)
          return {
            ...photo,
            blobUrl: URL.createObjectURL(blob),
          }
        }),
      )

      revokeGalleryBlobUrls()
      galleryBlobUrlsRef.current = photosWithBlobUrls.map((photo) => photo.blobUrl)
      setGalleryPhotos(photosWithBlobUrls)
      setGalleryCount(typeof data.count === 'number' ? data.count : photosWithBlobUrls.length)
      setGalleryStatus('ready')
    } catch (err) {
      revokeGalleryBlobUrls()
      setGalleryPhotos([])
      setGalleryCount(0)
      setGalleryError(err.message || 'Something went wrong while loading the gallery.')
      setGalleryStatus('error')
    }
  }, [eventID, revokeGalleryBlobUrls])

  useEffect(() => {
    loadGallery()

    return () => {
      revokeGalleryBlobUrls()
    }
  }, [loadGallery, revokeGalleryBlobUrls])

  return {
    galleryStatus,
    galleryError,
    galleryPhotos,
    galleryCount,
    loadGallery,
  }
}

export function usePhotoUpload(eventID, onUploadSuccess) {
  const [status, setStatus] = useState('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [selectedFile, setSelectedFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const fileInputRef = useRef(null)

  const clearSelection = useCallback(() => {
    setSelectedFile(null)
    setPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [])

  const handleReset = useCallback(() => {
    setStatus('idle')
    setErrorMessage('')
    clearSelection()
  }, [clearSelection])

  const handleFileChange = useCallback(async (event) => {
    const file = event.target.files[0]
    if (!file) {
      return
    }

    const validation = validateFile(file)
    if (!validation.isValid) {
      setErrorMessage(validation.message)
      setStatus('error')
      clearSelection()
      return
    }

    try {
      const nextPreview = await readFileAsDataURL(file)
      setSelectedFile(file)
      setPreview(nextPreview)
      setStatus('idle')
      setErrorMessage('')
    } catch (err) {
      setErrorMessage(err.message || 'Could not read the selected file.')
      setStatus('error')
      clearSelection()
    }
  }, [clearSelection])

  const handleSubmit = useCallback(async (event) => {
    event.preventDefault()

    if (!selectedFile) {
      setErrorMessage('Please choose a photo first.')
      setStatus('error')
      return
    }

    setStatus('uploading')
    setErrorMessage('')

    try {
      await uploadPhoto(eventID, selectedFile)
      setStatus('success')
      clearSelection()
      await onUploadSuccess()
    } catch (err) {
      setErrorMessage(err.message || 'Something went wrong. Please try again.')
      setStatus('error')
    }
  }, [clearSelection, eventID, onUploadSuccess, selectedFile])

  return {
    status,
    errorMessage,
    selectedFile,
    preview,
    fileInputRef,
    handleFileChange,
    handleSubmit,
    handleReset,
  }
}
