import sql from 'mssql';

const config = {
    user:     process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server:   process.env.DB_SERVER || '127.0.0.1',
    database: process.env.DB_DATABASE,
    port:     process.env.DB_SERVER_PORT ? parseInt(process.env.DB_SERVER_PORT) : 1433,
    options:  { encrypt: false, trustServerCertificate: true },
};

export const poolPromise = new sql.ConnectionPool(config).connect();
export { sql };
