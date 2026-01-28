const bcrypt = require('bcryptjs');

(async () => {
  const hash = await bcrypt.hash('admin123', 8);
  console.log('Password hash: ' + hash);
})();
