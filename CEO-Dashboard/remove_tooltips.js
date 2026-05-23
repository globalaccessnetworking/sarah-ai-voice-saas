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
    
    // Remove Recharts Tooltip tags, spanning multiple lines, including any > inside them (like => arrow functions)
    const tooltipRegex = /<Tooltip[\s\S]*?\/>/g;
    const newContent = content.replace(tooltipRegex, '');
    
    // Also remove the import for Tooltip from recharts to keep it clean (optional but good)
    // const cleanImports = newContent.replace(/Tooltip,\s*/g, '');
    
    if (newContent !== content) {
        fs.writeFileSync(filePath, newContent, 'utf8');
        console.log('Removed Tooltips from', filePath);
    }
});
