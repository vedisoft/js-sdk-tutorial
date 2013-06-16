Пример интеграции js-приложения с сервисом Простые Звонки
==========================================================

Простые Звонки - сервис для интеграции клиентских приложений (Excel, 1C и ERP-cистем) с офисными и облачными АТС. Клиентское приложение может общаться с сервером Простых Звонков через единый API, независимо от типа используемой АТС. 

В данном примере мы рассмотрим процесс подключения к серверу Простых Звонков веб-приложения, написанного на javascript. Мы начнём с веб-приложения, выводящего на экран список клиентов из базы данных, и добавим в него следующие функции:

- отображение всплывающей карточки при входящем звонке;
- звонок клиенту по клику на телефоный номер.

Шаг 0. Исходное приложение
--------------------------

Наше исходное приложение умеет показывать список клиентов. В качестве базы данных используется массив storage, определяемый в файле js/script.js. Прочитанные из файла строки отображаются в виде таблицы.

index.html:

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>TinyCRM</title>
    <link rel="stylesheet" href="css/bootstrap.min.css">
    <link rel="stylesheet" href="css/bootstrap-responsive.min.css">
</head>
<body>
    <div class="container">
        <h1>TinyCRM</h1>
        <h2>База клиентов</h2>
        <table id="contacts" class="table table-bordered"></table>
    </div>

    <script src="//ajax.googleapis.com/ajax/libs/jquery/1.10.1/jquery.min.js"></script>
    <script src="js/script.js"></script>
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

    var table = $('#contacts');

    for (var i = 0; i < storage.length; i += 1) {
        var row = $('<tr></tr>');

        row.append('<td>' + storage[i].name + '</td>');
        row.append('<td width="1%" nowrap>' + storage[i].phone + '</td>');

        row.appendTo(table);
    }
}(jQuery));
```

![Исходное приложение](https://github.com/vedisoft/php-sdk-tutorial/raw/master/img/tinycrm-origin.png)

Шаг 1. Настройка подключения к серверу
--------------------------------------

Подключим файл prostiezvonki.js (свежую версию можно взять [отсюда](https://github.com/vedisoft/js-sdk)): 

```html
<script src="js/prostiezvonki.js"></script>
```

Теперь нужно скачать [тестовый сервер и диагностическую утилиту](https://github.com/vedisoft/pz-developer-tools).

Запустим тестовый сервер:

    > TestServer.exe -r

и подключимся к нему диагностической утилитой:

    > Diagnostic.exe

    [events off]> Connect ws://localhost:10150 asd
    Успешно начато установление соединения с АТС

Тестовое окружение настроено.

Добавим на страницу веб-приложения индикатор состояния соединения с сервером и кнопку, по нажатию на которую мы будем устанавливать соединение.

```html
<span id="button" class="btn pull-right">Соединить</span>
<span id="indicator" class="badge">Проверка соединения...</span>
```

Теперь наше приложение выглядит так:

![Индикатор состояния соединения](https://github.com/vedisoft/php-sdk-tutorial/raw/master/img/connection-indicator.png)

Добавим обработчик события кнопки. По нажатию кнопки будет выполнять запрос на подключение либо отключение соединения с сервером:

```js
$('#button').on('click', function() {
    if ($(this).text() === 'Соединить') {
        pz.connect({
            host: 'ws://localhost:10150', // Адрес сервера
            client_id: 'password',        // Пароль
            client_type: 'tinycrm'        // Тип приложения
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

![Соединение установлено](https://github.com/vedisoft/php-sdk-tutorial/raw/master/img/connection-established.png)

Шаг 2. Исходящие звонки кликом по номеру
----------------------------------------

Для начала, сделаем номера телефонов клиентов ссылками:

```js
row.append('<td width="1%" nowrap><span title="Позвонить" class="btn-link make-call">' + storage[i].phone + '</span></td>');
```

![Делаем телефоны ссылками](https://github.com/vedisoft/php-sdk-tutorial/raw/master/img/phone-links.png)

Теперь добавим на страницу обработчики нажатия на ссылки:

```js
$('body').on('click', '.make-call', function() {
        var phone = $(this).text().trim();

        pz.call(phone);
    });
```

Кликнув на номер клиента, посмотрим на вывод тестового сервера:

```
Call event from CRM: src = 101, dst = +7 (343) 0112233
```

Как мы видим, сервер получил запрос на создание исходящего звонка с номера 101 на номер +7 (343) 0112233.

Шаг 3. Всплывающая карточка входящего звонка
--------------------------------------------

На страницу поместим скрытый контейнер, который мы будем использовать в качестве всплывающей карточки:

```html
<div style="display: none;" class="alert alert-info"></div>
```

Осталось добавить функцию, которая будет вызываться при получении события от серевера. Мы будем показывать всплывающую карточку при получении события входящего звонка.

> Подробное описание всех типов событий представлено в [документации](https://github.com/vedisoft/php-sdk#--4).

```js
pz.onEvent(function (event) {
    if (event.isIncoming()) {
        $('.alert').text('Звонок с '+event.from+' на '+event.to).show();
    }
});
```

Чтобы проверить работу всплывающей карточки, создадим входящий звонок с номера 73430112233 на номер 101 с помощью диагностической утилиты Diagnostic.exe:

```
[events off]> Generate transfer 73430112233 101
```

На странице приложения должна незамедлительно появиться карточка:

![Карточка входящего звонка](https://github.com/vedisoft/php-sdk-tutorial/raw/master/img/incoming-popup.png)

Ура!
----

Теперь наше приложение умеет показывать карточки со входящими звонками, а пользователь может позвонить клиенту в один клик. 

Настройка заняла совсем немного времени, ведь так? : )