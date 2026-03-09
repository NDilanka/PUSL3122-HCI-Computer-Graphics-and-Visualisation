
// Role Selection
function setRole(role,btn){
    document.getElementById("role-input").value = role;
    document.querySelectorAll(".role-tab").forEach(t => t.classList.remove("active"));
    btn.classList.add("active");
}

// Toggle password visibility
function togglePassword(){
    const input = document.getElementById("password");
    input.type = input.type === "password" ? "text" : "password";
}

// Show Message
function showMessage(msg, type="error"){
    const el = document.getElementById("login-message") || document.getElementById("register-message");
    if(!el) return;
    el.textContent = msg;
    el.className = `form-message ${type}`;
    el.classList.remove("hidden");
}

// Login Handler
async function handleLogin(e){
    e.preventDefault();
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;
    const role = document.getElementById("role-input").value;
    const btn = document.getElementById("login-btn");

    if (!username || !password){
        showMessage("Please fill in all fields.");
        return;
    }

    // Loading State
    btn.querySelector(".btn-text").classList.add("hidden");
    btn.querySelector(".btn-loader").classList.remove("hidden");
    btn.disabled = true;
    try {
        const response = await fetch("../backend/auth/login.php",{
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({username, password, role})
        });
        const data = await response.json();
        if(data.success){
            // Save session info to sessionStorage
            sessionStorage.setItem("user", JSON.stringify({
                id: data.user.id,
                username: data.user.username,
                role: data.user.role,
                name: data.user.full_name
            }));
            showMessage("Login successful! Redirecting...","success");
            setTimeout(() => {
                window.location.href = "pages/dashboard.html";
            },800);
        }else{
            showMessage(data.message || "Invalid username or password.");
        }  
    } catch (error) {
        demoLogin(username, password, role);
        
    }finally {
        btn.querySelector(".btn-text").classList.remove("hidden");
        btn.querySelector(".btn-loader").classList.add("hidden");
        btn.disabled = false;
    } 
}

function demoLogin(username, password, role) {
    const demoAccounts = [
        {username: "admin", password: "admin123", role: "admin", full_name: "Admin Designer",id:1},
        {username: "user", password: "user123", role: "user", full_name: "Demo Customer",id:2},
        {username: "sarah", password: "pass123",role: "admin", full_name: "Sarah Johnson",id:3},
        {username: "customer", password: "pass123", role: "user", full_name: "John Smith", id:4},
    ];

    const match = demoAccounts.find(
        a => a.username === username && a.password === password && a.role === role
    );

    if (match) {
        sessionStorage.setItem("furni_user", JSON.stringify(match));
        showMessage("Demo login successful! Redirecting...","success");
        setTimeout(() => {
            window.location.href = "pages/dashboard.html";
        },800);
    }else{
        showMessage("Invalid username,password or role. Try admin/admin123 or user/user123.");
    }
}

// Register Handler
async function handleRegister(e) {
    e.preventDefault();
    const fullname  = document.getElementById('fullname').value.trim();
    const username  = document.getElementById('reg-username').value.trim();   
    const email     = document.getElementById('email').value.trim();
    const password  = document.getElementById('reg-password').value;
    const confirm   = document.getElementById('confirm-password').value;
    const role      = document.getElementById('reg-role').value;
    const btn       = document.getElementById('register-btn');

    // Validation
    if (!fullname || !username || !email || !password || !confirm){
        showMessage("Please fill in all fields.","error");
        return;
    }
    if (password !== confirm){
        showMessage("Passwords do not match.","error");
        return;
    }
    if (password.length < 6){
        showMessage("Password must be at least 6 characters.","error");
        return;
    }
    if (!isValidEmail(email)){
        showMessage("Please enter a valid email address.","error");
        return;
    }
    btn.disabled = true;
    btn.textContent = "Creating Account...";
    try {
        const res = await fetch('../backend/auth/register.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fullname, username, email, password, role })
        });

        const data = await res.json();

        if (data.success) {
            showMessage('Account created! Redirecting to login...', 'success');
            setTimeout(() => { window.location.href = '../index.html'; }, 1200);
        } else {
            showMessage(data.message || 'Registration failed. Username may already exist.');
        }
    } catch (error) {
        showMessage(error);
        //showMessage("Account created (demo mode)! Redirecting...","success");
        //setTimeout(() => { window.location.href = '../index.html'; }, 1200);   
    }finally{
        btn.disabled = false;
        btn.textContent = "Create Account";
    }
}

// Password Strength Meter
function checkPasswordStrength(password) {
  const fill  = document.getElementById('strength-fill');
  const label = document.getElementById('strength-label');
  if (!fill) return;

  let score = 0;
  if (password.length >= 6)  score++;
  if (password.length >= 10) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const levels = [
    { pct: '0%',   color: '#E74C3C', text: '' },
    { pct: '25%',  color: '#E74C3C', text: 'Weak' },
    { pct: '50%',  color: '#E67E22', text: 'Fair' },
    { pct: '75%',  color: '#F1C40F', text: 'Good' },
    { pct: '90%',  color: '#27AE60', text: 'Strong' },
    { pct: '100%', color: '#1E8449', text: 'Very Strong' },
  ];

  fill.style.width      = levels[score].pct;
  fill.style.background = levels[score].color;
  label.textContent     = levels[score].text;
}

// Logout Function
function logout() {
  sessionStorage.removeItem('furni_user');
  fetch('../backend/auth/logout.php').catch(() => {});
  window.location.href = '../index.html';
}

// Auth Guard
function requireAuth() {
  const user = getSessionUser();
  if (!user) {
    window.location.href = '../index.html';
    return null;
  }
  return user;
}

function requireAdmin() {
  const user = requireAuth();
  if (user && user.role !== 'admin') {
    alert('This section is for designers only.');
    window.location.href = 'dashboard.html';
    return null;
  }
  return user;
}

// Get Current User
function getSessionUser() {
    try {
        const raw = sessionStorage.getItem('furni_user');
        return raw ? JSON.parse(raw) : null;
    }catch (e) {
        return null;
    }

}

// Populate Nav user info
function populateNavUser() {
  const user = getSessionUser();
  if (!user) return;

  const nameEl   = document.getElementById('nav-username');
  const roleEl   = document.getElementById('nav-role');
  const avatarEl = document.getElementById('nav-avatar');

  if (nameEl)   nameEl.textContent   = user.name || user.username;
  if (roleEl)   roleEl.textContent   = user.role === 'admin' ? 'Designer' : 'Customer';
  if (avatarEl) avatarEl.textContent = (user.name || user.username).charAt(0).toUpperCase();
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

