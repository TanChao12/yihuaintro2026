import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, onSnapshot, collection, addDoc, updateDoc } from 'firebase/firestore';
import { Heart, Send, Plus, MapPin, Calendar, Clock, Sparkles, MessageSquare, ThumbsUp, User, ShieldAlert, ArrowRight, CheckCircle2, QrCode, Monitor, ExternalLink, RefreshCw } from 'lucide-react';

const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {
    apiKey: "dummy", authDomain: "dummy", projectId: "dummy", storageBucket: "dummy", messagingSenderId: "dummy", appId: "dummy"
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'yihua-intro-night';

// Bad Word Validation List
const BAD_WORDS = [
    'fuck', 'shit', 'bitch', 'asshole', 'bodoh', 'babi', 'sial', 'pukimak', 'lancau', 
    'dick', 'pussy', 'cunt', 'nigger', 'faggot', 'anjing', 'celaka', 'kampang', 'Knn', 'Cb'
];

const containsBadWords = (text) => {
    const lowerText = text.toLowerCase();
    return BAD_WORDS.some(word => lowerText.includes(word));
};

export default function App() {
    const [user, setUser] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [newQuestion, setNewQuestion] = useState("");
    const [isAsking, setIsAsking] = useState(false);
    const [scriptsLoaded, setScriptsLoaded] = useState(false);
    
    // Slido-style Onboarding State
    const [hasJoined, setHasJoined] = useState(false);
    const [userName, setUserName] = useState("");
    const [isAnonymous, setIsAnonymous] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [filterTab, setFilterTab] = useState("top"); // 'top' or 'recent'
    const [copiedQr, setCopiedQr] = useState(false);

    // View Mode (Normal website vs Projection Dashboard view)
    const [viewMode, setViewMode] = useState("main"); // 'main' or 'dashboard'
    
    const containerRef = useRef(null);
    const cursorRef = useRef(null);
    const cursorDotRef = useRef(null);

    // Check URL query for view mode on mount
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get('view') === 'dashboard' || window.location.hash === '#dashboard') {
            setViewMode('dashboard');
        }
    }, []);

    // Load External Scripts (GSAP & Lenis)
    useEffect(() => {
        const loadScripts = async () => {
            const loadScript = (src) => new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = src;
                script.onload = resolve;
                script.onerror = reject;
                document.head.appendChild(script);
            });

            try {
                await loadScript("https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js");
                await loadScript("https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/ScrollTrigger.min.js");
                await loadScript("https://cdn.jsdelivr.net/gh/studio-freight/lenis@1.0.29/bundled/lenis.min.js");
                setScriptsLoaded(true);
            } catch (error) {
                console.error("Failed to load animation scripts", error);
            }
        };
        loadScripts();
    }, []);

    useLayoutEffect(() => {
        if (!scriptsLoaded || !window.Lenis || !window.gsap || viewMode === 'dashboard') return;

        const lenis = new window.Lenis({
            duration: 1.4,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            orientation: 'vertical',
            gestureOrientation: 'vertical',
            smoothWheel: true,
            wheelMultiplier: 1,
            touchMultiplier: 2,
            infinite: false,
        });

        lenis.on('scroll', window.ScrollTrigger.update);

        window.gsap.ticker.add((time) => {
            lenis.raf(time * 1000);
        });

        window.gsap.ticker.lagSmoothing(0, 0);

        return () => {
            window.gsap.ticker.remove((time) => { lenis.raf(time * 1000); });
            lenis.destroy();
        };
    }, [scriptsLoaded, viewMode]);

    // Custom Cursor
    useEffect(() => {
        if (!scriptsLoaded || !window.gsap || viewMode === 'dashboard') return;
        const gsap = window.gsap;

        let mouseX = window.innerWidth / 2;
        let mouseY = window.innerHeight / 2;
        let cursorX = mouseX;
        let cursorY = mouseY;
        
        const onMouseMove = (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
        };
        window.addEventListener('mousemove', onMouseMove);

        let animationFrameId;
        const renderCursor = () => {
            cursorX += (mouseX - cursorX) * 0.18;
            cursorY += (mouseY - cursorY) * 0.18;
            
            if (cursorRef.current && cursorDotRef.current) {
                gsap.set(cursorRef.current, { x: cursorX, y: cursorY });
                gsap.set(cursorDotRef.current, { x: mouseX, y: mouseY });
            }
            animationFrameId = requestAnimationFrame(renderCursor);
        };
        animationFrameId = requestAnimationFrame(renderCursor);

        return () => {
            window.removeEventListener('mousemove', onMouseMove);
            cancelAnimationFrame(animationFrameId);
        };
    }, [scriptsLoaded, viewMode]);

    // GSAP Scroll Animations
    useLayoutEffect(() => {
        if (!scriptsLoaded || !window.gsap || !window.ScrollTrigger || viewMode === 'dashboard') return;
        const gsap = window.gsap;
        const ScrollTrigger = window.ScrollTrigger;
        gsap.registerPlugin(ScrollTrigger);

        const heroTl = gsap.timeline();
        heroTl.fromTo('.hero-reveal', 
            { y: 80, opacity: 0 }, 
            { y: 0, opacity: 1, stagger: 0.15, duration: 1.4, ease: "power4.out", delay: 0.3 }
        );

        const fadeSections = document.querySelectorAll('.fade-in-section');
        fadeSections.forEach(section => {
            gsap.fromTo(section, 
                { y: 60, opacity: 0 },
                {
                    scrollTrigger: {
                        trigger: section,
                        start: "top 85%",
                        toggleActions: "play none none reverse"
                    },
                    y: 0,
                    opacity: 1,
                    duration: 1.2,
                    ease: "power3.out"
                }
            );
        });

        return () => {
            ScrollTrigger.getAll().forEach(t => t.kill());
        };
    }, [scriptsLoaded, viewMode]);

    useEffect(() => {
        const initAuth = async () => {
            try {
                if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
                    await signInWithCustomToken(auth, __initial_auth_token);
                } else {
                    await signInAnonymously(auth);
                }
            } catch (error) {
                console.error("Auth error:", error);
            }
        };
        initAuth();

        const unsubscribe = onAuthStateChanged(auth, setUser);
        return () => unsubscribe();
    }, []);

    // Firebase Realtime Questions Sync
    useEffect(() => {
        if (!user) return;

        const questionsRef = collection(db, 'artifacts', appId, 'public', 'data', 'yihua_qna_v2');
        const unsubscribe = onSnapshot(questionsRef, (snapshot) => {
            const qList = [];
            snapshot.forEach((doc) => {
                qList.push({ id: doc.id, ...doc.data() });
            });
            
            qList.sort((a, b) => {
                if (filterTab === 'top') {
                    if (b.upvotes !== a.upvotes) return b.upvotes - a.upvotes;
                    return b.timestamp - a.timestamp;
                } else {
                    return b.timestamp - a.timestamp;
                }
            });
            setQuestions(qList);
        }, (error) => {
            console.error("Error fetching questions:", error);
        });

        return () => unsubscribe();
    }, [user, filterTab]);

    const handleJoinSession = (e) => {
        e.preventDefault();
        if (!isAnonymous && !userName.trim()) {
            setErrorMsg("Please enter your name or join anonymously.");
            return;
        }
        setErrorMsg("");
        setHasJoined(true);
    };

    const handleAskQuestion = async (e) => {
        e.preventDefault();
        if (!user || !newQuestion.trim()) return;
        
        if (containsBadWords(newQuestion)) {
            setErrorMsg("⚠️ Your question contains restricted language. Please keep it respectful.");
            return;
        }
        
        setIsAsking(true);
        setErrorMsg("");
        try {
            const questionsRef = collection(db, 'artifacts', appId, 'public', 'data', 'yihua_qna_v2');
            await addDoc(questionsRef, {
                text: newQuestion.trim(),
                authorId: user.uid,
                authorName: isAnonymous || !userName.trim() ? "Anonymous Fresher" : userName.trim(),
                upvotes: 0,
                upvotedBy: {},
                timestamp: Date.now()
            });
            setNewQuestion("");
        } catch (error) {
            console.error("Error adding question:", error);
        } finally {
            setIsAsking(false);
        }
    };

    const handleUpvote = async (question) => {
        if (!user) return;
        const hasUpvoted = question.upvotedBy && question.upvotedBy[user.uid];
        const qRef = doc(db, 'artifacts', appId, 'public', 'data', 'yihua_qna_v2', question.id);
        
        try {
            if (hasUpvoted) {
                const newUpvotedBy = { ...question.upvotedBy };
                delete newUpvotedBy[user.uid];
                await updateDoc(qRef, { upvotes: Math.max(0, question.upvotes - 1), upvotedBy: newUpvotedBy });
            } else {
                await updateDoc(qRef, { upvotes: question.upvotes + 1, upvotedBy: { ...question.upvotedBy, [user.uid]: true } });
            }
        } catch (error) {
            console.error("Error upvoting:", error);
        }
    };

    const agendaData = [
        { time: "7:30 p.m.", title: "报道", sub: "Registration & Welcome" },
        { time: "7:45 p.m.", title: "Opening", sub: "开场仪式" },
        { time: "7:50 p.m.", title: "毅华宿舍村介绍", sub: "Village Heritage Intro" },
        { time: "8:00 p.m.", title: "25/26 理事会介绍 + 26/27 招募", sub: "Committee Showcase" },
        { time: "8:10 p.m.", title: "Ice Breaking", sub: "破冰环节" },
        { time: "8:25 p.m.", title: "游戏环节", sub: "Interactive Mini Games" },
        { time: "8:50 p.m.", title: "惩罚环节", sub: "Punishment Challenge" },
        { time: "9:00 p.m.", title: "Senior 分享", sub: "Senior Insider Tips" },
        { time: "9:10 p.m.", title: "Q&A Session", sub: "Live Slido Q&A" },
        { time: "9:20 p.m.", title: "Closing + 活动反馈", sub: "Closing & Feedback" },
        { time: "9:30 p.m.", title: "大合照", sub: "Grand Finale Group Photo" }
    ];

    if (viewMode === 'dashboard') {
        return (
            <div className="min-h-screen bg-[var(--bg-obsidian)] text-[var(--text-primary)] p-8 lg:p-12 font-sans flex flex-col justify-between">
                <style dangerouslySetInnerHTML={{__html: `
                    @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700;900&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap');
                    :root {
                        --bg-obsidian: #080706;
                        --bg-card: #12100E;
                        --text-primary: #F4F1EA;
                        --text-muted: #A39E93;
                        --accent-gold: #D4AF37;
                        --accent-red: #990000;
                        --border-subtle: rgba(212, 175, 55, 0.2);
                    }
                    body { background-color: var(--bg-obsidian); color: var(--text-primary); }
                    .font-editorial { font-family: 'Cinzel', serif; }
                    .glass-card { background: rgba(18, 16, 14, 0.85); backdrop-filter: blur(16px); border: 1px solid var(--border-subtle); }
                    .gold-gradient { background: linear-gradient(135deg, #FFF 0%, #D4AF37 50%, #AA7C11 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
                `}} />

                <header className="flex items-center justify-between pb-8 border-b border-[var(--border-subtle)]">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-[var(--accent-red)] flex items-center justify-center border border-[var(--accent-gold)]">
                            <span className="font-editorial text-xl font-bold text-[var(--accent-gold)]">毅</span>
                        </div>
                        <div>
                            <h1 className="font-editorial text-2xl font-bold tracking-wider gold-gradient">毅见倾新 · Live Q&A Dashboard</h1>
                            <p className="text-xs text-[var(--text-muted)] tracking-widest uppercase">Kolej Pendeta Za'ba (KPZ) · Grand Hall Projection View</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2 bg-red-950/60 border border-red-500/40 px-4 py-2 rounded-full">
                            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
                            <span className="text-xs font-bold text-red-300 tracking-wider uppercase">Live Slido Sync Active</span>
                        </div>

                        <div className="flex bg-[var(--bg-card)] p-1 rounded-xl border border-[var(--border-subtle)]">
                            <button 
                                onClick={() => setFilterTab('top')} 
                                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${filterTab === 'top' ? 'bg-[var(--accent-gold)] text-[var(--bg-obsidian)]' : 'text-[var(--text-muted)]'}`}
                            >
                                🔥 最热门 (Top)
                            </button>
                            <button 
                                onClick={() => setFilterTab('recent')} 
                                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${filterTab === 'recent' ? 'bg-[var(--accent-gold)] text-[var(--bg-obsidian)]' : 'text-[var(--text-muted)]'}`}
                            >
                                ⚡ 最新 (Recent)
                            </button>
                        </div>

                        <button 
                            onClick={() => setViewMode('main')}
                            className="px-5 py-2.5 rounded-xl glass-card text-xs font-semibold text-[var(--accent-gold)] hover:border-[var(--accent-gold)] transition-colors flex items-center gap-2"
                        >
                            <ExternalLink className="w-4 h-4" />
                            <span>返回主官网</span>
                        </button>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 my-8 flex-1 items-start">
                    <div className="lg:col-span-4 glass-card rounded-3xl p-8 border border-[var(--accent-gold)]/30 text-center space-y-6">
                        <div className="inline-block p-4 rounded-2xl bg-white shadow-2xl">
                            <div className="w-48 h-48 bg-black flex flex-col items-center justify-center text-white p-4 rounded-xl relative overflow-hidden">
                                <QrCode className="w-36 h-36 text-[var(--accent-gold)]" />
                            </div>
                        </div>
                        <div>
                            <h3 className="font-editorial text-xl font-bold mb-1">扫描二维码提问</h3>
                            <p className="text-xs text-[var(--text-muted)]">Scan to join Slido & Ask Questions</p>
                        </div>
                        <div className="p-4 rounded-2xl bg-[var(--bg-obsidian)] border border-[var(--border-subtle)] text-left space-y-2">
                            <div className="flex justify-between text-xs">
                                <span className="text-[var(--text-muted)]">活动日期：</span>
                                <span className="font-semibold text-white">01/10/2026 (周四)</span>
                            </div>
                            <div className="flex justify-between text-xs">
                                <span className="text-[var(--text-muted)]">提问人数：</span>
                                <span className="font-semibold text-[var(--accent-gold)]">{questions.length} 个实时提问</span>
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-8 space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                        {questions.length === 0 ? (
                            <div className="glass-card rounded-3xl p-16 text-center text-[var(--text-muted)]">
                                <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-30 text-[var(--accent-gold)] animate-bounce" />
                                <h3 className="font-editorial text-2xl font-bold mb-2">等待新生提问中...</h3>
                                <p className="text-sm">扫一扫左侧二维码，即可在手机上向台上嘉宾提问！</p>
                            </div>
                        ) : (
                            questions.map((q, idx) => (
                                <div key={q.id} className="glass-card rounded-2xl p-6 border border-[var(--accent-gold)]/30 flex items-start justify-between gap-6 shadow-xl animate-fade-in">
                                    <div className="flex items-start gap-4 flex-1">
                                        <div className="w-10 h-10 rounded-xl bg-[var(--accent-red)]/30 border border-[var(--accent-gold)]/40 flex items-center justify-center font-mono font-bold text-[var(--accent-gold)] shrink-0 text-lg">
                                            #{idx + 1}
                                        </div>
                                        <div className="space-y-2 flex-1">
                                            <div className="flex items-center gap-3">
                                                <span className="text-sm font-bold text-[var(--accent-gold)]">{q.authorName}</span>
                                                <span className="text-xs text-[var(--text-muted)]">• {new Date(q.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                            <p className="text-white text-lg font-medium leading-relaxed break-words">{q.text}</p>
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-center justify-center bg-[var(--bg-obsidian)] border border-[var(--accent-gold)]/40 px-5 py-3 rounded-2xl text-[var(--accent-gold)] shrink-0">
                                        <ThumbsUp className="w-5 h-5 mb-1 fill-current" />
                                        <span className="font-mono text-xl font-bold">{q.upvotes || 0}</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <footer className="pt-6 border-t border-[var(--border-subtle)] text-center text-xs text-[var(--text-muted)] flex justify-between items-center">
                    <span>Kolej Pendeta Za'ba (KPZ) · 毅见倾新 Q&A System</span>
                    <span className="text-[var(--accent-gold)] font-mono">Arrive as Strangers. Rise as One.</span>
                </footer>
            </div>
        );
    }

    return (
        <>
            <style dangerouslySetInnerHTML={{__html: `
                @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700;900&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap');
                
                :root {
                    --bg-obsidian: #080706;
                    --bg-card: #12100E;
                    --text-primary: #F4F1EA;
                    --text-muted: #A39E93;
                    --accent-gold: #D4AF37;
                    --accent-gold-glow: rgba(212, 175, 55, 0.25);
                    --accent-red: #990000;
                    --accent-red-bright: #D32F2F;
                    --border-subtle: rgba(212, 175, 55, 0.15);
                }

                body {
                    background-color: var(--bg-obsidian);
                    color: var(--text-primary);
                    font-family: 'Plus Jakarta Sans', sans-serif;
                    overflow-x: hidden;
                    cursor: none;
                }

                .font-editorial {
                    font-family: 'Cinzel', serif;
                }

                ::-webkit-scrollbar {
                    width: 6px;
                }
                ::-webkit-scrollbar-track {
                    background: var(--bg-obsidian);
                }
                ::-webkit-scrollbar-thumb {
                    background: #2A241F;
                    border-radius: 3px;
                }
                ::-webkit-scrollbar-thumb:hover {
                    background: var(--accent-gold);
                }

                .gold-gradient-text {
                    background: linear-gradient(135deg, #FFF 0%, #D4AF37 50%, #AA7C11 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }

                .glass-card {
                    background: rgba(18, 16, 14, 0.75);
                    backdrop-filter: blur(16px);
                    border: 1px solid var(--border-subtle);
                }

                .glass-card-hover:hover {
                    border-color: rgba(212, 175, 55, 0.4);
                    box-shadow: 0 10px 30px rgba(212, 175, 55, 0.08);
                }
            `}} />

            <div ref={cursorRef} className="fixed top-0 left-0 w-10 h-10 rounded-full border border-[var(--accent-gold)] pointer-events-none z-[9999] transform -translate-x-1/2 -translate-y-1/2 hidden md:block transition-transform duration-100 ease-out"></div>
            <div ref={cursorDotRef} className="fixed top-0 left-0 w-2 h-2 rounded-full bg-[var(--accent-gold)] pointer-events-none z-[9999] transform -translate-x-1/2 -translate-y-1/2 hidden md:block"></div>

            <div ref={containerRef} className="min-h-screen bg-[var(--bg-obsidian)] selection:bg-[var(--accent-red)] selection:text-white">
                
                <header className="fixed top-0 left-0 w-full z-50 px-6 lg:px-16 py-6 flex items-center justify-between backdrop-blur-md border-b border-[var(--border-subtle)] bg-[var(--bg-obsidian)]/80">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[var(--accent-red)] flex items-center justify-center border border-[var(--accent-gold)]">
                            <span className="font-editorial text-lg font-bold text-[var(--accent-gold)]">毅</span>
                        </div>
                        <div>
                            <span className="font-editorial text-sm tracking-widest text-[var(--accent-gold)] block">KPZ UKM</span>
                            <span className="text-xs text-[var(--text-muted)] tracking-wider">毅华新生迎新会</span>
                        </div>
                    </div>
                    <nav className="hidden md:flex items-center gap-8 text-sm font-medium tracking-wider">
                        <a href="#about" className="hover:text-[var(--accent-gold)] transition-colors">关于活动</a>
                        <a href="#community" className="hover:text-[var(--accent-gold)] transition-colors">宿舍风采</a>
                        <a href="#agenda" className="hover:text-[var(--accent-gold)] transition-colors">活动流程</a>
                        <a href="#qna" className="hover:text-[var(--accent-gold)] transition-colors">实时问答 (Slido)</a>
                    </nav>
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => setViewMode('dashboard')}
                            className="hidden lg:flex items-center gap-2 px-4 py-2 rounded-full glass-card border-[var(--accent-gold)]/40 text-xs font-semibold text-[var(--accent-gold)] hover:border-[var(--accent-gold)] transition-all"
                        >
                            <Monitor className="w-3.5 h-3.5" />
                            <span>大屏投影仪视图</span>
                        </button>
                        <a href="#qna" className="px-5 py-2.5 rounded-full bg-gradient-to-r from-[var(--accent-red)] to-[#5c0000] border border-[var(--accent-gold)]/40 text-xs font-semibold tracking-widest uppercase hover:border-[var(--accent-gold)] transition-all duration-300 shadow-lg shadow-red-950/50">
                            进入 Q&A 互动
                        </a>
                    </div>
                </header>

                <section className="relative min-h-screen flex flex-col justify-center items-center px-6 lg:px-16 pt-32 pb-20 overflow-hidden">
                    <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-[var(--accent-red)]/20 via-[var(--accent-gold)]/10 to-transparent rounded-full blur-[120px] pointer-events-none"></div>

                    <div className="max-w-6xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center z-10">
                        <div className="lg:col-span-7 flex flex-col items-start gap-6">
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-card border-[var(--accent-gold)]/30 hero-reveal">
                                <Sparkles className="w-4 h-4 text-[var(--accent-gold)]" />
                                <span className="text-xs font-semibold tracking-widest text-[var(--accent-gold)] uppercase">Kolej Pendeta Za'ba · 2026</span>
                            </div>

                            <h1 className="font-editorial text-5xl sm:text-7xl font-black tracking-tight leading-[1.1] hero-reveal">
                                毅见倾新 <br />
                                <span className="gold-gradient-text text-3xl sm:text-5xl font-light italic mt-2 block font-sans">The Beginning of Us</span>
                            </h1>

                            <p className="text-lg text-[var(--text-muted)] max-w-xl leading-relaxed hero-reveal font-light">
                                寓意来自不同地方的新生，因为相遇而成为「我们」，也代表大学新篇章的开始。陌路而来，同心而聚。
                            </p>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full py-4 border-y border-[var(--border-subtle)] hero-reveal">
                                <div className="flex items-center gap-3">
                                    <Calendar className="w-5 h-5 text-[var(--accent-gold)] shrink-0" />
                                    <div>
                                        <div className="text-xs text-[var(--text-muted)]">日期</div>
                                        <div className="text-sm font-semibold">1/10/2026 (星期四)</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Clock className="w-5 h-5 text-[var(--accent-gold)] shrink-0" />
                                    <div>
                                        <div className="text-xs text-[var(--text-muted)]">时间</div>
                                        <div className="text-sm font-semibold">7:30p.m. - 9:30p.m.</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <MapPin className="w-5 h-5 text-[var(--accent-gold)] shrink-0" />
                                    <div>
                                        <div className="text-xs text-[var(--text-muted)]">地点</div>
                                        <div className="text-sm font-semibold">Grand Hall, KPZ</div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-4 pt-2 hero-reveal">
                                <a href="#qna" className="px-8 py-4 rounded-full bg-[var(--accent-gold)] text-[var(--bg-obsidian)] font-bold tracking-wider hover:bg-white transition-colors shadow-xl flex items-center gap-3">
                                    <span>立即参与问答 (Slido)</span>
                                    <ArrowRight className="w-4 h-4" />
                                </a>
                                <a href="#agenda" className="px-8 py-4 rounded-full glass-card hover:border-[var(--accent-gold)] transition-colors text-sm font-semibold tracking-wider">
                                    查看活动流程
                                </a>
                            </div>
                        </div>

                        <div className="lg:col-span-5 relative hero-reveal">
                            <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-[var(--accent-gold)] to-[var(--accent-red)] opacity-30 blur-xl"></div>
                            <div className="relative glass-card rounded-3xl p-6 border border-[var(--accent-gold)]/30 overflow-hidden shadow-2xl">
                                <div className="absolute top-0 right-0 bg-[var(--accent-red)] text-white text-xs font-bold px-4 py-1.5 rounded-bl-2xl uppercase tracking-widest border-l border-b border-[var(--accent-gold)]/40 z-10">
                                    Modern Dragon Edition
                                </div>
                                <div className="aspect-[4/5] rounded-2xl overflow-hidden relative group">
                                    <img 
                                        src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=1000&auto=format&fit=crop" 
                                        alt="University Community" 
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent flex flex-col justify-end p-6">
                                        <span className="text-[var(--accent-gold)] text-xs font-bold uppercase tracking-widest mb-1">Arrive as Strangers. Rise as One.</span>
                                        <h3 className="font-editorial text-2xl font-bold text-white">陌路而来，同心而聚</h3>
                                        <p className="text-xs text-[var(--text-muted)] mt-2">预计人数：30位精锐新生与理事</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section id="about" className="py-28 px-6 lg:px-16 border-t border-[var(--border-subtle)] fade-in-section">
                    <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                        <div>
                            <span className="text-xs font-bold uppercase tracking-widest text-[var(--accent-gold)] mb-3 block">宿舍村精神 · Village Culture</span>
                            <h2 className="font-editorial text-4xl sm:text-5xl font-bold mb-6">毅华宿舍村 <br /><span className="gold-gradient-text">Kolej Pendeta Za'ba</span></h2>
                            <p className="text-[var(--text-muted)] leading-relaxed mb-6 font-light">
                                毅华不仅是一个住宿的地方，更是大学生涯中最温暖的避风港与成长摇篮。在这里，我们承传着坚韧、团结与卓越的精神。无论你来自何方，踏入KPZ的那一刻起，你便不再孤单。
                            </p>
                            <div className="grid grid-cols-2 gap-6 pt-4 border-t border-[var(--border-subtle)]">
                                <div>
                                    <h4 className="font-editorial text-3xl font-bold text-[var(--accent-gold)] mb-1">30+</h4>
                                    <p className="text-xs text-[var(--text-muted)]">新生精英齐聚一堂</p>
                                </div>
                                <div>
                                    <h4 className="font-editorial text-3xl font-bold text-[var(--accent-gold)] mb-1">100%</h4>
                                    <p className="text-xs text-[var(--text-muted)]">沉浸式破冰与 Senior 指导</p>
                                </div>
                            </div>
                        </div>
                        <div id="community" className="grid grid-cols-2 gap-4">
                            <div className="space-y-4">
                                <div className="aspect-[3/4] rounded-2xl overflow-hidden glass-card p-2 border-[var(--accent-gold)]/20">
                                    <img src="https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=600&auto=format&fit=crop" alt="Campus Life" className="w-full h-full object-cover rounded-xl" />
                                </div>
                            </div>
                            <div className="space-y-4 pt-8">
                                <div className="aspect-[3/4] rounded-2xl overflow-hidden glass-card p-2 border-[var(--accent-gold)]/20">
                                    <img src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=600&auto=format&fit=crop" alt="Friends" className="w-full h-full object-cover rounded-xl" />
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section id="agenda" className="py-28 px-6 lg:px-16 bg-[#0A0908] border-t border-[var(--border-subtle)] fade-in-section">
                    <div className="max-w-4xl mx-auto">
                        <div className="text-center mb-16">
                            <span className="text-xs font-bold uppercase tracking-widest text-[var(--accent-gold)] mb-3 block">Timeline & Flow</span>
                            <h2 className="font-editorial text-4xl sm:text-5xl font-bold">活动流程</h2>
                            <p className="text-sm text-[var(--text-muted)] mt-2">1月10日 · 精彩环节紧凑衔接</p>
                        </div>

                        <div className="space-y-4">
                            {agendaData.map((item, idx) => (
                                <div key={idx} className="glass-card glass-card-hover rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all duration-300">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-[var(--accent-red)]/20 border border-[var(--accent-gold)]/30 flex items-center justify-center text-[var(--accent-gold)] font-mono text-sm font-bold shrink-0">
                                            {idx + 1}
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-white">{item.title}</h3>
                                            <p className="text-xs text-[var(--text-muted)]">{item.sub}</p>
                                        </div>
                                    </div>
                                    <div className="px-4 py-1.5 rounded-full bg-[var(--bg-obsidian)] border border-[var(--border-subtle)] text-xs font-mono text-[var(--accent-gold)]">
                                        {item.time}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section id="qna" className="py-28 px-6 lg:px-16 border-t border-[var(--border-subtle)] relative fade-in-section">
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[var(--accent-red)]/5 to-transparent pointer-events-none"></div>

                    <div className="max-w-4xl mx-auto relative z-10">
                        <div className="text-center mb-12">
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-950/40 border border-red-500/30 text-red-400 text-xs font-semibold tracking-widest uppercase mb-4 animate-pulse">
                                <span className="w-2 h-2 rounded-full bg-red-500"></span>
                                Live Slido Q&A Board
                            </div>
                            <h2 className="font-editorial text-4xl sm:text-5xl font-bold">现场即时问答</h2>
                            <p className="text-sm text-[var(--text-muted)] mt-2">输入你的名字即可提问与点赞，大屏幕将实时同步展示问题。</p>
                        </div>

                        {!hasJoined ? (
                            <div className="glass-card rounded-3xl p-8 sm:p-12 border border-[var(--accent-gold)]/30 max-w-xl mx-auto shadow-2xl">
                                <div className="text-center mb-8">
                                    <div className="w-16 h-16 rounded-full bg-[var(--accent-gold)]/10 border border-[var(--accent-gold)]/40 flex items-center justify-center mx-auto mb-4 text-[var(--accent-gold)]">
                                        <User className="w-8 h-8" />
                                    </div>
                                    <h3 className="font-editorial text-2xl font-bold">加入互动问答</h3>
                                    <p className="text-xs text-[var(--text-muted)] mt-1">请输入你的大名或昵称以参与提问和点赞</p>
                                </div>

                                <form onSubmit={handleJoinSession} className="space-y-6">
                                    <div>
                                        <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-2">你的名字 / 昵称</label>
                                        <input 
                                            type="text" 
                                            value={userName}
                                            onChange={(e) => setUserName(e.target.value)}
                                            placeholder="例如：Alex / 毅华新生"
                                            disabled={isAnonymous}
                                            className="w-full bg-[var(--bg-obsidian)] border border-[var(--border-subtle)] rounded-xl px-4 py-3.5 text-white placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-gold)] transition-colors disabled:opacity-50"
                                        />
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <input 
                                            type="checkbox" 
                                            id="anon"
                                            checked={isAnonymous}
                                            onChange={(e) => setIsAnonymous(e.target.checked)}
                                            className="w-4 h-4 accent-[var(--accent-gold)] rounded cursor-pointer"
                                        />
                                        <label htmlFor="anon" className="text-sm text-[var(--text-muted)] cursor-pointer select-none">
                                            匿名参与 (Anonymous Fresher)
                                        </label>
                                    </div>

                                    {errorMsg && (
                                        <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
                                            <ShieldAlert className="w-4 h-4 shrink-0" />
                                            <span>{errorMsg}</span>
                                        </div>
                                    )}

                                    <button 
                                        type="submit"
                                        className="w-full py-4 rounded-xl bg-[var(--accent-gold)] text-[var(--bg-obsidian)] font-bold tracking-wider hover:bg-white transition-all shadow-xl flex items-center justify-center gap-2"
                                    >
                                        <span>进入 Q&A 互动大厅</span>
                                        <ArrowRight className="w-4 h-4" />
                                    </button>
                                </form>
                            </div>
                        ) : (
                            <div className="space-y-8">
                                <div className="glass-card rounded-2xl p-4 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4 border border-[var(--accent-gold)]/20">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-[var(--accent-gold)]/20 border border-[var(--accent-gold)]/40 flex items-center justify-center text-[var(--accent-gold)] font-bold">
                                            {isAnonymous ? "匿" : userName.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="text-xs text-[var(--text-muted)]">当前参与身份</div>
                                            <div className="text-sm font-bold text-white">{isAnonymous ? "Anonymous Fresher" : userName}</div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 bg-[var(--bg-obsidian)] p-1.5 rounded-xl border border-[var(--border-subtle)]">
                                        <button 
                                            onClick={() => setFilterTab('top')}
                                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${filterTab === 'top' ? 'bg-[var(--accent-gold)] text-[var(--bg-obsidian)]' : 'text-[var(--text-muted)] hover:text-white'}`}
                                        >
                                            🔥 最热门 (Top)
                                        </button>
                                        <button 
                                            onClick={() => setFilterTab('recent')}
                                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${filterTab === 'recent' ? 'bg-[var(--accent-gold)] text-[var(--bg-obsidian)]' : 'text-[var(--text-muted)] hover:text-white'}`}
                                        >
                                            ⚡ 最新 (Recent)
                                        </button>
                                    </div>
                                </div>

                                <div className="glass-card rounded-3xl p-6 sm:p-8 border border-[var(--accent-gold)]/30 shadow-2xl">
                                    <form onSubmit={handleAskQuestion} className="space-y-4">
                                        <div>
                                            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-2">向主讲人或 Senior 提问</label>
                                            <textarea 
                                                rows="3"
                                                value={newQuestion}
                                                onChange={(e) => setNewQuestion(e.target.value)}
                                                placeholder="写下你想问的问题（系统已启用了不当言论过滤）..."
                                                className="w-full bg-[var(--bg-obsidian)] border border-[var(--border-subtle)] rounded-2xl p-4 text-white placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-gold)] transition-colors resize-none text-sm"
                                            ></textarea>
                                        </div>

                                        {errorMsg && (
                                            <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
                                                <ShieldAlert className="w-4 h-4 shrink-0" />
                                                <span>{errorMsg}</span>
                                            </div>
                                        )}

                                        <div className="flex items-center justify-between pt-2">
                                            <span className="text-xs text-[var(--text-muted)]">
                                                💡 提示：点击问题右侧的点赞按钮可将其顶置
                                            </span>
                                            <button 
                                                type="submit"
                                                disabled={isAsking || !newQuestion.trim()}
                                                className="px-6 py-3 rounded-xl bg-[var(--accent-gold)] text-[var(--bg-obsidian)] font-bold text-xs uppercase tracking-wider hover:bg-white transition-all disabled:opacity-50 flex items-center gap-2 shadow-lg"
                                            >
                                                <Send className="w-3.5 h-3.5" />
                                                <span>{isAsking ? "发送中..." : "提交问题"}</span>
                                            </button>
                                        </div>
                                    </form>
                                </div>

                                <div className="space-y-4">
                                    {questions.length === 0 ? (
                                        <div className="glass-card rounded-2xl p-12 text-center text-[var(--text-muted)]">
                                            <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-30 text-[var(--accent-gold)]" />
                                            <p className="text-sm">暂无提问，快来抢沙发向大家提问吧！</p>
                                        </div>
                                    ) : (
                                        questions.map((q) => {
                                            const hasUpvoted = user && q.upvotedBy && q.upvotedBy[user.uid];
                                            return (
                                                <div key={q.id} className="glass-card glass-card-hover rounded-2xl p-6 transition-all duration-300 flex items-start justify-between gap-6">
                                                    <div className="space-y-2 flex-1">
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-xs font-bold text-[var(--accent-gold)]">{q.authorName}</span>
                                                            <span className="text-[10px] text-[var(--text-muted)]">• {new Date(q.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                        </div>
                                                        <p className="text-white text-base leading-relaxed break-words">{q.text}</p>
                                                    </div>

                                                    <button 
                                                        onClick={() => handleUpvote(q)}
                                                        className={`flex flex-col items-center justify-center min-w-[64px] py-2 px-3 rounded-xl border transition-all ${hasUpvoted ? 'bg-[var(--accent-gold)] border-[var(--accent-gold)] text-[var(--bg-obsidian)] font-bold shadow-lg shadow-amber-500/20' : 'bg-[var(--bg-obsidian)] border-[var(--border-subtle)] text-[var(--text-muted)] hover:border-[var(--accent-gold)] hover:text-white'}`}
                                                    >
                                                        <ThumbsUp className={`w-4 h-4 mb-1 ${hasUpvoted ? 'fill-current' : ''}`} />
                                                        <span className="text-xs font-mono font-bold">{q.upvotes || 0}</span>
                                                    </button>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </section>

                <footer className="py-16 px-6 lg:px-16 border-t border-[var(--border-subtle)] bg-[#050403] text-center text-xs text-[var(--text-muted)] space-y-4">
                    <div className="flex items-center justify-center gap-2">
                        <span className="font-editorial text-sm font-bold text-[var(--accent-gold)]">毅见倾新 · The Beginning of Us</span>
                    </div>
                    <p>Kolej Pendeta Za'ba (KPZ) · Universiti Kebangsaan Malaysia (UKM) · 2026</p>
                    <div className="pt-2">
                        <button 
                            onClick={() => setViewMode('dashboard')}
                            className="text-[var(--accent-gold)] hover:underline text-xs inline-flex items-center gap-1.5"
                        >
                            <Monitor className="w-3.5 h-3.5" />
                            <span>切换至大厅投影仪大屏幕问答视图</span>
                        </button>
                    </div>
                </footer>

            </div>
        </>
    );
}
