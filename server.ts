import express from 'express';
import { createServer as createViteServer } from 'vite';
import { createServer } from 'http';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { google } from 'googleapis';
import path from 'path';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*' }
});

app.use(express.json());

// In-memory database
const users: Record<string, any> = {};
const rooms: Record<string, any> = {};
const orders: any[] = [];
let sheetsConfig: any = {
  spreadsheetId: process.env.SPREADSHEET_ID || '1oMKFu9aobTP5sBuF0jjSR4In3Z6EcWfATCe_9ijNFXA',
  clientEmail: process.env.SHEETS_CLIENT_EMAIL || 'robo-gov@governanca-491823.iam.gserviceaccount.com',
  privateKey: process.env.SHEETS_PRIVATE_KEY || '-----BEGIN PRIVATE KEY-----\nMIIEvwIBADANBgkqhkiG9w0BAQEFAASCBKkwggSlAgEAAoIBAQCnXBJLFHqwYj9G\n+3vIbt/ZiMSrfD438w6osD4mL5Vh/e6HVN7tK9v3lkXaRT2Rb0UW9keld6sQ1eJ0\nUKQGa7P27wdZ7enJW6SmdgJkCi1OoVq51x4zPzxfibYC/aQLnWpct8AydxcXClki\n7PDBN7oNz+6/BkKEJZQ/Svl9Q+di4W/OW0wuFcpsMu6ZZHE+rvd7lws/I53EULuK\n1kq0CQzAx74Z33k2bLWFXY5O+XJPE5HOpxqhjeqEmJjE+S3529WGa2YNL9LsTXUP\nrWYQm5J9L4hYN4UCoq9rkE6yGaRmrddzWAEo2QNXX/gCbjPEULPTY8WNyoVVP7SS\nYi3H+vWNAgMBAAECggEAH6/qlMWZXzkS4wUtkCsR/hWLqy5Yd25xOZY5BjDfN1EF\nbyEuHji+KrgMnMGcYSNwsOLLePRZ8tOUT1KPY9nTlq72NNw7dhEAcTYJyNg2cNtT\nGrm0sZ5I94vS5ukQPNS+tTRjUwrCV+3xJ5A2G1dKRmA2w3tTb8LPuVYgO8v2DP30\nrhczDRPxw1Jq5VKsc9+S3IvHRhFy8mplcB++GcmlddiLIwd9OyqbiGtSkKlkVIFN\nX9NuAW7lo3bF1AZ1GuR6bJe/YKjuuN6HVfTQg0/nlbhfeG8aNF72SZ6eh/9PAu8f\ncLEhqFMXNyeOKexU9onJdQLrY9mtD5NK1ZI7JaNmQQKBgQDUIuaJRFdBTbZmfBGV\nr4iGrWx0JrcSY4KwI3uOVOOa48jgaHKJPkdIrht8l8KzKjs5/hAjUNDxnHWR4wnO\nD7cM0Dcglf5/IktMFeh50fIbzBGkt+T2Pc+Np4rUNdL4Nm5aaxSCmw+Rxz2NnutN\n0uyOyhAfsuStrIzXIYyp4eWprQKBgQDJ9v0eglIx8pHRg8afeGoLLKny/9uxmZMI\nVExHdyKSa07qKbuT0/Z0XD0BLiRqico5PKtaXiPY7nuRtn2U40rfZ4Y1Qwf0SCl1\nOmx6cQN/4WJG7WYCh7EL0qvdUOHMDE5Vw9Q+o84tdx0d/hQ5t8YfGU7aatbN4o+4\n0C3Pvbe3YQKBgQCRIEs9Dz7uUx7839Yb5FlvYYd3suC9uMw4eh3WEqcfWMQdGfd5\ngty7kTkGtMAjWDnqg7BAqNI46MPaCUu06DVfk7aTGWphSXHf3IENjh6m+6X6XUBL\nYZ/zlfI5GZV576rxOp5ud2xgW8D1eQobVLg3O29qcDVXx1sW9kHIGt3GhQKBgQCH\n+TTjRIRIQnLwJxMjrHNgwJpPEvl7cdTvB6ovd0McZwjDWIOEfHFyV+Nulv1HiStQ\nK8uF1Nm3pKAnM0ELa5euH0nZNB731VmsJkCAkvPzNe/vpsdGLssBFb5GC71pnmNj\nFKwh3DDkpUxCNByz20mVCHnxTXr/NGjk2avuMGGvIQKBgQCvBJMR1X0l9qAoIHOi\nRomzqn7lEttohqkV9eScblD3I6V+Ul7qEkvs+5iPtgRmHMenXjWIMYBjBjGEoHUn\nKlygkyOl6gny/pQ4Y93M4HXnhpmqJEYTz870++xTus/0fExSMk5fYOjA+9WhmOff\nkXF6LZc8oLEyYg9DT7uVk0eJXw==\n-----END PRIVATE KEY-----\n'
};
let lastSyncStatus = { status: 'pending', message: 'Aguardando primeira sincronização...', time: '' };

