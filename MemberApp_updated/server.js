
    const express = require('express');
    const path = require('path');
    const xlsx = require('xlsx');
    const fs = require('fs');

    const app = express();
    const PORT = process.env.PORT || 3000;

    app.use(express.static('public'));
    app.use(express.urlencoded({ extended: true }));
    app.use(express.json());

    if (!fs.existsSync('member_files')) fs.mkdirSync('member_files');

    app.post('/register', (req, res) => {
      const data = req.body;
      const username = data.username || 'unknown';

      const globalFile = 'loghistory.xlsx';
      let globalWB, globalWS;
      if (fs.existsSync(globalFile)) {
        globalWB = xlsx.readFile(globalFile);
        globalWS = globalWB.Sheets[globalWB.SheetNames[0]];
        const existing = xlsx.utils.sheet_to_json(globalWS);
        existing.push(data);
        const newWS = xlsx.utils.json_to_sheet(existing);
        globalWB.Sheets[globalWB.SheetNames[0]] = newWS;
      } else {
        globalWB = xlsx.utils.book_new();
        globalWS = xlsx.utils.json_to_sheet([data]);
        xlsx.utils.book_append_sheet(globalWB, globalWS, 'Members');
      }
      xlsx.writeFile(globalWB, globalFile);

      const memberFile = `member_files/${username}.xlsx`;
      const wb = xlsx.utils.book_new();
      const ws = xlsx.utils.json_to_sheet([data]);
      xlsx.utils.book_append_sheet(wb, ws, 'Data');
      xlsx.writeFile(wb, memberFile);

      res.send('✅ Registration successful!');
    });

    app.post('/login', (req, res) => {
      const { username, password } = req.body;
      const memberFile = `member_files/${username}.xlsx`;
      if (!fs.existsSync(memberFile)) return res.status(404).send('❌ Member not found.');

      const wb = xlsx.readFile(memberFile);
      const ws = wb.Sheets[wb.SheetNames[0]];
      const data = xlsx.utils.sheet_to_json(ws)[0];

      if (data.password === password) res.send(`✅ Welcome back, ${username}!`);
      else res.status(401).send('❌ Incorrect password.');
    });

    app.get('/', (req, res) => {
      res.sendFile(path.join(__dirname, 'public', 'index.html'));
    });

    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
