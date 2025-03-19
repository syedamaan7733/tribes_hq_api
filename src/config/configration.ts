export default () => ({
    port: Number(process.env.PORT) || 3000,
    database: {
      uri: process.env.MONGODB_URI || 'mongodb://localhost/auth-app',
    },
    jwt: {
      secret: process.env.JWT_SECRET || 'super-secret-jwt-key',
      expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    },
  });