let packSizes = {
  lencolCasal: 25,
  lencolSolteiro: 25,
  fronhas: 50
};

let requestableItems = [
  "Berço",
  "Banheira",
  "Saco para lixo",
  "Grades de cama",
  "Toalha de rosto",
  "Toalha de piso",
  "Toalha de banho",
  "Toalha de piscina",
  "Lençol de casal",
  "Lençol de solteiro",
  "Fronha"
];

// Initial sync on startup
setTimeout(() => {
  syncFromSheets();
  // Set up polling every 30 seconds to keep data fresh
  setInterval(syncFromSheets, 30000);
}, 2000);

// Initialize rooms
[200, 300, 400, 500, 600, 700].forEach(floor => {
  for (let i = 0; i <= 34; i++) {
    const id = `${floor + i}`;
    rooms[id] = {
      id,
      floor,
      status: 'vago', // vago, ocupado, interditado, chegada, saida
      condition: 'limpo', // sujo, limpo, vestir
      pax: 0,
      arrivalDate: '',
      departureDate: '',
      dnd: false,
      arrumacao: false,
      trocaEnxoval: false
    };
  }
});

const JWT_SECRET = 'hotel-secret-key';

// Auth endpoints
let appUrl = (process.env.APP_URL || 'http://localhost:3000').replace(/\/$/, '');
if (!appUrl.startsWith('http')) {
  appUrl = `https://${appUrl}`;
}
const oauth2Client = new google.auth.OAuth2(
  process.env.OAUTH_CLIENT_ID || 'dummy_id',
  process.env.OAUTH_CLIENT_SECRET || 'dummy_secret',
  `${appUrl}/api/auth/google/callback`
);

app.get('/api/auth/google/url', (req, res) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/userinfo.email', 'https://www.googleapis.com/auth/userinfo.profile']
  });
  res.json({ url });
});

app.get('/api/auth/google/callback', async (req, res) => {
  const { code } = req.query;
  try {
    const { tokens } = await oauth2Client.getToken(code as string);
    oauth2Client.setCredentials(tokens);
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();
    const email = userInfo.data.email;
    const name = userInfo.data.name;

    if (!users[email!]) {
      users[email!] = {
        email,
        name,
        role: 'camareira',
        approved: false,
        floors: []
      };
    }

    const user = users[email!];
    const token = jwt.sign({ 
      email: user.email, 
      role: user.role,
      name: user.name,
      approved: user.approved,
      floors: user.floors
    }, JWT_SECRET);

    res.send(`
      <html>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS', token: '${token}', user: ${JSON.stringify(user)} }, '*');
              window.close();
            } else {
              window.location.href = '/';
            }
          </script>
          <p>Autenticação concluída. Esta janela será fechada.</p>
        </body>
      </html>
    `);
  } catch (error: any) {
    console.error('OAuth Error:', error);
    res.status(500).send(`
      <html>
        <body style="font-family: sans-serif; padding: 2rem;">
          <h2 style="color: red;">Authentication failed</h2>
          <p><strong>Error details:</strong> ${error.message || String(error)}</p>
          <p>Verifique se as variáveis de ambiente OAUTH_CLIENT_ID e OAUTH_CLIENT_SECRET estão configuradas corretamente no Render.</p>
          <button onclick="window.close()">Fechar janela</button>
        </body>
      </html>
    `);
  }
});

