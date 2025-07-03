export default {
    salt: process.env.SSO_SALT || '112233',
    bcrypt_rounds: parseInt(process.env.SSO_BCRYPT_ROUNDS || '10'),
    app_id: process.env.SSO_APP_ID || '7913b18c-e3f2-4d40-8b6b-b0239c98fef6',
    frontend_url: process.env.SSO_FRONTEND_URL || 'http://localhost:9101',
}