// ===========================================
// SAVE THIS FILE AS: script.js
// ===========================================

// ⚠️ IMPORTANT: Change this URL to your deployed backend URL
const BACKEND_URL = 'http://localhost:8001'; // Change to your Render URL after deployment
// Example: const BACKEND_URL = 'https://harish-portfolio-api.onrender.com';

// ===== CUSTOM CURSOR =====
const cursor = document.getElementById('cursor');
document.addEventListener('mousemove', (e) => {
    cursor.style.left = e.clientX - 10 + 'px';
    cursor.style.top = e.clientY - 10 + 'px';
});

document.querySelectorAll('a, button, .skill-bubble, .project-card').forEach(el => {
    el.addEventListener('mouseenter', () => cursor.classList.add('hover'));
    el.addEventListener('mouseleave', () => cursor.classList.remove('hover'));
});

// ===== TYPING EFFECT =====
const typingTexts = [
    'Python Full Stack Developer',
    'Three.js Enthusiast',
    'AI Integration Specialist',
    'Backend Architect',
    'Cyberpunk Coder'
];
let textIndex = 0;
let charIndex = 0;
let isDeleting = false;
const typingElement = document.getElementById('typingText');

function typeEffect() {
    const currentText = typingTexts[textIndex];
    
    if (isDeleting) {
        typingElement.textContent = currentText.substring(0, charIndex - 1);
        charIndex--;
    } else {
        typingElement.textContent = currentText.substring(0, charIndex + 1);
        charIndex++;
    }
    
    let typeSpeed = isDeleting ? 50 : 100;
    
    if (!isDeleting && charIndex === currentText.length) {
        typeSpeed = 2000;
        isDeleting = true;
    } else if (isDeleting && charIndex === 0) {
        isDeleting = false;
        textIndex = (textIndex + 1) % typingTexts.length;
        typeSpeed = 500;
    }
    
    setTimeout(typeEffect, typeSpeed);
}
typeEffect();

// ===== THREE.JS SCENE =====
let scene, camera, renderer, tunnel, avatar, mixer, clock;
let particles = [];
let animations = [];
let currentAnimation = 0;
const mouse = new THREE.Vector2(0, 0);

function initThreeJS() {
    // Scene
    scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x0a0a0f, 10, 50);
    
    // Camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;
    
    // Renderer
    const canvas = document.getElementById('canvas3d');
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    
    // Lights
    const ambientLight = new THREE.AmbientLight(0x404060, 1);
    scene.add(ambientLight);
    
    const cyanLight = new THREE.PointLight(0x00ffff, 2, 50);
    cyanLight.position.set(5, 5, 5);
    scene.add(cyanLight);
    
    const pinkLight = new THREE.PointLight(0xff00ff, 2, 50);
    pinkLight.position.set(-5, -5, 5);
    scene.add(pinkLight);
    
    // Cyberpunk Tunnel
    createTunnel();
    
    // Try loading 3D Avatar (optional)
    loadAvatar();
    
    // Clock for animations
    clock = new THREE.Clock();
    
    // Event listeners
    window.addEventListener('resize', onWindowResize);
    window.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('click', onCanvasClick);
    
    // Hide loader
    setTimeout(() => {
        document.getElementById('loader').classList.add('hidden');
    }, 1500);
    
    animate();
}

function createTunnel() {
    const tunnelGeometry = new THREE.CylinderGeometry(8, 8, 100, 16, 50, true);
    const tunnelMaterial = new THREE.MeshBasicMaterial({
        color: 0x00ffff,
        wireframe: true,
        transparent: true,
        opacity: 0.3,
        side: THREE.BackSide
    });
    tunnel = new THREE.Mesh(tunnelGeometry, tunnelMaterial);
    tunnel.rotation.x = Math.PI / 2;
    tunnel.position.z = -20;
    scene.add(tunnel);
    
    // Second tunnel layer (pink)
    const tunnel2 = new THREE.Mesh(
        new THREE.CylinderGeometry(6, 6, 100, 12, 30, true),
        new THREE.MeshBasicMaterial({
            color: 0xff00ff,
            wireframe: true,
            transparent: true,
            opacity: 0.2,
            side: THREE.BackSide
        })
    );
    tunnel2.rotation.x = Math.PI / 2;
    tunnel2.position.z = -20;
    scene.add(tunnel2);
}

function loadAvatar() {
    const loader = new THREE.GLTFLoader();
    loader.load(
        'model.glb',
        (gltf) => {
            avatar = gltf.scene;
            avatar.scale.set(1.5, 1.5, 1.5);
            avatar.position.set(3, 5, 0); // Start above
            scene.add(avatar);
            
            // Setup animations if available
            if (gltf.animations && gltf.animations.length > 0) {
                mixer = new THREE.AnimationMixer(avatar);
                animations = gltf.animations;
                playAnimation(0);
            }
            
            // Drop animation
            dropAvatar();
            
            // Click on avatar to switch animations
            window.addEventListener('click', onAvatarClick);
        },
        (xhr) => {
            console.log(`Avatar: ${(xhr.loaded / xhr.total * 100).toFixed(0)}% loaded`);
        },
        (error) => {
            console.warn('Avatar model.glb not found. Skipping avatar load.', error);
        }
    );
}