app.post('/api/auth/gestor', (req, res) => {
  const { password } = req.body;
  if (password === '0000') {
    const email = 'gestor@hotel.com';
    if (!users[email]) {
      users[email] = { email, name: 'Gestor Principal', role: 'gestor', approved: true, floors: [200, 300, 400, 500, 600, 700] };
    }
    const user = users[email];
    const token = jwt.sign({ email: user.email, role: user.role }, JWT_SECRET);
    res.json({ token, user });
  } else {
    res.status(401).json({ error: 'Senha incorreta' });
  }
});

app.get('/api/auth/me', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    let user = users[decoded.email];
    
    // Se o servidor reiniciou e perdeu a memória, recria o usuário a partir do token!
    if (!user) {
      user = {
        email: decoded.email,
        name: decoded.name || decoded.email.split('@')[0],
        role: decoded.role || 'camareira',
        approved: decoded.approved || false,
        floors: decoded.floors || []
      };
      users[decoded.email] = user;
    }
    
    // Emite um novo token com os dados mais recentes (caso o gestor tenha aprovado)
    const newToken = jwt.sign({ 
      email: user.email, 
      role: user.role,
      name: user.name,
      approved: user.approved,
      floors: user.floors
    }, JWT_SECRET);

    res.json({ user, token: newToken });
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

app.post('/api/auth/approve-self', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    const user = users[decoded.email];
    
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    const { password } = req.body;
    if (password === '0000') {
      user.approved = true;
      user.role = 'gestor';
      user.floors = [200, 300, 400, 500, 600, 700];
      
      const newToken = jwt.sign({ 
        email: user.email, 
        role: user.role,
        name: user.name,
        approved: user.approved,
        floors: user.floors
      }, JWT_SECRET);
      
      io.emit('user_updated', user);
      res.json({ token: newToken, user });
    } else {
      res.status(401).json({ error: 'Senha incorreta' });
    }
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Socket.io for real-time updates
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('get_initial_data', () => {
    socket.emit('initial_data', {
      rooms: Object.values(rooms),
      orders,
      users: Object.values(users),
      packSizes,
      requestableItems
    });
    socket.emit('sync_status', lastSyncStatus);
  });

  socket.on('update_room', async (data) => {
    const { id, updates } = data;
    if (rooms[id]) {
      rooms[id] = { ...rooms[id], ...updates };
      io.emit('room_updated', rooms[id]);
      await syncToSheets();
    }
  });

  socket.on('delete_room', async (id) => {
    if (rooms[id]) {
      delete rooms[id];
      io.emit('room_deleted', id);
      await syncToSheets();
    }
  });

  socket.on('create_order', async (data) => {
    const order = {
      id: Date.now().toString(),
      roomId: data.roomId,
      items: data.items, // Array of { item, quantity }
      status: 'pendente',
      createdAt: new Date().toISOString()
    };
    orders.push(order);
    io.emit('order_created', order);
    await syncOrdersToSheets();
  });

  socket.on('update_order_status', async (data) => {
    const { id, status } = data;
    const order = orders.find(o => o.id === id);
    if (order) {
      order.status = status;
      io.emit('order_updated', order);
      await syncOrdersToSheets();
    }
  });

  socket.on('update_pack_sizes', (newSizes) => {
    packSizes = { ...packSizes, ...newSizes };
    io.emit('pack_sizes_updated', packSizes);
  });

  socket.on('update_requestable_items', (newItems) => {
    requestableItems = newItems;
    io.emit('requestable_items_updated', requestableItems);
  });

  socket.on('approve_user', (data) => {
    const { email, floors } = data;
    if (users[email]) {
      users[email].approved = true;
      users[email].floors = floors;
      io.emit('user_updated', users[email]);
    }
  });

  socket.on('save_sheets_config', (config) => {
    sheetsConfig = config;
    io.emit('sheets_config_updated', { configured: true });
    syncFromSheets();
  });
});

