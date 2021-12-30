const ref = {
    nameInput: document.querySelector('.input-name'),
    passwordInput: document.querySelector('.input-password'),
    mailInput: document.querySelector('.input-email'),
    additionalInput: document.querySelector('.input-additional'),
    importInput: document.querySelector('.import'),
    searchInput: document.querySelector('.input-search'),
    signInInput: document.querySelector('.login input'),

    passwordEl: document.querySelector('.test'),
    passwordList: document.querySelector('.password-view'),
    dowloadLink: document.querySelector('.export-decrypt-dowload'),
    panel: document.querySelector('.panel'),
    panelLink: document.querySelectorAll('.panel span'),
    panelItems: document.querySelectorAll('.panel-elem'),
    passwordBlock: document.querySelector('.password-create'), 
    searchBlock: document.querySelector('.search'),
    signInBlock: document.querySelector('.login'),

    exportDecryptBtn: document.querySelector('.export-decrypt'),
    saveBtn: document.querySelector('.save'),
    importBtn: document.querySelector('.importBtn'),
    passworBtn: document.querySelector('.login button'),
}

const api = 'http://localhost:4523';
let passwordArr = [];
let passwordArrSearch = [];

function updateData(data) {
    passwordArr = passwordArrSearch = data;
}

ref.passworBtn.addEventListener('click', async() => {
    const res = await axios.get(`${api}/app/password/${ref.signInInput.value}`);
    if(res.data) {
        ref.signInBlock.classList.add('none');
        ref.signInInput.value = '';
        axios.get(`${api}/passwords`).then(res => {
            updateData(res.data);
            updatePassword();
            events();
        })
    }
})

function events() {
    ref.saveBtn.addEventListener('click', async() => {
        const name = ref.nameInput.value;
        const password = ref.passwordInput.value;
        const mailOrPhone = ref.mailInput.value;
        const additional = ref.additionalInput.value;
        if (name && password && mailOrPhone) {
            const res = await axios.post(`${api}/passwords`, { name: name.trim(), password, mailOrPhone, additional });
            updateData(res.data);
            updatePassword();
            ref.nameInput.value = '';
            ref.passwordInput.value = '';
            ref.mailInput.value = '';
            ref.additionalInput.value = '';
        }
    })
    
    ref.exportDecryptBtn.addEventListener('click', () => {
        axios.get(`${api}/passwords/decrypt`).then(res => {
            ref.dowloadLink.href = res.data;
            ref.dowloadLink.click();
        })
    })
    
    ref.importBtn.addEventListener('click', () => {
        ref.importInput.click();
        ref.importInput.addEventListener('change', async(e) => {
            const file = e.path[0].files[0];
            const data = await getBase64(file);
            const res = await axios.post(`${api}/config`, {data: JSON.parse(data)});
            updateData(res.data);
            updatePassword();
        })
    })
    
    ref.panel.addEventListener('click', (e) => {
        if(e.path[0].getAttribute('active') === 'false') {
            const active = e.path[0];
            for(let el of ref.panelLink) {
                if(el.getAttribute('link') === active.getAttribute('link')) {
                    active.setAttribute('active', 'true');
                    active.classList.add('active-search');
                    for(let panelEl of ref.panelItems) {
                        if(el.getAttribute('link') === panelEl.getAttribute('link')) {
                            panelEl.classList.remove('none');
                        }else {
                            panelEl.classList.add('none');
                        }
                    }
                }else {
                    el.setAttribute('active', 'false');
                    el.classList.remove('active-search');
                }
            }
        }
    })

    ref.searchInput.addEventListener('input', (e) => {
        const val = e.path[0].value.toLowerCase();
        if(!val) {
            passwordArrSearch = passwordArr;
        }else {
            passwordArrSearch = passwordArr.filter(el => el.name.toLowerCase().includes(val));
        }
        updatePassword();
    })
}

function updatePassword() {
    ref.passwordList.innerHTML = '';
    if (!passwordArrSearch.length) {
        ref.passwordList.innerHTML = 'Пусто :('
        return;
    }
    for (const { name, mailOrPhone } of passwordArrSearch) {
        const elem = ref.passwordEl.cloneNode(true);

        elem.querySelector('.password-name span').textContent = name;
        elem.querySelector('.password-email span').textContent = mailOrPhone;
        elem.classList.remove('test', 'none');

        elem.querySelector('.view-password').addEventListener('click', async() => {
            if (elem.querySelector('.password-elem input').type === 'password') {
                const res = await axios.get(`${api}/passwords/${name}`);
                elem.querySelector('.password-elem input').type = 'text';
                elem.querySelector('.password-elem input').value = res.data.passwordView;
            } else {
                elem.querySelector('.password-elem input').type = 'password';
                elem.querySelector('.password-elem input').value = '********';
            }
        })
        elem.querySelector('.view-additional').addEventListener('click', async() => {
            if (elem.querySelector('.password-addition span').getAttribute('show') === 'false') {
                const res = await axios.get(`${api}/passwords/additional/${name}`);
                elem.querySelector('.password-addition span').setAttribute('show', 'true');
                elem.querySelector('.password-addition span').textContent = res.data.additional ? res.data.additional : '-';
            } else {
                elem.querySelector('.password-addition span').setAttribute('show', 'false');
                elem.querySelector('.password-addition span').textContent = '********';
            }
        })
        elem.querySelector('.copy').addEventListener('click', async() => {
            const res = await axios.get(`${api}/passwords/${name}`);
            elem.querySelector('.password-elem input').select();
            elem.querySelector('.password-elem input').setSelectionRange(0, 99999);
            navigator.clipboard.writeText(res.data.passwordView);
        })
        elem.querySelector('.delete').addEventListener('click', async() => {
            const res = await axios.delete(`${api}/passwords/${name}`);
            updateData(res.data);
            updatePassword();
        })

        ref.passwordList.append(elem);
    }
}

function Base64Decode(str, encoding = 'utf-8') {
    var bytes = base64js.toByteArray(str);
    return new (TextDecoder || TextDecoderLite)(encoding).decode(bytes);
}

function getBase64(file) {
    var reader = new FileReader();
    reader.readAsText(file);
    reader.onerror = function (error) {
        console.log('[base64] error');
    };
    return new Promise(res => {
        reader.onload = () => {
            res(reader.result);
        }
    });
}