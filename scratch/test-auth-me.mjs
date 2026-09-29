import jwt from 'jsonwebtoken';

const JWT_SECRET = 'super-secret-gym-key-12345';
const sampleToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MiwidXNlcm5hbWUiOiJ0ZXN0ZSIsImZpcnN0X25hbWUiOiIiLCJsYXN0X25hbWUiOiIiLCJlbWFpbCI6IiIsImlzX3N0YWZmIjp0cnVlLCJpc19zdXBlcnVzZXIiOnRydWUsInBob3RvX2Jhc2U2NCI6bnVsbCwid2hhdHNhcHAiOm51bGwsImlhdCI6MTc5MDYyMzcwMCwiZXhwIjoxODIyMTU5NzAwfQ.DfcX27B_36N4GY8p_n3RyAT9BISNSegTSmdYH7SxnD0';

console.log('--- TESTING AUTH ME LOCAL CPU EXECUTION TIME ---');
const t0 = performance.now();
for (let i = 0; i < 1000; i++) {
  jwt.decode(sampleToken);
}
const t1 = performance.now();
console.log(`1000 JWT decodes total CPU time: ${(t1 - t0).toFixed(2)} ms (Average per decode: ${((t1 - t0) / 1000).toFixed(4)} ms)`);
