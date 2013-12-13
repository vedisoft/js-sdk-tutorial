Пример интеграции js-приложения с сервисом Простые Звонки
==========================================================

Простые Звонки - сервис для интеграции клиентских приложений (Excel, 1C и ERP-cистем) с офисными и облачными АТС. Клиентское приложение может общаться с сервером Простых Звонков через единый API, независимо от типа используемой АТС. 

В данном примере мы рассмотрим процесс подключения к серверу Простых Звонков веб-приложения, написанного на javascript. Мы начнём с веб-приложения, выводящего на экран список клиентов из базы данных, и добавим в него следующие функции:

- отображение всплывающей карточки при входящем звонке;
- звонок клиенту по клику на телефоный номер;
- умная переадресация на менеджера клиента;
- история входящих и исходящих звонков.

Шаг 0. Исходное приложение
--------------------------

Наше исходное приложение умеет показывать список клиентов. В качестве базы данных используется массив storage, определяемый в файле js/tinycrm.js. Прочитанные из файла строки отображаются в виде таблицы.

index.html:

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>TinyCRM</title>
    <link rel="stylesheet" href="css/bootstrap.min.css">
    <link rel="stylesheet" href="css/bootstrap-responsive.min.css">
    <link rel="stylesheet" href="css/tinycrm.css">
</head>
<body>
    <div class="container">
        <h1>TinyCRM</h1>
        <h2>База клиентов</h2>
        <table id="contacts" class="table table-bordered"></table>
    </div>

    <script src="js/jquery.min.js"></script>
    <script src="js/tinycrm.js"></script>
</body>
</html>
```

js/script.js:

```js
(function ($) {
    var storage = [
            { name: 'Аркадий', phone: '+7 (343) 0112233' },
            { name: 'Борис', phone: '+7 (343) 0112244' },
            { name: 'Валентина', phone: '+7 (343) 0112255' }
        ];

    storage.forEach(function (contact) {
        $('<tr></tr>')
            .append('<td>' + contact.name + '</td>')
            .append('<td width="1%" nowrap>' + contact.phone + '</td>')
            .appendTo('#contacts');
    });
}(jQuery));
```

![Исходное приложение](https://github.com/vedisoft/js-sdk-tutorial/raw/master/img/tinycrm-origin.png)

Шаг 1. Настройка подключения к серверу
--------------------------------------

Подключим файл prostiezvonki.js (свежую версию можно взять [отсюда](https://github.com/vedisoft/js-sdk)): 

```html
<script src="js/prostiezvonki.js"></script>
```

Теперь нужно скачать [тестовый сервер и диагностическую утилиту](https://github.com/vedisoft/pz-developer-tools).

Запустим тестовый сервер:

    > TestServer.exe

и подключимся к нему диагностической утилитой:

    > Diagnostic.exe

    [events off]> Connect ws://localhost:10150 asd
    * Далее приложение запросит ввести пароль, просто нажмите Enter
    Успешно начато установление соединения с АТС

Тестовое окружение настроено.

Добавим на страницу веб-приложения индикатор состояния соединения с сервером и кнопку, по нажатию на которую мы будем устанавливать соединение.

```html
<span id="button" class="btn pull-right">Соединить</span>
<span id="indicator" class="badge">Проверка соединения...</span>
```

Теперь наше приложение выглядит так:

![Индикатор состояния соединения](https://github.com/vedisoft/js-sdk-tutorial/raw/master/img/connection-indicator.png)

Добавим обработчик события кнопки. По нажатию кнопки будет выполнять запрос на подключение либо отключение соединения с сервером:

```js
$('#button').on('click', function() {
    if ($(this).text() === 'Соединить') {
        pz.connect({
            host: 'ws://localhost', // Адрес сервера
            client_id: 'password',  // Пароль
            client_type: 'jsapi'    // Тип приложения
        });
    } else {
        pz.disconnect();
    }
});
```

Также добавим запрос информации о состоянии соединения с интервалом в одну секунду:

```js
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
```

Попробуем подключиться к серверу:

![Соединение установлено](https://github.com/vedisoft/js-sdk-tutorial/raw/master/img/connection-established.png)

Шаг 2. Исходящие звонки кликом по номеру
----------------------------------------

Для начала, сделаем номера телефонов клиентов ссылками. Для этого заменим код, отвечающий за заполнение таблицы с контактами:

```js
storage.forEach(function (contact) {
    var phoneLink = '<span class="btn-link make-call">' + contact.phone + '</span>';

    $('<tr></tr>')
        .append('<td>' + contact.name + '</td>')
        .append('<td width="1%" nowrap>' + phoneLink + '</td>')
        .appendTo('#contacts');
}););
```

![Делаем телефоны ссылками](https://github.com/vedisoft/js-sdk-tutorial/raw/master/img/phone-links.png)

Теперь укажем внутренний номер сотрудника и добавим обработчик нажатий на ссылки:

```js
var userPhone = '101';

