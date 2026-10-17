// Entorno ficticio para las pruebas e2e: no son credenciales reales. Se asigna sin condiciones
// porque las variables del proceso tienen prioridad sobre el `.env` local, y así las pruebas
// son deterministas aunque el equipo tenga un `.env` propio.
Object.assign(process.env, {
  DB_HOST: 'localhost',
  // Puerto sin servicio: ninguna prueba debe poder conectarse a una base de datos real.
  DB_PORT: '1',
  DB_NAME: 'test_db',
  DB_USER: 'test_user',
  DB_PASSWORD: 'test-only-password',
  JWT_SECRET: 'test-only-jwt-secret',
  JWT_EXPIRES_IN: '15m',
  PORT: '3000',
});
