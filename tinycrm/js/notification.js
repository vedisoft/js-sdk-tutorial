window.pzNoty = (function() {
    $.notify.defaults({ position: 'bottom right', clickToHide: false, autoHideDelay: 60000 })
    $.notify.addStyle('pz-notification', {
        html: '<div data-notify-html></div>'
    });

    $(document).on('mouseover', '.notifyjs-pz-notification-base .pz-close', function(e) {
        $(this).find('img').attr('src', getImgUrl('cross-bold.png'))
    });
    $(document).on('mouseleave', '.notifyjs-pz-notification-base .pz-close', function(e) {
        $(this).find('img').attr('src', getImgUrl('cross.png'))
    });

    $(document).on('click', '.notifyjs-pz-notification-base .prostiezvonki-notification .pz-close', function(e) {
        $(this).trigger('notify-hide');
    });

    $(document).on('mouseup', '.notifyjs-pz-notification-base .prostiezvonki-notification', function(e) {
        if (getSelection().toString())
            return;

        e = e || window.event;
        var url = $(this).attr('pz-url');
        var isRightClick = e.which == 3 || e.button == 2;
        var isCloseButton = $(e.target).parent('.pz-close').length > 0;

        if (isRightClick || isCloseButton) {
            $(this).trigger('notify-hide');
            return;
        }
        if (url)
            window.open(url, '_blank');
    });

    $(document).on('contextmenu', '.notifyjs-pz-notification-base .prostiezvonki-notification', function(e) {
        if (getSelection().toString())
            return true;

        e.preventDefault();
        return false;
    });

    function hideAllNotification() {
        $('.notifyjs-pz-notification-base .prostiezvonki-notification').each(function() {
            $(this).trigger('notify-hide');
        })
    }

    function showNotificationContact(phone, line, type, contactName, contactLink, event) {
        var html = generateNotificationContactHtml(phone, line, type, contactName, contactLink, event)
        $.notify(html, { style: 'pz-notification' });
    }

    function showNotificationCallMessage(phone, type, text) {
        var html = generateNotificationCallMessageHtml(phone, type, text)
        $.notify(html, { style: 'pz-notification' });
    }

    function showNotificationMessage(text) {
        var html = generateNotificationMessageHtml(text)
        $.notify(html, { style: 'pz-notification' });
    }

    function showNotificationErrorMessage(text) {
        var html = generateNotificationErrorHtml(text)
        $.notify(html, { style: 'pz-notification' });
    }

    function generateNotificationContactHtml(phone, line, type, contactName, contactLink, event) {
        var imgSrc = getImgSrc(type);
        var callTypeTextHtml = getCallTypeTextHtml(type);
        var contactEventText = getContactEventText(event);
        var contactEventElement = getContactEventElement(contactName, contactLink)

        var notifyText =
            '<div class="prostiezvonki-notification" pz-url="' + contactLink + '" style="cursor: pointer;">' +
            '   <div class="pz-close"><img src="' + getImgUrl('cross.png') + '" style="width: 15px;"></div>' +
            '   <table>' +
            '       <tr>' +
            '           <td rowspan="3" style="width: auto; vertical-align: top;"><img style="height: 45px;" src="' + imgSrc + '"></td>' +
            '           <td>' + callTypeTextHtml + '</td>' +
            '       </tr>' +
            '       <tr>' +
            '           <td><div class="pz-bold-big" style="height: 24px;">' + phone + '</div></td>' +
            '       </tr>' +
            '       <tr>' +
            '           <td>' + (line ? '<div>Номер линии: ' + line + '</div>' : '') + '</td>' +
            '       </tr>' +
            '       <tr>' +
            '           <td colspan="2"><div style="margin-top: 10px;">' + contactEventText + '</div></td>' +
            '       </tr>' +
            '       <tr>' +
            '           <td colspan="2">' + contactEventElement + '</td>' +
            '       </tr>' +
            '   </table>' +
            '   <div class="pz-logo">' +
            '       <img src="' + getImgUrl('logo.png') + '">' +
            '   </div>' +
            '</div>';

        return notifyText;
    }

    function generateNotificationCallMessageHtml(phone, type, text) {
        var imgSrc = getImgSrc(type);
        var callTypeTextHtml = getCallTypeTextHtml(type);

        var notifyText =
            '<div class="prostiezvonki-notification">' +
            '   <div class="pz-close"><img src="' + getImgUrl('cross.png') + '" style="width: 15px;"></div>' +
            '   <table>' +
            '       <tr>' +
            '           <td rowspan="2" style="width: auto; vertical-align: top;"><img style="height: 45px;" src="' + imgSrc + '"></td>' +
            '           <td>' + callTypeTextHtml + '</td>' +
            '       </tr>' +
            '       <tr>' +
            '           <td>' + (phone ? '<div class="pz-bold-big" style="height: 24px;">' + phone + '</div>' : '') + '</td>' +
            '       </tr>' +
            '       <tr>' +
            '           <td colspan="2"><div style="margin-top: 10px;">' + text + '</div></td>' +
            '       </tr>' +
            '   </table>' +
            '   <div class="pz-logo">' +
            '       <img src="' + getImgUrl('logo.png') + '">' +
            '   </div>' +
            '</div>';

        return notifyText;
    }

    function generateNotificationMessageHtml(text) {
        var notifyText =
            '<div class="prostiezvonki-notification">' +
            '   <div class="pz-close"><img src="' + getImgUrl('cross.png') + '" style="width: 15px;"></div>' +
            '   <table>' +
            '       <tr>' +
            '           <td><div style="margin-right: 10px; font-size: 14px;">' + text + '</div></td>' +
            '       </tr>' +
            '   </table>' +
            '   <div class="pz-logo">' +
            '       <img src="' + getImgUrl('logo.png') + '">' +
            '   </div>' +
            '</div>';

        return notifyText;
    }

    function generateNotificationErrorHtml(text) {
        var notifyText =
            '<div class="prostiezvonki-notification">' +
            '   <div class="pz-close"><img src="' + getImgUrl('cross.png') + '" style="width: 15px;"></div>' +
            '   <table>' +
            '       <tr>' +
            '           <td style="width: auto; vertical-align: top;"><img style="height: 45px;" src="' + getImgUrl('exclamation.png') + '"></td>' +
            '           <td><div style="margin-right: 10px; font-size: 14px;">' + text + '</div></td>' +
            '       </tr>' +
            '   </table>' +
            '   <div class="pz-logo">' +
            '       <img src="' + getImgUrl('logo.png') + '">' +
            '   </div>' +
            '</div>';

        return notifyText;
    }

    function getImgSrc(type) {
        switch (type) {
            case 'incoming':
                return getImgUrl('call-income.png');
            case 'outcoming':
                return getImgUrl('call-outcome.png');
            case 'missed':
                return getImgUrl('call-miss.png');
            default:
                return getImgUrl('call-income.png');
        }
    }

    function getCallTypeTextHtml(type) {
        switch (type) {
            case 'incoming':
                return '<div class="pz-green" style="height: 12px;">Входящий вызов...</div>';
            case 'outcoming':
                return '<div class="pz-blue" style="height: 12px;">Исходящий вызов...</div>';
            case 'missed':
                return '<div class="pz-red" style="height: 12px;">Пропущенный вызов</div>';
            default:
                return '';
        }
    }

    function getContactEventText(event) {
        switch (event) {
            case 'foundContact':
                return 'Клиент найден:';
            case 'notFoundContact':
                return 'Клиент не найден';
            case 'newContact':
                return 'Создан новый клиент';
            default:
                return '';
        }
    }

    function getContactEventElement(contactName, contactLink) {
        if (contactName)
            return '<img src="' + getImgUrl('card.png') + '" style="width: 19px; vertical-align: text-top;">&nbsp;<a href="javascript:void(0);" class="pz-link">' + contactName + '</a>';
        else
            return contactLink ? '<a href="javascript:void(0);" class="pz-btn">Создать</a>' : '';
    }

    function getImgUrl(img) {
        return 'img/' + img;
    }

    return {
        hideAllNotification: hideAllNotification,
        showNotificationContact: showNotificationContact,
        showNotificationCallMessage: showNotificationCallMessage,
        showNotificationMessage: showNotificationMessage,
        showNotificationErrorMessage: showNotificationErrorMessage
    }
})()