pz.setUserPhone(userPhone);

$('body').on('click', '.make-call', function() {
    pz.call($(this).text());
});
```

Кликнув на номер клиента, посмотрим на вывод тестового сервера:

```
Call event from CRM: src = 101, dst = +7 (343) 0112233
```

Как мы видим, сервер получил запрос на создание исходящего звонка с номера 101 на номер +7 (343) 0112233.

Шаг 3. Всплывающая карточка входящего звонка
--------------------------------------------

Для отображения всплывающих карточек воспользуемся плагином [jQuery Noty](http://needim.github.io/noty/).

Скачаем архив с плагином и распакуем его в папку `js/noty`. Теперь нужно подключить все необходимые файлы:

```js
<script src="js/noty/jquery.noty.js"></script>
<script src="js/noty/layouts/bottomRight.js"></script>
<script src="js/noty/themes/default.js"></script>
```

Подготовим функцию для поиска контактов по номеру телефона:

```js
function sanitizePhone(phone)
{
    return phone.replace(/\D/g, '').slice(-10);
}

function findByPhone(contacts, phone) {
    return contacts.filter(function (contact) {
        return sanitizePhone(contact.phone) === sanitizePhone(phone);
    }).shift();
}
```

> Как видите, мы воспользовались вспомогательной функцией для очистки номера телефона от посторонних символов и кода страны. Таким образом, поиск по номерам `+7 (343) 0112233` и `83430112233` будет выдавать одинаковый результат, что там и нужно.

Теперь у нас есть вся необходимая информация, и мы можем заняться непосредственно отображением карточек. Подготовим две вариации шаблона карточки: для случая когда номер найден в базе, и когда он не найден:

```js
function getNotyText(phone, name) {
    return '<span class="pz_noty_title">Входящий звонок</span>' +
        (name ? '<span class="pz_noty_contact">' + name + '</span>' : '') +
        '<span class="pz_noty_phone btn-link make-call">' + phone + '</span>' +
        '<span class="pz_noty_copyright">' +
            '<img src="img/pz.ico">' +
            '<a target="_blank" href="http://prostiezvonki.ru">Простые звонки</a>' +
        '</span>';
}
```

Напишем функцию, при вызове которой в правом нижнем углу экрана будет появляться карточка. Чтобы не загромождать экран, при очередном звонке будем скрывать старую карточку.

```js
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
```

Осталось добавить функцию, которая будет вызываться при получении события от серевера. Мы будем показывать всплывающую карточку при получении события входящего звонка.

> Подробное описание всех типов событий представлено в [документации](https://github.com/vedisoft/php-sdk#--4).

```js
pz.onEvent(function (event) {
    switch (true) {
        case event.isIncoming():
            if (event.to === userPhone) {
                showCard(event.from);
            }
            break;
    }
});
```

Чтобы проверить работу всплывающей карточки, создадим входящий звонок с номера 73430112233 на номер 101 с помощью диагностической утилиты Diagnostic.exe:

```
[events off]> Generate transfer 73430112233 101
```

На странице приложения должна незамедлительно появиться карточка:

![Карточка входящего звонка](https://github.com/vedisoft/js-sdk-tutorial/raw/master/img/incoming-popup.png)

Шаг 4. Умная переадресация
--------------------------

Чтобы воспользоваться функцией умной переадресации, нужно определить, какие звонки сотрудник хочет получать.

Будем считать, что все контакты, отображаемые на странице, закреплены за нашим сотрудником. Таким образом, условием для переадресации звонка будет наличие номера телефона звонящего в нашей базе контактов.

Функция для поиска в базе у нас уже есть, так что остаётся только добавить обработку событий трансфера:

```js
pz.onEvent(function (event) {
    switch (true) {
        ...

        case event.isTransfer():
            if (findByPhone(storage, event.from)) {
                pz.transfer(event.callID, userPhone);
            }
            break;
    }
});
```

Чтобы проверить функцию трансфера, отправим запрос с помощью диагностической утилиты:

```
[events off]> Generate incoming 73430112233
```

В консоли сервера мы должны увидеть, что приложение отправило запрос на перевод звонка на нашего пользователя:

```
Transfer Event: callID = 18467, to = 101
```

Шаг 5. История звонков
----------------------

Добавим на страницу ещё одну таблицу:

```html
<h2>История звонков</h2>
<table id="history" class="table table-bordered">
    <th width="10%">Направление</th>
    <th width="10%">Телефон</th>
    <th width="40%">Клиент</th>
    <th width="20%">Начало</th>
    <th width="20%">Продолжительность</th>
