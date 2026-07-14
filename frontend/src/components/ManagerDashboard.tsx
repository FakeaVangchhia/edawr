'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSocket } from '../hooks/useSocket';
import { Message, Order, Product, User } from '../types';
import {
  CheckCircle,
  Clock,
  MessageSquare,
  Send,
  Truck,
  Users,
  Warehouse,
} from 'lucide-react';
import { authFetch } from '../lib/api';
import ProductsDashboard from './ProductsDashboard';

type Tab = 'orders' | 'products' | 'whatsapp';

type ManagerDashboardProps = {
  headerActions?: React.ReactNode;
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(value);

export default function ManagerDashboard({ headerActions }: ManagerDashboardProps) {
  const { socket } = useSocket();
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>('orders');
  const [selectedPhone, setSelectedPhone] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, selectedPhone]);

  useEffect(() => {
    authFetch('/api/orders').then(r => r.json()).then(setOrders).catch(console.error);
    authFetch('/api/products').then(r => r.json()).then(setProducts).catch(console.error);
    authFetch('/api/users').then(r => r.json()).then(setUsers).catch(console.error);
    authFetch('/api/messages').then(r => r.json()).then(setMessages).catch(console.error);

    if (socket) {
      socket.on('order:created', (order: Order) => {
        setOrders(prev => [order, ...prev]);
      });
      socket.on('order:updated', (updatedOrder: Order) => {
        setOrders(prev => prev.map(o => o.id === updatedOrder.id ? { ...o, ...updatedOrder } : o));
      });
      socket.on('inventory:updated', () => {
        authFetch('/api/products').then(r => r.json()).then(setProducts).catch(console.error);
      });
      socket.on('product:updated', () => {
        authFetch('/api/products').then(r => r.json()).then(setProducts).catch(console.error);
      });
      socket.on('message:new', (msg: Message) => {
        setMessages(prev => [...prev, msg]);
      });
    }

    return () => {
      socket?.off('order:created');
      socket?.off('order:updated');
      socket?.off('inventory:updated');
      socket?.off('product:updated');
      socket?.off('message:new');
    };
  }, [socket]);

  const conversations = useMemo(() => {
    const groups: Record<string, Message[]> = {};
    messages.forEach(m => {
      if (!groups[m.phone]) groups[m.phone] = [];
      groups[m.phone].push(m);
    });
    return groups;
  }, [messages]);

  const deliveryBoys = users.filter(u => u.role === 'delivery');

  const assignDelivery = async (orderId: number, deliveryBoyId: number) => {
    try {
      const response = await authFetch(`/api/orders/${orderId}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ delivery_boy_id: deliveryBoyId })
      });
      if (response.ok) {
        setOrders(prev =>
          prev.map(o =>
            o.id === orderId
              ? { ...o, delivery_boy_id: deliveryBoyId, status: 'Assigned' as const }
              : o
          )
        );
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen bg-transparent">
      <header className="sticky top-0 z-10 border-b border-slate-200/80 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex min-h-16 max-w-7xl flex-wrap items-center gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm shadow-slate-900/20">
              <Warehouse className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-bold tracking-tight text-slate-900">eDawr Admin</h1>
              <p className="text-xs font-medium uppercase tracking-[0.24em] text-slate-400">Operations Console</p>
            </div>
          </div>
          <nav className="panel flex flex-wrap gap-2 rounded-2xl p-1.5">
            <button
              onClick={() => setActiveTab('orders')}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${activeTab === 'orders' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
            >
              Orders
            </button>
            <button
              onClick={() => setActiveTab('products')}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${activeTab === 'products' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
            >
              Products
            </button>
            <button
              onClick={() => setActiveTab('whatsapp')}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${activeTab === 'whatsapp' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
            >
              WhatsApp Chats
            </button>
          </nav>
          {headerActions ? <div className="ml-auto">{headerActions}</div> : null}
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {activeTab === 'orders' ? (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-slate-900">Live Orders</h2>
              <div className="flex gap-4">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <span className="w-3 h-3 rounded-full bg-yellow-400"></span> Pending
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <span className="w-3 h-3 rounded-full bg-blue-400"></span> Assigned
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <span className="w-3 h-3 rounded-full bg-emerald-400"></span> Delivered
                </div>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {orders.map(order => (
                <div key={order.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                  <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 p-4">
                    <div className="font-mono text-sm font-medium text-slate-500">#{order.id.toString().padStart(4, '0')}</div>
                    <div className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium
                      ${order.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                        order.status === 'Assigned' ? 'bg-blue-100 text-blue-800' :
                        'bg-emerald-100 text-emerald-800'}`}>
                      {order.status === 'Pending' && <Clock className="w-3 h-3" />}
                      {order.status === 'Assigned' && <Truck className="w-3 h-3" />}
                      {order.status === 'Delivered' && <CheckCircle className="w-3 h-3" />}
                      {order.status}
                    </div>
                  </div>

                  <div className="space-y-4 p-4">
                    <div>
                      <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Customer</div>
                      <div className="text-sm font-medium text-slate-900">{order.customer_phone}</div>
                    </div>

                    <div>
                      <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Items</div>
                      <ul className="space-y-2">
                        {order.items?.map(item => (
                          <li key={item.id} className="flex justify-between text-sm">
                            <span className="text-slate-700">{item.quantity}x {item.name}</span>
                            <span className="font-mono text-slate-500">{formatCurrency(item.price * item.quantity)}</span>
                          </li>
                        ))}
                      </ul>
                      <div className="mt-3 flex justify-between border-t border-slate-100 pt-3 text-sm font-medium">
                        <span>Total</span>
                        <span>{formatCurrency(order.items?.reduce((acc, item) => acc + (item.price * item.quantity), 0) ?? 0)}</span>
                      </div>
                    </div>

                    {order.status === 'Pending' && (
                      <div className="border-t border-slate-100 pt-4">
                        <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500">Assign Delivery</label>
                        <select
                          className="w-full rounded-lg border border-slate-300 p-2 text-sm shadow-sm focus:border-slate-900 focus:ring-slate-900"
                          onChange={(e) => {
                            if (e.target.value) assignDelivery(order.id, parseInt(e.target.value, 10));
                          }}
                          defaultValue=""
                        >
                          <option value="" disabled>Select delivery partner...</option>
                          {deliveryBoys.map(boy => (
                            <option key={boy.id} value={boy.id}>{boy.name}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {order.status !== 'Pending' && order.delivery_boy_id && (
                      <div className="border-t border-slate-100 pt-4">
                        <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-500">Assigned To</div>
                        <div className="flex items-center gap-2 text-sm font-medium text-slate-900">
                          <Users className="h-4 w-4 text-slate-400" />
                          {deliveryBoys.find(b => b.id === order.delivery_boy_id)?.name || 'Unknown'}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {orders.length === 0 && (
                <div className="col-span-full rounded-xl border border-dashed border-slate-200 bg-white py-12 text-center text-slate-500">
                  No orders yet. Waiting for WhatsApp messages...
                </div>
              )}
            </div>
          </div>
        ) : activeTab === 'products' ? (
          <ProductsDashboard />
        ) : (
          <div className="flex h-[600px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex w-1/3 flex-col border-r border-slate-200">
              <div className="border-b border-slate-200 bg-slate-50 p-4 font-bold text-slate-700">
                Conversations
              </div>
              <div className="flex-1 overflow-y-auto">
                {Object.keys(conversations).map(phone => {
                  const msgs = conversations[phone];
                  const lastMsg = msgs[msgs.length - 1];
                  return (
                    <div
                      key={phone}
                      onClick={() => setSelectedPhone(phone)}
                      className={`cursor-pointer border-b border-slate-100 p-4 transition-colors hover:bg-slate-50 ${selectedPhone === phone ? 'bg-slate-100' : ''}`}
                    >
                      <div className="font-bold text-slate-800">{phone}</div>
                      <div className="truncate text-sm text-slate-500">{lastMsg.content}</div>
                    </div>
                  );
                })}
                {Object.keys(conversations).length === 0 && (
                  <div className="p-8 text-center text-sm text-slate-500">No conversations yet.</div>
                )}
              </div>
            </div>
            <div className="flex flex-1 flex-col bg-slate-50/50">
              {selectedPhone ? (
                <>
                  <div className="flex items-center gap-2 border-b border-slate-200 bg-white p-4 font-bold text-slate-800">
                    <MessageSquare className="h-5 w-5 text-emerald-500" />
                    {selectedPhone}
                  </div>
                  <div className="flex-1 space-y-4 overflow-y-auto p-4 flex flex-col">
                    {conversations[selectedPhone]?.map(msg => (
                      <div key={msg.id} className={`flex ${msg.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[70%] rounded-2xl px-4 py-2 ${msg.direction === 'outbound' ? 'rounded-tr-sm bg-emerald-500 text-white' : 'rounded-tl-sm border border-slate-200 bg-white text-slate-800 shadow-sm'}`}>
                          <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
                          <div className={`mt-1 text-right text-[10px] ${msg.direction === 'outbound' ? 'text-emerald-100' : 'text-slate-400'}`}>
                            {new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </div>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                  <div className="border-t border-slate-200 bg-white p-4">
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (!replyText.trim()) return;
                        
                        const text = replyText.trim();
                        setReplyText('');
                        
                        // Optimistic UI update
                        const newMsg: Message = {
                          id: Date.now(),
                          phone: selectedPhone,
                          direction: 'outbound',
                          content: text,
                          created_at: new Date().toISOString()
                        };
                        setMessages(prev => [...prev, newMsg]);

                        authFetch('/api/messages/send', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ phone: selectedPhone, content: text })
                        }).catch(console.error);
                      }}
                      className="flex gap-2"
                    >
                      <input
                        type="text"
                        value={replyText}
                        onChange={e => setReplyText(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 rounded-full border border-slate-300 px-4 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                      <button type="submit" className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 text-white transition-colors hover:bg-emerald-600">
                        <Send className="h-4 w-4" />
                      </button>
                    </form>
                  </div>
                </>
              ) : (
                <div className="flex flex-1 flex-col items-center justify-center gap-3 text-slate-400">
                  <MessageSquare className="h-12 w-12 opacity-20" />
                  <p>Select a conversation to start messaging</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
