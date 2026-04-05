const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Set canvas size
canvas.width = 800;
canvas.height = 600;

// Game variables
let gameRunning = true;
let score = 0;
let speed = 0;
const maxSpeed = 8;
const acceleration = 0.3;
const turnSpeed = 3;

// Car object
const car = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    angle: 0, // in degrees
    width: 30,
    height: 50,
    color: '#ff0000'
};

// Roads (grid lines)
const roads = [];
const roadSpacing = 80;

// Buildings
const buildings = [];

// Traffic cars (obstacles)
let trafficCars = [];

// Input handling
const keys = {
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false,
    Space: false
};

// Camera offset (for POV effect)
let cameraX = 0;
let cameraY = 0;

// Initialize game world
function init() {
    // Create road grid
    for (let i = -2000; i < 2000; i += roadSpacing) {
        roads.push({
            x: i,
            y: 0,
            horizontal: true
        });
        roads.push({
            x: 0,
            y: i,
            horizontal: false
        });
    }
    
    // Create buildings at intersections
    for (let x = -2000; x < 2000; x += roadSpacing) {
        for (let y = -2000; y < 2000; y += roadSpacing) {
            if (Math.random() > 0.3) {
                buildings.push({
                    x: x,
                    y: y,
                    width: 40,
                    height: 40,
                    color: `hsl(${Math.random() * 360}, 70%, 50%)`
                });
            }
        }
    }
    
    // Create initial traffic
    for (let i = 0; i < 15; i++) {
        spawnTrafficCar();
    }
    
    setupEventListeners();
    gameLoop();
}

// Spawn traffic cars
function spawnTrafficCar() {
    const side = Math.floor(Math.random() * 4);
    let x, y;
    const padding = 500;
    
    switch(side) {
        case 0: // top
            x = (Math.random() - 0.5) * 4000;
            y = -2000 - padding;
            break;
        case 1: // bottom
            x = (Math.random() - 0.5) * 4000;
            y = 2000 + padding;
            break;
        case 2: // left
            x = -2000 - padding;
            y = (Math.random() - 0.5) * 4000;
            break;
        default: // right
            x = 2000 + padding;
            y = (Math.random() - 0.5) * 4000;
            break;
    }
    
    trafficCars.push({
        x: x,
        y: y,
        width: 25,
        height: 40,
        angle: 0,
        speed: 1 + Math.random() * 3,
        color: `hsl(${Math.random() * 360}, 70%, 45%)`
    });
}

// Input handling
function setupEventListeners() {
    window.addEventListener('keydown', (e) => {
        if (keys.hasOwnProperty(e.code)) {
            keys[e.code] = true;
            e.preventDefault();
        }
        if (e.code === 'Space' && gameRunning) {
            speed = Math.max(0, speed - 2);
            e.preventDefault();
        }
    });
    
    window.addEventListener('keyup', (e) => {
        if (keys.hasOwnProperty(e.code)) {
            keys[e.code] = false;
        }
    });
}

// Update car movement
function updateCar() {
    if (!gameRunning) return;
    
    // Acceleration
    if (keys.ArrowUp) {
        speed = Math.min(maxSpeed, speed + acceleration);
    }
    if (keys.ArrowDown) {
        speed = Math.max(-maxSpeed/2, speed - acceleration);
    }
    
    // Natural deceleration
    if (!keys.ArrowUp && !keys.ArrowDown) {
        if (speed > 0) speed = Math.max(0, speed - 0.1);
        if (speed < 0) speed = Math.min(0, speed + 0.1);
    }
    
    // Turning (only when moving)
    if (Math.abs(speed) > 0.5) {
        if (keys.ArrowLeft) {
            car.angle -= turnSpeed * (Math.abs(speed) / maxSpeed);
        }
        if (keys.ArrowRight) {
            car.angle += turnSpeed * (Math.abs(speed) / maxSpeed);
        }
    }
    
    // Convert angle to radians
    const angleRad = car.angle * Math.PI / 180;
    
    // Move car
    car.x += Math.cos(angleRad) * speed;
    car.y += Math.sin(angleRad) * speed;
    
    // Update camera to follow car
    cameraX = car.x - canvas.width / 2;
    cameraY = car.y - canvas.height / 2;
    
    // Update UI
    document.getElementById('speedValue').textContent = Math.floor(Math.abs(speed) * 30);
    document.getElementById('scoreValue').textContent = Math.floor(score);
    
    // Check collisions
    checkCollisions();
    
    // Add score over time
    if (speed > 0) {
        score += speed / 20;
    }
}

// Check collisions with traffic and boundaries
function checkCollisions() {
    // Car boundaries (world limits)
    if (Math.abs(car.x) > 2200 || Math.abs(car.y) > 2200) {
        gameOver();
        return;
    }
    
    // Check traffic collisions
    for (let i = 0; i < trafficCars.length; i++) {
        const traffic = trafficCars[i];
        
        // Simple rectangle collision
        const carLeft = car.x - car.width/2;
        const carRight = car.x + car.width/2;
        const carTop = car.y - car.height/2;
        const carBottom = car.y + car.height/2;
        
        const trafficLeft = traffic.x - traffic.width/2;
        const trafficRight = traffic.x + traffic.width/2;
        const trafficTop = traffic.y - traffic.height/2;
        const trafficBottom = traffic.y + traffic.height/2;
        
        if (carRight > trafficLeft && carLeft < trafficRight &&
            carBottom > trafficTop && carTop < trafficBottom) {
            gameOver();
            return;
        }
    }
}

