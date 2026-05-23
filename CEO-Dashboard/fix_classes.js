import fs from 'fs';
import path from 'path';

function walkSync(currentDirPath, callback) {
    fs.readdirSync(currentDirPath).forEach(function (name) {
        var filePath = path.join(currentDirPath, name);
        var stat = fs.statSync(filePath);
        if (stat.isFile() && filePath.endsWith('.tsx')) {
            callback(filePath, stat);
        } else if (stat.isDirectory()) {
            walkSync(filePath, callback);
        }
    });
}

walkSync('./src', function(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Fix duplicate classNames: `className="something" className="glass-panel"`
    // Also covers cases with single or double quotes
    const regex = /className=(["'`])([^"'`]+)\1\s+className=(["'`])glass-panel\3/g;
    const newContent = content.replace(regex, 'className=$1$2 glass-panel$1');
    
    if (newContent !== content) {
        fs.writeFileSync(filePath, newContent, 'utf8');
        console.log('Fixed', filePath);
    }
});
