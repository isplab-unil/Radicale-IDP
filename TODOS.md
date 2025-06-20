# Inter-dependent Privacy in Radicale

## Technical Architecture

### Server-Side Components (ownership: Rémy)
- Extend Radicale's core functionality to implement privacy-aware contact management
- Develop RESTful HTTP APIs to expose privacy management features
- Integrate with the existing CardDAV protocol stack while maintaining compatibility
- Implement server-side hashing algorithms for identity protection
- Store privacy preferences in a structured format with appropriate access controls

### Client Components (ownership: Bertil)
- **Web Interface**: Develop a React-based single-page application that communicates with Radicale's HTTP APIs
- **Desktop Integration**: Ensure compatibility with Thunderbird as the primary desktop client for vCards

## User Stories

### External User Authentication

- As an external user, I want to authenticate to Radicale without creating a regular account:
  - I will provide my email or phone number in a form
  - The server will send me a one-time password (OTP)
  - I will enter the OTP in a form
  - I will then be authenticated

### Privacy Settings Management

- As an authenticated external user, I want to manage my privacy settings:
  - I want to control which personal information others can store about me (e.g., company, job title, photo, birthday, address)
  - Note: Name, email, and phone number are considered public information and cannot be restricted
  - Radicale needs an API to save privacy settings for authenticated external users
  - Privacy settings should be stored in a database to ease statistics. A single SQLite on the filesystem can be used (see SQLAlchemy ORM).
  - The identifier (email or phone number) does not need to be hashed nor salted for the user settings. Privacy is not a critical for these fields and we care about not losing data.
  - **Question**: Should we support multiple identifiers per user?
    - One identity linked to one settings profile
    - Multiple identities (email/phone) linked to one settings profile
    - Enable users to associate additional emails and phone numbers to their existing settings
    **Answer**: We will use a 1:1 relation between identity and settings. When we have multiple policies for many cards, the most restrictive should be applied. The policies are applied field by field.

### Personal Information Disclosure

- As an authenticated external user, I want to view what information has been stored about me on the Radicale server:
  - Implement viewing formats according to the mockups
  - First implement full disclosure format, then develop aggregated formats
  - This feature requires scanning and reading all vCard files stored on the Radicale server

### Personal Information Control

- As an authenticated external user, I want to clean or modify cards containing my information based on my privacy settings:
  - This feature requires scanning and modifying all vCard files stored on the Radicale server that contain my information
  - Scanning should also be done when syncronizing the client data with the server data (uploading of data).

### Privacy Enforcement

- As a regular user saving contact information, the Radicale server should enforce others' privacy preferences:
  - The server should prevent me from saving information that others have marked as private
  - Investigate the CardDAV protocol to determine appropriate HTTP error responses (e.g., 400 Bad Request, 403 Forbidden, 406 Not Acceptable) when privacy violations occur


## Implementation Notes

- Module `/radicale/storage/multifilesystem/upload.py` is responsible for saving vCard files (VCF) to the filesystem
- Privacy rules enforcement should intercept the card saving process before it reaches the filesystem
- User identification through email/phone should use cryptographic hashing with appropriate salt
- Performance considerations needed for scanning large contact databases

## MVP Implementation Plan

### Phase 0: Create a dataset of cards for testing and validation ✅

### Phase 1: Basic Authentication & Privacy Settings

1. **Simple OTP Authentication** ✅
   - Create a basic OTP-based authentication using Twilio in `radicale/auth/otp_twilio.py`
   - Implement a simple OTP generation and validation mechanism
   - Use email and SMS for OTP delivery
   - Store temporary authentication tokens in a simple file-based system

2. **Basic Privacy Settings Storage** ✅
   - Set up SQLite database with SQLAlchemy ORM
   - Create UserSettings model with all privacy fields
   - Add configuration options in `radicale/config.py` for database path and default settings
   - Implement PrivacyDatabase class with CRUD operations
   - Write unit tests for database operations
   - Support a fixed set of vCard fields that can be marked as private:
     - name, email, phone, company, title, photo, birthday, address
   - Use 1:1 relation between identity and settings

### Phase 2: VCF Processing & Privacy Enforcement

