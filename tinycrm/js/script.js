(function ($) {
    var storage = [
        { name: 'Аркадий', phone: '+7 (343) 0112233' },
        { name: 'Борис', phone: '+7 (343) 0112244' },
        { name: 'Валентина', phone: '+7 (343) 0112255' }
    ];

    var table = $('#contacts');

    for (var i = 0; i < storage.length; i += 1) {
        var row = $('<tr></tr>');

        row.append('<td>' + storage[i].name + '</td>');
        row.append('<td width="1%" nowrap><span title="Позвонить" class="btn-link make-call">' + storage[i].phone + '</span></td>');

        row.appendTo(table);
    }

    pz.setUserPhone('102');

    pz.onEvent(function (event) {
        if (event.isIncoming()) {
            $('.alert').text('Звонок с '+event.from+' на '+event.to).show();
        }
    });

    $('#button').on('click', function() {
        if ($(this).text() === 'Соединить') {
            pz.connect({
                client_id: '102',
                client_type: 'tinycrm',
                host: "ws://localhost:10150"
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

        pz.call(phone);
    });
}(jQuery));