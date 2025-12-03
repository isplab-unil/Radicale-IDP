# QUICKSTART Guide

This guide explains the key features and customization options for the Radicale IDP privacy web application.

## Table of Contents

- [Accessing the Application](#accessing-the-application)
- [Environment Variables](#environment-variables)
- [Adding Default User Data](#adding-default-user-data)
- [Redeploying and Updating](#redeploying-and-updating)
- [Template Versions](#template-versions)
- [Disclaimer Box](#disclaimer-box)
- [Changing Text & Translations](#changing-text--translations)

---

## Accessing the Application

Once the Docker Compose deployment is running, you can access the services at:

- **Privacy Web Interface:** `http://YOUR_DOMAIN/`
- **Radicale Server:** `http://YOUR_DOMAIN/radicale/`

Replace `YOUR_DOMAIN` with your configured domain name.

---

## Environment Variables

Environment variables control how the application runs.

### Production Deployment (Docker Compose)

For production deployment using Docker Compose (recommended), environment variables are set in the **`.env` file at the root of the project** (not in the `web` directory).

### How to Update Environment Variables

1. Open the `.env` file **in the root directory** (same directory as `docker-compose.yml`)
2. Find the variable you want to change
3. Update the value (keep it on the same line)
4. Save the file
5. Restart the Docker containers for changes to take effect:
   ```bash
   docker-compose restart
   ```

> **Note:** The `web/.env` file exists for local development only (running the web app without Docker). For production with Docker Compose, always use the root `.env` file.

### Available Variables

| Variable                | Purpose                                                        | Example Value               |
| ----------------------- | -------------------------------------------------------------- | --------------------------- |
| `DB_FILE_NAME`          | Database file name                                             | `local.db`                  |
| `JWT_SECRET`            | Secret key for login tokens (⚠️ **must be unique and secure**) | Long random string          |
| `AWS_ACCESS_KEY_ID`     | AWS credentials for email                                      | From AWS account            |
| `AWS_SECRET_ACCESS_KEY` | AWS credentials for email                                      | From AWS account            |
| `AWS_REGION`            | AWS region                                                     | `us-east-1`, `eu-west-1`    |
| `EMAIL_FROM`            | Sender email address                                           | `noreply@example.com`       |
| `EMAIL_FROM_NAME`       | Sender friendly name                                           | `Contact Management System` |
| `RADICALE_URL`          | Radicale contact system URL                                    | `http://localhost:5232`     |
| `RADICALE_TOKEN`        | Radicale authentication token                                  | Token from Radicale admin   |
| `MOCK_SMS`              | Simulate SMS (for testing)                                     | `true` or `false`           |
| `MOCK_EMAIL`            | Simulate email (for testing)                                   | `true` or `false`           |
| `ENABLE_TEMPLATES`      | Enable template switching                                      | `true` or `false`           |
| `DEFAULT_TEMPLATE`      | Default template version                                       | `a`, `b`, `c`, or `d`       |

> **Note:** When `MOCK_SMS` or `MOCK_EMAIL` is set to `true`, the OTP (one-time password) will be displayed directly on the login page instead of being sent via SMS or email. This is useful for testing and development without requiring AWS credentials.

---

## Adding Default User Data

You can pre-populate the Radicale server with user data (contacts, calendars) that will be automatically loaded when the Docker container starts for the first time.

### How It Works

The system looks for user data in the `default-data/` directory at the project root. When the Radicale container starts:

1. It checks if any data already exists in the persistent volume
2. If the volume is empty (first run), it loads data from `default-data/`
3. Each user is created with the password specified in `DEFAULT_USER_PASSWORD` environment variable

### Supported Formats

The system supports two formats for default data:

1. **Directories** (recommended for development):
   ```
   default-data/
   ├── user1@example.com/
   │   └── addressbook/
   │       └── contact1.vcf
   └── user2@example.com/
       ├── addressbook/
       │   └── contact1.vcf
       └── calendar/
           └── event1.ics
   ```

2. **Zip files** (for pre-packaged distributions):
   ```
   default-data/
   ├── user1@example.com.zip
   └── user2@example.com.zip
   ```

### Adding a New User

1. Create a directory in `default-data/` with the user's email address as the name:
   ```bash
   mkdir -p default-data/newuser@example.com/addressbook
   ```

2. Add contact files (`.vcf`) to the `addressbook/` directory:
   ```bash
   cp mycontact.vcf default-data/newuser@example.com/addressbook/
   ```

3. Set the default password in your `.env` file:
   ```bash
   DEFAULT_USER_PASSWORD=YourSecurePassword123
   ```

4. **Important:** Remove any existing Docker volumes to reload the data:
   ```bash
   docker-compose down -v
   docker-compose up -d
   ```

   > ⚠️ **WARNING:** The `-v` flag will delete ALL volume data, including:
   > - All existing user collections (contacts, calendars)
   > - The privacy database (all privacy settings and logs)
   > - The web application database (user sessions, verification codes)
   > 
   > **Make a backup before removing volumes if you need to preserve this data!**
   > 
   > To backup your data:
   > ```bash
   > # Backup Radicale data (collections and privacy database)
   > docker cp radicale-idp-server:/var/lib/radicale ./backup-radicale
   > 
   > # Backup web app database
   > docker cp radicale-idp-web:/data ./backup-web
   > ```

### Security Considerations

- ⚠️ **The `DEFAULT_USER_PASSWORD` applies to ALL users** created from `default-data/`
- Change this password BEFORE deploying to production
- The default password `password` is INSECURE and only for local development
- Avoid shell special characters (!, $, `, \, ", ') in passwords
- Generate a strong password: `openssl rand -base64 16 | tr -d '/+='`

---

## Redeploying and Updating

When you need to update your deployment to the latest version or apply configuration changes, follow these steps:

### Standard Redeployment Process

1. **Pull the latest changes from the repository:**
   ```bash
   git pull
   ```

2. **(Optional) Update environment variables if needed:**
   - Edit the `.env` file in the root directory
   - Update any configuration values as needed
   - Save the file

3. **Stop the current containers:**
   ```bash
   podman compose down
   ```

   Or if using Docker:
   ```bash
   docker-compose down
   ```

4. **Rebuild and start the containers:**
   ```bash
   podman compose up --build -d
   ```

   Or if using Docker:
   ```bash
   docker-compose up --build -d
   ```

The `--build` flag ensures that Docker/Podman rebuilds the images with the latest code changes, and `-d` runs the containers in detached mode (in the background).

### When to Redeploy

You should redeploy when:

- There are new code updates in the repository
- You've changed environment variables in the `.env` file
- You've updated configuration files (e.g., `config/radicale.config`)
- You've modified nginx configuration or SSL settings
- You've updated translation files or web assets

### Preserving Data During Redeployment

The standard redeployment process (`podman compose down` without the `-v` flag) **preserves all your data**:

- User collections (contacts, calendars) are kept
- Privacy database and logs are kept
- Web application database is kept

Only use `podman compose down -v` if you intentionally want to delete all data and start fresh (see the warning in the [Adding Default User Data](#adding-default-user-data) section).

---

## Template Versions

The application supports multiple template versions for A/B testing or running different configurations:

```
https://yoursite.com/?v=a
```

**How it works:**

- Templates are enabled/disabled via environment variables
- When enabled, users can switch between versions: `a`, `b`, `c`, or `d`
- The selected version is remembered as users navigate through the site
- The default version is set in environment variables

**Use cases:**

- Test different designs or content with different user groups
- Run experiments to see which template performs better
- Customize the experience for different organizational units

**Example:**

- Standard version: `https://contact.example.com/?v=a`
- Alternative version: `https://contact.example.com/?v=b`

---

## Disclaimer Box

Show a warning message on the login page to inform users not to enter real information:

```
https://yoursite.com/login?disclaimer=true
```

**What it does:** Displays a red warning box at the top of the login page that says "Disclaimer — Do not enter your real information"

**Use case:** When you want to set up a test or demo environment and need to warn users that this isn't the real system.

**Example:**

- Production login: `https://contact.example.com/login`
- Test login: `https://test.contact.example.com/login?disclaimer=true`

---

## Changing Text, Icons & Translations

All text and icons displayed in the application are stored in the translation JSON file. You can customize any message or icon by editing the file.

### File Location

```
app/i18n/locales/en.json
```

### How to Edit

1. Open the `en.json` file in a text editor
2. Find the text or icon you want to change
3. Update the value between the quotation marks
4. Save the file
5. Refresh your browser to see the changes

### Editing Text

Simply find the text you want to change and update the value. For example, to change the login title, find `login.title` and update its value.

### Editing Icons

Icons are stored directly in the JSON file as text values. They use icon names from the Lucide icon library. For example, `"logoutIcon": "log-out"` displays a logout icon. To change it to a power icon, change it to `"logoutIcon": "power"`.

### Finding Icon Names

1. Visit https://lucide.dev/icons/
2. Search for the icon you want (example: "home", "settings", "trash", "power")
3. Click the icon to copy its name
4. Paste that name in the JSON file as the icon value

### Common Icon Names

- `home` - Home icon
- `mail` - Email/Mail icon
- `phone` - Phone icon
- `users` - People icon
- `trash` - Delete icon
- `settings` - Settings/gear icon
- `log-out` - Logout icon (door with arrow)
- `power` - Power button
- `arrow-right` - Right arrow
- `check` - Checkmark
- `ellipsis` - Three dots menu

### Common Text & Icon Locations in en.json

| What to Change     | Location                         | Type | Example                                |
| ------------------ | -------------------------------- | ---- | -------------------------------------- |
| Home page title    | `home.title`                     | Text | "Take control of your privacy"         |
| Login instructions | `login.description`              | Text | "Enter your email address..."          |
| Button labels      | `home.preferences.button`        | Text | "Set Your Subject Data Preferences"    |
| Error messages     | `login.errorSendingCode`         | Text | "Failed to send verification code."    |
| Disclaimer message | `login.disclaimer`               | Text | "Do not enter your real information"   |
| Back button label  | `navigation.backToDashboard`     | Text | "Back to Dashboard"                    |
| Back button icon   | `navigation.backToDashboardIcon` | Icon | "home"                                 |
| Logout label       | `navigation.logout`              | Text | "Logout"                               |
| Logout icon        | `navigation.logoutIcon`          | Icon | "log-out"                              |
| Field icon         | `access.fromIcon`                | Icon | "mail"                                 |
| Footer links       | `footer.*`                       | Text | "Privacy Policy", "Terms & Conditions" |

---

## Need Help?

- **JSON Validation:** Use https://jsonlint.com/ to check if your en.json file is valid
- **Icon Search:** https://lucide.dev/icons/ for finding the right icon name
- **Color Customization:** The app uses Tailwind CSS color names (red-50, red-900, etc.)