// Game over
function gameOver() {
    gameRunning = false;
    document.querySelector('.game-over').style.display = 'block';
    document.getElementById('finalScore').textContent = Math.floor(score);
}

// Reset game
function resetGame() {
    gameRunning = true;
    score = 0;
    speed = 0;
    car.x = canvas.width / 2;
    car.y = canvas.height / 2;
    car.angle = 0;
    trafficCars = [];
    cameraX = car.x - canvas.width / 2;
    cameraY = car.y - canvas.height / 2;
    
    // Respawn traffic
    for (let i = 0; i < 15; i++) {
        spawnTrafficCar();
    }
    
    document.querySelector('.game-over').style.display = 'none';
}

// Draw everything
function draw() {
    // Clear canvas
    ctx.fillStyle = '#2c3e2f';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Save context for transformations
    ctx.save();
    
    // Apply camera transformation
    ctx.translate(canvas.width/2, canvas.height/2);
    ctx.rotate(-car.angle * Math.PI / 180);
    ctx.translate(-car.x + cameraX, -car.y + cameraY);
    
    // Draw road grid
    ctx.strokeStyle = '#f0e68c';
    ctx.lineWidth = 3;
    roads.forEach(road => {
        ctx.beginPath();
        if (road.horizontal) {
            ctx.moveTo(road.x - 2000, road.y);
            ctx.lineTo(road.x + 2000, road.y);
        } else {
            ctx.moveTo(road.x, road.y - 2000);
            ctx.lineTo(road.x, road.y + 2000);
        }
        ctx.stroke();
        
        // Draw dashed center lines
        ctx.beginPath();
        ctx.setLineDash([20, 30]);
        if (road.horizontal) {
            ctx.moveTo(road.x - 2000, road.y);
            ctx.lineTo(road.x + 2000, road.y);
        } else {
            ctx.moveTo(road.x, road.y - 2000);
            ctx.lineTo(road.x, road.y + 2000);
        }
        ctx.stroke();
        ctx.setLineDash([]);
    });
    
    // Draw buildings
    buildings.forEach(building => {
        ctx.fillStyle = building.color;
        ctx.fillRect(building.x - building.width/2, building.y - building.height/2, 
                    building.width, building.height);
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fillRect(building.x - building.width/2 + 5, building.y - building.height/2 + 5,
                    building.width - 10, 5);
    });
    
    // Draw traffic cars
    trafficCars.forEach(traffic => {
        ctx.save();
        ctx.translate(traffic.x, traffic.y);
        ctx.rotate(traffic.angle * Math.PI / 180);
        ctx.fillStyle = traffic.color;
        ctx.fillRect(-traffic.width/2, -traffic.height/2, traffic.width, traffic.height);
        ctx.fillStyle = '#333';
        ctx.fillRect(-traffic.width/2 + 5, -traffic.height/2 + 8, traffic.width - 10, 10);
        ctx.fillStyle = '#fff';
        ctx.fillRect(-traffic.width/2 + 3, -traffic.height/2 + 3, 5, 5);
        ctx.fillRect(traffic.width/2 - 8, -traffic.height/2 + 3, 5, 5);
        ctx.restore();
    });
    
    // Draw player car (always centered)
    ctx.fillStyle = car.color;
    ctx.fillRect(-car.width/2, -car.height/2, car.width, car.height);
    
    // Car details
    ctx.fillStyle = '#fff';
    ctx.fillRect(-car.width/2 + 5, -car.height/2 + 8, car.width - 10, 10);
    ctx.fillStyle = '#ffff00';
    ctx.fillRect(-car.width/2 + 3, -car.height/2 + 3, 5, 5);
    ctx.fillRect(car.width/2 - 8, -car.height/2 + 3, 5, 5);
    
    // Windshield
    ctx.fillStyle = '#88ccff';
    ctx.fillRect(-car.width/2 + 5, -car.height/2 + 18, car.width - 10, 8);
    
    ctx.restore();
    
    // Draw POV effect (speed lines)
    if (speed > 3) {
        ctx.save();
        ctx.globalAlpha = Math.min(0.3, speed / 20);
        for (let i = 0; i < 20; i++) {
            ctx.beginPath();
            ctx.moveTo(Math.random() * canvas.width, canvas.height);
            ctx.lineTo(Math.random() * canvas.width, canvas.height - 50);
            ctx.strokeStyle = 'white';
            ctx.stroke();
        }
        ctx.restore();
    }
}

// Update traffic movement
function updateTraffic() {
    for (let i = 0; i < trafficCars.length; i++) {
        const traffic = trafficCars[i];
        
        // Simple AI: move towards center
        const angleToCenter = Math.atan2(-traffic.y, -traffic.x);
        traffic.angle = angleToCenter * 180 / Math.PI;
        
        const angleRad = traffic.angle * Math.PI / 180;
        traffic.x += Math.cos(angleRad) * traffic.speed;
        traffic.y += Math.sin(angleRad) * traffic.speed;
        
        // Remove cars that are too far and respawn
        if (Math.abs(traffic.x) > 2500 || Math.abs(traffic.y) > 2500) {
            trafficCars.splice(i, 1);
            spawnTrafficCar();
        }
    }
    
    // Maintain traffic count
    while (trafficCars.length < 15) {
        spawnTrafficCar();
    }
}

// Game loop
function gameLoop() {
    if (gameRunning) {
        updateCar();
        updateTraffic();
    }
    draw();
    requestAnimationFrame(gameLoop);
}

// Start the game
init();