1. **VCF Interception** ✅
   - Modify `radicale/storage/multifilesystem/upload.py` to intercept vCard uploads
   - Add a pre-processing step that checks vCards against privacy rules
   - For the MVP, focus on the most common vCard fields (name, email, phone, company, etc.)
   - Implement simple field validation based on privacy settings
   - Apply most restrictive policy when multiple cards exist

2. **Simple Query Functionality** ✅
   - Create a basic function to scan vCards for a given identity
   - For MVP, focus on exact matches rather than fuzzy matching
   - Implement minimal indexing based on email/phone properties

3. **Basic Privacy Enforcement** ✅
   - Implement filtering of vCard fields based on privacy settings
   - Remove or mask private fields before saving to storage
   - Return filtered vCard to the client
   - For MVP, use HTTP 200 (OK) with filtered content
   - Add logging for privacy filtering actions

4. **Privacy Settings Update Handling** ✅
   - Add functionality to reprocess all existing vCards when user privacy settings change
   - Add logging for bulk update operations
   - Add an API endpoint to trigger the privacy settings update process


### Phase 3: Information Disclosure

1. **Basic Disclosure API** ✅
   - Create a simple endpoint to retrieve information about the authenticated user
   - Return a list of vCards and fields that match the user's identity
   - Use basic authentication to protect the API

2. **Simple Privacy Dashboard** ❌
   - Create a minimal dashboard showing what information is stored about the user
   - Implement a basic interface to view cards containing user's information
   - Add simple controls to modify privacy settings

### Phase 4: Testing with Real Clients

1. **Thunderbird Compatibility** ❌
   - Test the MVP with Thunderbird to ensure basic compatibility
   - Document any issues or limitations
   - Focus on ensuring core functionality works rather than perfect integration

2. **Basic Documentation** ✅
   - Create minimal documentation explaining how to use the privacy features
   - Document API endpoints and expected responses
   - Include setup instructions for testing purposes

# Phase 5 Upgrade Authentication Flow to JWT-based OTP

1. **CORS Handling** ✅
   - Ensure all relevant endpoints (especially `/privacy/settings/{user}`) handle CORS preflight (OPTIONS) requests.
   - For all responses (including errors), add:
     - `Access-Control-Allow-Origin: *`
     - `Access-Control-Allow-Methods: *`
     - (Optionally) `Access-Control-Allow-Headers: Content-Type, Authorization`
     - (Optionally) `Access-Control-Expose-Headers: Authorization`

2. **OTP Generation and Initial Login** ✅
   - On `GET /privacy/settings/{user}`:
     - If no password (or password is empty), treat as OTP request.
     - Generate and send OTP to the user (email or phone).
     - Respond with `401 Unauthorized` and CORS headers.

3. **OTP Verification and JWT Issuance** ✅
   - On `GET /privacy/settings/{user}` with password (OTP code):
     - Validate the OTP for the user.
     - If valid:
       - Generate a JWT (payload: user identifier, iat, exp=1h).
       - Return `200 OK` with the JWT in the `Authorization: Bearer <jwt>` response header (and CORS headers).
     - If invalid:
       - Respond with `401 Unauthorized` and CORS headers.

4. **JWT Authentication for Subsequent Requests** ✅
   - For all protected endpoints (GET/POST/PUT/DELETE on `/privacy/settings/{user}` and similar):
     - Require `Authorization: Bearer <jwt>` header.
     - Validate the JWT (signature, expiry, user).
     - If valid, allow access.
     - If invalid/expired, respond with `401 Unauthorized` and CORS headers.

5. **Remove Old Session System and Logout** ✅
   - Remove all code related to the previous session token system (in-memory session storage, session token headers, etc).
   - Remove the `/logout` endpoint entirely.
   - All authentication state is now JWT-based and stateless.

6. **Testing and Documentation** ✅
   - Update or add tests for:
     - OTP generation and delivery.
     - JWT issuance and validation.
     - CORS headers on all relevant responses.
   - Update documentation to reflect the new flow and removal of `/logout`.

### Comments

We should first implement the features as utilities in python and validate them with unit test.
Then, these utilities will be exposed through an HTTP api.



---