// Google Sheets Sync Logic
async function getSheetsClient() {
  if (!sheetsConfig || !sheetsConfig.clientEmail || !sheetsConfig.privateKey || !sheetsConfig.spreadsheetId) {
    return null;
  }
  const auth = new google.auth.JWT({
    email: sheetsConfig.clientEmail,
    key: sheetsConfig.privateKey.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets']
  });
  return google.sheets({ version: 'v4', auth });
}

async function syncToSheets() {
  const sheets = await getSheetsClient();
  if (!sheets) return;

  try {
    const values = Object.values(rooms).map((r: any) => [
      r.id, r.status, r.condition, r.pax, r.departureDate, r.dnd ? 'Sim' : 'Não'
    ]);

    await sheets.spreadsheets.values.clear({
      spreadsheetId: sheetsConfig.spreadsheetId,
      range: 'STATUS_GOVERNANCA!A2:F',
    });

    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetsConfig.spreadsheetId,
      range: 'STATUS_GOVERNANCA!A2:F',
      valueInputOption: 'USER_ENTERED',
      requestBody: { values }
    });
  } catch (error) {
    console.error('Error syncing to sheets:', error);
  }
}

async function ensurePedidosSheetExists(sheets: any) {
  try {
    const response = await sheets.spreadsheets.get({
      spreadsheetId: sheetsConfig.spreadsheetId,
    });
    const sheetsList = response.data.sheets || [];
    const hasPedidos = sheetsList.some((s: any) => s.properties.title === 'PEDIDOS');

    if (!hasPedidos) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: sheetsConfig.spreadsheetId,
        requestBody: {
          requests: [
            {
              addSheet: {
                properties: {
                  title: 'PEDIDOS',
                }
              }
            }
          ]
        }
      });
      
      // Add headers
      await sheets.spreadsheets.values.update({
        spreadsheetId: sheetsConfig.spreadsheetId,
        range: 'PEDIDOS!A1:E1',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [['ID', 'Quarto', 'Itens', 'Status', 'Data']]
        }
      });
    }
  } catch (error) {
    console.error('Error ensuring PEDIDOS sheet exists:', error);
  }
}

async function syncOrdersToSheets() {
  const sheets = await getSheetsClient();
  if (!sheets) return;

  await ensurePedidosSheetExists(sheets);

  try {
    const values = orders.map((o: any) => [
      o.id,
      o.roomId,
      JSON.stringify(o.items),
      o.status,
      o.createdAt
    ]);

    await sheets.spreadsheets.values.clear({
      spreadsheetId: sheetsConfig.spreadsheetId,
      range: 'PEDIDOS!A2:E',
    });

    if (values.length > 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: sheetsConfig.spreadsheetId,
        range: 'PEDIDOS!A2:E',
        valueInputOption: 'USER_ENTERED',
        requestBody: { values }
      });
    }
  } catch (error) {
    console.error('Error syncing orders to sheets:', error);
  }
}

