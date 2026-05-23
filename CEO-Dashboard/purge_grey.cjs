const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
}

function processFiles() {
    let componentsPath = path.join(__dirname, 'src', 'components');
    
    walkDir(componentsPath, function(filePath) {
        if (!filePath.endsWith('.tsx') && !filePath.endsWith('.js')) return;
        
        let content = fs.readFileSync(filePath, 'utf8');
        let originalContent = content;
        
        content = content.replace(/hover:bg-(gray|slate)-(700|800|900)\s?/g, 'hover:bg-white/5 transition-colors ');
        content = content.replace(/transition-colors\s+transition-colors/g, 'transition-colors');
        
        content = content.replace(/\bglass-panel\b/g, 'bg-[#111827] border border-gray-800 rounded-xl');

        // Note: The below line will replace strictly formatted onMouseEnter that was discovered
        content = content.replace(/onMouseEnter=\{e => \(e\.currentTarget\.style\.backgroundColor = ['"](?:rgba\([0-9,.]+\)|#[0-9a-fA-F]+)['"]\)\}/g, "");
        content = content.replace(/onMouseLeave=\{e => \(e\.currentTarget\.style\.backgroundColor = ['"]transparent['"]\)\}/g, "");

        if (content !== originalContent) {
            // Also append hover:bg-white/5 explicitly to rows if missing, but we'll let existing classes handle it or manual review 
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`Updated ${filePath}`);
        }
    });

    const cssPath = path.join(__dirname, 'src', 'index.css');
    if (fs.existsSync(cssPath)) {
        let css = fs.readFileSync(cssPath, 'utf8');
        css = css.replace(/\.glass-panel\s*\{[^}]+\}/g, '');
        fs.writeFileSync(cssPath, css, 'utf8');
    }
}

processFiles();
