import sql from 'mssql';

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  // 서버 주소가 제대로 안 들어오면 로컬 호스트를 기본값으로 사용
  server: process.env.DB_SERVER || '127.0.0.1', 
  database: process.env.DB_DATABASE,
  port: 1433, 
  options: {
    // 로컬 MSSQL은 SSL 설정을 안 하는 경우가 많으므로 false 권장
    encrypt: false, 
    trustServerCertificate: true,
  },
};

console.log(`Connecting to MSSQL: ${config.server} / DB: ${config.database}`)

export const poolPromise = new sql.ConnectionPool(config)
                                    .connect()
                                    .then((pool) => {
                                        console.log('✅ Connected to MSSQL successfully');
                                        return pool;
                                    })
                                    .catch((err) => {
                                        console.error('❌ Database Connection Failed!', err.message);
                                        console.dir(err);
                                        throw err;
                                    })