</table>
```

Чтобы заполнить таблицу информацией о совершённых звонках, нам нужно обрабатывать события истории звонков:

```js
pz.onEvent(function (event) {
    switch (true) {
        ...

        case event.isHistory():
            if (event.to === userPhone || event.from === userPhone) {
                appendCallInfo(event);
            }
            break;
    }
});
```
Займёмся реализацией функции `appendCallInfo`, работа которой заключается в том, чтобы отформатировать полученные данные о звонке и записать их в таблицу.

Для форматирования дат мы воспользуемся библиотекой [moment.js](http://momentjs.com/).

Распакуем библиотеку и файлы локализации в папку `js/momentjs` и подключим их:

```html
<script src="js/momentjs/moment.min.js"></script>
<script src="js/momentjs/lang/ru.js"></script>
```

Подключим локализацию:

```js
moment.lang('ru');
```

Сама функция будет выглядеть так:

```js
function appendCallInfo(event) {
    var direction = event.direction === '1' ? 'Исходящий' : 'Входящий',
        phone     = event.direction === '1' ? event.to : event.from,
        contact   = findByPhone(storage, phone),
        name      = contact ? contact.name : '',
        fromNow   = moment.unix(event.start).fromNow(),
        duration  = moment.duration(event.duration, "seconds").humanize();

    $('<tr></tr>')
        .append('<td>' + direction + '</td>')
        .append('<td>' + phone + '</td>')
        .append('<td>' + name + '</td>')
        .append('<td>' + fromNow + '</td>')
        .append('<td>' + duration + '</td>')
        .appendTo('#history');
}
```

Для проверки создадим два события истории с помощью диагностической утилиты:

```
[events off]> Generate history 101 73430112233 1378913389 1378913592 123 out
[events off]> Generate history 73430112211 101 1378914389 1378914592 250 in
```

![История звонков](https://github.com/vedisoft/js-sdk-tutorial/raw/master/img/history.png)

Ура!
----

Теперь наше приложение умеет показывать карточки со входящими звонками и переводить звонки прикреплённых клиентов, а пользователь может позвонить клиенту в один клик и посмотреть историю совершённых звонков.

Настройка заняла совсем немного времени, ведь так? : )


FAQ
===

Как сделать так, чтобы карточки всплывали на последней открытой вкладке?
------------------------------------------------------------------------


```js
$(window).on("blur focus", function (e) {
    // обработка двойного срабатывания события
    // @link http://stackoverflow.com/a/1760268
    if ($(this).data('prevType') !== e.type) {
        $(this).data('prevType', e.type);

        switch (e.type) {
        case 'focus':
            if (!pz.isConnected()) {
                pz.connect({ ... });
            }
            break;
        }
    }
});
```
