import React, { useState } from 'react';
import { 
  Container, 
  Paper, 
  Typography, 
  Box, 
  CssBaseline, 
  ThemeProvider, 
  createTheme,
  AppBar,
  Toolbar
} from '@mui/material';
import { Security, Wifi } from '@mui/icons-material';
import JWTGenerator from './JWTGenerator';
import SocketConnectionPanel from './SocketConnectionPanel';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  const [jwt, setJwt] = useState('');

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ flexGrow: 1 }}>
        <AppBar position="static">
          <Toolbar>
            <Security sx={{ mr: 2 }} />
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              JWT 생성 및 실시간 소켓 테스트
            </Typography>
          </Toolbar>
        </AppBar>
        
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Security color="primary" sx={{ mr: 1 }} />
              <Typography variant="h5" component="h2">
                JWT 토큰 생성기
              </Typography>
            </Box>
            <JWTGenerator jwt={jwt} setJwt={setJwt} />
          </Paper>

          <Paper elevation={3} sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Wifi color="primary" sx={{ mr: 1 }} />
              <Typography variant="h5" component="h2">
                실시간 소켓 연결
              </Typography>
            </Box>
            <SocketConnectionPanel jwt={jwt} />
          </Paper>
        </Container>
      </Box>
    </ThemeProvider>
  );
}

export default App;
