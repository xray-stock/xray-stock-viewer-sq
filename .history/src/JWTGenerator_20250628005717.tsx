import React, { useState } from 'react';
import { KJUR } from 'jsrsasign';

interface JWTGeneratorProps {
  jwt: string;
  setJwt: (jwt: string) => void;
}

const JWTGenerator: React.FC<JWTGeneratorProps> = ({ jwt, setJwt }) => {
  const [secret, setSecret] = useState('change-me-jwt-secret-aabbccddeeff11223344556677889900aabbccddeeff1122');
  const [alg, setAlg] = useState('HS256');
  const [user, setUser] = useState('testuser');
  const [exp, setExp] = useState('2099-12-31');

  const makeJWT = () => {
    if (!secret || !user || !exp) {
      alert('Secret, user, 만료일 모두 입력해야 합니다!');
      return;
    }
    try {
      const expTime = Math.floor(new Date(exp + 'T23:59:59Z').getTime() / 1000);
      const iat = Math.floor(Date.now() / 1000);
      const payload = { user, exp: expTime, iat };
      const header = { alg, typ: 'JWT' };
      const sHeader = JSON.stringify(header);
      const sPayload = JSON.stringify(payload);
      const token = KJUR.jws.JWS.sign(alg, sHeader, sPayload, { utf8: secret });
      setJwt(token);
    } catch (e) {
      alert('JWT 생성 실패: ' + e);
    }
  };

  return (
    <div style={{ background: '#e0e7ef', padding: '1rem', borderRadius: 7, marginBottom: '1rem' }}>
      <div style={{ marginBottom: '0.7rem' }}>
        <label>Secret Key:</label><br />
        <input type="text" value={secret} onChange={e => setSecret(e.target.value)} size={60} />
      </div>
      <div style={{ marginBottom: '0.7rem' }}>
        <label>Algorithm:</label>
        <select value={alg} onChange={e => setAlg(e.target.value)}>
          <option value="HS256">HS256</option>
          <option value="HS384">HS384</option>
          <option value="HS512">HS512</option>
        </select>
      </div>
      <div style={{ marginBottom: '0.7rem' }}>
        <label>Payload (user):</label>
        <input type="text" value={user} onChange={e => setUser(e.target.value)} />
        <label style={{ marginLeft: 10 }}>만료일(YYYY-MM-DD):</label>
        <input type="date" value={exp} onChange={e => setExp(e.target.value)} />
      </div>
      <button onClick={makeJWT}>JWT 생성</button>
      <div style={{ marginTop: '0.7rem' }}>
        <label>JWT Token:</label><br />
        <input type="text" value={jwt} size={100} readOnly />
      </div>
    </div>
  );
};

export default JWTGenerator; 