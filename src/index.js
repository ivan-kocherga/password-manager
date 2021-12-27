const {
    app,
    BrowserWindow
} = require('electron');

const express = require('express');
const bodyParser = require('body-parser')

const {
    encrypt,
    decrypt
} = require('./encrypt');
const { passwordToArr } = require('./common')

const path = require('path');
const fs = require('fs');

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
    app.quit();
}

const createWindow = () => {
    // Create the browser window.
    const mainWindow = new BrowserWindow({
        width: 565,
        height: 700,
        autoHideMenuBar: true,
    });

    mainWindow.loadFile(path.join(__dirname, './public/index.html'));
    // mainWindow.webContents.openDevTools();

    initServe();
};

app.on('ready', createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

function initServe() {
    const serve = express();
    serve.use(bodyParser.json());
    serve.listen(4523);

    serve.get('/passwords', (req, res) => {
        fs.readFile(path.join(__dirname, 'passwords.encrypt.json'), 'utf8', (err, data) => {
            if (err) {
                return;
            }
            res.send(passwordToArr(JSON.parse(data)));
        })
    })

    serve.post('/passwords', async(req, res) => {
        const name = req.body.name;
        const password = req.body.password;
        const additional = req.body.additional;
        const mailOrPhone = req.body.mailOrPhone;
        const EPassword = encrypt(password);

        let file = await new Promise((res, rej) => {
            fs.readFile(path.join(__dirname, 'passwords.encrypt.json'), 'utf8', (err, data) => {
                if (err) {
                    rej();
                    return;
                }
                res(JSON.parse(data));
            })
        })

        file[name] = {password: EPassword, additional, mailOrPhone, name};

        fs.writeFile(path.join(__dirname, 'passwords.encrypt.json'), JSON.stringify(file), err => {
            if (err) {
                return;
            }
            res.send(passwordToArr(file));
        })
    })

    serve.delete('/passwords/:name', async(req, res) => {
        let file = await new Promise((res, rej) => {
            fs.readFile(path.join(__dirname, 'passwords.encrypt.json'), 'utf8', (err, data) => {
                if (err) {
                    rej();
                    return;
                }
                res(JSON.parse(data));
            })
        })

        let newFile = {};

        for (let fileItem in file) {
            if (fileItem !== req.params.name.replace('%20', ' ')) {
                newFile[fileItem] = file[fileItem];
            }
        }

        fs.writeFile(path.join(__dirname, 'passwords.encrypt.json'), JSON.stringify(newFile), err => {
            if (err) {
                return;
            }
            res.send(passwordToArr(newFile));
        })
    })

    serve.get('/passwords/decrypt', async(req, res) => {
        let file = await new Promise((res, rej) => {
            fs.readFile(path.join(__dirname, 'passwords.encrypt.json'), 'utf8', (err, data) => {
                if (err) {
                    rej();
                    return;
                }
                res(JSON.parse(data));
            })
        })

        let txt = ''

        for (const fileElem in file) {
            txt += `Название: ${fileElem}. Телефон или почта: ${file[fileElem].mailOrPhone}. Пароль: ${decrypt(file[fileElem].password)}. Дополнительно: ${file[fileElem].additional}.\n`
        }

        res.send('data:text/plain;charset=utf-8,' + encodeURIComponent(txt))
    })

    serve.get('/passwords/:name', async(req, res) => {
        let file = await new Promise((res, rej) => {
            fs.readFile(path.join(__dirname, 'passwords.encrypt.json'), 'utf8', (err, data) => {
                if (err) {
                    rej();
                    return;
                }
                res(JSON.parse(data));
            })
        })

        const elem = Object.entries(file).find(([_name]) => req.params.name.replace('%20', ' ') === _name)[1];
        const {password, name} = elem;
        const decryptPassword = decrypt(password);

        res.send({
            name,
            passwordView: decryptPassword
        })
    })

    serve.get('/passwords/additional/:name', async(req, res) => {
        let file = await new Promise((res, rej) => {
            fs.readFile(path.join(__dirname, 'passwords.encrypt.json'), 'utf8', (err, data) => {
                if (err) {
                    rej();
                    return;
                }
                res(JSON.parse(data));
            })
        })

        const elem = Object.entries(file).find(([name]) => req.params.name.replace('%20', ' ') === name)[1];
        const {additional, name} = elem;

        res.send({
            name,
            additional
        })
    })

    serve.post('/config', async(req, res) => {
        fs.writeFile(path.join(__dirname, 'passwords.encrypt.json'), JSON.stringify(req.body.data), err => {
            if (err) {
                return;
            }
            res.send(passwordToArr(req.body.data));
        })
    })
}