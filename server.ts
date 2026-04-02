import express from 'express';
import { createServer as createViteServer } from 'vite';
import { createServer } from 'http';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { google } from 'googleapis';
import path from 'path';
import { Readable } from 'stream';
import fs from 'fs';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*' }
});

app.use(express.json({ limit: '50mb' }));

// In-memory database
const users: Record<string, any> = {};
let rooms: Record<string, any> = {};
let dailyRooms: Record<string, any>[] = [];
let sheetRoomOrder: string[][] = [];
const orders: any[] = [];
const maintenanceRequests: any[] = [];
const swapRequests: any[] = [];
let sheetsConfig: any = {
  spreadsheetId: process.env.SPREADSHEET_ID || '1oMKFu9aobTP5sBuF0jjSR4In3Z6EcWfATCe_9ijNFXA',
  clientEmail: process.env.SHEETS_CLIENT_EMAIL || 'robo-gov@governanca-491823.iam.gserviceaccount.com',
  privateKey: process.env.SHEETS_PRIVATE_KEY || '-----BEGIN PRIVATE KEY-----\nMIIEvwIBADANBgkqhkiG9w0BAQEFAASCBKkwggSlAgEAAoIBAQCnXBJLFHqwYj9G\n+3vIbt/ZiMSrfD438w6osD4mL5Vh/e6HVN7tK9v3lkXaRT2Rb0UW9keld6sQ1eJ0\nUKQGa7P27wdZ7enJW6SmdgJkCi1OoVq51x4zPzxfibYC/aQLnWpct8AydxcXClki\n7PDBN7oNz+6/BkKEJZQ/Svl9Q+di4W/OW0wuFcpsMu6ZZHE+rvd7lws/I53EULuK\n1kq0CQzAx74Z33k2bLWFXY5O+XJPE5HOpxqhjeqEmJjE+S3529WGa2YNL9LsTXUP\nrWYQm5J9L4hYN4UCoq9rkE6yGaRmrddzWAEo2QNXX/gCbjPEULPTY8WNyoVVP7SS\nYi3H+vWNAgMBAAECggEAH6/qlMWZXzkS4wUtkCsR/hWLqy5Yd25xOZY5BjDfN1EF\nbyEuHji+KrgMnMGcYSNwsOLLePRZ8tOUT1KPY9nTlq72NNw7dhEAcTYJyNg2cNtT\nGrm0sZ5I94vS5ukQPNS+tTRjUwrCV+3xJ5A2G1dKRmA2w3tTb8LPuVYgO8v2DP30\nrhczDRPxw1Jq5VKsc9+S3IvHRhFy8mplcB++GcmlddiLIwd9OyqbiGtSkKlkVIFN\nX9NuAW7lo3bF1AZ1GuR6bJe/YKjuuN6HVfTQg0/nlbhfeG8aNF72SZ6eh/9PAu8f\ncLEhqFMXNyeOKexU9onJdQLrY9mtD5NK1ZI7JaNmQQKBgQDUIuaJRFdBTbZmfBGV\nr4iGrWx0JrcSY4KwI3uOVOOa48jgaHKJPkdIrht8l8KzKjs5/hAjUNDxnHWR4wnO\nD7cM0Dcglf5/IktMFeh50fIbzBGkt+T2Pc+Np4rUNdL4Nm5aaxSCmw+Rxz2NnutN\n0uyOyhAfsuStrIzXIYyp4eWprQKBgQDJ9v0eglIx8pHRg8afeGoLLKny/9uxmZMI\nVExHdyKSa07qKbuT0/Z0XD0BLiRqico5PKtaXiPY7nuRtn2U40rfZ4Y1Qwf0SCl1\nOmx6cQN/4WJG7WYCh7EL0qvdUOHMDE5Vw9Q+o84tdx0d/hQ5t8YfGU7aatbN4o+4\n0C3Pvbe3YQKBgQCRIEs9Dz7uUx7839Yb5FlvYYd3suC9uMw4eh3WEqcfWMQdGfd5\ngty7kTkGtMAjWDnqg7BAqNI46MPaCUu06DVfk7aTGWphSXHf3IENjh6m+6X6XUBL\nYZ/zlfI5GZV576rxOp5ud2xgW8D1eQobVLg3O29qcDVXx1sW9kHIGt3GhQKBgQCH\n+TTjRIRIQnLwJxMjrHNgwJpPEvl7cdTvB6ovd0McZwjDWIOEfHFyV+Nulv1HiStQ\nK8uF1Nm3pKAnM0ELa5euH0nZNB731VmsJkCAkvPzNe/vpsdGLssBFb5GC71pnmNj\nFKwh3DDkpUxCNByz20mVCHnxTXr/NGjk2avuMGGvIQKBgQCvBJMR1X0l9qAoIHOi\nRomzqn7lEttohqkV9eScblD3I6V+Ul7qEkvs+5iPtgRmHMenXjWIMYBjBjGEoHUn\nKlygkyOl6gny/pQ4Y93M4HXnhpmqJEYTz870++xTus/0fExSMk5fYOjA+9WhmOff\nkXF6LZc8oLEyYg9DT7uVk0eJXw==\n-----END PRIVATE KEY-----\n'
};
let lastSyncStatus: { status: string; message: string; time: string; debug?: string } = { status: 'pending', message: 'Aguardando primeira sincronização...', time: '' };

