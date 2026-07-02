const fs = require('fs');
let code = fs.readFileSync('src/pages/Profile.jsx', 'utf8');

// 1. Remove styles block
code = code.replace(/const styles = `[\s\S]*?`;/, 'import "./Profile.css";\nimport UsernamePrompt from "../components/profile/UsernamePrompt";');

// 2. Remove <style>{styles}</style>
code = code.replace(/<style>{styles}<\/style>\s*/, '');

fs.writeFileSync('src/pages/Profile.jsx', code);
