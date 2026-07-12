# events-frontend

A mobile-friendly React (Vite) single-page application that lets guests upload photos to an event by scanning a QR code.

## Table of Contents

- [Local Development](#local-development)
- [Environment Configuration](#environment-configuration)
- [Build & Deploy on Hostinger](#build--deploy-on-hostinger)
- [SPA Routing / Deep-Link Fallback](#spa-routing--deep-link-fallback)
- [Backend API Contract](#backend-api-contract)

---

## Local Development

### Prerequisites

- Node.js 18+
- npm 9+

### Steps

```bash
# 1. Clone the repository
git clone https://github.com/kitgragasin/events-frontend.git
cd events-frontend

# 2. Install dependencies
npm install

# 3. Copy the example env file and fill in your values
cp .env.example .env

# 4. Start the development server
npm run dev
```

The app will be available at `http://localhost:5173` by default.

---

## Environment Configuration

Copy `.env.example` to `.env` and set the variable:

| Variable            | Required | Description                                          |
| ------------------- | -------- | ---------------------------------------------------- |
| `VITE_API_BASE_URL` | Yes      | Base URL of the backend API (no trailing slash). Example: `https://api.yourdomain.com` |

> Vite exposes only variables prefixed with `VITE_` to the browser bundle.

---

## Build & Deploy on Hostinger

### 1. Build the production bundle

```bash
npm run build
```

The output is placed in the `dist/` directory.

### 2. Upload to Hostinger

1. Log in to your Hostinger control panel.
2. Go to **File Manager** (or use FTP/SSH).
3. Upload the **contents** of `dist/` to your public root (e.g., `public_html/`).

> Make sure you upload the _contents_ of `dist/`, not the folder itself.

### 3. Set environment variables at build time

If you are building locally, set `VITE_API_BASE_URL` in `.env` before running `npm run build`.

If you use Hostinger's CI/CD or a build pipeline, add the variable as an environment secret in that system.

---

## SPA Routing / Deep-Link Fallback

Because this is a single-page application, deep routes like `/e/:eventCode` are handled client-side. When a user navigates directly to such a URL (e.g., by scanning a QR code), the server must serve `index.html` instead of returning a 404.

### Apache (`.htaccess`)

Create a `.htaccess` file in your `public_html/` directory:

```apache
Options -MultiViews
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteRule ^ index.html [QSA,L]
```

Hostinger shared hosting uses Apache, so this is the recommended approach. The file is **not** included in the build output automatically — you need to add it manually to `public_html/` after deployment (or include it in the `public/` folder of this project so Vite copies it to `dist/` on build).

#### Tip — include `.htaccess` in the build

Place the file at `public/.htaccess` in this repository. Vite will copy everything in `public/` verbatim to `dist/` during build.

---

## Backend API Contract

The frontend expects the following HTTP endpoint on the server pointed to by `VITE_API_BASE_URL`.

### Upload a photo

```
POST /events/:eventCode/photos
Content-Type: multipart/form-data
```

| Field   | Type | Description                    |
| ------- | ---- | ------------------------------ |
| `photo` | File | The image file being uploaded. |

#### Success response

```
HTTP 200 OK (or 201 Created)
Content-Type: application/json

{ "message": "Photo uploaded successfully." }
```

#### Error response

```
HTTP 4xx / 5xx
Content-Type: application/json

{ "message": "Human-readable error description." }
```

The frontend displays the `message` field from error responses. Any non-2xx status code is treated as a failure.
