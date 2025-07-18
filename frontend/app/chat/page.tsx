'use client';

import { useState, useEffect, useRef } from 'react';
import { Send, Video, User, Bot, LogOut, Play, MessageSquare, History, ChevronRight, Sparkles, Zap } from 'lucide-react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

interface ChatHistory {
    videoUrl: string;
    question: string;
    answer: string;
    createdAt: string;
}

interface ChatMessage {
    type: 'user' | 'bot';
    content: string;
    timestamp: Date;
}

interface VideoInfo {
    title: string;
    thumbnail: string;
    videoId: string;
    embedUrl: string;
}

export default function Chat() {
    const [token, setToken] = useState<string>('');
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [videoUrl, setVideoUrl] = useState<string>('');
    const [query, setQuery] = useState<string>('');
    const [chunks, setChunks] = useState<string[]>([]);
    const [history, setHistory] = useState<ChatHistory[]>([]);
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isProcessing, setIsProcessing] = useState<boolean>(false);
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [currentVideoInfo, setCurrentVideoInfo] = useState<VideoInfo | null>(null);
    const [activeTab, setActiveTab] = useState<'chat' | 'history'>('chat');
    const [answer, setAnswer] = useState<string>('');

    const chatEndRef = useRef<HTMLDivElement>(null);

    const extractVideoId = (url: string): string | null => {
        const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/;
        const match = url.match(regex);
        return match ? match[1] : null;
    };

    const getVideoInfo = (url: string): VideoInfo | null => {
        const videoId = extractVideoId(url);
        if (!videoId) return null;

        return {
            title: `YouTube Video - ${videoId}`,
            thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
            videoId,
            embedUrl: `https://www.youtube.com/embed/${videoId}`
        };
    };

    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        if (storedToken) {
            try {
                // Verify token is not expired
                const decoded = jwtDecode(storedToken);
                if (decoded.exp && decoded.exp * 1000 < Date.now()) {
                    handleLogout();
                    return;
                }

                setToken(storedToken);
                setIsAuthenticated(true);
                fetchHistory(storedToken);
            } catch (err) {
                console.error('Invalid token:', err);
                handleLogout();
            }
        }
    }, []);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatMessages]);

    const fetchHistory = async (token: string) => {
        try {
            if (!token || token.trim() === '') {
                console.error('No token provided');
                return;
            }

            const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/chat/history`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
            });
            setHistory(res.data);
        } catch (err: any) {
            console.error('Error fetching history:', err);
            if (err.response?.status === 401) {
                handleLogout();
                alert('Session expired. Please login again.');
            }
        }
    };

    const handleRegister = async () => {
        try {
            const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/register`, {
                email,
                password,
            });
            setToken(res.data.token);
            localStorage.setItem('token', res.data.token);
            setIsAuthenticated(true);
            fetchHistory(res.data.token);
        } catch (err: any) {
            alert('Registration failed: ' + err.response?.data?.error || 'Unknown error');
        }
    };

    const handleLogin = async () => {
        try {
            const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
                email,
                password,
            });
            setToken(res.data.token);
            localStorage.setItem('token', res.data.token);
            setIsAuthenticated(true);
            fetchHistory(res.data.token);
        } catch (err: any) {
            alert('Login failed: ' + err.response?.data?.error || 'Unknown error');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        setToken('');
        setIsAuthenticated(false);
        setChunks([]);
        setHistory([]);
        setChatMessages([]);
        setCurrentVideoInfo(null);
    };

    const handleProcessVideo = async () => {
        setIsProcessing(true);
        try {
            const videoInfo = getVideoInfo(videoUrl);
            if (!videoInfo) {
                alert('Invalid YouTube URL');
                setIsProcessing(false);
                return;
            }

            setCurrentVideoInfo(videoInfo);

            const res = await axios.post(
                `${process.env.NEXT_PUBLIC_API_URL}/api/chat/process-video`,
                { videoUrl },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setChunks(res.data.chunks);
            setChatMessages([{
                type: 'bot',
                content: res.data.message || `Video processed successfully! I'm ready to answer questions about: ${videoInfo.title}`,
                timestamp: new Date()
            }]);
        } catch (err: any) {
            alert('Error processing video: ' + err.response?.data?.error || 'Unknown error');
        }
        setIsProcessing(false);
    };

    const handleAskQuestion = async () => {
        const trimmedQuery = query.trim();
        if (!trimmedQuery) return;

        const userMessage: ChatMessage = {
            type: 'user',
            content: trimmedQuery,
            timestamp: new Date()
        };

        setChatMessages(prev => [...prev, userMessage]);
        setQuery('');
        setIsLoading(true);

        try {
            const res = await axios.post(
                `${process.env.NEXT_PUBLIC_API_URL}/api/chat/ask`,
                { query: trimmedQuery, chunks, videoUrl },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const botMessage: ChatMessage = {
                type: 'bot',
                content: res.data.answer,
                timestamp: new Date()
            };

            setChatMessages(prev => [...prev, botMessage]);
            setAnswer(res.data.answer);
            fetchHistory(token);
        } catch (err: any) {
            const errorMsg = err?.response?.data?.error || err?.message || 'Unknown error';
            alert('Error asking question: ' + errorMsg);
        }

        setIsLoading(false);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleAskQuestion();
        }
    };

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white overflow-hidden">
                {/* Animated Background */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
                    <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse animation-delay-2000"></div>
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse animation-delay-4000"></div>
                </div>

                <div className="relative z-10 flex items-center justify-center min-h-screen px-4 sm:px-6 lg:px-8 py-12">
                    <div className="w-full max-w-md bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl shadow-xl p-8">
                        <div className="text-center mb-8">
                            <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <Video className="w-8 h-8 text-white" />
                            </div>
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent mb-2">VideoChat</h1>
                            <p className="text-gray-300">Ask questions about any YouTube video</p>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Enter your email"
                                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-white placeholder-gray-400 transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter your password"
                                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-white placeholder-gray-400 transition-all"
                                />
                            </div>

                            <div className="flex space-x-3">
                                <button
                                    onClick={handleRegister}
                                    className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium py-3 px-4 rounded-lg transition-all transform hover:scale-[1.02]"
                                >
                                    Register
                                </button>
                                <button
                                    onClick={handleLogin}
                                    className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-medium py-3 px-4 rounded-lg transition-all transform hover:scale-[1.02]"
                                >
                                    Login
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white overflow-hidden">
            {/* Animated Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse animation-delay-2000"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse animation-delay-4000"></div>
            </div>

            {/* Header */}
            <header className="relative z-10 bg-slate-800/50 backdrop-blur-sm border-b border-slate-700">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center">
                            <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-pink-500 rounded-lg flex items-center justify-center mr-3">
                                <Video className="w-5 h-5 text-white" />
                            </div>
                            <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">VideoChat</h1>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="flex items-center space-x-2 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white px-4 py-2 rounded-lg transition-all transform hover:scale-[1.03]"
                        >
                            <LogOut className="w-4 h-4" />
                            <span className="hidden sm:inline">Logout</span>
                        </button>
                    </div>
                </div>
            </header>

            <div className="relative z-10 flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
                    {/* Video Section */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-6">
                            <h2 className="text-xl font-semibold mb-4 flex items-center">
                                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mr-3">
                                    <Play className="w-4 h-4 text-white" />
                                </div>
                                Process Video
                            </h2>
                            <div className="space-y-4">
                                <input
                                    type="text"
                                    value={videoUrl}
                                    onChange={(e) => setVideoUrl(e.target.value)}
                                    placeholder="Paste YouTube URL here..."
                                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-white placeholder-gray-400"
                                />
                                <button
                                    onClick={handleProcessVideo}
                                    disabled={isProcessing || !videoUrl.trim()}
                                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:bg-slate-700 text-white font-medium py-3 px-4 rounded-lg transition-all transform hover:scale-[1.02] flex items-center justify-center"
                                >
                                    {isProcessing ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                                            Processing...
                                        </>
                                    ) : (
                                        'Process Video'
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Video Player */}
                        {currentVideoInfo && (
                            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-6">
                                <h3 className="text-lg font-semibold mb-4 flex items-center">
                                    <Zap className="w-5 h-5 text-yellow-400 mr-2" />
                                    Current Video
                                </h3>
                                <div className="aspect-w-16 aspect-h-9 mb-4">
                                    <iframe
                                        src={currentVideoInfo.embedUrl}
                                        title={currentVideoInfo.title}
                                        className="w-full h-48 rounded-lg"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                    ></iframe>
                                </div>
                                <p className="text-sm text-gray-300 truncate">{currentVideoInfo.title}</p>
                            </div>
                        )}
                    </div>

                    {/* Chat Section */}
                    <div className="lg:col-span-2">
                        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl h-full flex flex-col overflow-hidden">
                            {/* Tab Navigation */}
                            <div className="flex border-b border-slate-700">
                                <button
                                    onClick={() => setActiveTab('chat')}
                                    className={`flex-1 py-4 px-6 text-center font-medium transition-all ${activeTab === 'chat'
                                        ? 'text-purple-400 border-b-2 border-purple-500'
                                        : 'text-gray-400 hover:text-gray-300'
                                        }`}
                                >
                                    <MessageSquare className="w-4 h-4 inline mr-2" />
                                    Chat
                                </button>
                                <button
                                    onClick={() => setActiveTab('history')}
                                    className={`flex-1 py-4 px-6 text-center font-medium transition-all ${activeTab === 'history'
                                        ? 'text-purple-400 border-b-2 border-purple-500'
                                        : 'text-gray-400 hover:text-gray-300'
                                        }`}
                                >
                                    <History className="w-4 h-4 inline mr-2" />
                                    History
                                </button>
                            </div>

                            {activeTab === 'chat' ? (
                                <>
                                    {/* Chat Messages */}
                                    <div className="flex-1 overflow-y-auto p-6 space-y-4 min-h-0">
                                        {chatMessages.length === 0 ? (
                                            <div className="text-center text-gray-400 py-12">
                                                <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                                                    <MessageSquare className="w-8 h-8 text-gray-500" />
                                                </div>
                                                <p>Process a YouTube video to start chatting!</p>
                                                <p className="text-sm mt-2 text-gray-500">Paste a YouTube URL and click "Process Video"</p>
                                            </div>
                                        ) : (
                                            chatMessages.map((message, index) => (
                                                <div
                                                    key={index}
                                                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                                                >
                                                    <div
                                                        className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${message.type === 'user'
                                                            ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                                                            : 'bg-slate-700 text-gray-200'
                                                            }`}
                                                    >
                                                        <div className="flex items-start space-x-3">
                                                            {message.type === 'bot' && (
                                                                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center flex-shrink-0">
                                                                    <Bot className="w-4 h-4 text-white" />
                                                                </div>
                                                            )}
                                                            {message.type === 'user' && (
                                                                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
                                                                    <User className="w-4 h-4 text-white" />
                                                                </div>
                                                            )}
                                                            <div className="flex-1">
                                                                <div className="text-sm space-y-2 leading-relaxed whitespace-pre-wrap">
                                                                    {message.content.split('\n').map((line, idx) => {
                                                                        const trimmed = line.trim();

                                                                        if (/^\d+\.\s/.test(trimmed)) {
                                                                            // Numbered list
                                                                            return <p key={idx} className="pl-4">{trimmed}</p>;
                                                                        }

                                                                        if (/^- /.test(trimmed)) {
                                                                            // Bullet point
                                                                            return <p key={idx} className="pl-4 before:content-['•_'] before:mr-1">{trimmed.slice(2)}</p>;
                                                                        }

                                                                        // Regular paragraph
                                                                        return <p key={idx}>{trimmed}</p>;
                                                                    })}
                                                                </div>

                                                                <p className="text-xs opacity-70 mt-2">
                                                                    {message.timestamp.toLocaleTimeString()}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                        {isLoading && (
                                            <div className="flex justify-start">
                                                <div className="bg-slate-700 rounded-2xl px-4 py-3 max-w-xs lg:max-w-md">
                                                    <div className="flex items-center space-x-3">
                                                        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
                                                            <Bot className="w-4 h-4 text-white" />
                                                        </div>
                                                        <div className="flex space-x-1">
                                                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        <div ref={chatEndRef} />
                                    </div>

                                    {/* Chat Input */}
                                    {chunks.length > 0 && (
                                        <div className="p-6 border-t border-slate-700">
                                            <div className="flex space-x-3">
                                                <input
                                                    type="text"
                                                    value={query}
                                                    onChange={(e) => setQuery(e.target.value)}
                                                    onKeyPress={handleKeyPress}
                                                    placeholder="Ask a question about the video..."
                                                    className="flex-1 px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-white placeholder-gray-400"
                                                    disabled={isLoading}
                                                />
                                                <button
                                                    onClick={handleAskQuestion}
                                                    disabled={isLoading || !query.trim()}
                                                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:bg-slate-700 text-white px-6 py-3 rounded-lg transition-all transform hover:scale-[1.03] flex items-center"
                                                >
                                                    <Send className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </>
                            ) : (
                                /* History Tab */
                                <div className="flex-1 overflow-y-auto p-6">
                                    {history.length === 0 ? (
                                        <div className="text-center text-gray-400 py-12">
                                            <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <History className="w-8 h-8 text-gray-500" />
                                            </div>
                                            <p>No chat history yet</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {history.map((chat, index) => (
                                                <div key={index} className="bg-slate-700/50 rounded-xl p-4 border border-slate-600">
                                                    <div className="text-sm text-gray-400 mb-2">
                                                        {new Date(chat.createdAt).toLocaleString()}
                                                    </div>
                                                    <div className="text-sm text-purple-400 mb-2 truncate">
                                                        Video: {chat.videoUrl}
                                                    </div>
                                                    <div className="mb-2">
                                                        <strong className="text-gray-300">Q:</strong> <span className="text-gray-200">{chat.question}</span>
                                                    </div>
                                                    <div>
                                                        <strong className="text-gray-300">A:</strong> <span className="text-gray-200">{chat.answer}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}