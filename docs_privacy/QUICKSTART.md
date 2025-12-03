# QUICKSTART Guide

This guide explains the key features and customization options for the Radicale IDP web application.

## Table of Contents

- [Environment Variables](#environment-variables)
- [Template Versions](#template-versions)
- [Disclaimer Box](#disclaimer-box)
- [Changing Text & Translations](#changing-text--translations)

---

## Environment Variables

Environment variables control how the application runs. They're set in the `.env` file in the web directory.

### How to Update Environment Variables

1. Open the `.env` file in the `web` directory
2. Find the variable you want to change
3. Update the value (keep it on the same line)
4. Save the file
5. Restart the application for changes to take effect

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
- To combine both: `https://contact.example.com/login?disclaimer=true&v=b`

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
