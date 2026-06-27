import { useCallback } from "react";
import Particles from "react-tsparticles";
import { loadSlim } from "tsparticles-slim";

const BackgroundParticles = ({ variant = "full" }) => {
    const particlesInit = useCallback(async engine => {
        await loadSlim(engine);
    }, []);

    const options = {
        background: { color: { value: "transparent" } },
        fpsLimit: 60,
        particles: {
            color: { value: "#ffffff" },
            links: { 
                color: "#ffffff", 
                distance: 150, 
                enable: true, 
                opacity: 0.20, /* Increased link opacity */
                width: 1 
            },
            move: { direction: "none", enable: true, outModes: { default: "bounce" }, random: true, speed: 1.5, straight: false },
            number: { 
                density: { enable: true, area: 800 }, 
                value: variant === 'split' ? 30 : 60 /* 60 total, so 30 per side if split */
            }, 
            opacity: { value: 0.30 }, /* Increased particle opacity */
            shape: { type: "circle" },
            size: { value: { min: 2, max: 3 } },
        },
        detectRetina: true,
    };

    if (variant === "split") {
        return (
            <>
                {/* Left Side */}
                <div style={{ 
                    position: "fixed", top: 0, left: 0, 
                    width: "calc(max(0px, 50vw - 450px))", height: "100%", 
                    zIndex: 0, pointerEvents: "none", overflow: "hidden" 
                }}>
                    <Particles id="tsparticles-bg-left" init={particlesInit} options={options} style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%" }} />
                </div>
                {/* Right Side */}
                <div style={{ 
                    position: "fixed", top: 0, right: 0, 
                    width: "calc(max(0px, 50vw - 450px))", height: "100%", 
                    zIndex: 0, pointerEvents: "none", overflow: "hidden" 
                }}>
                    <Particles id="tsparticles-bg-right" init={particlesInit} options={options} style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%" }} />
                </div>
            </>
        );
    }

    return (
        <Particles
            id="tsparticles-bg"
            init={particlesInit}
            style={{
                position: "fixed",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                zIndex: 0,
                pointerEvents: "none"
            }}
            options={options}
        />
    );
};

export default BackgroundParticles;
