(function ($) {
    var userPhone = '101',
        storage = [
            { name: 'Аркадий', phone: '+7 (343) 0112233' },
            { name: 'Борис', phone: '+7 (343) 0112244' },
            { name: 'Валентина', phone: '+7 (343) 0112255' }
        ];

    storage.forEach(function (contact) {
        var phoneLink = '<span class="btn-link make-call">' + contact.phone + '</span>';

        $('<tr></tr>')
            .append('<td>' + contact.name + '</td>')
            .append('<td width="1%" nowrap>' + phoneLink + '</td>')
            .appendTo('#contacts');
    });

    pz.onEvent(function (event) {
        switch (true) {
            case event.isIncoming():
                if (event.to === userPhone) {
                    showCard(event.from);
                }
                break;
            case event.isTransfer():
                if (findByPhone(storage, event.from)) {
                    pz.transfer(event.callID, userPhone);
                }
                break;
            case event.isHistory():
                if (event.to === userPhone || event.from === userPhone) {
                    appendCallInfo(event);
                }
                break;
            case event.isSmsStatus():
                var phone = event.to;

                if (event.result == '0') {
                    showMessage('Отправка СМС', 'СМС отправляется на номер ' + phone);
                }
                else if (event.result == '1') {
                    showMessage('Отправлена СМС', 'СМС успешно отправлена на номер ' + phone);
                }
                else {
                    showError('Не удалось отправить СМС на номер ' + phone)
                }
                break;
        }
    });

    $('#button').on('click', function() {
        if ($(this).text() === 'Соединить') {
            pz.connect({
                user_phone: userPhone,  // Номер менеджера
                host: "ws://localhost", // Адрес сервера
                client_id: 'password',  // Пароль
                client_type: 'jsapi'    // Тип приложения
            });
        } else {
            pz.disconnect();
        }
    });

    $('#button-send-sms').on('click', function() {
        if (pz.isConnected()) {
            var phone = $('input[name=sms-phone]').val();
            var text = $('input[name=sms-text]').val();
            pz.sms(phone, text);
        } else {
            showError("Нет соединения");
        }
    });

    setInterval(function() {
        if (pz.isConnected()) {
            $('#indicator')
                .removeClass('badge-important')
                .addClass('badge-success')
                .text('Соединение установлено');
            $('#button').text('Разъединить');
        } else {
            $('#indicator')
                .removeClass('badge-success')
                .addClass('badge-important')
                .text('Нет соединения');
            $('#button').text('Соединить');
        }
    }, 1000);

    $('body').on('click', '.make-call', function() {
        pz.call($(this).text());
    });

    function sanitizePhone(phone)
    {
        return phone.replace(/\D/g, '').slice(-10);
    }

    function findByPhone(contacts, phone) {
        return contacts.filter(function (contact) {
            return sanitizePhone(contact.phone) === sanitizePhone(phone);
        }).shift();
    }

    function getNotyText(phone, name) {
        return '<span class="pz_noty_title">Входящий звонок</span>' +
            (name ? '<span class="pz_noty_contact">' + name + '</span>' : '') +
            '<span class="pz_noty_phone btn-link make-call">' + phone + '</span>' +
            '<span class="pz_noty_copyright">' +
                '<img src="img/pz.ico">' +
                '<a target="_blank" href="http://prostiezvonki.ru">Простые звонки</a>' +
            '</span>';
    }

    function getNotyMessage(title, text) {
        return '<span class="pz_noty_title">' + title + '</span>' +
            '<span>' + text + '</span>' +
            '<span class="pz_noty_copyright">' +
            '<img src="img/pz.ico">' +
            '<a target="_blank" href="http://prostiezvonki.ru">Простые звонки</a>' +
            '</span>';
    }

    function showCard(phone) {
        var contact = findByPhone(storage, phone);
        var text = contact
                ? getNotyText(contact.phone, contact.name)
                : getNotyText(phone);

        $.noty.closeAll();
        noty({
            layout: 'bottomRight',
            closeWith: ['button'],
            text: text
        });
    }
    
    function showError(text) {
        var text = getNotyMessage('Ошибка', text);

        $.noty.closeAll();
        noty({
            layout: 'bottomRight',
            closeWith: ['button'],
            text: text
        });
    }

    function showMessage(title, text) {
        var text = getNotyMessage(title, text);

        $.noty.closeAll();
        noty({
            layout: 'bottomRight',
            closeWith: ['button'],
            text: text
        });
    }

    moment.lang('ru');

    function appendCallInfo(event) {
        var direction = event.direction === '1' ? 'Исходящий' : 'Входящий',
            phone     = event.direction === '1' ? event.to : event.from,
            contact   = findByPhone(storage, phone),
            name      = contact ? contact.name : '',
            fromNow   = moment.unix(parseInt(event.start)).fromNow(),
            duration  = moment.duration(parseInt(event.duration), "seconds").humanize();

        $('<tr></tr>')
            .append('<td>' + direction + '</td>')
            .append('<td>' + phone + '</td>')
            .append('<td>' + name + '</td>')
            .append('<td>' + fromNow + '</td>')
            .append('<td>' + duration + '</td>')
            .appendTo('#history');
    }
}(jQuery));