function createInitialRooms() {
  const r: Record<string, any> = {};
  [200, 300, 400, 500, 600, 700].forEach(floor => {
    for (let i = 0; i <= 34; i++) {
      const id = `${floor + i}`;
      if (!deletedRooms.includes(id)) {
        r[id] = {
          id,
          floor,
          status: 'vago',
          condition: 'limpo',
          pax: 0,
          arrivalDate: '',
          departureDate: '',
          dnd: false,
          arrumacao: false,
          trocaEnxoval: false,
          linenDelivered: false,
          logs: []
        };
      }
    }
  });
  return r;
}

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

let deletedRooms: string[] = [];
try {
  if (fs.existsSync('deleted_rooms.json')) {
    deletedRooms = JSON.parse(fs.readFileSync('deleted_rooms.json', 'utf-8'));
  }
} catch (e) {
  console.error('Error reading deleted_rooms.json', e);
}

// Initialize rooms
rooms = createInitialRooms();
dailyRooms = [rooms];
sheetRoomOrder = [[]];

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

app.post('/api/auth/update-name', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    const user = users[decoded.email];
    if (!user) return res.status(404).json({ error: 'User not found' });

    const { name } = req.body;
    user.name = name;

    const newToken = jwt.sign({ 
      email: user.email, 
      role: user.role,
      name: user.name,
      approved: user.approved,
      floors: user.floors
    }, JWT_SECRET);

    io.emit('user_updated', user);
    res.json({ token: newToken, user });
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
      dailyRooms,
      orders,
      users: Object.values(users),
      packSizes,
      requestableItems,
      swapRequests,
      maintenanceRequests
    });
    socket.emit('sync_status', lastSyncStatus);
  });

  socket.on('update_room', async (data) => {
    const { id, updates, dayIndex = 0, user } = data;
    if (dailyRooms[dayIndex] && dailyRooms[dayIndex][id]) {
      const room = dailyRooms[dayIndex][id];
      
      // Create log entry for each update
      if (!room.logs) room.logs = [];
      const timestamp = new Date().toISOString();
      const userName = user?.name || user?.email || 'Sistema';
      
      Object.keys(updates).forEach(key => {
        if (updates[key] !== room[key]) {
          room.logs.push({
            timestamp,
            user: userName,
            field: key,
            oldValue: room[key],
            newValue: updates[key]
          });
        }
      });

      dailyRooms[dayIndex][id] = { ...room, ...updates };
      if (dayIndex === 0) rooms = dailyRooms[0];
      io.emit('room_updated', { updatedRoom: dailyRooms[dayIndex][id], dayIndex });
      debouncedSyncToSheets();
    }
  });

  socket.on('swap_rooms', async (data) => {
    const { oldRoomId, newRoomId } = data;
    if (rooms[oldRoomId] && rooms[newRoomId]) {
      rooms[oldRoomId].status = 'vago';
      rooms[newRoomId].status = 'chegada';
      io.emit('room_updated', rooms[oldRoomId]);
      io.emit('room_updated', rooms[newRoomId]);
      await syncToSheets();
    }
  });

  socket.on('request_swap', (data) => {
    const { user, ...rest } = data;
    const req = { 
      id: Date.now().toString(), 
      ...rest, 
      status: 'pending', 
      createdAt: new Date().toISOString(),
      logs: [{
        timestamp: new Date().toISOString(),
        user: user?.name || user?.email || 'Sistema',
        action: 'Solicitou troca'
      }]
    };
    swapRequests.push(req);
    io.emit('swap_request_created', req);
  });

  socket.on('approve_swap', async (id) => {
    const req = swapRequests.find(r => r.id === id);
    if (req && req.status === 'pending') {
      req.status = 'approved';
      if (rooms[req.oldRoomId] && rooms[req.newRoomId]) {
        rooms[req.oldRoomId].status = 'vago';
        rooms[req.newRoomId].status = 'chegada';
        io.emit('room_updated', rooms[req.oldRoomId]);
        io.emit('room_updated', rooms[req.newRoomId]);
        await syncToSheets();
      }
      io.emit('swap_request_updated', req);

      // Reject any other pending requests involving these rooms
      swapRequests.forEach(otherReq => {
        if (otherReq.status === 'pending' && otherReq.id !== id) {
          if (otherReq.oldRoomId === req.oldRoomId || otherReq.newRoomId === req.newRoomId || otherReq.newRoomId === req.oldRoomId || otherReq.oldRoomId === req.newRoomId) {
            otherReq.status = 'rejected';
            io.emit('swap_request_updated', otherReq);
          }
        }
      });
    }
  });

  socket.on('reject_swap', (id) => {
    const req = swapRequests.find(r => r.id === id);
    if (req) {
      req.status = 'rejected';
      io.emit('swap_request_updated', req);
    }
  });

  socket.on('create_maintenance', async (data) => {
    const { user, ...rest } = data;
    const req = { 
      id: Date.now().toString(), 
      ...rest, 
      status: 'pendente', 
      createdAt: new Date().toISOString(),
      logs: [{
        timestamp: new Date().toISOString(),
        user: user?.name || user?.email || 'Sistema',
        action: 'Criou pedido de manutenção'
      }]
    };
    maintenanceRequests.push(req);
    io.emit('maintenance_created', req);
    await syncMaintenanceToSheets();
  });

  socket.on('resolve_maintenance', async (data) => {
    const { id, status, reason } = data;
    const req = maintenanceRequests.find(r => r.id === id);
    if (req) {
      req.status = status;
      if (reason) req.resolutionReason = reason;
      io.emit('maintenance_updated', req);
      await syncMaintenanceToSheets();
    }
  });

  socket.on('delete_room', async (id) => {
    if (rooms[id]) {
      delete rooms[id];
      if (!deletedRooms.includes(id)) {
        deletedRooms.push(id);
        try {
          fs.writeFileSync('deleted_rooms.json', JSON.stringify(deletedRooms, null, 2));
        } catch (e) {
          console.error('Error writing deleted_rooms.json', e);
        }
      }
      io.emit('room_deleted', id);
      await syncToSheets();
    }
  });

  socket.on('create_order', async (data) => {
    const { user, ...rest } = data;
    const order = {
      id: Date.now().toString(),
      roomId: rest.roomId,
      items: rest.items, // Array of { item, quantity }
      status: 'pendente',
      createdAt: new Date().toISOString(),
      logs: [{
        timestamp: new Date().toISOString(),
        user: user?.name || user?.email || 'Sistema',
        action: 'Criou pedido de rouparia'
      }]
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

  socket.on('trigger_sync', () => {
    syncFromSheets();
  });
});

// Google Sheets Sync Logic
async function getDriveClient() {
  if (!sheetsConfig || !sheetsConfig.clientEmail || !sheetsConfig.privateKey) {
    return null;
  }
  const auth = new google.auth.JWT({
    email: sheetsConfig.clientEmail,
    key: sheetsConfig.privateKey.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/drive']
  });
  return google.drive({ version: 'v3', auth });
}

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

let syncTimeout: NodeJS.Timeout | null = null;

async function debouncedSyncToSheets() {
  if (syncTimeout) clearTimeout(syncTimeout);
  syncTimeout = setTimeout(async () => {
    await syncToSheets();
    syncTimeout = null;
  }, 5000);
}

async function syncToSheets() {
  const sheets = await getSheetsClient();
  if (!sheets || !sheetRoomOrder.length) return;

  try {
    // Update Column C for each day
    for (let dayIndex = 0; dayIndex < dailyRooms.length; dayIndex++) {
      const order = sheetRoomOrder[dayIndex];
      const dayRooms = dailyRooms[dayIndex];
      
      if (!order || order.length === 0) continue;

      const values = order.map(id => [dayRooms[id]?.condition || 'sujo']);
      
      // Calculate start row based on previous blocks' lengths
      let startRow = 2;
      for (let i = 0; i < dayIndex; i++) {
        startRow += sheetRoomOrder[i].length + 1; // +1 for the empty row
      }
      
      const range = `STATUS_GOVERNANCA!C${startRow}:C${startRow + order.length - 1}`;
      
      await sheets.spreadsheets.values.update({
        spreadsheetId: sheetsConfig.spreadsheetId,
        range,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values }
      });
    }
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
      ranges: ['STATUS_GOVERNANCA!A2:E2000', 'PEDIDOS!A2:E'],
    });

    const governancaData = response.data.valueRanges?.[0].values || [];
    const pedidosData = response.data.valueRanges?.[1].values || [];

    const blocks: any[][] = [];
    let currentBlock: any[] = [];
    
    governancaData.forEach((row) => {
      const isEmpty = row.length === 0 || row.every(cell => !cell || String(cell).trim() === '');
      if (isEmpty) {
        if (currentBlock.length > 0) {
          blocks.push(currentBlock);
          currentBlock = [];
        }
      } else {
        currentBlock.push(row);
      }
    });
    if (currentBlock.length > 0) blocks.push(currentBlock);

    if (blocks.length === 0 && governancaData.length > 0) {
      blocks.push(governancaData);
    }

    const oldDailyRooms = dailyRooms;
    dailyRooms = blocks.map(() => createInitialRooms());
    sheetRoomOrder = blocks.map(() => []);

    blocks.forEach((block, dayIndex) => {
      const dayRooms = dailyRooms[dayIndex];
      const oldDayRooms = oldDailyRooms[dayIndex] || {};
      const dayOrder = sheetRoomOrder[dayIndex];

      block.forEach((row) => {
        const id = String(row[0] || '').trim().replace(/^0+/, '');
        dayOrder.push(id);

        if (id && dayRooms[id]) {
          // Preserve manual flags if room existed before
          if (oldDayRooms[id]) {
            dayRooms[id].arrumacao = oldDayRooms[id].arrumacao;
            dayRooms[id].trocaEnxoval = oldDayRooms[id].trocaEnxoval;
            dayRooms[id].dnd = oldDayRooms[id].dnd;
            dayRooms[id].linenDelivered = oldDayRooms[id].linenDelivered;
          }

          const situation = String(row[1] || '').toLowerCase().trim();
          const statusColC = String(row[2] || '').toLowerCase().trim();
          const paxRaw = String(row[3] || '').trim();
          const departureDate = String(row[4] || '').trim();
          
          if (situation.includes('saida') && situation.includes('chegada')) {
            dayRooms[id].status = 'saida_chegada';
          } else if (situation.includes('interditado') || situation.includes('bloqueado') || situation.includes('manutenção') || situation.includes('manutencao')) {
            dayRooms[id].status = 'interditado';
          } else if (situation.includes('ocupado')) {
            dayRooms[id].status = 'ocupado';
          } else if (situation.includes('saida') || situation.includes('saída') || situation.includes('check-out') || situation.includes('checkout')) {
            dayRooms[id].status = 'saida';
          } else if (situation.includes('chegada') || situation.includes('entrada') || situation.includes('reserva') || situation.includes('check-in') || situation.includes('checkin')) {
            dayRooms[id].status = 'chegada';
          } else {
            dayRooms[id].status = 'vago';
          }

          if (['limpo', 'sujo', 'vestir'].includes(statusColC)) {
            dayRooms[id].condition = statusColC;
          }

          const paxMatch = paxRaw.match(/^(\d+)/);
          dayRooms[id].pax = paxMatch ? parseInt(paxMatch[1]) : 0;
          dayRooms[id].departureDate = departureDate;
        }
      });
    });

    if (dailyRooms.length > 0) {
      rooms = dailyRooms[0];
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

    lastSyncStatus = { 
      status: 'success', 
      message: 'Sincronizado com sucesso', 
      time: new Date().toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo' })
    };
    io.emit('sync_status', lastSyncStatus);
    io.emit('initial_data', { 
      rooms: Object.values(rooms), 
      dailyRooms,
      orders, 
      users: Object.values(users), 
      packSizes, 
      requestableItems, 
      swapRequests, 
      maintenanceRequests 
    });
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

async function ensureMaintenanceSheetExists(sheets: any) {
  try {
    const response = await sheets.spreadsheets.get({
      spreadsheetId: sheetsConfig.spreadsheetId,
    });
    const sheetsList = response.data.sheets || [];
    const hasSheet = sheetsList.some((s: any) => s.properties.title === 'MANUTENCOES');

    if (!hasSheet) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: sheetsConfig.spreadsheetId,
        requestBody: {
          requests: [
            {
              addSheet: {
                properties: {
                  title: 'MANUTENCOES',
                }
              }
            }
          ]
        }
      });
      
      // Add headers
      await sheets.spreadsheets.values.update({
        spreadsheetId: sheetsConfig.spreadsheetId,
        range: 'MANUTENCOES!A1:H1',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [['ID', 'Quarto', 'Descrição', 'Status', 'Motivo Resolução', 'Foto', 'Criado Por', 'Data Criação']]
        }
      });
    }
  } catch (error) {
    console.error('Error ensuring MANUTENCOES sheet exists:', error);
  }
}

