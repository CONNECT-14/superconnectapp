import { Link, useNavigate } from 'react-router-dom';
import { useCallback, useState, useEffect } from "react";
import Particles from "react-tsparticles";
import { loadSlim } from "tsparticles-slim";
import ThemeToggle from "../components/ThemeToggle";
import './Landing.css'

const Landing = () => {
    const navigate = useNavigate();

    const particlesInit = useCallback(async engine => {
        await loadSlim(engine);
    }, []);

    // Track theme so particles and inline styles can react
    const [isLightMode, setIsLightMode] = useState(
        () => document.documentElement.classList.contains("light-mode") || localStorage.getItem("theme") === "light"
    );

    useEffect(() => {
        const observer = new MutationObserver(() => {
            setIsLightMode(document.documentElement.classList.contains("light-mode"));
        });
        observer.observe(document.documentElement, { attributes: true });
        return () => observer.disconnect();
    }, []);

    const particleColor = isLightMode ? "#111827" : "#ffffff";
    const particleOpacity = isLightMode ? 0.25 : 0.6;
    const linkOpacity = isLightMode ? 0.08 : 0.3;

    return (
        <div className="home">
            <ThemeToggle />
            
            <div style={{ position: "relative", minHeight: "100vh" }}>
                <Particles
                    id="tsparticles"
                    init={particlesInit}
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        zIndex: 0
                    }}
                    options={{
                        background: {
                            color: {
                                value: "transparent",
                            },
                        },
                        fpsLimit: 60,
                        interactivity: {
                            events: {
                                onClick: { enable: true, mode: "push" },
                                onHover: { enable: true, mode: "repulse" },
                                resize: true,
                            },
                            modes: {
                                push: { quantity: 3 },
                                repulse: { distance: 100, duration: 0.4 },
                            },
                        },
                        particles: {
                            color: {
                                value: particleColor,
                            },
                            links: {
                                color: particleColor,
                                distance: 150,
                                enable: true,
                                opacity: linkOpacity,
                                width: 1,
                            },
                            move: {
                                direction: "none",
                                enable: true,
                                outModes: { default: "bounce" },
                                random: true,
                                speed: 1.5,
                                straight: false,
                            },
                            number: {
                                density: { enable: true, area: 800 },
                                value: 120,
                            },
                            opacity: {
                                value: particleOpacity,
                            },
                            shape: {
                                type: "circle",
                            },
                            size: {
                                value: { min: 2, max: 3 },
                            },
                        },
                        detectRetina: true,
                    }}
                />

                <div style={{ position: "relative", zIndex: 1, height: "100%", display: "flex", flexDirection: "column" }}>
                    <nav className="landing-navbar">
                        <Link to="/" className="landing-brand">
                            <img src={process.env.PUBLIC_URL + (isLightMode ? "/assests/logo-light.png" : "/assests/logo-dark.png")} alt="Brain Logo" />
                            <span className="brand-text">Connect</span>
                        </Link>
                        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                            <Link to="/login" className="btn-nav-signin">
                                Sign In
                            </Link>
                            <Link to="/register" className="btn-nav-getstarted">
                                Get Started
                            </Link>
                        </div>
                    </nav>

                    <section className="hero" style={{ flex: 1 }}>
                        <div className="hero-content animate-slideUp">
                            <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', marginBottom: '24px'}}>
                                <img 
                                    src={process.env.PUBLIC_URL + (isLightMode ? "/assests/logo-light.png" : "/assests/logo-dark.png")} 
                                    alt="Brain Logo" 
                                    className="hero-logo-large" 
                                    style={{ marginBottom: '0', width: '80px', height: '80px', objectFit: 'contain' }}
                                />
                            </div>
                            <h1 className="hero-title">Welcome to <span className="highlight">Connect</span></h1>
                            <p className="hero-tagline">
                                A collaborative platform for developers to showcase innovations, crowdsource solutions, and build project-driven communities that turn shared ideas into finished products.
                            </p>

                            <div className="hero-actions">
                                <button
                                    className="btn btn-primary"
                                    onClick={() => navigate("/login")}
                                >
                                    Get Started
                                </button>
                            </div>
                        </div>
                    </section>
                </div>
                
                {/* Subtle gradient transition between hero and features */}
                <div style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    width: "100%",
                    height: "150px",
                    background: isLightMode
                        ? "linear-gradient(to bottom, transparent, #F3F4F6)"
                        : "linear-gradient(to bottom, transparent, #0F0F11)",
                    zIndex: 2,
                    pointerEvents: "none"
                }}></div>
            </div>

            <div style={{ position: "relative", zIndex: 3, backgroundColor: isLightMode ? "#F3F4F6" : "#0F0F11" }}>
                <section className="features">
                    <h2 className="features-title">Why Connect?</h2>
                    <div className="features-grid">

                        <div className="feature-card">
                            <span className="feature-icon">💬</span>
                            <h3>Learn & Discuss</h3>
                            <p>Ask questions, share ideas, and learn from real experiences.</p>
                        </div>

                        <div className="feature-card">
                            <span className="feature-icon">🤝</span>
                            <h3>Collaborate</h3>
                            <p>Work with like-minded people to build and improve products.</p>
                        </div>

                        <div className="feature-card">
                            <span className="feature-icon">🚀</span>
                            <h3>Grow Projects</h3>
                            <p>Showcase your ideas, get feedback, and evolve faster.</p>
                        </div>

                    </div>
                </section>
                
                <footer className="landing-footer">
                    <p>© 2025 Connect. Built for developers.</p>
                </footer>
            </div>

        </div>
    );
};

export default Landing;