function dropAvatar() {
    if (!avatar) return;
    let velocity = 0;
    const gravity = -0.02;
    const targetY = 0;
    let bounces = 0;
    
    const drop = () => {
        velocity += gravity;
        avatar.position.y += velocity;
        
        if (avatar.position.y <= targetY) {
            avatar.position.y = targetY;
            velocity = -velocity * 0.5;
            bounces++;
            
            // Flash effect
            avatar.traverse((child) => {
                if (child.isMesh) {
                    const originalColor = child.material.color.clone();
                    child.material.color.set(0x00ffff);
                    setTimeout(() => child.material.color.copy(originalColor), 100);
                }
            });
            
            if (bounces >= 3) return;
        }
        requestAnimationFrame(drop);
    };
    drop();
}

function playAnimation(index) {
    if (!mixer || !animations.length) return;
    mixer.stopAllAction();
    const action = mixer.clipAction(animations[index]);
    action.play();
}

function onAvatarClick(event) {
    if (!avatar || !animations.length) return;
    
    const raycaster = new THREE.Raycaster();
    const mouseVec = new THREE.Vector2(
        (event.clientX / window.innerWidth) * 2 - 1,
        -(event.clientY / window.innerHeight) * 2 + 1
    );
    raycaster.setFromCamera(mouseVec, camera);
    const intersects = raycaster.intersectObject(avatar, true);
    
    if (intersects.length > 0) {
        currentAnimation = (currentAnimation + 1) % animations.length;
        playAnimation(currentAnimation);
    }
}

function createParticleBurst(x, y) {
    const vector = new THREE.Vector3(
        (x / window.innerWidth) * 2 - 1,
        -(y / window.innerHeight) * 2 + 1,
        0.5
    );
    vector.unproject(camera);
    
    const colors = [0x00ffff, 0xff00ff, 0x39ff14, 0xa020f0];
    
    for (let i = 0; i < 30; i++) {
        const geometry = new THREE.SphereGeometry(0.05, 8, 8);
        const material = new THREE.MeshBasicMaterial({
            color: colors[Math.floor(Math.random() * colors.length)],
            transparent: true,
            opacity: 1
        });
        const particle = new THREE.Mesh(geometry, material);
        particle.position.copy(vector);
        
        particle.velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 0.3,
            (Math.random() - 0.5) * 0.3,
            (Math.random() - 0.5) * 0.3
        );
        particle.life = 1.0;
        
        scene.add(particle);
        particles.push(particle);
    }
}

function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.position.add(p.velocity);
        p.life -= 0.02;
        p.material.opacity = p.life;
        p.scale.multiplyScalar(0.97);
        
        if (p.life <= 0) {
            scene.remove(p);
            particles.splice(i, 1);
        }
    }
}

function onCanvasClick(event) {
    createParticleBurst(event.clientX, event.clientY);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function onMouseMove(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

function animate() {
    requestAnimationFrame(animate);
    
    const delta = clock.getDelta();
    
    // Rotate tunnel
    if (tunnel) {
        tunnel.rotation.y += 0.002;
    }
    
    // Parallax effect on camera
    camera.position.x += (mouse.x * 0.5 - camera.position.x) * 0.05;
    camera.position.y += (mouse.y * 0.5 - camera.position.y) * 0.05;
    camera.lookAt(0, 0, 0);
    
    // Update mixer for avatar animations
    if (mixer) mixer.update(delta);
    
    // Update particles
    updateParticles();
    
    renderer.render(scene, camera);
}

// ===== CHATBOT =====
const chatbotToggle = document.getElementById('chatbotToggle');
const chatbotPanel = document.getElementById('chatbotPanel');
const chatbotClose = document.getElementById('chatbotClose');
const chatInput = document.getElementById('chatInput');
const chatSend = document.getElementById('chatSend');
const chatMessages = document.getElementById('chatbotMessages');

let chatHistory = [];

chatbotToggle.addEventListener('click', () => {
    chatbotPanel.classList.toggle('active');
});

chatbotClose.addEventListener('click', () => {
    chatbotPanel.classList.remove('active');
});

function addMessage(text, sender) {
    const msg = document.createElement('div');
    msg.className = `message ${sender}`;
    msg.textContent = text;
    chatMessages.appendChild(msg);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return msg;
}

async function sendChatMessage() {
    const message = chatInput.value.trim();
    if (!message) return;
    
    addMessage(message, 'user');
    chatInput.value = '';
    
    const typingMsg = addMessage('Thinking...', 'bot typing');
    
    try {
        const response = await fetch(`${BACKEND_URL}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: message,
                history: chatHistory
            })
        });
        
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const data = await response.json();
        typingMsg.remove();
        addMessage(data.reply, 'bot');
        
        // Update history
        chatHistory.push({ role: 'user', content: message });
        chatHistory.push({ role: 'assistant', content: data.reply });
        if (chatHistory.length > 10) chatHistory = chatHistory.slice(-10);
        
    } catch (error) {
        typingMsg.remove();
        addMessage('⚠️ Sorry, I cannot connect right now. Please make sure the backend is running!', 'bot');
        console.error('Chat error:', error);
    }
}

chatSend.addEventListener('click', sendChatMessage);
chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendChatMessage();
});

// ===== INITIALIZE =====
window.addEventListener('load', () => {
    initThreeJS();
});
