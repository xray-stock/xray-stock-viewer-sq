import React, { useState } from 'react';
import { SignJWT } from 'jose';
import {
  TextField,
  Select,
  MenuItem,
  Button,
  Box,
  FormControl,
  InputLabel,
  Alert,
  Typography,
  Card,
  CardContent,
  Divider
} from '@mui/material';
import { Key, Security, ContentCopy } from '@mui/icons-material';

interface JWTGeneratorProps {
  jwt: string;
  setJwt: (jwt: string) => void;
}

const JWTGenerator: React.FC<JWTGeneratorProps> = ({ jwt, setJwt }) => {
  const [secret, setSecret] = useState('change-me-jwt-secret-aabbccddeeff11223344556677889900aabbccddeeff1122');
  const [alg, setAlg] = useState<'HS256' | 'HS384' | 'HS512'>('HS256');
  const [user, setUser] = useState('testuser');
  const [exp, setExp] = useState('2099-12-31');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const makeJWT = async () => {
    if (!secret || !user || !exp) {
      setError('Secret, user, 만료일 모두 입력해야 합니다!');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const expTime = Math.floor(new Date(exp + 'T23:59:59Z').getTime() / 1000);
      const iat = Math.floor(Date.now() / 1000);
      const payload = { user, exp: expTime, iat };
      const encoder = new TextEncoder();
      const key = encoder.encode(secret);
      const jwt = await new SignJWT(payload)
        .setProtectedHeader({ alg })
        .sign(key);
      setJwt(jwt);
    } catch (e) {
      setError('JWT 생성 실패: ' + e);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (jwt) {
      navigator.clipboard.writeText(jwt);
    }
  };

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <TextField
          fullWidth
          label="Secret Key"
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
          variant="outlined"
          size="small"
        />
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <FormControl fullWidth size="small">
            <InputLabel>Algorithm</InputLabel>
            <Select
              value={alg}
              label="Algorithm"
              onChange={(e) => setAlg(e.target.value as 'HS256' | 'HS384' | 'HS512')}
            >
              <MenuItem value="HS256">HS256</MenuItem>
              <MenuItem value="HS384">HS384</MenuItem>
              <MenuItem value="HS512">HS512</MenuItem>
            </Select>
          </FormControl>
          
          <TextField
            fullWidth
            label="User ID"
            value={user}
            onChange={(e) => setUser(e.target.value)}
            variant="outlined"
            size="small"
          />
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            fullWidth
            label="만료일"
            type="date"
            value={exp}
            onChange={(e) => setExp(e.target.value)}
            variant="outlined"
            size="small"
            InputLabelProps={{ shrink: true }}
          />
          
          <Button
            fullWidth
            variant="contained"
            onClick={makeJWT}
            disabled={loading}
            startIcon={<Security />}
            sx={{ height: 40 }}
          >
            {loading ? '생성 중...' : 'JWT 생성'}
          </Button>
        </Box>
      </Box>

      {jwt && (
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Key color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6" component="h3">
                생성된 JWT Token
              </Typography>
            </Box>
            <Divider sx={{ mb: 2 }} />
            <TextField
              fullWidth
              multiline
              rows={3}
              value={jwt}
              variant="outlined"
              size="small"
              InputProps={{
                readOnly: true,
                endAdornment: (
                  <Button
                    onClick={copyToClipboard}
                    startIcon={<ContentCopy />}
                    size="small"
                  >
                    복사
                  </Button>
                ),
              }}
            />
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default JWTGenerator; 