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

interface PackSizes {
  lencolCasal: number;
  lencolSolteiro: number;
  fronhas: number;
}

interface SocketContextData {
  socket: Socket | null;
  rooms: Room[];
  orders: Order[];
  users: User[];
  packSizes: PackSizes;
  requestableItems: string[];
  syncStatus: { status: string; message: string; time: string; debug?: string };
  updateRoom: (id: string, updates: Partial<Room>) => void;
  createOrder: (roomId: string, items: { item: string; quantity: number }[]) => void;
  updateOrderStatus: (id: string, status: Order['status']) => void;
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

  const createOrder = (roomId: string, items: { item: string; quantity: number }[]) => {
    socket?.emit('create_order', { roomId, items });
  };

  const updateOrderStatus = (id: string, status: Order['status']) => {
    socket?.emit('update_order_status', { id, status });
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
    <SocketContext.Provider value={{ socket, rooms, orders, users, packSizes, requestableItems, syncStatus, updateRoom, createOrder, updateOrderStatus, approveUser, saveSheetsConfig, deleteRoom, updatePackSizes, updateRequestableItems }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
