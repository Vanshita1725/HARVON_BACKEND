# Authentication API - Registration with File Upload

## Updated Registration Endpoint (Form-Data with File Upload)

### Method: POST
### URL: `http://localhost:3000/api/auth/register`

---

## Request Format: Form-Data (Multipart)

### Fields:
- **name** (text) - User's full name [required]
- **email** (text) - User's email address [required]
- **password** (text) - User's password (min 6 chars) [required]
- **phoneNumber** (text) - User's phone number [optional]
- **profilePhoto** (file) - Image file (.jpg, .png, .gif, .webp) [optional, max 5MB]

### Success Response (201 Created)
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY1Njc4OTEyMzQ1Njc4OTAiLCJpYXQiOjE3MDEyNDU2MzIsImV4cCI6MTcwMTg1MDQzMn0.abcdefghijklmnopqrstuvwxyz",
  "message": "User registered successfully",
  "user": {
    "id": "656789123456789012",
    "name": "John Doe",
    "email": "john@example.com",
    "phoneNumber": "1234567890",
    "profilePhoto": "/uploads/profilePhoto-1701245632123-456789.jpg"
  }
}
```

### Error Response (400 Bad Request - Invalid File Type)
```json
{
  "success": false,
  "message": "Only image files are allowed (jpeg, png, gif, webp)"
}
```

### Error Response (400 Bad Request - File Too Large)
```json
{
  "success": false,
  "message": "File size exceeds 5MB limit"
}
```

### Error Response (400 Bad Request - Missing Required Fields)
```json
{
  "success": false,
  "message": "Please provide an email and password"
}
```

### Error Response (400 Bad Request - User Already Exists)
```json
{
  "success": false,
  "message": "User already exists"
}
```

---

## Postman Testing

### Steps:

1. **Create New Request**
   - Method: **POST**
   - URL: `http://localhost:3000/api/auth/register`

2. **Go to Body Tab**
   - Select **form-data** (NOT raw, NOT x-www-form-urlencoded)

3. **Add Form Fields** (in this order):
   | Key | Type | Value |
   | --- | ---- | ----- |
   | name | text | John Doe |
   | email | text | john@example.com |
   | password | text | password123 |
   | phoneNumber | text | 1234567890 |
   | profilePhoto | file | (Select your image file) |

4. **Click Send**

### Result:
You'll get a 201 response with the user data and profilePhoto path like `/uploads/profilePhoto-1701245632123-456789.jpg`

### Accessing Uploaded Image:
```
http://localhost:3000/uploads/profilePhoto-1701245632123-456789.jpg
```

---

## PowerShell Testing

### Register with Image File:
```powershell
$filePath = "C:\path\to\your\image.jpg"
$form = @{
    name = "John Doe"
    email = "john@example.com"
    password = "password123"
    phoneNumber = "1234567890"
    profilePhoto = Get-Item -Path $filePath
}

Invoke-RestMethod -Method Post -Uri http://localhost:3000/api/auth/register -Form $form
```

### Register without Image:
```powershell
$form = @{
    name = "Jane Doe"
    email = "jane@example.com"
    password = "password456"
    phoneNumber = "9876543210"
}

Invoke-RestMethod -Method Post -Uri http://localhost:3000/api/auth/register -Form $form
```

---

## cURL Testing

### Register with Image File:
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -F "name=John Doe" \
  -F "email=john@example.com" \
  -F "password=password123" \
  -F "phoneNumber=1234567890" \
  -F "profilePhoto=@/path/to/image.jpg"
```

### Register without Image:
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -F "name=Jane Doe" \
  -F "email=jane@example.com" \
  -F "password=password456" \
  -F "phoneNumber=9876543210"
```

---

## File Upload Constraints

- **Max File Size:** 5 MB
- **Allowed Formats:** JPEG, PNG, GIF, WebP
- **Storage:** `/uploads` folder (accessible via `/uploads/<filename>`)
- **Filename Format:** `profilePhoto-{timestamp}-{random}.{ext}`

---

## Login (No Changes)

### Method: POST
### URL: `http://localhost:3000/api/auth/login`

### Request (JSON):
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

### Success Response (200 OK):
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY1Njc4OTEyMzQ1Njc4OTAiLCJpYXQiOjE3MDEyNDU2MzIsImV4cCI6MTcwMTg1MDQzMn0.abcdefghijklmnopqrstuvwxyz",
  "message": "Login successful",
  "user": {
    "id": "656789123456789012",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

---

## Get Current User (No Changes)

### Method: GET
### URL: `http://localhost:3000/api/auth/me`

### Headers:
```
Authorization: Bearer YOUR_TOKEN_HERE
```

### Success Response (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "656789123456789012",
    "name": "John Doe",
    "email": "john@example.com",
    "phoneNumber": "1234567890",
    "profilePhoto": "/uploads/profilePhoto-1701245632123-456789.jpg",
    "createdAt": "2023-12-01T10:30:45.123Z"
  }
}
```

---

## Key Changes from Previous Version

1. **Registration now uses Form-Data** instead of JSON
2. **File upload support** via `profilePhoto` field
3. **Image files stored locally** in `/uploads` folder
4. **Automatic file validation** (type and size)
5. **Accessible via `/uploads/<filename>`** URL
6. **phoneNumber added to response** in registration