async function syncMaintenanceToSheets() {
  const sheets = await getSheetsClient();
  if (!sheets) return;

  await ensureMaintenanceSheetExists(sheets);

  try {
    const values = maintenanceRequests.map((req: any) => {
      let photoCell = '';
      if (req.photoUrl) {
        photoCell = `=IMAGE("${req.photoUrl}")`; // Direct links and uc?id= work with =IMAGE()
      }
      return [
        req.id,
        req.roomId,
        req.description,
        req.status,
        req.resolutionReason || '',
        photoCell,
        req.createdBy,
        req.createdAt
      ];
    });

    await sheets.spreadsheets.values.clear({
      spreadsheetId: sheetsConfig.spreadsheetId,
      range: 'MANUTENCOES!A2:H',
    });

    if (values.length > 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: sheetsConfig.spreadsheetId,
        range: 'MANUTENCOES!A2:H',
        valueInputOption: 'USER_ENTERED',
        requestBody: { values }
      });
    }
  } catch (error) {
    console.error('Error syncing maintenance to sheets:', error);
  }
}

app.post('/api/upload', async (req, res) => {
  try {
    const { imageBase64, filename } = req.body;
    const drive = await getDriveClient();
    
    if (!imageBase64 || !drive) {
      return res.status(400).json({ error: 'No image provided or Drive not configured' });
    }
    
    const buffer = Buffer.from(imageBase64.replace(/^data:image\/\w+;base64,/, ""), 'base64');
    const mimeType = imageBase64.match(/^data:(image\/\w+);base64,/)?.[1] || 'image/jpeg';

    let parentFolderId: string | undefined = '1jHSbN18QXKL1OPl8_QiSsHYT0NiqgNNW'; // User provided folder ID
    
    const fileMetadata: any = { 
      name: filename,
      parents: [parentFolderId]
    };

    const media = { 
      mimeType, 
      body: Readable.from(buffer) 
    };
    
    let driveRes;
    let fileId;
    let finalUrl;
    let usedFallback = false;

    try {
      driveRes = await drive.files.create({
        requestBody: fileMetadata,
        media: media,
        fields: 'id, webViewLink, webContentLink',
        supportsAllDrives: true
      });
      
      fileId = driveRes.data.id;
      await drive.permissions.create({
        fileId: fileId!,
        requestBody: { role: 'reader', type: 'anyone' }
      });
      
      // Use uc?id= format for direct image rendering in <img> tags
      finalUrl = `https://drive.google.com/uc?id=${fileId}`;
      
    } catch (createErr: any) {
      if (createErr.message && createErr.message.includes('storage quota')) {
        console.log('Aviso (Google Drive): A conta de serviço não tem espaço para salvar na pasta comum.');
        console.log('Redirecionando o salvamento da foto para o servidor alternativo (Catbox)...');
      } else {
        console.error('Drive create error:', createErr.message || createErr);
        console.log('Falling back to catbox.moe due to Drive error...');
      }
      
      try {
        const blob = new Blob([buffer], { type: mimeType });
        const formData = new FormData();
        formData.append('reqtype', 'fileupload');
        formData.append('fileToUpload', blob, filename);

        const catboxRes = await fetch('https://catbox.moe/user/api.php', {
          method: 'POST',
          body: formData,
        });

        if (!catboxRes.ok) {
          throw new Error(`Catbox API responded with status ${catboxRes.status}`);
        }

        finalUrl = await catboxRes.text();
        usedFallback = true;
      } catch (fallbackErr: any) {
        console.error('Catbox fallback error:', fallbackErr.message || fallbackErr);
        return res.status(500).json({ 
          error: 'Erro ao salvar a foto. O Google Drive bloqueou por falta de espaço e o servidor alternativo também falhou.' 
        });
      }
    }
    
    res.json({ url: finalUrl, id: fileId, usedFallback });
  } catch (e: any) {
    console.error('Upload error:', e.message || e);
    res.status(500).json({ error: 'Upload failed' });
  }
});

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
