(function ($) {
    var userPhone = '102';

    var storage = [
        { name: 'Аркадий Аркадиевич Аркадьев', phone: '+7 (343) 0112233' },
        { name: 'Борис Борисович Борисов', phone: '+7 (343) 0112244' },
        { name: 'Валентина Валентиновна Валентинова', phone: '+7 (343) 0112255' },
        { name: 'Константин Константинович Константинопольский', phone: '+7 (343) 0112266' }
    ];

    var table = $('#contacts');

    storage.forEach(function (contact) {
        $('<tr></tr>')
            .append('<td>' + contact.name + '</td>')
            .append('<td width="1%" nowrap><span title="Позвонить" class="btn-link make-call">' + contact.phone + '</span></td>')
            .appendTo(table);
    });

    pz.setUserPhone(userPhone);

    pz.onEvent(function (event) {
        if (event.isIncoming()) {
            if (event.to === userPhone) {
                showCard(event.from);
            }
        }
    });

    $('#button').on('click', function() {
        if ($(this).text() === 'Соединить') {
            pz.connect({
                host: "ws://localhost:10150",
                client_id: 'password',
                client_type: 'jsapi'
            });
        } else {
            pz.disconnect();
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
        var phone = $(this).text().trim();

        console.log('call '+phone);
        pz.call(phone);
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
}(jQuery));