import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, query, orderBy, onSnapshot, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { Trash2, CheckCircle, Clock, Phone, User, Calendar, ExternalLink, ShieldAlert } from 'lucide-react';

interface Consultation {
  id: string;
  name: string;
  phone: string;
  carrier: string;
  status: 'pending' | 'completed';
  createdAt: any;
}

export default function AdminDashboard() {
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');

  // Simple secret password for the demo - in a real app, use Firebase Auth
  const SECRET_KEY = 'vitamin123'; 

  useEffect(() => {
    if (!isAuthenticated) return;

    const q = query(collection(db, 'consultations'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Consultation[];
      setConsultations(data);
      setLoading(false);
      
      // Browser Notification for new requests
      if (!snapshot.metadata.hasPendingWrites && snapshot.docChanges().some(change => change.type === 'added')) {
        if (Notification.permission === 'granted') {
          new Notification('새로운 상담 신청!', {
            body: '비타민인터넷에 새로운 상담 신청이 들어왔습니다.',
            icon: '/favicon.ico'
          });
        }
      }
    });

    return () => unsubscribe();
  }, [isAuthenticated]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === SECRET_KEY) {
      setIsAuthenticated(true);
      if (Notification.permission !== 'granted') {
        Notification.requestPermission();
      }
    } else {
      alert('비밀번호가 틀렸습니다.');
    }
  };

  const toggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'pending' ? 'completed' : 'pending';
    await updateDoc(doc(db, 'consultations', id), { status: newStatus });
  };

  const deleteRequest = async (id: string) => {
    if (window.confirm('정말 삭제하시겠습니까?')) {
      await deleteDoc(doc(db, 'consultations', id));
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-md"
        >
          <div className="flex flex-col items-center mb-8">
            <div className="bg-amber-100 p-4 rounded-full mb-4">
              <ShieldAlert className="w-10 h-10 text-brand-yellow-dark" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">관리자 로그인</h1>
            <p className="text-gray-500 text-sm">상담 내역 확인을 위해 비밀번호를 입력하세요.</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호 입력"
              className="w-full px-6 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-brand-yellow outline-none transition-all"
              autoFocus
            />
            <button
              type="submit"
              className="w-full bg-brand-yellow hover:bg-brand-yellow-dark text-white py-4 rounded-2xl font-bold text-lg shadow-lg transition-all active:scale-95"
            >
              접속하기
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-brand-yellow p-2 rounded-xl">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">상담 관리 대시보드</h1>
              <p className="text-xs text-gray-500">실시간으로 신청 내역을 확인합니다.</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-amber-50 px-4 py-2 rounded-full border border-amber-100">
              <span className="text-sm font-bold text-brand-yellow-dark">총 {consultations.length}건</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-yellow"></div>
          </div>
        ) : consultations.length === 0 ? (
          <div className="bg-white rounded-3xl p-20 text-center border border-gray-100">
            <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <User className="w-10 h-10 text-gray-300" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">아직 신청 내역이 없습니다.</h2>
            <p className="text-gray-500">새로운 상담이 들어오면 여기에 표시됩니다.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            <AnimatePresence mode="popLayout">
              {consultations.map((item) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`bg-white p-6 rounded-3xl border transition-all ${
                    item.status === 'completed' ? 'border-gray-100 opacity-75' : 'border-amber-100 shadow-sm'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex flex-wrap items-center gap-6">
                      <div className="flex items-center gap-3 min-w-[150px]">
                        <div className={`p-3 rounded-2xl ${item.status === 'completed' ? 'bg-gray-100' : 'bg-amber-100'}`}>
                          <User className={`w-5 h-5 ${item.status === 'completed' ? 'text-gray-400' : 'text-brand-yellow-dark'}`} />
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 font-medium">신청자</p>
                          <p className="font-bold text-gray-900">{item.name}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 min-w-[180px]">
                        <div className={`p-3 rounded-2xl ${item.status === 'completed' ? 'bg-gray-100' : 'bg-blue-50'}`}>
                          <Phone className={`w-5 h-5 ${item.status === 'completed' ? 'text-gray-400' : 'text-blue-500'}`} />
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 font-medium">연락처</p>
                          <a href={`tel:${item.phone}`} className="font-bold text-gray-900 hover:text-blue-600 transition-colors">
                            {item.phone}
                          </a>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 min-w-[120px]">
                        <div className={`p-3 rounded-2xl ${item.status === 'completed' ? 'bg-gray-100' : 'bg-purple-50'}`}>
                          <ExternalLink className={`w-5 h-5 ${item.status === 'completed' ? 'text-gray-400' : 'text-purple-500'}`} />
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 font-medium">통신사</p>
                          <p className="font-bold text-gray-900">{item.carrier}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 min-w-[180px]">
                        <div className={`p-3 rounded-2xl ${item.status === 'completed' ? 'bg-gray-100' : 'bg-green-50'}`}>
                          <Calendar className={`w-5 h-5 ${item.status === 'completed' ? 'text-gray-400' : 'text-green-500'}`} />
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 font-medium">신청시간</p>
                          <p className="font-bold text-gray-900">
                            {item.createdAt?.seconds 
                              ? format(new Date(item.createdAt.seconds * 1000), 'yyyy-MM-dd HH:mm') 
                              : '방금 전'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleStatus(item.id, item.status)}
                        className={`flex-1 md:flex-none px-6 py-3 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                          item.status === 'completed'
                            ? 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                            : 'bg-green-500 text-white hover:bg-green-600 shadow-lg shadow-green-500/20'
                        }`}
                      >
                        {item.status === 'completed' ? (
                          <>
                            <Clock className="w-4 h-4" />
                            대기중으로 변경
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4" />
                            상담 완료 처리
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => deleteRequest(item.id)}
                        className="p-3 bg-red-50 text-red-500 rounded-2xl hover:bg-red-100 transition-all"
                        title="삭제"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>
    </div>
  );
}
