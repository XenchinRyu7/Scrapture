# Security Policy

## Supported Versions

Currently being supported with security updates:

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

## Reporting a Vulnerability

We take the security of Scrapture seriously. If you believe you have found a security vulnerability, please report it to us responsibly.

### How to Report

**Please do NOT report security vulnerabilities through public GitHub issues.**

Instead, please report them via:

1. **GitHub Security Advisories** (Preferred)
   - Go to the Security tab of this repository
   - Click "Report a vulnerability"
   - Fill out the form with details

2. **Email**
   - Contact the maintainers directly via GitHub

### What to Include

Please include as much of the following information as possible:

- Type of vulnerability
- Full paths of source file(s) related to the vulnerability
- Location of the affected source code (tag/branch/commit or direct URL)
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if available)
- Impact of the vulnerability
- Any potential mitigations you've identified

### What to Expect

- **Acknowledgment**: We'll acknowledge receipt of your vulnerability report within 48 hours
- **Updates**: We'll send you regular updates about our progress
- **Disclosure**: We'll work with you to understand and resolve the issue before any public disclosure
- **Credit**: We'll credit you in the security advisory (unless you prefer to remain anonymous)

## Security Best Practices

When using Scrapture:

### General Security

- **Keep dependencies updated**: Regularly run `npm audit` and update dependencies
- **Use environment variables**: Never commit sensitive data (API keys, credentials) to the repository
- **Secure Redis**: Always password-protect your Redis instance in production
- **Database security**: Use proper database permissions and secure connection strings
- **Rate limiting**: Configure appropriate rate limits to prevent abuse

### Docker Security

- **Don't run as root**: The provided Docker configuration uses non-root users
- **Keep images updated**: Regularly rebuild images to get security updates
- **Secure networks**: Use Docker networks to isolate services
- **Secret management**: Use Docker secrets or environment files (not committed to git)

### Web Scraping Ethics

- **Respect robots.txt**: Enable `respectRobots` option
- **Rate limiting**: Use appropriate delays between requests
- **Terms of Service**: Only scrape websites where permitted
- **Personal data**: Handle scraped data responsibly and in compliance with privacy laws

## Known Security Considerations

### Playwright/Chromium

- Scrapture uses Playwright which runs Chromium in headless mode
- Ensure you're running the latest version to get security patches
- Be cautious when scraping untrusted websites

### API Endpoints

- All API endpoints should be protected in production environments
- Consider implementing authentication/authorization
- Use HTTPS in production

### Data Storage

- Scraped data may contain sensitive information
- Implement proper access controls to your database
- Consider data retention policies

## Security Updates

We will publish security advisories for:

- Critical vulnerabilities
- High-severity issues affecting multiple users
- Any vulnerability that requires immediate action

Security updates will be released as patch versions (e.g., 0.1.1 → 0.1.2).

## Responsible Disclosure Timeline

- **Day 0**: Vulnerability reported to maintainers
- **Day 1-2**: Maintainers acknowledge receipt
- **Day 3-14**: Maintainers investigate and develop fix
- **Day 14-30**: Fix is tested and released
- **Day 30+**: Public disclosure (coordinated with reporter)

We appreciate your efforts to responsibly disclose your findings and will make every effort to acknowledge your contributions.

## License

By reporting a vulnerability, you agree that your report and any associated data may be used to improve the security of this project.
