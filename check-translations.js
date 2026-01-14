// check-translations.js
const fs = require('fs');
const path = require('path');
const glob = require('glob');

// --- Función para encontrar todas las claves t('...') en un archivo ---
function findKeys(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const regex = /t\(\s*['"`]([^'"`]+)['"`]\s*\)/g;
    const keys = new Set();
    let match;
    while ((match = regex.exec(content)) !== null) {
        keys.add(match[1]);
    }
    return keys;
}

// --- Función para obtener las claves existentes en un archivo de idioma JSON ---
function getExistingKeys(filePath) {
    if (!fs.existsSync(filePath)) return new Set();
    const content = fs.readFileSync(filePath, 'utf-8');
    let json;
    try {
        json = JSON.parse(content);
    } catch (e) {
        console.error(`❌ Error al parsear ${filePath}: ${e.message}`);
        return new Set();
    }
    const keys = new Set();
    // Función recursiva para extraer todas las claves anidadas
    function extractKeys(obj, prefix = '') {
        Object.entries(obj).forEach(([k, v]) => {
            const fullKey = prefix ? `${prefix}.${k}` : k;
            keys.add(fullKey);
            if (v && typeof v === 'object') extractKeys(v, fullKey);
        });
    }
    extractKeys(json);
    return keys;
}

// --- Función para expandir globs y obtener todos los archivos ---
function getFilesFromGlobs(patterns) {
    const files = new Set();
    patterns.forEach(pattern => {
        glob.sync(pattern, { nodir: true }).forEach(file => files.add(file));
    });
    return Array.from(files);
}

// --- Configuración ---
const filePatterns = ['index.html','pages/**/*.html','js/**/*.js','js/**/*.jsx'];
const languages = ['es','en','fr','de'];

// --- Escaneo de claves ---
console.log('🔍 Escaneando archivos en busca de claves t()...');
const allProjectKeys = new Set();
getFilesFromGlobs(filePatterns).forEach(file => {
    findKeys(file).forEach(key => allProjectKeys.add(key));
});
console.log(`✅ Se encontraron ${allProjectKeys.size} claves en el proyecto.`);

// --- Revisión por idioma ---
let hasMissingKeys = false;
languages.forEach(lang => {
    const langFilePath = path.join('data', `${lang}.json`);
    const existingKeys = getExistingKeys(langFilePath);
    const missingKeys = [...allProjectKeys].filter(key => !existingKeys.has(key));

    if (missingKeys.length > 0) {
        hasMissingKeys = true;
        console.log(`\n⚠️ Faltan ${missingKeys.length} claves en ${lang}.json:`);
        missingKeys.forEach(key => console.log(`  - ${key}`));
    } else {
        console.log(`✅ Todas las claves están presentes en ${lang}.json`);
    }
});

// --- Resumen final ---
if (!hasMissingKeys) {
    console.log('\n🎉 ¡Todos los archivos de idioma están completos!');
} else {
    console.log('\n⚠️ Revisa los archivos de idioma y agrega las claves faltantes.');
}

// --- Opcional: exportar faltantes a JSON ---
// Uncomment si quieres generar un archivo JSON con las faltantes

languages.forEach(lang => {
    const langFilePath = path.join('data', `${lang}.json`);
    const existingKeys = getExistingKeys(langFilePath);
    const missingKeys = [...allProjectKeys].filter(key => !existingKeys.has(key));
    if (missingKeys.length > 0) {
        fs.writeFileSync(`missing-${lang}.json`, JSON.stringify(missingKeys, null, 2));
        console.log(`📝 Archivo missing-${lang}.json creado con las claves faltantes.`);
    }
});

