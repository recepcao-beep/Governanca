import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface Room {
  id: string;
  floor: number;
  status: 'vago' | 'ocupado' | 'interditado' | 'chegada' | 'saida';
  condition: 'sujo' | 'limpo' | 'vestir';
  pax: number;
  departureDate: string;
  dnd: boolean;
  linenDelivered?: boolean;
}

interface Order {
  id: string;
  roomId: string;
  items: { item: string; quantity: number }[];
  status: 'pendente' | 'entregue' | 'nao_entregue' | 'nao_perturbe';
  createdAt: string;
}

interface User {
  email: string;
  role: 'gestor' | 'camareira';
  approved: boolean;
  floors: number[];
}

interface SwapRequest {
  id: string;
  oldRoomId: string;
  newRoomId: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  createdBy: string;
}

interface MaintenanceRequest {
  id: string;
  roomId: string;
  description: string;
  photoUrl?: string;
  status: 'pendente' | 'corrigida' | 'nao_executada';
  resolutionReason?: string;
  createdAt: string;
  createdBy: string;
}

interface PackSizes {
  lencolCasal: number;
  lencolSolteiro: number;
  fronhas: number;
}

interface SocketContextData {
  socket: Socket | null;
  rooms: Room[];
  orders: Order[];
  swapRequests: SwapRequest[];
  maintenanceRequests: MaintenanceRequest[];
  users: User[];
  packSizes: PackSizes;
  requestableItems: string[];
  syncStatus: { status: string; message: string; time: string; debug?: string };
  updateRoom: (id: string, updates: Partial<Room>) => void;
  swapRooms: (oldRoomId: string, newRoomId: string) => void;
  requestSwap: (oldRoomId: string, newRoomId: string, reason: string, createdBy: string) => void;
  approveSwap: (id: string) => void;
  rejectSwap: (id: string) => void;
  createOrder: (roomId: string, items: { item: string; quantity: number }[]) => void;
  updateOrderStatus: (id: string, status: Order['status']) => void;
  createMaintenance: (roomId: string, description: string, photoUrl: string | undefined, createdBy: string) => void;
  resolveMaintenance: (id: string, status: 'corrigida' | 'nao_executada', reason?: string) => void;
  approveUser: (email: string, floors: number[]) => void;
  saveSheetsConfig: (config: any) => void;
  deleteRoom: (id: string) => void;
  updatePackSizes: (sizes: PackSizes) => void;
  updateRequestableItems: (items: string[]) => void;
}

const SocketContext = createContext<SocketContextData>({} as SocketContextData);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [swapRequests, setSwapRequests] = useState<SwapRequest[]>([]);
  const [maintenanceRequests, setMaintenanceRequests] = useState<MaintenanceRequest[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [packSizes, setPackSizes] = useState<PackSizes>({ lencolCasal: 25, lencolSolteiro: 25, fronhas: 50 });
  const [requestableItems, setRequestableItems] = useState<string[]>([]);
  const [syncStatus, setSyncStatus] = useState({ status: 'pending', message: 'Conectando...', time: '' });

  useEffect(() => {
    const newSocket = io(window.location.origin);
    setSocket(newSocket);

    newSocket.on('connect', () => {
      newSocket.emit('get_initial_data');
    });

    newSocket.on('initial_data', (data) => {
      setRooms(data.rooms);
      setOrders(data.orders);
      setUsers(data.users);
      if (data.packSizes) setPackSizes(data.packSizes);
      if (data.requestableItems) setRequestableItems(data.requestableItems);
      if (data.swapRequests) setSwapRequests(data.swapRequests);
      if (data.maintenanceRequests) setMaintenanceRequests(data.maintenanceRequests);
    });

    newSocket.on('sync_status', (status) => {
      setSyncStatus(status);
    });

    newSocket.on('pack_sizes_updated', (newSizes) => {
      setPackSizes(newSizes);
    });

    newSocket.on('requestable_items_updated', (newItems) => {
      setRequestableItems(newItems);
    });

    newSocket.on('room_updated', (updatedRoom: Room) => {
      setRooms((prev) => prev.map((r) => (r.id === updatedRoom.id ? updatedRoom : r)));
    });

    newSocket.on('order_created', (newOrder: Order) => {
      setOrders((prev) => [...prev, newOrder]);
    });

    newSocket.on('order_updated', (updatedOrder: Order) => {
      setOrders((prev) => prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o)));
    });

    newSocket.on('swap_request_created', (req: SwapRequest) => {
      setSwapRequests((prev) => [...prev, req]);
    });

    newSocket.on('swap_request_updated', (updatedReq: SwapRequest) => {
      setSwapRequests((prev) => prev.map((r) => (r.id === updatedReq.id ? updatedReq : r)));
    });

    newSocket.on('maintenance_created', (req: MaintenanceRequest) => {
      setMaintenanceRequests((prev) => [...prev, req]);
    });

    newSocket.on('maintenance_updated', (updatedReq: MaintenanceRequest) => {
      setMaintenanceRequests((prev) => prev.map((r) => (r.id === updatedReq.id ? updatedReq : r)));
    });

    newSocket.on('user_updated', (updatedUser: User) => {
      setUsers((prev) => prev.map((u) => (u.email === updatedUser.email ? updatedUser : u)));
    });

    newSocket.on('room_deleted', (roomId: string) => {
      setRooms((prev) => prev.filter((r) => r.id !== roomId));
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const updateRoom = (id: string, updates: Partial<Room>) => {
    socket?.emit('update_room', { id, updates });
  };

  const swapRooms = (oldRoomId: string, newRoomId: string) => {
    socket?.emit('swap_rooms', { oldRoomId, newRoomId });
  };

  const requestSwap = (oldRoomId: string, newRoomId: string, reason: string, createdBy: string) => {
    socket?.emit('request_swap', { oldRoomId, newRoomId, reason, createdBy });
  };

  const approveSwap = (id: string) => {
    socket?.emit('approve_swap', id);
  };

  const rejectSwap = (id: string) => {
    socket?.emit('reject_swap', id);
  };

  const createOrder = (roomId: string, items: { item: string; quantity: number }[]) => {
    socket?.emit('create_order', { roomId, items });
  };

  const updateOrderStatus = (id: string, status: Order['status']) => {
    socket?.emit('update_order_status', { id, status });
  };

  const createMaintenance = (roomId: string, description: string, photoUrl: string | undefined, createdBy: string) => {
    socket?.emit('create_maintenance', { roomId, description, photoUrl, createdBy });
  };

  const resolveMaintenance = (id: string, status: 'corrigida' | 'nao_executada', reason?: string) => {
    socket?.emit('resolve_maintenance', { id, status, reason });
  };

  const approveUser = (email: string, floors: number[]) => {
    socket?.emit('approve_user', { email, floors });
  };

  const saveSheetsConfig = (config: any) => {
    socket?.emit('save_sheets_config', config);
  };

  const deleteRoom = (id: string) => {
    socket?.emit('delete_room', id);
  };

  const updatePackSizes = (sizes: PackSizes) => {
    socket?.emit('update_pack_sizes', sizes);
  };

  const updateRequestableItems = (items: string[]) => {
    socket?.emit('update_requestable_items', items);
  };

  return (
    <SocketContext.Provider value={{ socket, rooms, orders, swapRequests, maintenanceRequests, users, packSizes, requestableItems, syncStatus, updateRoom, swapRooms, requestSwap, approveSwap, rejectSwap, createOrder, updateOrderStatus, createMaintenance, resolveMaintenance, approveUser, saveSheetsConfig, deleteRoom, updatePackSizes, updateRequestableItems }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