async function syncFromSheets() {
  const sheets = await getSheetsClient();
  if (!sheets) return;

  await ensurePedidosSheetExists(sheets);

  try {
    const response = await sheets.spreadsheets.values.batchGet({
      spreadsheetId: sheetsConfig.spreadsheetId,
      ranges: ['DADOS_BRUTOS_HITS!A2:H', 'VINCULACAO_HOJE!A2:A', 'STATUS_GOVERNANCA!A2:F', 'PEDIDOS!A2:E'],
    });

    const rawData = response.data.valueRanges?.[0].values || [];
    const vinculacaoData = response.data.valueRanges?.[1].values || [];
    const governancaData = response.data.valueRanges?.[2].values || [];
    const pedidosData = response.data.valueRanges?.[3].values || [];

    // Reset status to vago before applying new data
    Object.values(rooms).forEach((r: any) => {
      r.status = 'vago';
      r.pax = 0;
      r.departureDate = '';
    });

    // Sync condition and dnd from STATUS_GOVERNANCA first
    if (governancaData && governancaData.length) {
      governancaData.forEach(row => {
        const id = String(row[0] || '').trim();
        if (id && rooms[id]) {
          const condition = String(row[2] || '').toLowerCase().trim();
          const dnd = String(row[5] || '').toLowerCase().trim() === 'sim';
          
          if (['limpo', 'sujo', 'vestir'].includes(condition)) {
            rooms[id].condition = condition;
          }
          rooms[id].dnd = dnd;
        }
      });
    }

    // Sync orders from PEDIDOS
    if (pedidosData && pedidosData.length) {
      orders.length = 0; // Clear existing orders
      pedidosData.forEach(row => {
        const id = String(row[0] || '').trim();
        if (id) {
          try {
            orders.push({
              id,
              roomId: String(row[1] || '').trim(),
              items: row[2] ? JSON.parse(String(row[2])) : [],
              status: String(row[3] || 'pendente').trim(),
              createdAt: String(row[4] || '').trim()
            });
          } catch (e) {
            console.error(`Error parsing order items for order ${id}:`, e);
          }
        }
      });
    }

    // Get today's date in DD/MM/YYYY format, adjusted for Brazil timezone
    const today = new Date();
    today.setHours(today.getHours() - 3); // UTC-3
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const m = String(today.getMonth() + 1);
    const yyyy = today.getFullYear();
    const yy = String(yyyy).slice(-2);
    
    const todayStrings = [
      `${dd}/${mm}/${yyyy}`,
      `${dd}/${m}/${yyyy}`,
      `${dd}/${mm}/${yy}`,
      `${dd}/${m}/${yy}`,
      `${yyyy}-${mm}-${dd}`
    ];

    let debugLogs: string[] = [];

    if (rawData && rawData.length) {
      rawData.forEach((row, index) => {
        // Pela imagem, o ID do quarto está na Coluna A (índice 0) mas tem texto junto, ex: "307 (1CSS)"
        // Precisamos extrair apenas os números iniciais
        const rawIdCell = String(row[0] || '').trim();
        const idMatch = rawIdCell.match(/^0*(\d+)/); // Pega os números no começo, ignorando zeros à esquerda
        const id = idMatch ? idMatch[1] : '';
        
        if (id && rooms[id]) {
          // Pela imagem:
          // Coluna C (índice 2) = Data de Entrada (ex: 28/03/26 15:17)
          // Coluna D (índice 3) = Data de Saída (ex: 30/03/2026 13:59)
          // Coluna E (índice 4) = Status (ex: OCUPADO)
          // Coluna F (índice 5) = Pax (ex: 2/1)
          
          const entryDateFull = row[2] ? String(row[2]).trim() : '';
          const exitDateFull = row[3] ? String(row[3]).trim() : ''; 
          const statusRaw = row[4] ? String(row[4]).toLowerCase().trim() : ''; 
          
          // Extrai o primeiro número do Pax (antes da barra)
          const paxRaw = row[5] ? String(row[5]) : '';
          const paxMatch = paxRaw.match(/^(\d+)/);
          rooms[id].pax = paxMatch ? parseInt(paxMatch[1]) : 0; 
          
          // Extrai apenas a data da string de entrada (ignora a hora)
          const entryDateMatch = entryDateFull.match(/^(\d{2}\/\d{2}\/\d{2,4})/);
          const entryDate = entryDateMatch ? entryDateMatch[1] : entryDateFull;
          
          // Convert DD/MM/YYYY to YYYY-MM-DD for easier parsing in JS
          if (entryDate) {
            const parts = entryDate.split('/');
            if (parts.length === 3) {
              const year = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
              rooms[id].arrivalDate = `${year}-${parts[1]}-${parts[0]}`;
            } else {
              rooms[id].arrivalDate = entryDate;
            }
          }

          // Extrai apenas a data da string de saída (ignora a hora)
          const exitDateMatch = exitDateFull.match(/^(\d{2}\/\d{2}\/\d{2,4})/);
          const exitDate = exitDateMatch ? exitDateMatch[1] : exitDateFull;
          rooms[id].departureDate = exitDate;
          
          const isEntryToday = todayStrings.some(t => entryDate.includes(t));
          const isExitToday = todayStrings.some(t => exitDate.includes(t));
          const currentHour = today.getHours();
          
          if (index < 10) {
            debugLogs.push(`Qto ${id} | Saída: "${exitDate}" (Hoje? ${isExitToday}) | Status: "${statusRaw}" | Pax: ${rooms[id].pax}`);
          }
          
          const isOccupied = statusRaw.includes('ocupado') || statusRaw.includes('in-house') || statusRaw.includes('trânsito') || statusRaw.includes('transito');
          const isReservation = statusRaw.includes('reserva') || statusRaw.includes('entrada') || statusRaw.includes('chegada') || statusRaw.includes('checkin');
          const isCheckout = statusRaw.includes('saída') || statusRaw.includes('saida') || statusRaw.includes('checkout');
          const isInterditado = statusRaw.includes('interditado') || statusRaw.includes('bloqueado') || statusRaw.includes('manuten') || statusRaw.includes('inativo');

          if (isInterditado) {
            rooms[id].status = 'interditado';
          } else if (isOccupied) {
            if (isExitToday) {
              // Se está ocupado mas sai hoje, vira saída (ou vago se já passou das 14h)
              if (currentHour >= 14 && rooms[id].status !== 'chegada') {
                rooms[id].status = 'vago';
              } else if (rooms[id].status !== 'chegada') {
                rooms[id].status = 'saida';
              }
            } else {
              rooms[id].status = 'ocupado';
            }
          } else if (isCheckout || (isExitToday && !isEntryToday)) {
            if (currentHour >= 14 && rooms[id].status !== 'chegada') {
              rooms[id].status = 'vago';
            } else if (rooms[id].status !== 'chegada') {
              rooms[id].status = 'saida';
            }
          } else if (isReservation || isEntryToday) {
            // Só marca como chegada se a data de entrada for HOJE
            if (isEntryToday) {
              rooms[id].status = 'chegada';
            }
          }
        }
      });
    }

    if (vinculacaoData && vinculacaoData.length) {
      vinculacaoData.forEach(row => {
        const id = String(row[0] || '').trim().replace(/^0+/, '');
        // Só marca como chegada se o quarto estiver vago. Se estiver ocupado ou em saída, mantém o status atual.
        if (rooms[id] && rooms[id].status === 'vago') {
          rooms[id].status = 'chegada';
        }
      });
    }

    lastSyncStatus = { 
      status: 'success', 
      message: 'Sincronizado com sucesso', 
      time: new Date().toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
      debug: debugLogs.join(' | ')
    };
    io.emit('sync_status', lastSyncStatus);
    io.emit('initial_data', { rooms: Object.values(rooms), orders, users: Object.values(users), packSizes, requestableItems });
  } catch (error: any) {
    console.error('Error syncing from sheets:', error);
    lastSyncStatus = { 
      status: 'error', 
      message: error.message || 'Erro ao sincronizar', 
      time: new Date().toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo' })
    };
    io.emit('sync_status', lastSyncStatus);
  }
}

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        hmr: {
          server: httpServer
        }
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const PORT = process.env.PORT || 3000;
  httpServer.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
