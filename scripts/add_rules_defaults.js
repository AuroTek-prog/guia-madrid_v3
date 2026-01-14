const fs = require('fs');
const path = require('path');

const filePath = path.resolve(__dirname, '../data/apartments.json');
const backupPath = filePath + '.bak';

function main() {
  if (!fs.existsSync(filePath)) {
    console.error('apartments.json not found at', filePath);
    process.exit(1);
  }

  const raw = fs.readFileSync(filePath, 'utf8');
  const data = JSON.parse(raw);

  // Backup
  fs.writeFileSync(backupPath, raw, 'utf8');
  console.log('Backup created at', backupPath);

  const defaults = {
    quiet_hours_start: '22:00',
    quiet_hours_end: '08:00',
    checkout_time: '11:00'
  };

  let changed = 0;
  for (const key of Object.keys(data)) {
    const apt = data[key];
    if (!apt) continue;
    if (!apt.rules) {
      apt.rules = { ...defaults };
      changed++;
    } else {
      // Fill missing fields only
      let patched = false;
      for (const k of Object.keys(defaults)) {
        if (apt.rules[k] === undefined) {
          apt.rules[k] = defaults[k];
          patched = true;
        }
      }
      if (patched) changed++;
    }
  }

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  console.log(`Updated ${changed} apartment(s) with default rules.`);
}

main();
